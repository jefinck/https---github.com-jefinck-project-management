import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

const ChatWithStudent = ({ facultyId, studentId }) => {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const token = JSON.parse(localStorage.getItem("user"))?.token;

  useEffect(() => {
    const fetchChat = async () => {
      try {
        if (!token) {
          setError("Authentication token not found. Please log in again.");
          return;
        }
        const res = await axios.get(`http://localhost:5000/api/chats/${studentId}/${facultyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data.messages || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching chat:", err);
        setError("Failed to load chat messages");
      }
    };
    if (studentId && facultyId) {
      fetchChat();
    }
  }, [studentId, facultyId, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim()) return;

    try {
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        return;
      }
      const res = await axios.post(
        `http://localhost:5000/api/chats/${studentId}/${facultyId}`,
        {
          sender: "faculty",
          content: newMsg,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages(res.data.messages || []);
      setNewMsg("");
      setError(null);
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
    }
  };

  const formatDate = (dateStr) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  let lastDate = null;

  return (
    <div className="chat-box">
      {error && <p className="error-message">{error}</p>}
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
                <div className={msg.sender === "faculty" ? "msg faculty" : "msg student"}>
                  <strong>{msg.sender === "faculty" ? "You" : "Student"}:</strong> {msg.content}
                  <div className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</div>
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
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatWithStudent;