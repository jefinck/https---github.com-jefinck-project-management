import express from "express";
import Student from "../models/Student.js";
import Faculty from "../models/Faculty.js";
import Project from "../models/Project.js";

const router = express.Router();

// Get total student count
router.get("/students/count", async (req, res) => {
  try {
    const count = await Student.countDocuments({});
    res.json({ count });
  } catch (error) {
    console.error("Error fetching student count:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get total faculty count
router.get("/faculty/count", async (req, res) => {
  try {
    const count = await Faculty.countDocuments({});
    res.json({ count });
  } catch (error) {
    console.error("Error fetching faculty count:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get total project count
router.get("/projects/count", async (req, res) => {
  try {
    const count = await Project.countDocuments({});
    res.json({ count });
  } catch (error) {
    console.error("Error fetching project count:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;