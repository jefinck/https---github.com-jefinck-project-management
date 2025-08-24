import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa";
import "../../styles/faculty.css";

const FacultySidebar = () => {
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("facultyProfileImage");
    setShowLogoutModal(false);
    navigate("/login");
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <div className="sidebar">
      <h2>Faculty Dashboard</h2>

      <NavLink
        to="/faculty/home"
        className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
      >
        Home
      </NavLink>

      <NavLink
        to="/faculty/manage-projects"
        className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
      >
        View Projects
      </NavLink>

      <NavLink
        to="/faculty/assign-task"
        className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
      >
        Assign Task
      </NavLink>

      <NavLink
        to="/faculty/review-tasks"
        className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
      >
        Review Task
      </NavLink>

      <NavLink
        to="/faculty/chat"
        className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
      >
        Chat with Student
      </NavLink>

      <div className="logout-section">
        <button
          onClick={handleLogoutClick}
          className="logout-btn"
          aria-label="Log out"
        >
          Logout
        </button>
      </div>

      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out?</p>
            <div className="modal-buttons">
              <button
                className="modal-btn confirm"
                onClick={confirmLogout}
                aria-label="Confirm logout"
              >
                Yes
              </button>
              <button
                className="modal-btn cancel"
                onClick={cancelLogout}
                aria-label="Cancel logout"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultySidebar;