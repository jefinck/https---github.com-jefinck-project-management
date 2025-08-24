// models/SubmittedTask.js
import mongoose from "mongoose";

const SubmittedTaskSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
  },
  description: String,
  fileUrl: String,
  originalFileName: String, // New field to store original filename
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["Submitted", "Graded"], // Updated enum: Removed "Reviewed", "Approved", "Rejected"; Added "Graded"
    default: "Submitted",
  },
  facultyComments: String,
  grade: {
    type: Number,
    min: 0,
    default: null, // Allow null until graded
  },
});

const SubmittedTask = mongoose.model("SubmittedTask", SubmittedTaskSchema);
export default SubmittedTask;