import React, { useState } from "react";
import axios from "axios";
import Notification from "../../components/common/Notification";
import "../../styles/admin.css";

const AddFaculty = () => {
  const [formData, setFormData] = useState({
    employeeId: "",
    firstName: "",
    lastName: "",
    department: "",
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
      await axios.post("http://localhost:5000/api/faculty", formData);
      setNotification({
        message: "Faculty added successfully",
        type: "success",
      });
      setFormData({
        employeeId: "",
        firstName: "",
        lastName: "",
        department: "",
        email: "",
        contactNo: "",
        password: "",
      });
    } catch (error) {
      console.error("Error adding faculty:", error);
      setNotification({
        message: "Failed to add faculty!",
        type: "error",
      });
    }
  };

  return (
    <div className="admin-content">
      <h2>Add Faculty</h2>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <form className="form-container" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Employee ID</label>
          <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} required />
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
          <label>Department</label>
          <select name="department" value={formData.department} onChange={handleChange} required>
            <option value="" disabled>Select Department</option>
            <option value="ICT">ICT</option>
            <option value="IT">IT</option>
            <option value="CE">CE</option>
            <option value="CE-AI">CE-AI</option>
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
        <button type="submit" className="submit-btn">Add Faculty</button>
      </form>
    </div>
  );
};

export default AddFaculty;