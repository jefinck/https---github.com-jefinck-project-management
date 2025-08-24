// src/components/common/Notification.jsx
import React, { useEffect } from "react";
import "../../styles/notification.css";

const Notification = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`notification ${type}`}>
      <span className="notification-icon">
        {type === "success" ? "✔" : "✖"}
      </span>
      <span className="notification-message">{message}</span>
      <button
        className="notification-close"
        onClick={onClose}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

export default Notification;