import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Notification from "../../../components/common/Notification";
import "../../../styles/admin.css";

const ProjectAssignment = () => {


  
  const [students, setStudents] = useState([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [faculty, setFaculty] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [endDate, setEndDate] = useState(null);
  const [domain, setDomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [techStack, setTechStack] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [notification, setNotification] = useState(null);
  const [errors, setErrors] = useState({});

  const domainOptions = [
    "Artificial Intelligence / Machine Learning",
    "Data Science & Analytics",
    "Web Development",
    "Mobile App Development",
    "Internet of Things (IoT)",
    "Cloud Computing",
    "Cybersecurity",
    "Blockchain Technology",
    "Embedded Systems",
    "Others",
  ];

  const MAX_TEAM_SIZE = 5;

  useEffect(() => {
    fetchStudents();
    fetchFaculty();
  }, []);

  const fetchStudents = async () => {
    try {
      setIsLoadingStudents(true);
      const response = await axios.get("http://localhost:5000/api/student");
      const fetchedStudents = response.data;
      console.log("Fetched students:", fetchedStudents);
      
      // Validate student data
      const validStudents = fetchedStudents.filter(
        (student) => student._id && student.firstName && student.lastName && student.enrollmentNo
      );
      
      if (validStudents.length === 0) {
        setNotification({ message: "No valid students found", type: "error" });
      } else if (validStudents.length < fetchedStudents.length) {
        console.warn(`Skipped ${fetchedStudents.length - validStudents.length} students due to missing fields`);
      }
      
      setStudents(validStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
      setNotification({ message: "Failed to load students", type: "error" });
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const fetchFaculty = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/faculty");
      setFaculty(response.data);
    } catch (error) {
      console.error("Error fetching faculty:", error);
    }
  };

  const studentOptions = useMemo(() => {
    return students
      .filter((student) => student._id && student.firstName && student.lastName && student.enrollmentNo)
      .map((student) => ({
        value: student._id,
        label: `${student.firstName} ${student.lastName} (${student.enrollmentNo})`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [students]);

  const validateForm = () => {
    const newErrors = {};
    if (!title) newErrors.title = "Project title is required";
    if (!description) newErrors.description = "Description is required";
    if (!endDate) {
      newErrors.endDate = "End date is required";
    } else if (endDate < new Date()) {
      newErrors.endDate = "End date must be in the future";
    }
    if (!domain) newErrors.domain = "Project domain is required";
    if (domain === "Others" && !customDomain.trim()) newErrors.customDomain = "Custom domain is required";
    if (selectedStudents.length === 0) newErrors.students = "At least one student must be selected";
    if (selectedStudents.length > MAX_TEAM_SIZE) newErrors.students = `Maximum ${MAX_TEAM_SIZE} students allowed`;
    if (!selectedFaculty) newErrors.faculty = "Please select a faculty";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAssignProject = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setNotification({
        message: "Please fill in all required fields correctly!",
        type: "error",
      });
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/projects/assign", {
        title,
        description,
        endDate,
        domain: domain === "Others" ? customDomain.trim() : domain,
        techStack,
        studentIds: selectedStudents.map((s) => s.value),
        facultyId: selectedFaculty,
      });

      setNotification({
        message: "Project assigned successfully!",
        type: "success",
      });
      setTitle("");
      setDescription("");
      setEndDate(null);
      setDomain("");
      setCustomDomain("");
      setTechStack("");
      setSelectedStudents([]);
      setSelectedFaculty("");
      setErrors({});
    } catch (error) {
      console.error("Error assigning project:", error);
      setNotification({
        message: "Failed to assign project.",
        type: "error",
      });
    }
  };

  console.log("Student options:", studentOptions);

  return (
    <div className="admin-content">
      <h2>Assign Project</h2>

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <form onSubmit={handleAssignProject} className="assignment-form">
        <div className="form-group">
          <label htmlFor="title">Project Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter project title"
            className={errors.title ? "error" : ""}
            aria-invalid={errors.title ? "true" : "false"}
            aria-describedby={errors.title ? "title-error" : undefined}
          />
          {errors.title && <span id="title-error" className="error-message">{errors.title}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Project Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter project description"
            rows="3"
            className={errors.description ? "error" : ""}
            aria-invalid={errors.description ? "true" : "false"}
            aria-describedby={errors.description ? "description-error" : undefined}
          />
          {errors.description && <span id="description-error" className="error-message">{errors.description}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="endDate">End Date</label>
          <DatePicker
            id="endDate"
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            dateFormat="MM/dd/yyyy"
            placeholderText="Select end date"
            minDate={new Date()}
            className={errors.endDate ? "error" : ""}
            aria-invalid={errors.endDate ? "true" : "false"}
            aria-describedby={errors.endDate ? "endDate-error" : undefined}
          />
          {errors.endDate && <span id="endDate-error" className="error-message">{errors.endDate}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="domain">Project Domain</label>
          <select
            id="domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className={errors.domain ? "error" : ""}
            aria-invalid={errors.domain ? "true" : "false"}
            aria-describedby={errors.domain ? "domain-error" : undefined}
          >
            <option value="">-- Select Domain --</option>
            {domainOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {errors.domain && <span id="domain-error" className="error-message">{errors.domain}</span>}
        </div>

        {domain === "Others" && (
          <div className="form-group">
            <label htmlFor="customDomain">Custom Domain</label>
            <input
              id="customDomain"
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="Enter custom domain"
              className={errors.customDomain ? "error" : ""}
              aria-invalid={errors.customDomain ? "true" : "false"}
              aria-describedby={errors.customDomain ? "customDomain-error" : undefined}
            />
            {errors.customDomain && <span id="customDomain-error" className="error-message">{errors.customDomain}</span>}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="techStack">Technology Stack</label>
          <input
            id="techStack"
            type="text"
            value={techStack}
            onChange={(e) => setTechStack(e.target.value)}
            placeholder="Enter technology stack (e.g., React, Node.js)"
            aria-invalid="false"
          />
        </div>

        <div className="form-group">
          <label htmlFor="students">Team Members</label>
          <Select
            key={studentOptions.length}
            id="students"
            isMulti
            options={studentOptions}
            value={selectedStudents}
            onChange={setSelectedStudents}
            placeholder={isLoadingStudents ? "Loading students..." : "Select team members"}
            isDisabled={isLoadingStudents}
            className={errors.students ? "error" : ""}
            classNamePrefix="react-select"
            aria-invalid={errors.students ? "true" : "false"}
            aria-describedby={errors.students ? "students-error" : undefined}
            menuShouldScroll={true}
            maxMenuHeight={300}
            filterOption={({ label }, input) => label.toLowerCase().includes(input.toLowerCase())}
          />
          {errors.students && <span id="students-error" className="error-message">{errors.students}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="faculty">Select Faculty</label>
          <select
            id="faculty"
            value={selectedFaculty}
            onChange={(e) => setSelectedFaculty(e.target.value)}
            className={errors.faculty ? "error" : ""}
            aria-invalid={errors.faculty ? "true" : "false"}
            aria-describedby={errors.faculty ? "faculty-error" : undefined}
          >
            <option value="">-- Select Faculty --</option>
            {faculty.map((fac) => (
              <option key={fac._id} value={fac._id}>
                {fac.firstName} {fac.lastName} ({fac.department})
              </option>
            ))}
          </select>
          {errors.faculty && <span id="faculty-error" className="error-message">{errors.faculty}</span>}
        </div>

        <button type="submit">Assign Project</button>
      </form>
    </div>
  );
};

export default ProjectAssignment;
