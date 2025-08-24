import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaSave, FaTimes, FaPlus } from "react-icons/fa";
import Notification from "../../components/common/Notification";
import ConfirmationDialog from "../../components/common/ConfirmationDialog";
import "../../styles/admin.css";

const ManageFaculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: "",
    firstName: "",
    lastName: "",
    department: "",
    email: "",
    contactNo: "",
  });
  const [notification, setNotification] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    employeeId: "",
    firstName: "",
    lastName: "",
    department: "",
    email: "",
    contactNo: "",
    password: "",
  });

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/faculty");
      setFaculty(response.data);
    } catch (error) {
      console.error("Error fetching faculty:", error);
      setNotification({
        message: "Failed to fetch faculty",
        type: "error",
      });
    }
  };

  const deleteFaculty = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/faculty/${deleteId}`);
      fetchFaculty();
      setNotification({
        message: "Faculty deleted successfully",
        type: "success",
      });
    } catch (error) {
      console.error("Error deleting faculty:", error);
      setNotification({
        message: "Failed to delete faculty",
        type: "error",
      });
    }
    setShowConfirm(false);
    setDeleteId(null);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowConfirm(true);
  };

  const editFaculty = (facultyData) => {
    setEditingId(facultyData._id);
    setFormData({ ...facultyData });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      employeeId: "",
      firstName: "",
      lastName: "",
      department: "",
      email: "",
      contactNo: "",
    });
  };

  const updateFaculty = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/faculty/${editingId}`, formData);
      setEditingId(null);
      fetchFaculty();
      setNotification({
        message: "Faculty updated successfully",
        type: "success",
      });
    } catch (error) {
      console.error("Error updating faculty:", error);
      setNotification({
        message: "Failed to update faculty",
        type: "error",
      });
    }
  };

  const handleAddChange = (e) => {
    setAddFormData({ ...addFormData, [e.target.name]: e.target.value });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/faculty", addFormData);
      setNotification({
        message: "Faculty added successfully",
        type: "success",
      });
      setAddFormData({
        employeeId: "",
        firstName: "",
        lastName: "",
        department: "",
        email: "",
        contactNo: "",
        password: "",
      });
      setShowAddModal(false);
      fetchFaculty();
    } catch (error) {
      console.error("Error adding faculty:", error);
      setNotification({
        message: "Failed to add faculty!",
        type: "error",
      });
    }
  };

  const filteredFaculty = faculty.filter((f) =>
    Object.values(f).some((value) =>
      value.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="admin-content">
      <h2>Manage Faculty</h2>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <input
          type="text"
          className="search-bar"
          placeholder="Search faculty..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, maxWidth: "300px" }}
        />
        <button
          className="modal-btn confirm"
          onClick={() => setShowAddModal(true)}
          aria-label="Add faculty"
        >
          <FaPlus /> Add Faculty
        </button>
      </div>
      <table className="faculty-table">
        <thead>
          <tr>
            <th>Employee ID</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Department</th>
            <th>Email</th>
            <th>Contact No</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredFaculty.map((f) =>
            editingId === f._id ? (
              <tr key={f._id}>
                <td>
                  <input
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    value={formData.contactNo}
                    onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                  />
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="save-btn"
                      onClick={updateFaculty}
                      data-tooltip="Save"
                      aria-label="Save changes"
                    >
                      <FaSave />
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={cancelEdit}
                      data-tooltip="Cancel"
                      aria-label="Cancel editing"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={f._id}>
                <td>{f.employeeId}</td>
                <td>{f.firstName}</td>
                <td>{f.lastName}</td>
                <td>{f.department}</td>
                <td>{f.email}</td>
                <td>{f.contactNo}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="edit-btn"
                      onClick={() => editFaculty(f)}
                      data-tooltip="Edit"
                      aria-label="Edit faculty"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteClick(f._id)}
                      data-tooltip="Delete"
                      aria-label="Delete faculty"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
      <ConfirmationDialog
        isOpen={showConfirm}
        onConfirm={deleteFaculty}
        onCancel={() => setShowConfirm(false)}
        message="Are you sure you want to delete this faculty member?"
      />
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "500px", width: "90%" }}>
            <h2>Add Faculty</h2>
            <form className="form-container" onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label>Employee ID</label>
                <input
                  type="text"
                  name="employeeId"
                  value={addFormData.employeeId}
                  onChange={handleAddChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={addFormData.firstName}
                  onChange={handleAddChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={addFormData.lastName}
                  onChange={handleAddChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select
                  name="department"
                  value={addFormData.department}
                  onChange={handleAddChange}
                  required
                >
                  <option value="" disabled>
                    Select Department
                  </option>
                  <option value="ICT">ICT</option>
                  <option value="IT">IT</option>
                  <option value="CE">CE</option>
                  <option value="CE-AI">CE-AI</option>
                </select>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={addFormData.email}
                  onChange={handleAddChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Contact No</label>
                <input
                  type="text"
                  name="contactNo"
                  value={addFormData.contactNo}
                  onChange={handleAddChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={addFormData.password}
                  onChange={handleAddChange}
                  required
                />
              </div>
              <div className="modal-buttons">
                <button type="submit" className="submit-btn">
                  Add Faculty
                </button>
                <button
                  type="button"
                  className="modal-btn cancel"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageFaculty;