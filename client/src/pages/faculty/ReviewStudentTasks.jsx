import React, { useState, useEffect } from "react";
import axios from "axios";
import FacultySidebar from "../../components/faculty/FacultySidebar";
import "../../styles/faculty.css";
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import { styled } from "@mui/system";

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  marginTop: theme.spacing(3),
  borderRadius: "8px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
  maxWidth: "100%",
  overflowX: "auto",
}));

const ReviewStudentTask = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [facultyComments, setFacultyComments] = useState("");
  const [grade, setGrade] = useState("");
  const [gradeError, setGradeError] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("user"))?.token;
        if (!token) {
          setError("Unauthorized access. Please login.");
          setLoading(false);
          return;
        }
        const response = await axios.get("http://localhost:5000/api/submitted-tasks/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Submissions response:", response.data);
        setSubmissions(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Fetch submissions error:", err);
        setError(err.response?.data?.error || "Failed to fetch submissions");
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  const handleOpenDialog = (submission) => {
    console.log("Selected submission:", submission);
    setSelectedSubmission(submission);
    setFacultyComments(submission.facultyComments || "");
    setGrade(submission.grade !== null ? submission.grade.toString() : "");
    setGradeError("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSubmission(null);
    setFacultyComments("");
    setGrade("");
    setGradeError("");
  };

  const validateGrade = (value, totalMarks) => {
    const numValue = parseFloat(value);
    if (value === "") return "Grade is required";
    if (isNaN(numValue)) return "Grade must be a number";
    if (numValue < 0) return "Grade cannot be negative";
    if (numValue > totalMarks) return `Grade cannot exceed ${totalMarks}`;
    return "";
  };

  const handleGradeChange = (e) => {
    const value = e.target.value;
    setGrade(value);
    const totalMarks = selectedSubmission?.taskId?.totalMarks || 100;
    const error = validateGrade(value, totalMarks);
    setGradeError(error);
  };

  const handleSubmitReview = async () => {
    if (!selectedSubmission) return;
    const totalMarks = selectedSubmission.taskId?.totalMarks || 100;
    const gradeError = validateGrade(grade, totalMarks);
    if (gradeError) {
      setGradeError(gradeError);
      return;
    }
    try {
      const parsedGrade = parseFloat(grade);
      const updatedData = {
        facultyComments,
        status: "Graded",
        grade: parsedGrade,
      };
      const token = JSON.parse(localStorage.getItem("user"))?.token;
      const response = await axios.put(
        `http://localhost:5000/api/submitted-tasks/${selectedSubmission._id}`,
        updatedData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Update response:", response.data);
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub._id === selectedSubmission._id ? response.data.submission : sub
        )
      );
      setSnackbar({
        open: true,
        message: "Review submitted successfully",
        severity: "success",
      });
      handleCloseDialog();
    } catch (err) {
      console.error("Submit review error:", err);
      const errorMessage =
        err.response?.data?.error || err.response?.data?.details || "Failed to submit review";
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ open: false, message: "", severity: "info" });
  };

  return (
    <div className="dashboard-container">
      <FacultySidebar />
      <div className="main-content">
        <Container>
          {loading ? (
            <CircularProgress />
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : submissions.length === 0 ? (
            <Alert severity="info">No submissions yet.</Alert>
          ) : (
            <>
              <Typography variant="h4" gutterBottom sx={{ color: "#343a40", fontWeight: 600 }}>
                Review Student Submissions
              </Typography>
              <StyledTableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, backgroundColor: "#f8f9fa" }}>
                        Student Name
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, backgroundColor: "#f8f9fa" }}>
                        Task Title
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, backgroundColor: "#f8f9fa" }}>
                        Task Description
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, backgroundColor: "#f8f9fa" }}>
                        Submission Description
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, backgroundColor: "#f8f9fa" }}>
                        File
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, backgroundColor: "#f8f9fa" }}>
                        Submitted At
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, backgroundColor: "#f8f9fa" }}>
                        Total Marks
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, backgroundColor: "#f8f9fa" }}>
                        Grade
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, backgroundColor: "#f8f9fa" }}>
                        Status
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, backgroundColor: "#f8f9fa" }}>
                        Comments
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, backgroundColor: "#f8f9fa" }}>
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission._id} sx={{ "&:hover": { backgroundColor: "#f1f3f5" } }}>
                        <TableCell>{`${submission.studentId?.firstName || "Unknown"} ${submission.studentId?.lastName || "Student"}`}</TableCell>
                        <TableCell>{submission.taskId?.taskTitle || "Unknown Task"}</TableCell>
                        <TableCell title={submission.taskId?.description || "No task description"}>
                          {submission.taskId?.description
                            ? submission.taskId.description.substring(0, 50) +
                              (submission.taskId.description.length > 50 ? "..." : "")
                            : "No task description"}
                        </TableCell>
                        <TableCell title={submission.description || "No submission description"}>
                          {submission.description
                            ? submission.description.substring(0, 50) +
                              (submission.description.length > 50 ? "..." : "")
                            : "No submission description"}
                        </TableCell>
                        <TableCell>
                          {submission.fileUrl ? (
                            <Button
                              variant="outlined"
                              sx={{
                                borderColor: "#007bff",
                                color: "#007bff",
                                "&:hover": { borderColor: "#0056b3", color: "#0056b3" },
                              }}
                              href={submission.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View File
                            </Button>
                          ) : (
                            "No file"
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(submission.submittedAt).toLocaleString("en-US", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </TableCell>
                        <TableCell>{submission.taskId?.totalMarks || "N/A"}</TableCell>
                        <TableCell>{submission.grade !== null ? submission.grade : "Not Graded"}</TableCell>
                        <TableCell>{submission.status}</TableCell>
                        <TableCell>{submission.facultyComments || "None"}</TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            sx={{
                              backgroundColor: "#007bff",
                              "&:hover": { backgroundColor: "#0056b3" },
                            }}
                            onClick={() => handleOpenDialog(submission)}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </StyledTableContainer>

              <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle sx={{ color: "#343a40", fontWeight: 600 }}>
                  Review Submission
                </DialogTitle>
                <DialogContent>
                  {selectedSubmission && (
                    <>
                      <Typography sx={{ mb: 1 }}>
                        <strong>Student:</strong>{" "}
                        {`${selectedSubmission.studentId?.firstName || "Unknown"} ${selectedSubmission.studentId?.lastName || "Student"}`}
                      </Typography>
                      <Typography sx={{ mb: 1 }}>
                        <strong>Task:</strong> {selectedSubmission.taskId?.taskTitle || "Unknown Task"}
                      </Typography>
                      <Typography sx={{ mb: 1 }}>
                        <strong>Task Description:</strong>{" "}
                        {selectedSubmission.taskId?.description || "No task description"}
                      </Typography>
                      <Typography sx={{ mb: 2, fontWeight: 500, color: "#007bff" }}>
                        <strong>Total Marks:</strong> {selectedSubmission.taskId?.totalMarks || "N/A"}
                      </Typography>
                      {selectedSubmission.fileUrl && (
                        <Typography sx={{ mb: 2 }}>
                          <strong>Submitted File:</strong>{" "}
                          <a
                            href={selectedSubmission.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#007bff", textDecoration: "underline" }}
                          >
                            {selectedSubmission.originalFileName || "View File"}
                          </a>
                        </Typography>
                      )}
                      <TextField
                        fullWidth
                        margin="normal"
                        label={`Grade (0-${selectedSubmission.taskId?.totalMarks || 100})`}
                        type="number"
                        value={grade}
                        onChange={handleGradeChange}
                        error={!!gradeError}
                        helperText={gradeError}
                        inputProps={{ min: 0, step: 1 }}
                        required
                        sx={{
                          "& .MuiOutlinedInput-notchedOutline": { borderColor: "#ced4da" },
                          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#007bff" },
                        }}
                      />
                      <TextField
                        fullWidth
                        margin="normal"
                        label="Faculty Comments (Optional)"
                        multiline
                        rows={4}
                        value={facultyComments}
                        onChange={(e) => setFacultyComments(e.target.value)}
                        sx={{
                          "& .MuiOutlinedInput-notchedOutline": { borderColor: "#ced4da" },
                          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#007bff" },
                        }}
                      />
                    </>
                  )}
                </DialogContent>
                <DialogActions>
                  <Button
                    onClick={handleCloseDialog}
                    sx={{
                      color: "#6c757d",
                      "&:hover": { color: "#5a6268" },
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitReview}
                    variant="contained"
                    sx={{
                      backgroundColor: "#007bff",
                      "&:hover": { backgroundColor: "#0056b3" },
                    }}
                    disabled={!!gradeError || grade === ""}
                  >
                    Submit Review
                  </Button>
                </DialogActions>
              </Dialog>
            </>
          )}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: "100%" }}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Container>
      </div>
    </div>
  );
};

export default ReviewStudentTask;