import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import Faculty from "../models/Faculty.js";
import Student from "../models/Student.js";

const router = express.Router();

// Login Route
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    let user;
    let role;

    user = await User.findOne({ username });
    if (user) {
      role = "admin";
    } else {
      user = await Faculty.findOne({ employeeId: username });
      if (user) {
        role = "faculty";
      } else {
        user = await Student.findOne({ enrollmentNo: username });
        if (user) {
          role = "student";
        }
      }
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      role,
      adminId: role === "admin" ? user._id : null,
      facultyId: role === "faculty" ? user._id : null,
      studentId: role === "student" ? user._id : null,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Forgot Password Route
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  console.log("Forgot password request for email:", email);

  try {
    if (!email) {
      console.log("No email provided");
      return res.status(400).json({ message: "Email is required" });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("Email credentials missing");
      return res.status(500).json({ message: "Email service not configured" });
    }

    // Nodemailer setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log("EMAIL_USER in route:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS in route:", process.env.EMAIL_PASS);

    let user;
    let role;

    // Check Admin
    console.log("Checking User collection...");
    user = await User.findOne({ email });
    if (user) {
      role = "admin";
      console.log("Found admin user:", user.email);
    } else {
      // Check Faculty
      console.log("Checking Faculty collection...");
      user = await Faculty.findOne({ email });
      if (user) {
        role = "faculty";
        console.log("Found faculty user:", user.email);
      } else {
        // Check Student
        console.log("Checking Student collection...");
        user = await Student.findOne({ email });
        if (user) {
          role = "student";
          console.log("Found student user:", user.email);
        }
      }
    }

    if (!user) {
      console.log("No user found for email:", email);
      return res.status(200).json({ message: "If the email is registered, a reset link has been sent." });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 15 * 60 * 1000; // 15 minutes

    user.resetToken = token;
    user.resetTokenExpires = expires;

    console.log("Saving user with reset token...");
    await user.save();
    console.log("User saved successfully");

    const resetLink = `http://localhost:5173/reset-password/${token}`;

    // Send email
    console.log("Sending email to:", email);
    await transporter.sendMail({
      from: `"Project Management" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <p>Hello,</p>
        <p>You requested a password reset for your Project Management System account.</p>
        <p>Click <a href="${resetLink}">here</a> to reset your password.</p>
        <p><b>This link will expire in 15 minutes.</b></p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });
    console.log("Email sent successfully");

    res.status(200).json({ message: "If the email is registered, a reset link has been sent." });
  } catch (err) {
    console.error("Forgot Password Error:", err.message, err.stack);
    res.status(500).json({ message: "Failed to process request" });
  }
});

// Reset Password Route
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    let user =
      (await User.findOne({ resetToken: token, resetTokenExpires: { $gt: Date.now() } })) ||
      (await Faculty.findOne({ resetToken: token, resetTokenExpires: { $gt: Date.now() } })) ||
      (await Student.findOne({ resetToken: token, resetTokenExpires: { $gt: Date.now() } }));

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

export default router;