import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true }],
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true },
  endDate: { type: Date, required: true },
  domain: { type: String, required: true },
  techStack: { type: String },
  assignedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["Pending", "Completed"], default: "Pending" },
});

const Project = mongoose.model("Project", ProjectSchema);
export default Project;