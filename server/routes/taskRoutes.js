import express from "express";
import mongoose from "mongoose";
import Task from "../models/Task.js";
import Project from "../models/Project.js";
import Faculty from "../models/Faculty.js";
import Student from "../models/Student.js";
import SubmittedTask from "../models/SubmittedTask.js";
import nodemailer from "nodemailer";

const router = express.Router();

// Assign a new task
router.post("/assign-task", async (req, res) => {
  try {
    const { facultyId, studentId, projectId, taskTitle, description, dueDate, totalMarks } = req.body;

    // Validate required fields
    if (!facultyId || !taskTitle || !description || !dueDate || totalMarks === undefined) {
      return res.status(400).json({ message: "All fields are required, including totalMarks" });
    }

    if (totalMarks <= 0) {
      return res.status(400).json({ message: "Total marks must be a positive number" });
    }

    // Validate faculty exists
    const faculty = await Faculty.findById(facultyId).select("firstName lastName email");
    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    // Set up Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const taskData = {
      facultyId,
      taskTitle,
      description,
      dueDate,
      totalMarks,
      status: "Pending",
      studentId: null,
      projectId: null,
    };

    if (studentId) {
      // Single student case
      const student = await Student.findById(studentId).select(
        "firstName lastName email enrollmentNo"
      );
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      taskData.studentId = studentId;
      if (projectId) {
        const project = await Project.findOne({ _id: projectId, studentIds: studentId });
        if (!project) {
          return res.status(400).json({ message: "Invalid project for this student" });
        }
        taskData.projectId = projectId;
      }

      const newTask = new Task(taskData);
      await newTask.save();

      // Send email to student
      const project = projectId ? await Project.findById(projectId).select("title") : null;
      await transporter.sendMail({
        from: `"Project Management" <${process.env.EMAIL_USER}>`,
        to: student.email,
        subject: `New Task Assigned: ${taskTitle}`,
        html: `
          <p>Hello ${student.firstName} ${student.lastName},</p>
          <p>A new task has been assigned to you in the Project Management System.</p>
          <h3>Task Details:</h3>
          <p><strong>Title:</strong> ${taskTitle}</p>
          <p><strong>Description:</strong> ${description}</p>
          <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleString()}</p>
          <p><strong>Total Marks:</strong> ${totalMarks}</p>
          ${project ? `<p><strong>Project:</strong> ${project.title}</p>` : ""}
          <p>Please log in to the system to view the task and submit your work.</p>
          <p>Best regards,<br>Project Management Team</p>
        `,
      });

      res.status(201).json({ message: "Task assigned successfully", task: newTask });
    } else {
      // "All Students" case
      // Check for existing task to prevent duplicates
      const existingTask = await Task.findOne({
        facultyId,
        taskTitle,
        dueDate: new Date(dueDate).toISOString(),
        studentId: null,
      });
      if (existingTask) {
        return res.status(400).json({ message: "A task with the same title and due date already exists for all students" });
      }

      // Fetch students assigned to this faculty from Project collection
      const projects = await Project.find({ facultyId }).distinct("studentIds");
      if (!projects.length) {
        return res.status(404).json({ message: "No students assigned to this faculty" });
      }

      // Fetch student details for emails
      const students = await Student.find({ _id: { $in: projects } }).select(
        "firstName lastName email enrollmentNo"
      );

      // Create a single task
      const newTask = new Task(taskData);
      await newTask.save();

      // Send emails to all students
      const emailPromises = students.map((student) => {
        if (student.email) {
          const emailOptions = {
            from: `"Project Management" <${process.env.EMAIL_USER}>`,
            to: student.email,
            subject: `New Task Assigned: ${taskTitle}`,
            html: `
              <p>Hello ${student.firstName} ${student.lastName},</p>
              <p>A new task has been assigned to you in the Project Management System.</p>
              <h3>Task Details:</h3>
              <p><strong>Title:</strong> ${taskTitle}</p>
              <p><strong>Description:</strong> ${description}</p>
              <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleString()}</p>
              <p><strong>Total Marks:</strong> ${totalMarks}</p>
              <p>Please log in to the system to view the task and submit your work.</p>
              <p>Best regards,<br>Project Management Team</p>
            `,
          };
          return transporter.sendMail(emailOptions);
        }
        return Promise.resolve();
      });

      await Promise.all(emailPromises);

      res.status(201).json({
        message: "Task assigned to all students successfully",
        task: newTask,
      });
    }
  } catch (error) {
    console.error("Error assigning task:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

// Get tasks for a specific student
router.get("/student/:id", async (req, res) => {
  try {
    const studentId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ error: "Invalid student ID" });
    }
    const tasks = await Task.find({
      $or: [
        { studentId: studentId }, // Tasks assigned directly to the student
        { studentId: null }, // Tasks assigned to all students
      ],
    })
      .populate("facultyId", "firstName lastName")
      .populate("projectId", "title");
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching student tasks:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get tasks for a specific faculty
router.get("/faculty/:id", async (req, res) => {
  try {
    const facultyId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(facultyId)) {
      return res.status(400).json({ error: "Invalid faculty ID" });
    }
    const tasks = await Task.find({ facultyId })
      .populate("studentId", "firstName lastName enrollmentNo")
      .populate("projectId", "title");
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching faculty tasks:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get a specific task by ID
router.get("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(200).json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get tasks for a specific project
router.get("/project/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ error: "Invalid project ID" });
    }

    // Find the project to get its facultyId and studentIds
    const project = await Project.findById(projectId).select("facultyId studentIds");
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Fetch tasks where:
    // 1. projectId matches (for single-student tasks)
    // 2. studentId is null and facultyId matches (for "All Students" tasks)
    const tasks = await Task.find({
      $or: [
        { projectId: projectId }, // Tasks directly linked to the project
        { studentId: null, facultyId: project.facultyId }, // "All Students" tasks by the project's faculty
      ],
    })
      .populate("facultyId", "firstName lastName")
      .populate("studentId", "firstName lastName enrollmentNo")
      .populate("projectId", "title");

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching project tasks:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// Update a task
router.put("/:id", async (req, res) => {
  try {
    const { facultyId, studentId, projectId, taskTitle, description, dueDate, totalMarks } = req.body;
    if (!facultyId || !taskTitle || !description || !dueDate || totalMarks === undefined) {
      return res.status(400).json({ message: "All fields are required, including totalMarks" });
    }

    if (totalMarks <= 0) {
      return res.status(400).json({ message: "Total marks must be a positive number" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (task.facultyId.toString() !== facultyId) {
      return res.status(403).json({ error: "Unauthorized to edit this task" });
    }

    // Check for duplicate task if updating to "All Students"
    if (!studentId) {
      const existingTask = await Task.findOne({
        _id: { $ne: req.params.id }, // Exclude current task
        facultyId,
        taskTitle,
        dueDate: new Date(dueDate).toISOString(),
        studentId: null,
      });
      if (existingTask) {
        return res.status(400).json({ message: "A task with the same title and due date already exists for all students" });
      }
    }

    const updateData = {
      taskTitle,
      description,
      dueDate,
      totalMarks,
      studentId: studentId || null,
      projectId: projectId || null,
    };

    if (studentId) {
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      if (projectId) {
        const project = await Project.findOne({ _id: projectId, studentIds: studentId });
        if (!project) {
          return res.status(400).json({ error: "Invalid project for this student" });
        }
      }
    }

    // If dueDate is updated to a future date, remove "Missed" submissions
    const newDueDate = new Date(dueDate);
    const now = new Date();
    if (newDueDate > now) {
      await SubmittedTask.deleteMany({
        taskId: req.params.id,
        grade: 0,
        description: "Automatically graded due to missed deadline",
      });
    }

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate("studentId", "firstName lastName enrollmentNo")
      .populate("projectId", "title");

    // Notify students if task is assigned to "All Students"
    if (!studentId) {
      const projects = await Project.find({ facultyId }).distinct("studentIds");
      if (projects.length > 0) {
        const students = await Student.find({ _id: { $in: projects } }).select(
          "firstName lastName email enrollmentNo"
        );
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        const emailPromises = students.map((student) => {
          if (student.email) {
            return transporter.sendMail({
              from: `"Project Management" <${process.env.EMAIL_USER}>`,
              to: student.email,
              subject: `Task Updated: ${taskTitle}`,
              html: `
                <p>Hello ${student.firstName} ${student.lastName},</p>
                <p>The following task has been updated in the Project Management System.</p>
                <h3>Task Details:</h3>
                <p><strong>Title:</strong> ${taskTitle}</p>
                <p><strong>Description:</strong> ${description}</p>
                <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleString()}</p>
                <p><strong>Total Marks:</strong> ${totalMarks}</p>
                <p>Please log in to the system to view the updated task.</p>
                <p>Best regards,<br>Project Management Team</p>
              `,
            }).catch((emailErr) => {
              console.error(`Failed to send email to ${student.email}:`, emailErr.message);
              return Promise.resolve(); // Continue with other emails even if one fails
            });
          }
          return Promise.resolve();
        });
        await Promise.all(emailPromises);
      }
    }

    res.status(200).json({ message: "Task updated successfully", task: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// Delete a task
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Delete associated submissions
    await SubmittedTask.deleteMany({ taskId: req.params.id });

    await Task.findByIdAndDelete(req.params.id);

    // Notify students if task was assigned to "All Students"
    if (!task.studentId) {
      const projects = await Project.find({ facultyId: task.facultyId }).distinct("studentIds");
      const students = await Student.find({ _id: { $in: projects } }).select(
        "firstName lastName email enrollmentNo"
      );
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      const emailPromises = students.map((student) => {
        if (student.email) {
          return transporter.sendMail({
            from: `"Project Management" <${process.env.EMAIL_USER}>`,
            to: student.email,
            subject: `Task Deleted: ${task.taskTitle}`,
            html: `
              <p>Hello ${student.firstName} ${student.lastName},</p>
              <p>The following task has been deleted from the Project Management System.</p>
              <h3>Task Details:</h3>
              <p><strong>Title:</strong> ${task.taskTitle}</p>
              <p>Please contact your faculty if you have any questions.</p>
              <p>Best regards,<br>Project Management Team</p>
            `,
          });
        }
        return Promise.resolve();
      });
      await Promise.all(emailPromises);
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
