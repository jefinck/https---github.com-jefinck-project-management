import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaSave, FaTimes, FaPlus } from "react-icons/fa";
import Notification from "../../components/common/Notification";
import ConfirmationDialog from "../../components/common/ConfirmationDialog";
import "../../styles/admin.css";

const ManageStudent = () => {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    enrollmentNo: "",
    firstName: "",
    lastName: "",
    class: "",
    email: "",
    contactNo: "",
  });
  const [notification, setNotification] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    enrollmentNo: "",
    firstName: "",
    lastName: "",
    class: "",
    email: "",
    contactNo: "",
    password: "",
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/student");
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
      setNotification({
        message: "Failed to fetch students",
        type: "error",
      });
    }
  };

  const deleteStudent = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/student/${deleteId}`);
      fetchStudents();
      setNotification({
        message: "Student deleted successfully",
        type: "success",
      });
    } catch (error) {
      console.error("Error deleting student:", error);
      setNotification({
        message: "Failed to delete student",
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

  const editStudent = (student) => {
    setEditingStudent(student._id);
    setFormData({
      enrollmentNo: student.enrollmentNo,
      firstName: student.firstName,
      lastName: student.lastName,
      class: student.class,
      email: student.email,
      contactNo: student.contactNo,
    });
  };

  const updateStudent = async () => {
    try {
      await axios.put(`http://localhost:5000/api/student/${editingStudent}`, formData);
      setEditingStudent(null);
      fetchStudents();
      setNotification({
        message: "Student updated successfully",
        type: "success",
      });
    } catch (error) {
      console.error("Error updating student:", error);
      setNotification({
        message: "Failed to update student",
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
      await axios.post("http://localhost:5000/api/student", addFormData);
      setNotification({
        message: "Student added successfully",
        type: "success",
      });
      setAddFormData({
        enrollmentNo: "",
        firstName: "",
        lastName: "",
        class: "",
        email: "",
        contactNo: "",
        password: "",
      });
      setShowAddModal(false);
      fetchStudents();
    } catch (error) {
      console.error("Error adding student:", error);
      setNotification({
        message: "Failed to add student!",
        type: "error",
      });
    }
  };

  const filteredStudents = students.filter((student) =>
    Object.values(student).some((value) =>
      value.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="admin-content">
      <h2>Manage Students</h2>
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
          placeholder="Search student..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, maxWidth: "300px" }}
        />
        <button
          className="modal-btn confirm"
          onClick={() => setShowAddModal(true)}
          aria-label="Add student"
        >
          <FaPlus /> Add Student
        </button>
      </div>
      <table className="student-table">
        <thead>
          <tr>
            <th>Enrollment No</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Class</th>
            <th>Email</th>
            <th>Contact No</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((student) => (
            <tr key={student._id}>
              {editingStudent === student._id ? (
                <>
                  <td>
                    <input
                      type="text"
                      value={formData.enrollmentNo}
                      onChange={(e) =>
                        setFormData({ ...formData, enrollmentNo: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={formData.class}
                      onChange={(e) =>
                        setFormData({ ...formData, class: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={formData.contactNo}
                      onChange={(e) =>
                        setFormData({ ...formData, contactNo: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="save-btn"
                        onClick={updateStudent}
                        data-tooltip="Save"
                        aria-label="Save changes"
                      >
                        <FaSave />
                      </button>
                      <button
                        className="cancel-btn"
                        onClick={() => setEditingStudent(null)}
                        data-tooltip="Cancel"
                        aria-label="Cancel editing"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td>{student.enrollmentNo}</td>
                  <td>{student.firstName}</td>
                  <td>{student.lastName}</td>
                  <td>{student.class}</td>
                  <td>{student.email}</td>
                  <td>{student.contactNo}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="edit-btn"
                        onClick={() => editStudent(student)}
                        data-tooltip="Edit"
                        aria-label="Edit student"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteClick(student._id)}
                        data-tooltip="Delete"
                        aria-label="Delete student"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <ConfirmationDialog
        isOpen={showConfirm}
        onConfirm={deleteStudent}
        onCancel={() => setShowConfirm(false)}
        message="Are you sure you want to delete this student?"
      />
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "500px", width: "90%" }}>
            <h2>Add Student</h2>
            <form className="form-container" onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label>Enrollment No</label>
                <input
                  type="text"
                  name="enrollmentNo"
                  value={addFormData.enrollmentNo}
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
                <label>Class</label>
                <select
                  name="class"
                  value={addFormData.class}
                  onChange={handleAddChange}
                  required
                >
                  <option value="" disabled>
                    Select Class
                  </option>
                  <option value="TK-1 A">TK-1 A</option>
                  <option value="TK-1 B">TK-1 B</option>
                  <option value="TK-2">TK-2</option>
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
                  Add Student
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

export default ManageStudent;