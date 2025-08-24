import React, { useEffect, useState, useRef } from "react";
import StudentSidebar from "../../components/student/StudentSidebar";
import axios from "axios";
import "../../styles/student.css";

const ChatWithFaculty = () => {
  const [studentId, setStudentId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [facultyId, setFacultyId] = useState(null);
  const [facultyName, setFacultyName] = useState(""); // Changed from projectTitle
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  useEffect(() => {
    if (user?.studentId) {
      setStudentId(user.studentId);
    } else {
      setError("Student ID not found. Please log in again.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!studentId || !token) return;
      try {
        const res = await axios.get(
          `http://localhost:5000/api/projects/student/${studentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const projectsData = res.data;
        setProjects(projectsData);

        // Fetch unread counts for each project
        const unreadPromises = projectsData.map((project) =>
          axios.get(
            `http://localhost:5000/api/chats/${studentId}/${
              typeof project.facultyId === "object" ? project.facultyId._id : project.facultyId
            }`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )
        );
        const unreadResponses = await Promise.all(unreadPromises);
        const unreadMap = {};
        unreadResponses.forEach((response, index) => {
          const chat = response.data;
          unreadMap[projectsData[index]._id] = chat.unreadCountStudent || 0;
        });
        setUnreadCounts(unreadMap);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching projects or unread counts:", err);
        setError("Failed to load projects or chat data.");
        setLoading(false);
      }
    };
    fetchProjects();
  }, [studentId, token]);

  const handleProjectSelect = async (project) => {
    setSelectedProjectId(project._id);
    const selectedFacultyId =
      typeof project.facultyId === "object" ? project.facultyId._id : project.facultyId;
    setFacultyId(selectedFacultyId);
    // Set faculty name instead of project title
    const facultyFullName =
      typeof project.facultyId === "object"
        ? `${project.facultyId.firstName} ${project.facultyId.lastName}`
        : "Unknown Faculty";
    setFacultyName(facultyFullName);

    // Mark messages as read when project is selected
    try {
      await axios.put(
        `http://localhost:5000/api/chats/${studentId}/${selectedFacultyId}/read`,
        { reader: "student" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnreadCounts((prev) => ({
        ...prev,
        [project._id]: 0,
      }));
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      if (!studentId || !facultyId || !token) return;
      try {
        const res = await axios.get(
          `http://localhost:5000/api/chats/${studentId}/${facultyId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages(res.data.messages || []);
        setError(null);
      } catch (err) {
        console.error("Error loading messages:", err);
        setError("Failed to load chat messages.");
      }
    };
    fetchMessages();
  }, [studentId, facultyId, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !token) return;
    try {
      const res = await axios.post(
        `http://localhost:5000/api/chats/${studentId}/${facultyId}`,
        {
          sender: "student",
          content: newMsg,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(res.data.messages || []);
      setUnreadCounts((prev) => ({
        ...prev,
        [selectedProjectId]: 0,
      }));
      setNewMsg("");
      setError(null);
    } catch (err) {
      console.error("Message send failed:", err);
      setError("Failed to send message.");
    }
  };

  const formatDate = (dateStr) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  let lastDate = null;

  return (
    <div className="dashboard-container">
      <StudentSidebar />
      <div className="main-content">
        <h2 className="section-title">Chat with Guide</h2>
        {error && <p className="error-message">{error}</p>}
        {loading ? (
          <p>Loading projects...</p>
        ) : projects.length === 0 ? (
          <p>No projects assigned to you.</p>
        ) : (
          <div className="faculty-chat-container">
            <div className="student-list">
              <h3>Your Projects</h3>
              <ul>
                {projects.map((p) => (
                  <li key={p._id} className="project-item">
                    <button
                      onClick={() => handleProjectSelect(p)}
                      className={selectedProjectId === p._id ? "selected" : ""}
                    >
                      {p.title}
                      {unreadCounts[p._id] > 0 && (
                        <span className="unread-badge">{unreadCounts[p._id]}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="chat-area">
              {facultyId ? (
                <>
                  <h4 className="project-title">Guide Chat: {facultyName}</h4>
                  <div className="chat-box">
                    <div className="messages">
                      {messages.length === 0 ? (
                        <p>No messages yet.</p>
                      ) : (
                        messages.map((msg, idx) => {
                          const msgDate = formatDate(msg.timestamp);
                          const showDate = msgDate !== lastDate;
                          lastDate = msgDate;

                          return (
                            <React.Fragment key={idx}>
                              {showDate && <div className="chat-date">{msgDate}</div>}
                              <div
                                className={`msg ${msg.sender === "student" ? "student" : "faculty"}`}
                              >
                                <strong>
                                  {msg.sender === "student" ? "You" : "Faculty"}:
                                </strong>{" "}
                                {msg.content}
                                <div className="timestamp">
                                  {new Date(msg.timestamp).toLocaleTimeString(undefined, {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                            </React.Fragment>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="chat-input">
                      <input
                        value={newMsg}
                        onChange={(e) => setNewMsg(e.target.value)}
                        placeholder="Type your message..."
                      />
                      <button onClick={sendMessage}>Send</button>
                    </div>
                  </div>
                </>
              ) : (
                <p>Select a project to chat with faculty</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWithFaculty;