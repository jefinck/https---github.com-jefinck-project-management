import mongoose from "mongoose";

const StudentSchema = new mongoose.Schema({
  enrollmentNo: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  class: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contactNo: { type: String, required: true },
  password: { type: String, required: true },
  assignedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
  resetToken: { type: String },
  resetTokenExpires: { type: Date },
  profileImage: { type: String, default: "" },
});

export default mongoose.model("Student", StudentSchema);