import React, { useEffect, useState } from "react";
import axios from "axios";
import ChatWithStudent from "./ChatWithStudent";
import FacultySidebar from "../../components/faculty/FacultySidebar";
import "../../styles/faculty.css";

const FacultyChatDashboard = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [error, setError] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const facultyId = user?.facultyId;
  const token = user?.token;

  useEffect(() => {
    const fetchAssignedStudents = async () => {
      try {
        if (!facultyId || !token) {
          setError("Faculty ID or token not found. Please log in again.");
          return;
        }
        const res = await axios.get(
          `http://localhost:5000/api/projects/faculty/${facultyId}/assigned-students`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (Array.isArray(res.data)) {
          const studentsData = res.data.filter(Boolean);
          setStudents(studentsData);

          // Fetch unread counts for each student
          const unreadPromises = studentsData.map((student) =>
            axios.get(`http://localhost:5000/api/chats/${student._id}/${facultyId}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          );
          const unreadResponses = await Promise.all(unreadPromises);
          const unreadMap = {};
          unreadResponses.forEach((response, index) => {
            const chat = response.data;
            unreadMap[studentsData[index]._id] = chat.unreadCountFaculty || 0;
          });
          setUnreadCounts(unreadMap);
        }
      } catch (err) {
        console.error("Failed to fetch students:", err);
        setError("Failed to fetch assigned students");
      }
    };

    if (facultyId && token) {
      fetchAssignedStudents();
    } else {
      setError("Faculty ID or token not found. Please log in again.");
    }
  }, [facultyId, token]);

  const handleStudentSelect = async (studentId) => {
    setSelectedStudentId(studentId);
    // Remove projectTitle since it's not provided by the endpoint
    // setSelectedProjectTitle(projectTitle);

    // Mark messages as read when student is selected
    try {
      await axios.put(
        `http://localhost:5000/api/chats/${studentId}/${facultyId}/read`,
        { reader: "faculty" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnreadCounts((prev) => ({
        ...prev,
        [studentId]: 0,
      }));
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  };

  return (
    <div className="dashboard-container">
      <FacultySidebar />
      <div className="main-content">
        <h2 className="section-title">Chat with Assigned Students</h2>
        {error ? (
          <p className="error-message">{error}</p>
        ) : students.length === 0 ? (
          <p>No students assigned to you.</p>
        ) : (
          <div className="faculty-chat-container">
            <div className="student-list">
              <h3>Assigned Students</h3>
              <ul>
                {students.map((s) => (
                  <li key={s._id} className="student-item">
                    <button
                      onClick={() => handleStudentSelect(s._id)}
                      className={selectedStudentId === s._id ? "selected" : ""}
                    >
                      {s.firstName} {s.lastName}
                      {unreadCounts[s._id] > 0 && (
                        <span className="unread-badge">{unreadCounts[s._id]}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="chat-area">
              {selectedStudentId ? (
                <ChatWithStudent studentId={selectedStudentId} facultyId={facultyId} />
              ) : (
                <p>Select a student to start chat</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyChatDashboard;