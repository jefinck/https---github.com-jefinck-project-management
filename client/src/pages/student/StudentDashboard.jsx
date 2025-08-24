import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import StudentSidebar from "../../components/student/StudentSidebar";
import "../../styles/student.css";

const StudentDashboard = () => {
  const [student, setStudent] = useState(null);
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const userId = user?.studentId;

        if (!userId) {
          console.error("No student ID found in localStorage.");
          return;
        }

        const [studentRes, taskRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/student/${userId}`),
          axios.get(`http://localhost:5000/api/tasks/student/${userId}`),
        ]);

        setStudent(studentRes.data);
        const fetchedTasks = taskRes.data;
        setTasks(fetchedTasks);
      } catch (error) {
        console.error("Error fetching student data or tasks:", error);
      }
    };

    fetchStudentData();
  }, []);

  // Filter and sort pending tasks by due date (closest first)
  const pendingTasks = tasks
    .filter(
      (task) =>
        task.status !== "Submitted" &&
        task.status !== "Completed" &&
        new Date(task.dueDate) >= new Date()
    )
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const handleProfileClick = () => {
    navigate("/student/profile");
  };

  return (
    <div className="dashboard-wrapper">
      <StudentSidebar />

      <div className="dashboard-content">
        <div className="student-dashboard-container">
          {/* Welcome Header with Profile Icon on same line */}
          <div className="dashboard-header-flex">
            <h2 className="welcome-text">Welcome, {student ? student.firstName : "Student"}!</h2>
            <img
              src={student?.profileImage || "/default-avatar.png"}
              alt="Profile"
              className="student-profile-icon"
              onClick={handleProfileClick}
              title="View Profile"
            />
          </div>

          {/* Tasks */}
          <div className="task-section">
            <h3>Upcoming Tasks</h3>
            {pendingTasks.length > 0 ? (
              pendingTasks.map((task, index) => (
                <div key={index} className="task-item">
                  <div className="task-title-row">
                    <p>
                      <strong>Title:</strong> {task.taskTitle}
                    </p>
                    <p className="task-marks">
                      <strong>Marks:</strong> {task.totalMarks ?? "N/A"}
                    </p>
                  </div>
                  <p>
                    <strong>Due Date:</strong>{" "}
                    {new Date(task.dueDate).toLocaleString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>
                </div>
              ))
            ) : (
              <p>No upcoming tasks! 🎉</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;