import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import Notification from "../../components/common/Notification";
import "../../styles/student.css";

const TaskDetailsSubmit = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const studentId = user?.studentId;
  const token = user?.token;

  const [task, setTask] = useState(null);
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [notification, setNotification] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedTask, setSubmittedTask] = useState(null);
  const [isOverdue, setIsOverdue] = useState(false);
  const [error, setError] = useState(null);

  const supportedFormats = ["jpg", "png", "pdf", "docx"];
  const maxFileSize = 10 * 1024 * 1024; // 10MB in bytes

  useEffect(() => {
    if (!studentId || !token) {
      setNotification({
        message: "Student ID or token not found. Please log in again.",
        type: "error",
      });
      return;
    }

    const fetchTaskAndStatus = async () => {
      try {
        const [taskRes, statusRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/tasks/${taskId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`http://localhost:5000/api/submitted-tasks/status/${taskId}/${studentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const taskData = taskRes.data;
        setTask(taskData);

        const overdue = new Date(taskData.dueDate) < new Date();
        setIsOverdue(overdue);

        const submission = statusRes.data.submission;
        const isMissedSubmission =
          submission?.grade === 0 &&
          submission?.description === "Automatically graded due to missed deadline";
        setIsSubmitted(statusRes.data.submitted && !isMissedSubmission);
        if (statusRes.data.submitted && !isMissedSubmission) {
          setSubmittedTask(submission);
          setDescription(submission.description || "");
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Could not load task details.");
      }
    };

    fetchTaskAndStatus();
  }, [taskId, studentId, token]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) {
      setFile(null);
      return;
    }

    const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
    if (!supportedFormats.includes(fileExtension)) {
      setNotification({
        message: `Invalid file format. Supported formats: ${supportedFormats.join(", ")}.`,
        type: "error",
      });
      setFile(null);
      return;
    }

    if (selectedFile.size > maxFileSize) {
      setNotification({
        message: "File size exceeds 10MB limit.",
        type: "error",
      });
      setFile(null);
      return;
    }

    console.log("Selected file:", selectedFile.name, "Size:", selectedFile.size);
    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setNotification({
        message: "Please select a valid file.",
        type: "error",
      });
      return;
    }

    const formData = new FormData();
    formData.append("studentId", studentId);
    formData.append("taskId", taskId);
    formData.append("description", description);
    formData.append("file", file);
    if (task?.projectId) {
      formData.append("projectId", task.projectId);
    }

    console.log("Submitting form with file:", file.name);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/submitted-tasks/submit",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotification({
        message: res.data.message,
        type: "success",
      });
      setIsSubmitted(true);
      setSubmittedTask(res.data.submission);
      setFile(null);
      setDescription("");
    } catch (err) {
      console.error("Submission failed:", err.response?.data || err.message);
      setNotification({
        message: err.response?.data?.error || "Task submission failed. Please try again.",
        type: "error",
      });
    }
  };

  if (error) {
    return (
      <div className="task-details-wrapper">
        <div className="task-submit-box">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="task-details-wrapper">
        <div className="task-submit-box">
          <p>Loading task...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-details-wrapper">
      <div className="task-submit-box">
        <div className="header-section">
          <button className="back-btn" onClick={() => navigate("/student/submit-task")}>
            Back
          </button>
          <h2>Submission Details</h2>
        </div>
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
        <div className="grade-section">
          <span>
            Grade:{" "}
            {isSubmitted && submittedTask?.grade !== null
              ? `${submittedTask.grade} / ${task.totalMarks || 10}`
              : `0 / ${task.totalMarks || 10}`}
          </span>
        </div>

        <h3>{task.taskTitle || "login"}</h3>
        <p>
          <strong>Description:</strong> {task.description || "login page with css"}
        </p>
        <p>
          {isSubmitted
            ? `Submitted ${new Date(submittedTask.submittedAt).toLocaleString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}`
            : `Due Date: ${new Date(task.dueDate).toLocaleString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}`}
        </p>

        {isOverdue && !isSubmitted ? (
          <div className="status-missing">
            <p>
              <strong>Task is overdue.</strong> Submission is no longer possible.
            </p>
            <p>Automatically graded as 0 due to missed deadline.</p>
          </div>
        ) : isSubmitted ? (
          <div className="submitted-status">
            <p>
              ✅ <strong>Task already submitted</strong>
            </p>
            <div className="submitted-details">
              <p>
                <strong>Submitted File:</strong>{" "}
                {submittedTask.fileUrl ? (
                  <a
                    href={submittedTask.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    type={getFileType(submittedTask.originalFileName)}
                    className="download-link"
                  >
                    {submittedTask.originalFileName}
                  </a>
                ) : (
                  <span style={{ color: "red" }}>
                    No file submitted (Upload failed or not saved)
                  </span>
                )}
              </p>
              <p>
                <strong>Your Description:</strong> {submittedTask.description || "No description"}
              </p>
              <p>
                <strong>Status:</strong> {submittedTask.status || "Submitted"}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="task-form-centered" encType="multipart/form-data">
            <div className="file-input-container">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.pdf,.docx"
                required
              />
              <p className="supported-formats">
                Supported file formats: {supportedFormats.join(", ")}
              </p>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional Description"
            ></textarea>
            <button type="submit">Submit Task</button>
          </form>
        )}
      </div>
    </div>
  );
};

// Helper function to determine MIME type based on file extension
const getFileType = (filename) => {
  const ext = filename.split(".").pop().toLowerCase();
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    default:
      return "application/octet-stream";
  }
};

export default TaskDetailsSubmit;
