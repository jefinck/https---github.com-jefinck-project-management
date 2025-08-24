import React, { useState, useEffect } from "react";
import axios from "axios";
import StudentSidebar from "../../components/student/StudentSidebar";
import "../../styles/student.css";

const StudentProfile = () => {
  const [student, setStudent] = useState(null);
  const [profileImage, setProfileImage] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const studentId = storedUser?.studentId;

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/student/home/${studentId}`);
        setStudent(res.data);
        setProfileImage(res.data.profileImage || "");
      } catch (err) {
        console.error("Error fetching student:", err);
      }
    };

    if (studentId) fetchStudent();
  }, [studentId]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "your_upload_preset");

    try {
      const cloudinaryRes = await axios.post(
        "https://api.cloudinary.com/v1_1/your_cloud_name/image/upload",
        formData
      );
      const imageUrl = cloudinaryRes.data.secure_url;

      await axios.put(`http://localhost:5000/api/student/update-profile-image/${studentId}`, {
        imageUrl,
      });

      setProfileImage(imageUrl);
    } catch (error) {
      console.error("Error uploading profile image:", error);
    }
  };

  const handleRemoveImage = async () => {
    try {
      await axios.put(`http://localhost:5000/api/student/update-profile-image/${studentId}`, {
        imageUrl: "",
      });
      setProfileImage("");
    } catch (error) {
      console.error("Error removing profile image:", error);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    try {
      await axios.put(`http://localhost:5000/api/student/update-password/${studentId}`, {
        password: newPassword,
      });
      setShowPasswordForm(false);
      setNewPassword("");
      setConfirmPassword("");
      setError("");
      alert("Password updated successfully");
    } catch (error) {
      console.error("Error updating password:", error);
      setError("Failed to update password. Try again.");
    }
  };

  return (
    <div className="dashboard-wrapper">
      <StudentSidebar />
      <div className="dashboard-content">
        <div className="student-profile-wrapper">
          <div className="profile-card">
            <h2>Student Profile</h2>
            <div className="profile-image-section">
              <img
                src={profileImage || "/default-avatar.png"}
                alt="Profile"
                className="profile-icon"
              />
              <div className="profile-image-actions">
                <button
                  className="add-image-btn"
                  onClick={() => document.getElementById("imageInput").click()}
                >
                  {profileImage ? "Change Image" : "Add Image"}
                </button>
                {profileImage && (
                  <button className="remove-image-btn" onClick={handleRemoveImage}>
                    Remove Image
                  </button>
                )}
                <input
                  type="file"
                  accept="image/*"
                  id="imageInput"
                  style={{ display: "none" }}
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            <div className="profile-details">
              <div className="profile-row">
                <strong>Enrollment No:</strong>
                <span>{student?.enrollmentNo || "N/A"}</span>
              </div>
              <div className="profile-row">
                <strong>Full Name:</strong>
                <span>{student?.firstName} {student?.lastName}</span>
              </div>
              <div className="profile-row">
                <strong>Class:</strong>
                <span>{student?.class || "N/A"}</span>
              </div>
              <div className="profile-row">
                <strong>Email:</strong>
                <span>{student?.email || "N/A"}</span>
              </div>
              <div className="profile-row">
                <strong>Contact No.:</strong>
                <span>{student?.contactNo || "N/A"}</span>
              </div>
              {!showPasswordForm && (
              <button className="update-password-btn" onClick={() => setShowPasswordForm(true)}>
                Update Password
              </button>
            )}
            </div>

            {showPasswordForm && (
              <form className="password-form" onSubmit={handleUpdatePassword}>
                <div className="form-group">
                  <input
                    type="password"
                    placeholder="Enter New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="error">{error}</p>}
                <div className="password-actions">
                  <button type="submit" className="save-password-btn">
                    Save
                  </button>
                  <button
                    type="button"
                    className="cancel-password-btn"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setNewPassword("");
                      setConfirmPassword("");
                      setError("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;