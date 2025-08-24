import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import StudentSidebar from "../../components/student/StudentSidebar";
import Notification from "../../components/common/Notification";
import "../../styles/student.css";

const SubmitTask = () => {
  const [tasks, setTasks] = useState([]);
  const [taskStatuses, setTaskStatuses] = useState({});
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const studentId = user?.studentId;
  const token = user?.token;

  useEffect(() => {
    if (!studentId || !token) {
      setNotification({
        message: "Student ID or token not found. Please log in again.",
        type: "error",
      });
      setLoading(false);
      return;
    }

    const fetchTasks = async () => {
      try {
        const taskRes = await axios.get(`http://localhost:5000/api/tasks/student/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const tasks = taskRes.data;
        setTasks(tasks);

        // Fetch submission status for each task
        const statusPromises = tasks.map((task) =>
          axios.get(`http://localhost:5000/api/submitted-tasks/status/${task._id}/${studentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        );
        const statusResponses = await Promise.all(statusPromises);

        const statuses = {};
        statusResponses.forEach((res, index) => {
          const taskId = tasks[index]._id;
          const totalMarks = tasks[index].totalMarks || 10;
          const dueDate = new Date(tasks[index].dueDate);
          const now = new Date();
          const submission = res.data.submission;

          // Check if submission is a "Missed" auto-submission
          const isMissedSubmission =
            submission?.grade === 0 &&
            submission?.description === "Automatically graded due to missed deadline";

          if (res.data.submitted && !isMissedSubmission) {
            // Handle actual submissions
            if (submission.grade !== null && submission.grade !== undefined) {
              statuses[taskId] = {
                text: `Graded: ${submission.grade}/${totalMarks}`,
                class: "status-graded",
              };
            } else {
              statuses[taskId] = { text: "Submitted", class: "status-submitted" };
            }
          } else {
            // Handle non-submitted or "Missed" submissions
            if (dueDate < now) {
              statuses[taskId] = { text: "Missing", class: "status-missing" };
            } else {
              statuses[taskId] = { text: "Pending", class: "status-pending" };
            }
          }
        });
        setTaskStatuses(statuses);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching tasks or statuses:", err);
        setNotification({
          message: "Failed to load tasks or submission statuses.",
          type: "error",
        });
        setLoading(false);
      }
    };

    fetchTasks();
  }, [studentId, token]);

  return (
    <div className="dashboard-wrapper">
      <StudentSidebar />
      <div className="dashboard-content">
        <div className="student-dashboard-container">
          <h2>Assigned Tasks</h2>
          {notification && (
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification(null)}
            />
          )}
          {loading ? (
            <p>Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p>No tasks assigned to you.</p>
          ) : (
            <ul className="task-list">
              {tasks.map((task) => {
                const status = taskStatuses[task._id] || {
                  text: "Pending",
                  class: "status-pending",
                };
                return (
                  <li
                    key={task._id}
                    onClick={() => navigate(`/student/task/${task._id}`)}
                    className="task-item"
                  >
                    <strong>{task.taskTitle}</strong>
                    <span className={`task-status ${status.class}`}>{status.text}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmitTask;