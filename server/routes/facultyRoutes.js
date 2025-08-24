  import express from "express";
  import mongoose from "mongoose"; // ✅ Import mongoose
  import Faculty from "../models/Faculty.js";
  import Task from "../models/Task.js";
  import bcrypt from "bcryptjs";
  import authMiddleware from "../middleware/authMiddleware.js";
  import nodemailer from "nodemailer";

  const router = express.Router();

  /**
   * ✅ GET Faculty Home Data (Profile & Assigned Projects)
   * Returns: Name, Employee ID, Department, Email, Contact No., Total Assigned Projects
   */
  router.get("/home/:facultyId", async (req, res) => {
    try {
      const { facultyId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(facultyId)) {
        return res.status(400).json({ message: "Invalid Faculty ID format" });
      }

      // ✅ Populate assigned projects count
      const faculty = await Faculty.findById(facultyId).populate("assignedProjects");

      if (!faculty) {
        return res.status(404).json({ message: "Faculty not found" });
      }

      res.json({
        employeeId: faculty.employeeId,
        name: faculty.firstName + " " + faculty.lastName,
        department: faculty.department,
        email: faculty.email,
        contactNo: faculty.contactNo,
        totalProjects: faculty.assignedProjects.length || 0, // ✅ Fetch actual project count
      });
    } catch (error) {
      console.error("Error fetching faculty data:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  /**
   * ✅ Register a New Faculty Member
   * Hashes password before saving to the database.
   */
  router.post("/", async (req, res) => {
    try {
      const { employeeId, firstName, lastName, department, email, contactNo, password } = req.body;
  
      if (!employeeId || !firstName || !lastName || !department || !email || !contactNo || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }
  
      const existingFaculty = await Faculty.findOne({ email });
      if (existingFaculty) {
        return res.status(400).json({ message: "Email already registered" });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const newFaculty = new Faculty({
        employeeId,
        firstName,
        lastName,
        department,
        email,
        contactNo,
        password: hashedPassword,
      });
  
      await newFaculty.save();
  
      // Set up Nodemailer transporter
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      // Email options for the faculty
      const mailOptions = {
        from: `"Project Management" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Welcome to the Project Management System",
        html: `
          <p>Hello ${firstName} ${lastName},</p>
          <p>Your faculty account has been successfully created in the Project Management System.</p>
          <h3>Your Login Details:</h3>
          <p><strong>Username:</strong> ${employeeId}</p>
          <p><strong>Password:</strong> ${password}</p>
          <p>Please log in to the system using employee Id and Password. We recommend changing your password after your first login for security purposes.</p>
          <p>Best regards,<br>Project Management Team</p>
        `,
      };
  
      // Send email
      await transporter.sendMail(mailOptions);
  
      res.status(201).json({ message: "Faculty registered successfully" });
    } catch (error) {
      console.error("Error registering faculty:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  /**
   * ✅ Get All Faculty Members
   */
  router.get("/", async (req, res) => {
    try {
      const faculty = await Faculty.find();
      res.json(faculty);
    } catch (error) {
      console.error("Error fetching faculty:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  /**
   * ✅ Delete a Faculty Member
   */
  router.delete("/:id", async (req, res) => {
    try {
      await Faculty.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Faculty deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Error deleting faculty" });
    }
  });

  /**
   * ✅ Update Faculty Member Details
   */
  router.put("/:id", async (req, res) => {
    try {
      const updatedFaculty = await Faculty.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.status(200).json(updatedFaculty);
    } catch (error) {
      res.status(500).json({ error: "Error updating faculty" });
    }
  });

  /**
   * ✅ Change Faculty Password (Secure Update with Hashing)
   * Uses authMiddleware to ensure only authorized users can change passwords.
   */
  router.put("/change-password/:id", authMiddleware, async (req, res) => {
    try {
      const { newPassword } = req.body;
      const { id } = req.params;

      if (!newPassword) {
        return res.status(400).json({ message: "New password is required" });
      }

      // ✅ Hash new password before saving
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await Faculty.findByIdAndUpdate(id, { password: hashedPassword });

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });



  /**
   * ✅ GET Assigned Projects for a Faculty
   */
  router.get("/projects/:facultyId", async (req, res) => {
    const { facultyId } = req.params;
    console.log("Received facultyId:", facultyId); // ✅ Debugging

    try {
      if (!mongoose.Types.ObjectId.isValid(facultyId)) {
        console.log("Invalid Faculty ID:", facultyId);
        return res.status(400).json({ message: "Invalid Faculty ID format" });
      }

      const faculty = await Faculty.findById(facultyId)
        .populate({
          path: "assignedProjects",
          populate: {
            path: "studentId", // ✅ Populate Student Details
            select: "firstName lastName", // ✅ Select only needed fields
          },
        });

      if (!faculty) {
        console.log("Faculty not found in DB:", facultyId);
        return res.status(404).json({ error: "Faculty not found" });
      }

      res.json(faculty.assignedProjects);
    } catch (err) {
      console.error("Error fetching projects:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // GET single faculty by ID
  router.get("/:id", async (req, res) => {
    try {
      const faculty = await Faculty.findById(req.params.id);
      if (!faculty) {
        return res.status(404).json({ message: "Faculty not found" });
      }
      res.status(200).json(faculty);
    } catch (error) {
      res.status(500).json({ error: "Server error fetching faculty" });
    }
  });


  // routes/faculty.js------to store image URL
  router.put("/update-profile-image/:facultyId", async (req, res) => {
    try {
      const { imageUrl } = req.body;
      const { facultyId } = req.params;

      const updated = await Faculty.findByIdAndUpdate(
        facultyId,
        { profileImage: imageUrl },
        { new: true }
      );

      res.status(200).json({ message: "Profile image updated", data: updated });
    } catch (err) {
      console.error("Error updating profile image:", err);
      res.status(500).json({ error: "Server error" });
    }
  });




 

  export default router;
