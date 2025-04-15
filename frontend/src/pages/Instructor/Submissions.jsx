import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Grid,
  Snackbar,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  InsertDriveFile as FileIcon,
  Link as LinkIcon,
} from "@mui/icons-material";
import apiClient from "../../services/api";
import { fetchAssignments } from "../../redux/assignmentsSlice";

const Submissions = () => {
  const dispatch = useDispatch();
  const { assignments } = useSelector((state) => state.assignments);
  const instructorId = useSelector((state) => state.auth.user_id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [submissionData, setSubmissionData] = useState(null);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [grades, setGrades] = useState({});
  const [submitLoading, setSubmitLoading] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    dispatch(fetchAssignments(instructorId));
  }, [dispatch, instructorId]);

  const fetchSubmissionStatus = async (assignmentId) => {
    try {
      setLoading(true);
      const assignment = assignments.find((a) => a.id === assignmentId);
      if (!assignment) return;

      const response = await apiClient.get(
        `assignments/${assignmentId}/track/1/course/${assignment.course}/submitters/`
      );

      const dataWithUrls = await Promise.all(
        response.data.submitters.map(async (student) => {
          try {
            const res = await apiClient.get(
              `submission/${student.student_id}/`
            );
            return {
              ...student,
              submission_assignment_url: res.data.url || null,
            };
          } catch (err) {
            return {
              ...student,
              submission_assignment_url: null,
            };
          }
        })
      );

      const finalData = {
        ...response.data,
        submitters: dataWithUrls,
      };

      setSubmissionData(finalData);
      setError(null);
    } catch (err) {
      setError("Failed to fetch submission data");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentChange = (event) => {
    const assignmentId = event.target.value;
    setSelectedAssignment(assignmentId);
    fetchSubmissionStatus(assignmentId);
  };

  const handleAccordionChange = (studentId) => (event, isExpanded) => {
    setExpandedStudent(isExpanded ? studentId : null);
  };

  const handleFeedbackChange = (studentId) => (e) => {
    setFeedback({ ...feedback, [studentId]: e.target.value });
  };

  const handleGradeChange = (studentId) => (e) => {
    const value = e.target.value;
    if (value >= 0 && value <= 10) {
      setGrades({ ...grades, [studentId]: value });
    }
  };

  const handleSubmitFeedback = async (studentId) => {
    const studentFeedback = feedback[studentId];
    const studentGrade = grades[studentId];

    if (!studentFeedback || studentFeedback.trim() === "") {
      setSnackbar({
        open: true,
        message: "Feedback is required",
        severity: "error",
      });
      return;
    }

    if (studentGrade === undefined || studentGrade === "") {
      setSnackbar({
        open: true,
        message: "Grade is required.",
        severity: "error",
      });
      return;
    }

    if (studentGrade < 0 || studentGrade > 10) {
      setSnackbar({
        open: true,
        message: "Grade must be between 0 and 10.",
        severity: "error",
      });
      return;
    }

    try {
      setSubmitLoading((prev) => ({ ...prev, [studentId]: true }));

      await apiClient.put(`/submissions/${studentId}`, {
        feedback: studentFeedback,
        grade: studentGrade,
        assignment_id: selectedAssignment,
      });

      setSnackbar({
        open: true,
        message: "Evaluation submitted successfully.",
        severity: "success",
      });

      setFeedback((prev) => {
        const { [studentId]: _, ...rest } = prev;
        return rest;
      });
      setGrades((prev) => {
        const { [studentId]: _, ...rest } = prev;
        return rest;
      });
      setExpandedStudent(null);

      const assignment = assignments.find((a) => a.id === selectedAssignment);
      const refreshed = await apiClient.get(
        `/assignments/${selectedAssignment}/track/1/course/${assignment.course}/submitters/`
      );
      setSubmissionData(refreshed.data);
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to submit evaluation",
        severity: "error",
      });
    } finally {
      setSubmitLoading((prev) => ({ ...prev, [studentId]: false }));
    }
  };

  const filteredStudents = () => {
    if (!submissionData) return [];

    const allStudents = [
      ...submissionData.submitters,
      ...submissionData.non_submitters.map((student) => ({
        ...student,
        submitted: false,
        submission_date: null,
        file_url: null,
      })),
    ];

    return allStudents.filter((student) => {
      if (statusFilter === "all") return true;
      return statusFilter === "submitted"
        ? student.submitted
        : !student.submitted;
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", mb: 3 }}>
        Student Submissions
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Select Assignment</InputLabel>
            <Select
              value={selectedAssignment}
              onChange={handleAssignmentChange}
              label="Select Assignment"
            >
              {assignments.map((assignment) => (
                <MenuItem key={assignment.id} value={assignment.id}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AssignmentIcon fontSize="small" />
                    {assignment.title}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Filter by Status"
            >
              <MenuItem value="all">All Students</MenuItem>
              <MenuItem value="submitted">Submitted</MenuItem>
              <MenuItem value="not-submitted">Not Submitted</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress size={60} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {submissionData && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Showing {filteredStudents().length} students (
            {submissionData.submitted_count} submitted,
            {submissionData.not_submitted_count} not submitted)
          </Typography>

          {filteredStudents().map((student) => (
            <Accordion
              key={student.student_id}
              expanded={expandedStudent === student.student_id}
              onChange={handleAccordionChange(student.student_id)}
              sx={{
                border: "1px solid #ddd",
                borderRadius: "5px",
                marginBottom: 2,
                boxShadow: "none",
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  backgroundColor: "#f9f9f9",
                  borderBottom: "1px solid #ddd",
                  "&.Mui-expanded": {
                    backgroundColor: "#e0e0e0",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <PersonIcon color="action" />
                    <Typography>{student.name}</Typography>
                    <Chip
                      label={student.submitted ? "Submitted" : "Not Submitted"}
                      color={student.submitted ? "success" : "error"}
                      icon={
                        student.submitted ? <CheckCircleIcon /> : <CancelIcon />
                      }
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {student.email}
                  </Typography>
                </Box>
              </AccordionSummary>

              <AccordionDetails
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  padding: "16px",
                }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Submission Details
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    {student.submitted ? (
                      <>
                        <Typography variant="body2">
                          <strong>Submission Date:</strong>{" "}
                          {new Date(student.submission_date).toLocaleString()}
                        </Typography>
                        {student.file_url && (
                          <Button
                            variant="outlined"
                            startIcon={<FileIcon />}
                            href={student.file_url}
                            target="_blank"
                            sx={{ mt: 1 }}
                          >
                            View Submission File
                          </Button>
                        )}

                        {student.submission_assignment_url ? (
                          <Button
                            variant="outlined"
                            startIcon={<LinkIcon />}
                            href={student.submission_assignment_url}
                            target="_blank"
                            sx={{ mt: 1, ml: 2 }}
                          >
                            Submission Assignment
                          </Button>
                        ) : (
                          <Typography></Typography>
                        )}
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No submission available
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Evaluation
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    {/* Feedback and Grade Input Logic */}
                    {student.submitted ? (
                      <>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Feedback"
                          value={feedback[student.student_id] || ""}
                          onChange={handleFeedbackChange(student.student_id)}
                          sx={{ mb: 2 }}
                        />

                        <TextField
                          fullWidth
                          type="number"
                          label="Grade"
                          inputProps={{ min: 0, max: 10 }}
                          value={grades[student.student_id] || ""}
                          onChange={handleGradeChange(student.student_id)}
                          sx={{ mb: 2 }}
                        />
                      </>
                    ) : (
                      <>
                        {/* Show grade as 0 and disable input if not submitted */}
                        <TextField
                          fullWidth
                          type="number"
                          label="Grade"
                          value={0}
                          disabled
                          sx={{ mb: 2 }}
                        />
                        {/* Hide feedback field */}
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Feedback"
                          value="No Thing Submitted"  
                          disabled
                          sx={{ mb: 2 }}
                        />
                      </>
                    )}

                    {student.submitted && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleSubmitFeedback(student.student_id)}
                        disabled={submitLoading[student.student_id]}
                      >
                        {submitLoading[student.student_id] ? (
                          <CircularProgress size={24} sx={{ color: "#fff" }} />
                        ) : (
                          "Save Evaluation"
                        )}
                      </Button>
                    )}
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}

          {filteredStudents().length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No students found matching the current filters
            </Alert>
          )}
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        message={
          <Typography
            sx={{
              margin: "auto",
              textAlign: "center",
              width: "100%",
              fontWeight: "bold",
              fontSize: "1rem",
            }}
          >
            {snackbar.message}
          </Typography>
        }
        ContentProps={{
          sx: {
            backgroundColor: snackbar.severity === "success" ? "green" : "red",
            color: "#fff",
            justifyContent: "center",
          },
        }}
      />
    </Box>
  );
};

export default Submissions;
