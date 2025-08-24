import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Home from "./Home";
import ManageStudent from "./ManageStudent";
import ManageFaculty from "./ManageFaculty";
import AddStudent from "./AddStudent";
import AddFaculty from "./AddFaculty";
import ProjectAssignment from "./project-management/ProjectAssignment";
import ProjectOverview from "./project-management/ProjectOverview";
import "../../styles/admin.css";

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-container">
      <button
        className="menu-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        ☰
      </button>
      <Sidebar className={sidebarOpen ? "sidebar open" : "sidebar"} />
      <div className="admin-content">
        <Routes>
          <Route path="/" element={<Navigate to="/admin/home" />} />
          <Route path="/home" element={<Home />} />
          <Route path="/manage-students" element={<ManageStudent />} />
          <Route path="/manage-faculty" element={<ManageFaculty />} />
          <Route path="/add-student" element={<AddStudent />} />
          <Route path="/add-faculty" element={<AddFaculty />} />
          <Route path="/project-assignment" element={<ProjectAssignment />} />
          <Route path="/project-overview" element={<ProjectOverview />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminDashboard;