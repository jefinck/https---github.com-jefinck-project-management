import express from "express";
import mongoose from "mongoose";
import Project from "../models/Project.js";
import Faculty from "../models/Faculty.js";
import Student from "../models/Student.js";
import nodemailer from "nodemailer";

const router = express.Router();

// Assign Project to Student & Faculty
router.post("/assign", async (req, res) => {
  try {
    const { title, description, endDate, domain, techStack, studentIds, facultyId } = req.body;

    if (!title || !description || !endDate || !domain || !studentIds || !studentIds.length || !facultyId) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Validate student(s) and faculty exist
    const students = await Student.find({ _id: { $in: studentIds } }).select("firstName lastName email enrollmentNo");
    const faculty = await Faculty.findById(facultyId).select("firstName lastName email department");

    if (!students.length || !faculty) {
      return res.status(404).json({ message: "Student(s) or Faculty not found" });
    }

    // Create and save a new project
    const newProject = new Project({
      title,
      description,
      endDate,
      domain,
      techStack,
      studentIds,
      facultyId,
    });

    await newProject.save();

    // Update Faculty Collection
    await Faculty.findByIdAndUpdate(
      facultyId,
      { $push: { assignedProjects: newProject._id } },
      { new: true }
    );

    // Update Student Collection (add project to each student's assignedProjects)
    await Student.updateMany(
      { _id: { $in: studentIds } },
      { $push: { assignedProjects: newProject._id } },
      { new: true }
    );

    // Set up Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email options for students
    const studentEmails = students.map((student) => ({
      from: `"Project Management" <${process.env.EMAIL_USER}>`,
      to: student.email,
      subject: "New Project Assigned to You",
      html: `
        <p>Hello ${student.firstName} ${student.lastName},</p>
        <p>You have been assigned a new project in the Project Management System.</p>
        <h3>Project Details:</h3>
        <p><strong>Title:</strong> ${title}</p>
        <p><strong>Description:</strong> ${description}</p>
        <p><strong>Domain:</strong> ${domain}</p>
        <p><strong>Technology Stack:</strong> ${techStack || "Not specified"}</p>
        <p><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString()}</p>
        <p><strong>Faculty Guide:</strong> ${faculty.firstName} ${faculty.lastName} (${faculty.department})</p>
        <p><strong>Team Members:</strong> ${students.map(s => `${s.firstName} ${s.lastName}`).join(", ")}</p>
        <p>Please log in to the system to view more details and start working on the project.</p>
        <p>Best regards,<br>Project Management Team</p>
      `,
    }));

    // Email options for faculty
    const facultyMailOptions = {
      from: `"Project Management" <${process.env.EMAIL_USER}>`,
      to: faculty.email,
      subject: "New Project Assigned to Your Supervision",
      html: `
        <p>Hello ${faculty.firstName} ${faculty.lastName},</p>
        <p>A new project has been assigned to you for supervision in the Project Management System.</p>
        <h3>Project Details:</h3>
        <p><strong>Title:</strong> ${title}</p>
        <p><strong>Description:</strong> ${description}</p>
        <p><strong>Domain:</strong> ${domain}</p>
        <p><strong>Technology Stack:</strong> ${techStack || "Not specified"}</p>
        <p><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString()}</p>
        <p><strong>Team Members:</strong> ${students.map(s => `${s.firstName} ${s.lastName} (${s.enrollmentNo})`).join(", ")}</p>
        <p>Please log in to the system to review the project and guide the students.</p>
        <p>Best regards,<br>Project Management Team</p>
      `,
    };

    // Send emails
    await Promise.all([
      ...studentEmails.map((mail) => transporter.sendMail(mail)),
      transporter.sendMail(facultyMailOptions),
    ]);

    res.status(201).json({ message: "Project assigned successfully", project: newProject });
  } catch (error) {
    console.error("Error assigning project:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get all assigned projects
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("studentIds", "firstName lastName enrollmentNo")
      .populate("facultyId", "firstName lastName department");
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects.", details: error.message });
  }
});

// Update assigned project
router.put("/:id", async (req, res) => {
  try {
    const { title, description, studentIds, facultyId, endDate, domain, techStack, status } = req.body;
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { title, description, studentIds, facultyId, endDate, domain, techStack, status },
      { new: true }
    );

    if (!updatedProject) return res.status(404).json({ error: "Project not found" });
    res.status(200).json({ message: "Project updated successfully!", updatedProject });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project.", details: error.message });
  }
});

// Delete assigned project
router.delete("/:id", async (req, res) => {
  try {
    const projectId = req.params.id;
    console.log(`Received DELETE request for project ID: ${projectId}`);

    // Validate project ID
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      console.log(`Invalid project ID: ${projectId}`);
      return res.status(400).json({ error: "Invalid project ID" });
    }

    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      console.log(`Project not found: ${projectId}`);
      return res.status(404).json({ error: "Project not found" });
    }

    // Validate studentIds and facultyId
    const invalidStudentIds = project.studentIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidStudentIds.length > 0) {
      console.log(`Invalid student IDs: ${invalidStudentIds.join(", ")}`);
      return res.status(400).json({ error: `Invalid student IDs: ${invalidStudentIds.join(", ")}` });
    }
    if (!mongoose.Types.ObjectId.isValid(project.facultyId)) {
      console.log(`Invalid faculty ID: ${project.facultyId}`);
      return res.status(400).json({ error: "Invalid faculty ID" });
    }

    // Log project details
    console.log(`Deleting project: ${project.title} (ID: ${projectId})`);

    // Remove project from Student.assignedProjects
    const studentUpdateResult = await Student.updateMany(
      { _id: { $in: project.studentIds } },
      { $pull: { assignedProjects: projectId } }
    );
    console.log(`Updated ${studentUpdateResult.nModified} student documents`);

    // Remove project from Faculty.assignedProjects
    const facultyUpdateResult = await Faculty.updateOne(
      { _id: project.facultyId },
      { $pull: { assignedProjects: projectId } }
    );
    console.log(`Updated ${facultyUpdateResult.nModified} faculty documents`);

    // Delete the project
    await Project.findByIdAndDelete(projectId);
    console.log(`Project deleted: ${projectId}`);

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error(`Error deleting project ${projectId}:`, error);
    res.status(500).json({ error: "Failed to delete project", details: error.message });
  }
});

// Get all projects assigned to a specific student
router.get("/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ error: "Invalid student ID" });
    }
    const projects = await Project.find({ studentIds: studentId })
      .populate("facultyId", "firstName lastName")
      .populate("studentIds", "firstName lastName enrollmentNo") // Added population for studentIds
      .select("-__v");
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching student projects:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// New route: Get all projects assigned to a specific faculty
router.get("/faculty/:facultyId", async (req, res) => {
  try {
    const { facultyId } = req.params;
    const projects = await Project.find({ facultyId })
      .populate("studentIds", "firstName lastName enrollmentNo")
      .populate("facultyId", "firstName lastName department");

    res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching faculty projects:", error);
    res.status(500).json({ error: "Failed to fetch faculty projects.", details: error.message });
  }
});

// Route to get all students assigned to a faculty (fixed)
router.get("/faculty/:facultyId/assigned-students", async (req, res) => {
  try {
    const { facultyId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(facultyId)) {
      return res.status(400).json({ error: "Invalid faculty ID" });
    }
    const projects = await Project.find({ facultyId }).distinct("studentIds");
    const students = await Student.find({ _id: { $in: projects } }).select(
      "firstName lastName enrollmentNo"
    );
    res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching assigned students:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
