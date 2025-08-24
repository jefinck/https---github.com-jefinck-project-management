import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import FacultySidebar from "../../components/faculty/FacultySidebar";
import "../../styles/faculty.css";
import defaultProfile from "../../assets/profile.png";

const FacultyDashboard = () => {
  const [facultyData, setFacultyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projectCount, setProjectCount] = useState(0);
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
        setProjectCount(response.data.totalProjects);

        // 👇 Also update profile image from backend response (if available)
        if (response.data.profileImage) {
          setProfileImage(response.data.profileImage);
          localStorage.setItem("facultyProfileImage", response.data.profileImage); // optional: keep it synced
        }
      } catch (err) {
        console.error("Error fetching faculty data:", err);
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyData();
  }, [facultyId, token]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="dashboard-container">
      <FacultySidebar />

      <div className="main-content">
        <div className="top-bar">
          <h1>Welcome, {facultyData?.name} </h1>
          <div className="profile-container">
            <img
              src={profileImage || defaultProfile}
              alt="Profile"
              className="profile-icon"
              onClick={() => navigate("/faculty/profile")}
            />
          </div>
        </div>

        <div className="total-projects-container">
          <div className="stats-box">
            <h2>Total Assigned Projects</h2>
            <p>{projectCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
