// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import "../styles/Register.css"; // Import CSS

// const Register = () => {
//   const [formData, setFormData] = useState({
//     enrollmentNo: "",
//     firstName: "",
//     lastName: "",
//     Class: "",
//     password: "",
//     confirmPassword: "",
//   });

//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       await axios.post("http://localhost:5000/api/auth/register", formData);
//       navigate("/login"); // Redirect to Login after successful registration
//     } catch (err) {
//       setError(err.response?.data?.message || "Error in registration");
//     }
//   };

//   return (
//     <div className="register-container">
//       <form className="register-form" onSubmit={handleSubmit}>
//         <h2>Student Registration</h2>
//         {error && <p className="error">{error}</p>}
//         <input type="text" name="enrollmentNo" placeholder="Enrollment No" onChange={handleChange} required />
//         <input type="text" name="firstName" placeholder="First Name" onChange={handleChange} required />
//         <input type="text" name="lastName" placeholder="Last Name" onChange={handleChange} required />
//         <input type="text" name="Class" placeholder="Class" onChange={handleChange} required />
//         <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
//         <input type="password" name="confirmPassword" placeholder="Confirm Password" onChange={handleChange} required />
//         <button type="submit">Register</button>
//         <p>Already have an account? <a href="/login">Login here</a></p>
//       </form>
//     </div>
//   );
// };

// export default Register;
