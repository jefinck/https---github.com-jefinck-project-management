import React, { useState, useEffect } from "react";
import axios from "axios";
import FacultySidebar from "../../components/faculty/FacultySidebar";
import Notification from "../../components/common/Notification";
import "../../styles/faculty.css";

const AssignTask = () => {
  const [students, setStudents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("all");
  const [selectedProject, setSelectedProject] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [marks, setMarks] = useState("");
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const facultyId = user?.facultyId;
  const token = user?.token;

  // Fetch students and tasks
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (!facultyId || !token) {
          setNotification({
            message: "Faculty ID or token not found. Please log in again.",
            type: "error",
          });
          return;
        }
  
        // Fetch students
        const studentResponse = await axios.get(
          `http://localhost:5000/api/projects/faculty/${facultyId}/assigned-students`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStudents(studentResponse.data);
        if (studentResponse.data.length === 0) {
          setNotification({
            message: "No students assigned to you.",
            type: "info",
          });
        }
  
        // Fetch tasks
        const taskResponse = await axios.get(
          `http://localhost:5000/api/tasks/faculty/${facultyId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Tasks fetched:", taskResponse.data);
        setTasks(taskResponse.data);
        setFilteredTasks(taskResponse.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setNotification({
          message: "Failed to load students or tasks.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [facultyId, token]);

  // Fetch projects when a student is selected
  useEffect(() => {
    if (selectedStudent !== "all" && selectedStudent) {
      const fetchProjects = async () => {
        setProjectsLoading(true);
        try {
          const response = await axios.get(
            `http://localhost:5000/api/projects/student/${selectedStudent}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setProjects(response.data);
          setSelectedProject(response.data.length > 0 ? response.data[0]._id : "");
          if (response.data.length === 0) {
            setNotification({
              message: "No projects assigned to this student.",
              type: "info",
            });
          }
        } catch (err) {
          console.error("Error fetching projects:", err);
          setNotification({
            message: "Failed to load projects.",
            type: "error",
          });
        } finally {
          setProjectsLoading(false);
        }
      };

      fetchProjects();
    } else {
      setProjects([]);
      setSelectedProject("");
    }
  }, [selectedStudent, token]);

  // Search tasks
  useEffect(() => {
    setFilteredTasks(
      tasks.filter((task) =>
        task.taskTitle.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, tasks]);

  // Open modal for creating or editing a task
  const openModal = (task = null) => {
    if (task) {
      setEditTaskId(task._id);
      setTaskTitle(task.taskTitle);
      setDescription(task.description);
      setDueDate(new Date(task.dueDate).toISOString().slice(0, 16));
      setMarks(task.totalMarks);
      setSelectedStudent(task.studentId?._id || "all");
      setSelectedProject(task.projectId?._id || "");
    } else {
      setEditTaskId(null);
      setTaskTitle("");
      setDescription("");
      setDueDate("");
      setMarks("");
      setSelectedStudent("all");
      setSelectedProject("");
    }
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditTaskId(null);
    setNotification(null);
  };

  // Handle form submission (create or edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotification(null);

    if (!facultyId || !token) {
      setNotification({
        message: "Faculty ID or token not found. Please log in again.",
        type: "error",
      });
      return;
    }

    if (!taskTitle || !dueDate || !description || !marks) {
      setNotification({
        message: "All fields are required.",
        type: "error",
      });
      return;
    }

    if (isNaN(marks) || Number(marks) <= 0) {
      setNotification({
        message: "Marks must be a positive number.",
        type: "error",
      });
      return;
    }

    if (selectedStudent !== "all" && !selectedProject) {
      setNotification({
        message: "Please select a project for the student.",
        type: "error",
      });
      return;
    }

    const taskData = {
      facultyId,
      taskTitle,
      description,
      dueDate,
      totalMarks: Number(marks),
    };

    if (selectedStudent !== "all") {
      taskData.studentId = selectedStudent;
      taskData.projectId = selectedProject;
    } else {
      taskData.studentId = null;
      taskData.projectId = null;
    }

    try {
      let response;
      if (editTaskId) {
        response = await axios.put(
          `http://localhost:5000/api/tasks/${editTaskId}`,
          taskData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          "http://localhost:5000/api/tasks/assign-task",
          taskData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setNotification({
        message: response.data.message,
        type: "success",
      });

      // Refresh tasks from server to avoid duplicates
      const taskResponse = await axios.get(
        `http://localhost:5000/api/tasks/faculty/${facultyId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(taskResponse.data);
      setFilteredTasks(taskResponse.data);

      closeModal();
    } catch (err) {
      console.error("Error handling task:", err.response?.data || err);
      setNotification({
        message: err.response?.data?.message || "Failed to handle task.",
        type: "error",
      });
    }
  };

  // Delete task
  const handleDelete = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Refresh tasks from server
      const taskResponse = await axios.get(
        `http://localhost:5000/api/tasks/faculty/${facultyId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(taskResponse.data);
      setFilteredTasks(taskResponse.data);
      setNotification({
        message: "Task deleted successfully.",
        type: "success",
      });
    } catch (err) {
      console.error("Error deleting task:", err);
      setNotification({
        message: "Failed to delete task.",
        type: "error",
      });
    }
  };

  return (
    <div className="dashboard-container">
      <FacultySidebar />
      <div className="main-content">
        <h1>Manage Tasks</h1>
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
        <div className="task-controls">
          <input
            type="text"
            placeholder="Search tasks by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-bar"
          />
          <button onClick={() => openModal()} className="assign-task-btn">
            Assign New Task
          </button>
        </div>
  
        {loading ? (
          <p>Loading tasks...</p>
        ) : filteredTasks.length === 0 ? (
          <p>No tasks assigned.</p>
        ) : (
          <table className="task-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Assigned To</th>
                <th>Due Date</th>
                <th>Marks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task._id}>
                  <td>{task.taskTitle}</td>
                  <td>
                    {task.studentId
                      ? `${task.studentId.firstName} ${task.studentId.lastName}`
                      : "All Students"}
                  </td>
                  <td>{new Date(task.dueDate).toLocaleString()}</td>
                  <td>{task.totalMarks}</td>
                  <td>
                    <button onClick={() => openModal(task)} className="edit-btn">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(task._id)} className="delete-btn">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>{editTaskId ? "Edit Task" : "Assign Task"}</h2>
              <form onSubmit={handleSubmit} className="assign-task-form">
                <div className="form-group">
                  <label>Assign To:</label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    disabled={projectsLoading || students.length === 0}
                  >
                    <option value="all">All Students</option>
                    {students.map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.firstName} {student.lastName} ({student.enrollmentNo})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedStudent !== "all" &&
                  (projectsLoading ? (
                    <p>Loading projects...</p>
                  ) : projects.length === 0 ? (
                    <p>No projects assigned to this student.</p>
                  ) : (
                    <div className="form-group">
                      <label>Project Title:</label>
                      <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                      >
                        {projects.map((project) => (
                          <option key={project._id} value={project._id}>
                            {project.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}

                <div className="form-group">
                  <label>Task Title:</label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Enter task title"
                    required
                    disabled={students.length === 0}
                  />
                </div>

                <div className="form-group">
                  <label>Description:</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter task description"
                    required
                    disabled={students.length === 0}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Due Date & Time:</label>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    disabled={students.length === 0}
                  />
                </div>

                <div className="form-group">
                  <label>Total Marks:</label>
                  <input
                    type="number"
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    placeholder="Enter marks (e.g. 10, 100)"
                    required
                    min="1"
                    disabled={students.length === 0}
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={students.length === 0 || (selectedStudent !== "all" && projects.length === 0)}
                  >
                    {editTaskId ? "Update Task" : "Assign Task"}
                  </button>
                  <button type="button" onClick={closeModal} className="cancel-btn">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignTask;
