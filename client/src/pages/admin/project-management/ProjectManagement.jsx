import React from "react";
import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import ProjectAssignment from "./ProjectAssignment";
import ProjectOverview from "./ProjectOverview";
import "../../../styles/admin.css"; // Adjusted path for styles

const ProjectManagement = () => {
  return (
    <div className="project-management-container">
      <h2>Project Management</h2>
      
      {/* Navigation Tabs */}
      <div className="tab-container">
        <NavLink to="assign-project" className="tab-link">Assign Project</NavLink>
        <NavLink to="overview" className="tab-link">Project Overview</NavLink>
      </div>

      {/* Nested Routes */}
      <div className="tab-content">
        <Routes>
          <Route path="/" element={<Navigate to="assign-project" />} />
          <Route path="assign-project" element={<ProjectAssignment />} />
          <Route path="overview" element={<ProjectOverview />} />
        </Routes>
      </div>
    </div>
  );
};

export default ProjectManagement;
