// models
import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Faculty",
    required: true,
  },
  messages: [
    {
      sender: { type: String, enum: ["student", "faculty"], required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  unreadCountStudent: {
    type: Number,
    default: 0,
  },
  unreadCountFaculty: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

export default mongoose.model("Chat", chatSchema);
