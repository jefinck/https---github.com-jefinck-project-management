import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/faculty.css";
import { useNavigate } from "react-router-dom";
import defaultProfile from "../../assets/profile.png";

const FacultyProfile = () => {
  const [facultyData, setFacultyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState(localStorage.getItem("facultyProfileImage") || "");

  const navigate = useNavigate();
  let storedUser = JSON.parse(localStorage.getItem("user"));
  let facultyId = storedUser?.facultyId?.trim() || null;
  let token = storedUser?.token || null;

  useEffect(() => {
    const fetchFacultyData = async () => {
      if (!facultyId || !token) {
        setError("Unauthorized access. Please login.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`http://localhost:5000/api/faculty/home/${facultyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFacultyData(response.data);
      } catch (err) {
        console.error("Error fetching faculty data:", err);
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyData();
  }, [facultyId, token]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "faculty_profile"); // 🔁 Replace with your actual unsigned preset
    formData.append("cloud_name", "dewzttwin"); // 🔁 Replace with your Cloudinary cloud name
  
    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/dewzttwin/image/upload", {
        method: "POST",
        body: formData,
      });
  
      const data = await res.json();
      setProfileImage(data.secure_url);
  
      // ✅ Save to both localStorage and backend (optional if you want it available everywhere)
      localStorage.setItem("facultyProfileImage", data.secure_url);
  
      // OPTIONAL: Save to DB for global availability across devices
      await axios.put(
        `http://localhost:5000/api/faculty/update-profile-image/${facultyId}`,
        { imageUrl: data.secure_url },
        { headers: { Authorization: `Bearer ${token}` } }
      );

       // ✅ Refresh faculty data to sync new image
      const refreshed = await axios.get(`http://localhost:5000/api/faculty/home/${facultyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFacultyData(refreshed.data);
  
    } catch (err) {
      console.error("Error uploading to Cloudinary:", err);
    }
  };
  

  const handleRemoveImage = async () => {
    try {
      setProfileImage("");
      localStorage.removeItem("facultyProfileImage");
  
      // Optional: Remove image from DB
      await axios.put(
        `http://localhost:5000/api/faculty/update-profile-image/${facultyId}`,
        { imageUrl: "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      const refreshed = await axios.get(`http://localhost:5000/api/faculty/home/${facultyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFacultyData(refreshed.data);
    } catch (err) {
      console.error("Error removing profile image:", err);
    }
  };
  

  const handleUpdatePassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      alert("Please fill in both fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/api/faculty/change-password/${facultyId}`,
        { newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    } catch (error) {
      console.error("Error updating password:", error);
      alert("Failed to change password.");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="faculty-profile-page">
      <div className="profile-card">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

        <div className="profile-icon-wrapper">
          <img
            src={profileImage || defaultProfile}
            alt="Profile"
            className="profile-icon"
          />
          <input
            type="file"
            accept="image/*"
            id="upload-profile"
            style={{ display: "none" }}
            onChange={handleImageUpload}
          />
          <div className="icon-actions">
            <label htmlFor="upload-profile" className="upload-btn">Change</label>
            {profileImage && <button className="remove-btn" onClick={handleRemoveImage}>Remove</button>}
          </div>
        </div>

        <h2>Faculty Profile</h2>
        <div className="profile-details">
          <div className="profile-row"><strong>Employee ID:</strong> <span>{facultyData?.employeeId}</span></div>
          <div className="profile-row"><strong>Name:</strong> <span>{facultyData?.name}</span></div>
          <div className="profile-row"><strong>Department:</strong> <span>{facultyData?.department}</span></div>
          <div className="profile-row"><strong>Email:</strong> <span>{facultyData?.email}</span></div>
          <div className="profile-row"><strong>Contact No.:</strong> <span>{facultyData?.contactNo}</span></div>
        </div>

        <button className="update-password-btn" onClick={() => setShowPasswordForm(!showPasswordForm)}>
          {showPasswordForm ? "Cancel" : "Update Password"}
        </button>

        {showPasswordForm && (
          <div className="password-form">
            <h3>Change Password</h3>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button onClick={handleUpdatePassword}>Update Password</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyProfile;
