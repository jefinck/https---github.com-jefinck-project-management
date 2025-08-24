import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa";
import "../styles/admin.css";

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default to open
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const toggleProjectMenu = () => {
    setIsProjectOpen(!isProjectOpen);
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    navigate("/login");
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <div className={`sidebar ${isSidebarOpen ? "open" : ""}`} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "10px 20px", color: "#fff" }}>
        <h2 style={{ display: isSidebarOpen ? "block" : "none" }}>Admin Dashboard</h2>
      </div>
      <div style={{ display: isSidebarOpen ? "block" : "none", flex: "1 0 auto" }}>
        <NavLink to="/admin/home" className="nav-link">
          Dashboard
        </NavLink>
        <NavLink to="/admin/manage-students" className="nav-link">
          Manage Students
        </NavLink>
        <NavLink to="/admin/manage-faculty" className="nav-link">
          Manage Faculty
        </NavLink>
        <div className="nav-link dropdown" onClick={toggleProjectMenu}>
          <span>Project Management</span>
          <FaChevronDown
            className={`arrow-icon ${isProjectOpen ? "open" : ""}`}
          />
        </div>
        {isProjectOpen && (
          <div className="submenu">
            <NavLink to="/admin/project-assignment" className="nav-link">
              Assign Project
            </NavLink>
            <NavLink to="/admin/project-overview" className="nav-link">
              Project Overview
            </NavLink>
          </div>
        )}
      </div>
      <div style={{ display: isSidebarOpen ? "block" : "none", flex: "0 0 auto" }}>
        <button
          className="logout"
          onClick={handleLogoutClick}
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

export default Sidebar;