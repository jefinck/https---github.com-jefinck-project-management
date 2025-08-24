import express from "express";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import SubmittedTask from "../models/SubmittedTask.js";
import Task from "../models/Task.js";
import Student from "../models/Student.js";
import Faculty from "../models/Faculty.js";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import Project from "../models/Project.js";

// Cloudinary config
import "../config/cloudinaryConfig.js";

const router = express.Router();

// Multer Storage Setup (using memory storage for manual upload)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    console.log("Multer fileFilter - mimetype:", file.mimetype); // Debug log
    const validMimeTypes = ["application/pdf"];
    if (!validMimeTypes.includes(file.mimetype.toLowerCase())) {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
});

/** GET: Fetch all submitted tasks for the authenticated faculty */
router.get("/", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError.message);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const facultyId = decoded.id;
    if (!mongoose.Types.ObjectId.isValid(facultyId)) {
      return res.status(400).json({ error: "Invalid faculty ID in token" });
    }

    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({ error: "Faculty not found" });
    }

    const projects = await Project.find({ facultyId }).distinct("studentIds");
    if (!projects.length) {
      return res.status(200).json([]);
    }

    const validStudentIds = projects.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (!validStudentIds.length) {
      return res.status(200).json([]);
    }

    const taskIds = await Task.find({ facultyId }).distinct("_id");
    if (!taskIds.length) {
      return res.status(200).json([]);
    }

    const submissions = await SubmittedTask.find({
      studentId: { $in: validStudentIds },
      taskId: { $in: taskIds },
    })
      .populate("studentId", "firstName lastName")
      .populate("taskId", "taskTitle totalMarks projectId description") // Added description
      .populate("projectId", "title");

    res.status(200).json(submissions);
  } catch (err) {
    console.error("Error fetching submitted tasks:", err.message);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

/** POST: Submit a task */
router.post("/submit", upload.single("file"), async (req, res) => {
  try {
    const { studentId, taskId, projectId, description } = req.body;
    console.log("Received submission:", { studentId, taskId, projectId, description, file: req.file });

    if (!studentId || !taskId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const task = await Task.findById(taskId).populate("facultyId", "firstName lastName email department");
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("File details:", {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    // Validate buffer
    if (!req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({ error: "File buffer is empty or invalid" });
    }

    // Check if the buffer starts with PDF magic number (%PDF-)
    const pdfHeader = req.file.buffer.toString("ascii", 0, 5);
    if (!pdfHeader.startsWith("%PDF-")) {
      return res.status(400).json({ error: "Uploaded file is not a valid PDF" });
    }

    // Manually upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const originalName = req.file.originalname;
      const originalBase = originalName.split(".")[0];
      const originalExt = originalName.split(".").pop().toLowerCase();
      console.log("Uploading to Cloudinary with params:", { originalName, originalBase, originalExt });

      cloudinary.uploader.upload_stream(
        {
          folder: "student_submissions",
          resource_type: req.file.mimetype === "application/pdf" ? "raw" : "auto",
          public_id: `${originalBase}_${Date.now()}`,
          format: originalExt,
          access_mode: "public",
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error.message);
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(req.file.buffer);
    });

    console.log("Cloudinary upload result:", result);

    let fileUrl = result.secure_url;
    console.log("Generated Cloudinary URL:", fileUrl);

    if (!fileUrl || !fileUrl.startsWith("http")) {
      console.error("Invalid fileUrl generated by Cloudinary:", fileUrl);
      return res.status(500).json({ error: "Failed to generate file URL", details: "Cloudinary upload issue" });
    }

    let finalProjectId = null;
    if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
      const project = await Project.findById(projectId);
      if (project) {
        finalProjectId = projectId;
      } else {
        console.warn("Invalid projectId provided:", projectId);
      }
    } else if (task.projectId) {
      finalProjectId = task.projectId;
    }
    console.log("Final projectId:", finalProjectId);

    const submission = new SubmittedTask({
      studentId,
      taskId,
      projectId: finalProjectId,
      description: description || "",
      fileUrl: fileUrl,
      originalFileName: req.file.originalname,
      status: "Submitted",
    });

    await submission.save();
    console.log("Submission saved:", submission._id);

    await Task.findByIdAndUpdate(taskId, { status: "Submitted" });

    const student = await Student.findById(studentId).select("firstName lastName email enrollmentNo");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const projectTitle = finalProjectId
      ? (await Project.findById(finalProjectId).select("title"))?.title || "None"
      : "None";
    if (task.facultyId && task.facultyId.email) {
      await transporter.sendMail({
        from: `"Project Management" <${process.env.EMAIL_USER}>`,
        to: task.facultyId.email,
        subject: `New Task Submission: ${task.taskTitle}`,
        html: `
          <p>Hello ${task.facultyId.firstName} ${task.facultyId.lastName},</p>
          <p>A student has submitted a task in the Project Management System.</p>
          <h3>Submission Details:</h3>
          <p><strong>Task Title:</strong> ${task.taskTitle}</p>
          <p><strong>Student:</strong> ${student.firstName} ${student.lastName} (${student.enrollmentNo})</p>
          <p><strong>Project:</strong> ${projectTitle}</p>
          <p><strong>Description:</strong> ${description || "No description provided"}</p>
          <p><strong>File:</strong> <a href="${fileUrl}" target="_blank">View Submitted File (${req.file.originalname})</a></p>
          <p>Please log in to the system to review the submission.</p>
          <p>Best regards,<br>Project Management Team</p>
        `,
      });
    }

    const populatedSubmission = await SubmittedTask.findById(submission._id)
      .populate("studentId", "firstName lastName")
      .populate("taskId", "taskTitle totalMarks projectId description") // Added description
      .populate("projectId", "title");

    res.status(201).json({ message: "Task submitted successfully", submission: populatedSubmission });
  } catch (err) {
    console.error("Submission error:", err.message, err.stack);
    res.status(500).json({ error: "Submission failed", details: err.message });
  }
});

/** PUT: Add faculty feedback, status, and grade update */
router.put("/:id", async (req, res) => {
  const { facultyComments, grade, status } = req.body;

  try {
    // Validate submission ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid submission ID" });
    }

    // Find submission and populate taskId
    const submission = await SubmittedTask.findById(req.params.id).populate("taskId studentId");
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // Validate taskId existence
    if (!submission.taskId) {
      return res.status(400).json({ error: "Associated task not found" });
    }

    // Validate studentId existence
    if (!submission.studentId) {
      return res.status(400).json({ error: "Associated student not found" });
    }

    // Validate grade
    const totalMarks = submission.taskId?.totalMarks || 100;
    if (grade === undefined || isNaN(grade)) {
      return res.status(400).json({ error: "Grade is required and must be a number" });
    }
    if (grade < 0 || grade > totalMarks) {
      return res.status(400).json({ error: `Grade must be between 0 and ${totalMarks}` });
    }

    // Update submission
    submission.facultyComments = facultyComments || "";
    submission.status = status || "Graded"; // Use provided status or default to "Graded"
    submission.grade = parseFloat(grade);
    await submission.save();

    // Send email notification (with error handling)
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const projectTitle = submission.projectId?.title || "None";
      await transporter.sendMail({
        from: `"Project Management" <${process.env.EMAIL_USER}>`,
        to: submission.studentId.email,
        subject: `Task Review Update: ${submission.taskId.taskTitle}`,
        html: `
          <p>Hello ${submission.studentId.firstName} ${submission.studentId.lastName},</p>
          <p>Your submitted task has been graded in the Project Management System.</p>
          <h3>Task Details:</h3>
          <p><strong>Title:</strong> ${submission.taskId.taskTitle}</p>
          <p><strong>Project:</strong> ${projectTitle}</p>
          <p><strong>Status:</strong> ${submission.status}</p>
          <p><strong>Grade:</strong> ${grade}/${totalMarks}</p>
          <p><strong>Faculty Comments:</strong> ${facultyComments || "None"}</p>
          <p><strong>Submitted File:</strong> <a href="${submission.fileUrl}" target="_blank">View File (${submission.originalFileName || "None"})</a></p>
          <p>Please log in to the system to view the full details of your submission.</p>
          <p>Best regards,<br>Project Management Team</p>
        `,
      });
    } catch (emailErr) {
      console.error("Error sending email:", emailErr.message);
      // Log email error but don't fail the request
    }

    // Fetch updated submission with populated fields
    const updatedSubmission = await SubmittedTask.findById(req.params.id)
      .populate("studentId", "firstName lastName")
      .populate("taskId", "taskTitle totalMarks projectId description") // Added description
      .populate("projectId", "title");

    res.status(200).json({ message: "Feedback updated successfully", submission: updatedSubmission });
  } catch (err) {
    console.error("Error updating submission:", err.message, err.stack);
    res.status(500).json({ error: "Failed to update submission", details: err.message });
  }
});

/** GET: Check if task is submitted by student */
router.get("/status/:taskId/:studentId", async (req, res) => {
  const { taskId, studentId } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ error: "Invalid task or student ID" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const submission = await SubmittedTask.findOne({ taskId, studentId })
      .populate("studentId", "firstName lastName")
      .populate("taskId", "taskTitle totalMarks projectId description") // Added description
      .populate("projectId", "title");

    if (!submission && new Date(task.dueDate) < new Date()) {
      const newSubmission = new SubmittedTask({
        studentId,
        taskId,
        projectId: task.projectId || null,
        description: "Automatically graded due to missed deadline",
        fileUrl: null,
        originalFileName: null,
        status: "Graded", // Valid status
        grade: 0,
      });
      await newSubmission.save();
      const populatedSubmission = await SubmittedTask.findById(newSubmission._id)
        .populate("studentId", "firstName lastName")
        .populate("taskId", "taskTitle totalMarks projectId description") // Added description
        .populate("projectId", "title");
      return res.status(200).json({ submitted: true, submission: populatedSubmission });
    }

    return res.status(200).json({ submitted: !!submission, submission });
  } catch (err) {
    console.error("Error checking submission status:", err);
    res.status(500).json({ error: "Error checking status" });
  }
});

/** POST: Mark overdue tasks with zero grade */
router.post("/mark-overdue/:taskId/:studentId", async (req, res) => {
  try {
    const { taskId, studentId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const now = new Date();
    if (new Date(task.dueDate) >= now) {
      return res.status(400).json({ message: "Task is not overdue" });
    }

    let submission = await SubmittedTask.findOne({ taskId, studentId });
    if (submission) {
      return res.status(200).json({ message: "Task already submitted", submission });
    }

    submission = new SubmittedTask({
      studentId,
      taskId,
      projectId: projectId || null,
      description: "Automatically graded due to missed deadline",
      fileUrl: null,
      originalFileName: null,
      status: "Graded", // Valid status
      grade: 0,
    });

    await submission.save();
    const populatedSubmission = await SubmittedTask.findById(submission._id)
      .populate("studentId", "firstName lastName")
      .populate("taskId", "taskTitle totalMarks projectId description") // Added description
      .populate("projectId", "title");

    res.status(201).json({ message: "Task marked as overdue with zero grade", submission: populatedSubmission });
  } catch (err) {
    console.error("Error marking overdue task:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;