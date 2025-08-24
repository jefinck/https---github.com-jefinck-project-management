import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import FacultyHome from "./pages/faculty/FacultyDashboard"; // Import Faculty Home Page
import FacultyProfile from "./pages/faculty/FacultyProfile";
import ManageAssignedProjects from "./pages/faculty/ManageAssignedProjects";
import AssignTask from "./pages/faculty/AssignTask";
import FacultyChatDashboard from "./pages/faculty/FacultyChatDashboard";
import ReviewStudentTasks from "./pages/faculty/ReviewStudentTasks";


import AdminDashboard from "./pages/admin/AdminDashboard";
import Home from "./pages/admin/Home";
import ManageFaculty from "./pages/admin/ManageFaculty";
import AddFaculty from "./pages/admin/AddFaculty";
import ManageStudent from "./pages/admin/ManageStudent";
import AddStudent from "./pages/admin/AddStudent";
import ProjectManagement from "./pages/admin/project-management/ProjectManagement";

import StudentDashboard from "./pages/student/StudentDashboard";
import MyProject from "./pages/student/MyProject";
import StudentChat from "./pages/student/ChatWithFaculty";
import SubmitTask from "./pages/student/SubmitTask";
import TaskDetailsSubmit from "./pages/student/TaskDetailsSubmit";
import StudentProfile from "./pages/student/StudentProfile";

function App() {
  return (
    <Routes>
      {/* Redirect to Login Page on Load */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Authentication Route */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      
      {/* Admin Routes */}
      <Route path="/admin/*" element={<AdminDashboard />}>
        <Route path="home" element={<Home />} />
        <Route path="manage-faculty" element={<ManageFaculty />} />
        <Route path="add-faculty" element={<AddFaculty />} />
        <Route path="manage-student" element={<ManageStudent />} />
        <Route path="add-student" element={<AddStudent />} />
        <Route path="project-management" element={<ProjectManagement />} />
      </Route>

      {/* Faculty Route - Ensure "/faculty/home" is accessible */}
      <Route path="/faculty/home" element={<FacultyHome />} />
      <Route path="/faculty/profile" element={<FacultyProfile />} />
      <Route path="/faculty/manage-projects" element={<ManageAssignedProjects />} />
      <Route path="/faculty/assign-task" element={<AssignTask />} /> 
      <Route path="/faculty/chat" element={<FacultyChatDashboard />} />
      <Route path="/faculty/review-tasks" element={<ReviewStudentTasks />} />

      
      <Route path="/student/dashboard" element={<StudentDashboard />} />
      <Route path="/student/profile" element={<StudentProfile />} />
      <Route path="/student/my-project" element={<MyProject />} />
      <Route path="/student/chat" element={<StudentChat />} />
      <Route path="/student/submit-task" element={<SubmitTask />} />
      <Route path="/student/task/:taskId" element={<TaskDetailsSubmit />} />

    </Routes>
  );
}

export default App;
