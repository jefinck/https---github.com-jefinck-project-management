import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Login.css";
import logo from "../assets/login.png"; // make sure it's the correct path

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 👁️ Toggle
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        username,
        password,
      });

      const { role, facultyId, adminId, studentId, token } = response.data;
      const userData = { token, role, facultyId, adminId, studentId };
      localStorage.setItem("user", JSON.stringify(userData));

      if (role === "admin") navigate("/admin/home");
      else if (role === "faculty") navigate("/faculty/home");
      else if (role === "student") navigate("/student/dashboard");
      else throw new Error("Invalid role");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <img src={logo} alt="Logo" className="login-logo" />
        <h2>Login</h2>
        {error && <p className="error">{error}</p>}

        <input
          type="text"
          placeholder="Username (Admin/Faculty/Student)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            <i className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
          </span>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? <span className="spinner"></span> : "Login"}
        </button>

        <div className="forgot-password">
          <a onClick={() => navigate("/forgot-password")}>Forgot Password?</a>
        </div>

      </form>
    </div>
  );
};

export default Login;
