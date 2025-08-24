import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import StudentSidebar from "../../components/student/StudentSidebar";
import "../../styles/student.css";

const MyProject = () => {
  const [projects, setProjects] = useState([]);
  const [student, setStudent] = useState(null);
  const [facultyMap, setFacultyMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projectTasks, setProjectTasks] = useState({});
  const [progressData, setProgressData] = useState({});
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const studentId = user?.studentId;
        const token = user?.token;

        if (!studentId || !token) {
          setError("Student ID or token not found. Please log in again.");
          setLoading(false);
          return;
        }

        // Fetch all assigned projects
        const projectRes = await axios.get(
          `http://localhost:5000/api/projects/student/${studentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const projectList = projectRes.data;
        setProjects(projectList);

        // Fetch student details
        const studentRes = await axios.get(`http://localhost:5000/api/student/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudent(studentRes.data);

        // Fetch all related faculty details
        const facultyIds = [
          ...new Set(
            projectList
              .map((p) => (typeof p.facultyId === "object" ? p.facultyId?._id : p.facultyId))
              .filter(Boolean)
          ),
        ];
        const facultyData = {};

        await Promise.all(
          facultyIds.map(async (id) => {
            try {
              const res = await axios.get(`http://localhost:5000/api/faculty/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              facultyData[id] = res.data;
            } catch (err) {
              console.error(`Error fetching faculty ${id}:`, err);
              facultyData[id] = null;
            }
          })
        );

        setFacultyMap(facultyData);

        // Fetch tasks for each project and calculate progress
        const tasksData = {};
        const progress = {};

        await Promise.all(
          projectList.map(async (project) => {
            try {
              const taskRes = await axios.get(
                `http://localhost:5000/api/tasks/project/${project._id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const tasks = taskRes.data;
              tasksData[project._id] = tasks;

              // Calculate progress for this project
              let totalMarks = 0;
              let marksObtained = 0;
              const statusPromises = tasks.map((task) =>
                axios.get(
                  `http://localhost:5000/api/submitted-tasks/status/${task._id}/${studentId}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                )
              );
              const statusResponses = await Promise.all(statusPromises);

              statusResponses.forEach((res, index) => {
                const taskMarks = tasks[index].totalMarks ?? 10;
                totalMarks += taskMarks;
                // Only include grades for submitted and graded tasks
                if (res.data.submitted && res.data.submission.grade !== null) {
                  marksObtained += res.data.submission.grade;
                }
              });

              progress[project._id] = { obtained: marksObtained, total: totalMarks };
            } catch (err) {
              console.error(`Error fetching tasks for project ${project._id}:`, err);
              tasksData[project._id] = [];
              progress[project._id] = { obtained: 0, total: 0 };
              if (err.response?.status === 404) {
                console.warn(`No tasks found for project ${project._id}`);
              }
            }
          })
        );

        setProjectTasks(tasksData);
        setProgressData(progress);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching project or user info:", error);
        setError("Failed to load projects or student information.");
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const radius = canvas.width / 2 - 10;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const marks = progressData[selectedProjectId] || { obtained: 0, total: 0 };
    const percentage = marks.total > 0 ? (marks.obtained / marks.total) * 100 : 0;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw base circle (gray)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 12;
    ctx.strokeStyle = "#e2e8f0";
    ctx.stroke();

    // Draw progress arc (blue)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, (-Math.PI / 2) + (2 * Math.PI * percentage) / 100);
    ctx.strokeStyle = "#3182ce";
    ctx.stroke();

    // Draw marks text
    ctx.font = "18px Inter";
    ctx.fillStyle = "#1a202c";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${marks.obtained}/${marks.total}`, centerX, centerY);
  }, [selectedProjectId, progressData]);

  const handleViewProgress = (projectId) => {
    setSelectedProjectId(projectId);
  };

  const closeModal = () => {
    setSelectedProjectId(null);
  };

  return (
    <div className="dashboard-wrapper">
      <StudentSidebar />
      <div className="dashboard-content">
        <div className="student-dashboard-container">
          <h2>My Projects</h2>
          {loading ? (
            <p>Loading projects...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : projects.length > 0 ? (
            projects.map((project) => (
              <div key={project._id} className="project-box">
                <div className="project-details">
                  <p>
                    <strong>Title:</strong> {project.title}
                  </p>
                  <p>
                    <strong>Description:</strong> {project.description}
                  </p>
                  <p>
                    <strong>Team Members:</strong>{" "}
                    {project.studentIds && project.studentIds.length > 0
                      ? project.studentIds
                          .map((s) => `${s.firstName} ${s.lastName}`)
                          .join(", ")
                      : "No team members assigned"}
                  </p>
                  <p>
                    <strong>Faculty Guide:</strong>{" "}
                    {project.facultyId && facultyMap[typeof project.facultyId === "object" ? project.facultyId._id : project.facultyId]
                      ? `${facultyMap[typeof project.facultyId === "object" ? project.facultyId._id : project.facultyId].firstName} ${facultyMap[typeof project.facultyId === "object" ? project.facultyId._id : project.facultyId].lastName}`
                      : "N/A"}
                  </p>
                  <p>
                    <strong>Status:</strong> {project.status}
                  </p>
                  <p>
                    <strong>Assigned At:</strong> {new Date(project.assignedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  className="view-progress-btn"
                  onClick={() => handleViewProgress(project._id)}
                >
                  View Progress
                </button>
              </div>
            ))
          ) : (
            <p>No projects assigned yet.</p>
          )}
        </div>
      </div>

      {/* Modal for Progress */}
      {selectedProjectId && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Your Project Progress</h3>
            <div className="progress-indicator">
              <canvas ref={canvasRef} width="200" height="200"></canvas>
              <p>
                {progressData[selectedProjectId]?.total > 0
                  ? `${Math.round((progressData[selectedProjectId].obtained / progressData[selectedProjectId].total) * 100)}% Complete`
                  : "No tasks assigned yet"}
              </p>
            </div>
            <div className="modal-buttons">
              <button className="modal-btn cancel" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProject;
