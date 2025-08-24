import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa";
import Notification from "../../../components/common/Notification";
import ConfirmationDialog from "../../../components/common/ConfirmationDialog";
import "../../../styles/admin.css";

const ProjectOverview = () => {
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState(null);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      console.log("Fetching projects...");
      const response = await axios.get("http://localhost:5000/api/projects");
      console.log("Projects fetched:", response.data.length);
      setProjects(response.data);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setNotification({
        message: "Failed to fetch projects",
        type: "error",
      });
    }
  };

  const handleEdit = (project) => {
    console.log("Editing project:", project._id);
    setEditingProjectId(project._id);
    setEditForm({
      title: project.title,
      description: project.description,
      studentIds: project.studentIds.map((s) => s._id),
      facultyId: project.facultyId._id,
      endDate: project.endDate,
      domain: project.domain,
      techStack: project.techStack,
      status: project.status,
    });
  };

  const handleSave = async (projectId) => {
    console.log("Saving project:", projectId);
    try {
      const response = await axios.put(`http://localhost:5000/api/projects/${projectId}`, editForm);
      setProjects(projects.map((p) => (p._id === projectId ? response.data.updatedProject : p)));
      setEditingProjectId(null);
      setNotification({
        message: "Project updated successfully",
        type: "success",
      });
    } catch (error) {
      console.error("Error updating project:", error);
      setNotification({
        message: "Failed to update project",
        type: "error",
      });
    }
  };

  const handleDelete = async (projectId) => {
    console.log("Attempting to delete project with ID:", projectId);
    try {
      const response = await axios.delete(`http://localhost:5000/api/projects/${projectId}`);
      console.log("Delete response:", response.status, response.data);
      if (response.status === 200) {
        setProjects(projects.filter((p) => p._id !== projectId));
        setShowDeleteDialog(null);
        setNotification({
          message: response.data.message || "Project deleted successfully",
          type: "success",
        });
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      let errorMessage = "Failed to delete project";
      if (error.response) {
        console.log("Error response:", error.response.status, error.response.data);
        if (error.response.status === 400) {
          errorMessage = "Invalid project ID";
        } else if (error.response.status === 404) {
          errorMessage = "Project not found";
        } else {
          errorMessage = error.response.data.error || error.response.data.details || errorMessage;
        }
      } else if (error.request) {
        errorMessage = "No response from server. Please check if the server is running.";
      } else {
        errorMessage = `Unexpected error: ${error.message}`;
      }
      setNotification({
        message: errorMessage,
        type: "error",
      });
      setShowDeleteDialog(null);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.studentIds.some((s) =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.enrollmentNo.toLowerCase().includes(searchQuery.toLowerCase())
    ) ||
    `${p.facultyId.firstName} ${p.facultyId.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-content">
      <h2>Project Overview</h2>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <input
        type="text"
        placeholder="Search by title, student, enrollment no., or faculty..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="search-bar"
      />
      <table className="project-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Students</th>
            <th>Faculty</th>
            <th>End Date</th>
            <th>Domain</th>
            <th>Tech Stack</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProjects.map((project) => (
            <tr key={project._id}>
              {editingProjectId === project._id ? (
                <>
                  <td>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    />
                  </td>
                  <td>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={project.studentIds.map((s) => `${s.firstName} ${s.lastName} (${s.enrollmentNo})`).join(", ")}
                      disabled
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={`${project.facultyId.firstName} ${project.facultyId.lastName}`}
                      disabled
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      value={new Date(editForm.endDate).toISOString().split("T")[0]}
                      onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editForm.domain}
                      onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editForm.techStack || ""}
                      onChange={(e) => setEditForm({ ...editForm, techStack: e.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td>
                    <button onClick={() => handleSave(project._id)} className="action-btn save" data-tooltip="Save">
                      <FaSave />
                    </button>
                    <button onClick={() => setEditingProjectId(null)} className="action-btn cancel" data-tooltip="Cancel">
                      <FaTimes />
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td>{project.title}</td>
                  <td>{project.description}</td>
                  <td>
                    {project.studentIds.map((s) => `${s.firstName} ${s.lastName} (${s.enrollmentNo})`).join(", ")}
                  </td>
                  <td>{project.facultyId.firstName} {project.facultyId.lastName}</td>
                  <td>{new Date(project.endDate).toLocaleDateString()}</td>
                  <td>{project.domain}</td>
                  <td>{project.techStack || "N/A"}</td>
                  <td>{project.status}</td>
                  <td>
                    <button onClick={() => handleEdit(project)} className="action-btn edit" data-tooltip="Edit">
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => {
                        console.log("Delete button clicked for project:", project._id);
                        setShowDeleteDialog(project._id);
                      }}
                      className="action-btn delete"
                      data-tooltip="Delete"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {showDeleteDialog && (
        <ConfirmationDialog
          isOpen={!!showDeleteDialog}
          message="Are you sure you want to delete this project?"
          onConfirm={() => {
            console.log("Confirm delete for project:", showDeleteDialog);
            handleDelete(showDeleteDialog);
          }}
          onCancel={() => {
            console.log("Cancel delete dialog");
            setShowDeleteDialog(null);
          }}
        />
      )}
    </div>
  );
};

export default ProjectOverview;