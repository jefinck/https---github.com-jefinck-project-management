import React, { useEffect, useState } from "react";
import axios from "axios";
import FacultySidebar from "../../components/faculty/FacultySidebar";
import "../../styles/faculty.css";

const ManageAssignedProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  let storedUser = JSON.parse(localStorage.getItem("user"));
  let facultyId = storedUser?.facultyId?.trim() || null;
  let token = storedUser?.token || null;

  useEffect(() => {
    const fetchProjects = async () => {
      if (!facultyId || !token) {
        setError("Unauthorized access. Please login.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:5000/api/projects/faculty/${facultyId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setProjects(response.data);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [facultyId, token]);

  const handleViewProject = (project) => {
    setSelectedProject(project);
  };

  const handleCloseModal = () => {
    setSelectedProject(null);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="dashboard-container">
      <FacultySidebar />

      <div className="main-content">
        <h2>View Assigned Projects</h2>
        <table className="projects-table">
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Students</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {projects.length > 0 ? (
              projects.map((project) => (
                <tr key={project._id}>
                  <td>{project.title}</td>
                  <td>
                    {project.studentIds?.length
                      ? project.studentIds
                          .map((student) => `${student.firstName} ${student.lastName}`)
                          .join(", ")
                      : "No students assigned"}
                  </td>
                  <td>{project.status}</td>
                  <td>
                    <button
                      className="view-btn"
                      onClick={() => handleViewProject(project)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No projects assigned.</td>
              </tr>
            )}
          </tbody>
        </table>

        {selectedProject && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Project Details</h2>
              <p><strong>Title:</strong> {selectedProject.title}</p>
              <p><strong>Description:</strong> {selectedProject.description}</p>
              <p>
                <strong>Students:</strong>{" "}
                {selectedProject.studentIds?.length
                  ? selectedProject.studentIds
                      .map((student) => `${student.firstName} ${student.lastName}`)
                      .join(", ")
                  : "No students assigned"}
              </p>
              <p>
                <strong>Assigned At:</strong>{" "}
                {new Date(selectedProject.assignedAt).toLocaleDateString()}
              </p>
              <p><strong>Status:</strong> {selectedProject.status}</p>
              <p><strong>Domain:</strong> {selectedProject.domain}</p>
              <p>
                <strong>Tech Stack:</strong>{" "}
                {selectedProject.techStack || "Not specified"}
              </p>
              <p>
                <strong>End Date:</strong>{" "}
                {new Date(selectedProject.endDate).toLocaleDateString()}
              </p>
              <button className="close-btn" onClick={handleCloseModal}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageAssignedProjects;