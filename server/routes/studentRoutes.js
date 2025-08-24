import express from "express";
import Student from "../models/Student.js";
import bcrypt from "bcryptjs"; // ✅ Import bcrypt
import mongoose from "mongoose";
import nodemailer from "nodemailer";

const router = express.Router();

// Add new student
router.post("/", async (req, res) => {
  try {
    const { enrollmentNo, firstName, lastName, class: studentClass, email, contactNo, password } = req.body;

    if (!enrollmentNo || !firstName || !lastName || !studentClass || !email || !contactNo || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

    const newStudent = new Student({
      enrollmentNo,
      firstName,
      lastName,
      class: studentClass,
      email,
      contactNo,
      password: hashedPassword,
    });

    await newStudent.save();

    // Set up Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email options for the student
    const mailOptions = {
      from: `"Project Management" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to the Project Management System",
      html: `
        <p>Hello ${firstName} ${lastName},</p>
        <p>Your account has been successfully created in the Project Management System.</p>
        <h3>Your Login Details:</h3>
        <p><strong>Username::</strong> ${enrollmentNo}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p>Please log in to the system using Enrollment No and Password. We recommend changing your password after your first login for security purposes.</p>
        <p>Best regards,<br>Project Management Team</p>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: "Student registered successfully" });
  } catch (error) {
    console.error("Error registering student:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all students
router.get("/", async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete student
router.delete("/:id", async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting student" });
  }
});

// Update student
router.put("/:id", async (req, res) => {
  try {
    const updatedStudent = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedStudent);
  } catch (error) {
    res.status(500).json({ error: "Error updating student" });
  }
});

// get student by id 
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid student ID" });
    }

    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ error: "Student not found" });

    res.status(200).json(student);
  } catch (error) {
    console.error("Server error fetching student:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Routes for Profile Fetching & Update
router.get("/home/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    res.status(200).json(student);
  } catch (error) {
    console.error("Error fetching signed-in student:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update profile image
router.put("/update-profile-image/:id", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { profileImage: imageUrl },
      { new: true }
    );
    if (!student) return res.status(404).json({ message: "Student not found" });

    res.status(200).json(student);
  } catch (error) {
    console.error("Error updating profile image:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update password
router.put("/update-password/:id", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "New password is required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { password: hashedPassword },
      { new: true }
    );
    if (!student) return res.status(404).json({ message: "Student not found" });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;