import React, { useState } from "react";
import axios from "axios";
import Notification from "../../components/common/Notification";
import "../../styles/admin.css";

const AddStudent = () => {
  const [formData, setFormData] = useState({
    enrollmentNo: "",
    firstName: "",
    lastName: "",
    class: "",
    email: "",
    contactNo: "",
    password: "",
  });
  const [notification, setNotification] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/student", formData);
      setNotification({
        message: "Student added successfully",
        type: "success",
      });
      setFormData({
        enrollmentNo: "",
        firstName: "",
        lastName: "",
        class: "",
        email: "",
        contactNo: "",
        password: "",
      });
    } catch (error) {
      console.error("Error adding student:", error);
      setNotification({
        message: "Failed to add student!",
        type: "error",
      });
    }
  };

  return (
    <div className="admin-content">
      <h2>Add Student</h2>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <form className="form-container" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Enrollment No</label>
          <input type="text" name="enrollmentNo" value={formData.enrollmentNo} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>First Name</label>
          <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Last Name</label>
          <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Class</label>
          <select name="class" value={formData.class} onChange={handleChange} required>
            <option value="" disabled>Select Class</option>
            <option value="TK-1 A">TK-1 A</option>
            <option value="TK-1 B">TK-1 B</option>
            <option value="TK-2">TK-2</option>
          </select>
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Contact No</label>
          <input type="text" name="contactNo" value={formData.contactNo} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        </div>
        <button type="submit" className="submit-btn">Add Student</button>
      </form>
    </div>
  );
};

export default AddStudent;