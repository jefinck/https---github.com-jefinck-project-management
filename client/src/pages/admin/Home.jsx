import React, { useEffect, useState } from "react";
import axios from "axios";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import "../../styles/admin.css";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const Home = () => {
  const [studentCount, setStudentCount] = useState(0);
  const [facultyCount, setFacultyCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const studentRes = await axios.get("http://localhost:5000/api/admin/students/count");
        setStudentCount(studentRes.data.count || 0);

        const facultyRes = await axios.get("http://localhost:5000/api/admin/faculty/count");
        setFacultyCount(facultyRes.data.count || 0);

        const projectRes = await axios.get("http://localhost:5000/api/admin/projects/count");
        setProjectCount(projectRes.data.count || 0);
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    };

    fetchCounts();
  }, []);

  // Pie Chart Data for User Distribution
  const pieData = {
    labels: ["Students", "Faculty"],
    datasets: [
      {
        data: [studentCount, facultyCount],
        backgroundColor: ["#36A2EB", "#FF6384"],
        hoverBackgroundColor: ["#36A2EB", "#FF6384"],
      },
    ],
  };

  // Pie Chart Options
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.raw}`,
        },
      },
    },
  };

  return (
    <div className="admin-content">
      <h2>Admin Dashboard</h2>
      
      {/* Stats Section */}
      <div className="stats">
        <div className="stat-box">
          <h3>Total Students</h3>
          <p>{studentCount}</p>
        </div>
        <div className="stat-box">
          <h3>Total Faculty</h3>
          <p>{facultyCount}</p>
        </div>
        <div className="stat-box">
          <h3>Total Projects Assigned</h3>
          <p>{projectCount}</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="charts">
        {/* Pie Chart */}
        <div className="chart-box">
          <h3>User Distribution</h3>
          <div className="chart-container">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;