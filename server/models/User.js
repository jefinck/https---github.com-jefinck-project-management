import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true }, // ✅ added email field
  password: { type: String, required: true },
  role: { type: String, default: "admin" },
  resetToken: { type: String },
  resetTokenExpires: { type: Date }
});

export default mongoose.model("User", UserSchema);
