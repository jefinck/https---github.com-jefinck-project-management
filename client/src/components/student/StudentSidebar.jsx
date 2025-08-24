import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa";
import "../../styles/student.css";

const StudentSidebar = () => {
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("user");
    setShowLogoutModal(false);
    navigate("/login");
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <div className="sidebar">
      <h2>Student Dashboard</h2>

      <NavLink
        to="/student/dashboard"
        className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
      >
        Home
      </NavLink>

      <NavLink
        to="/student/my-project"
        className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
      >
        My Projects
      </NavLink>

      <NavLink
        to="/student/submit-task"
        className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
      >
        Tasks & Progress
      </NavLink>

      <NavLink
        to="/student/chat"
        className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
      >
        Chat with Faculty
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

export default StudentSidebar;