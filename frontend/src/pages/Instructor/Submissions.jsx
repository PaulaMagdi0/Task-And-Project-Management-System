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
} from "@mui/icons-material";
import apiClient from "../../services/api";
import { fetchAssignments } from "../../redux/assignmentsSlice";
import { fetchCourses } from "../../redux/coursesSlice";

const Submissions = () => {
  const dispatch = useDispatch();
  const { assignments } = useSelector((state) => state.assignments);
  const { data: courses } = useSelector((state) => state.courses);
  const instructorId = useSelector((state) => state.auth.user_id);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [submissionData, setSubmissionData] = useState({
    submitters: [],
    submitted_count: 0,
    not_submitted_count: 0,
  });
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [grades, setGrades] = useState({});
  const [submitLoading, setSubmitLoading] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("");

  useEffect(() => {
    dispatch(fetchAssignments(instructorId));
    dispatch(fetchCourses(instructorId));
  }, [dispatch, instructorId]);

  const fetchSubmissionStatus = async (assignmentId, trackId) => {
    try {
      setLoading(true);
      const assignment = assignments.find((a) => a.id === assignmentId);
      if (!assignment) {
        console.error("Assignment not found for ID:", assignmentId);
        return;
      }

      const response = await apiClient.get(
        `assignments/${assignmentId}/track/${trackId}/course/${assignment.course}/submitters/`
      );
      console.log("API Response:", response.data);

      // Combine submitters and non_submitters, adding a `submitted` property
      const submittersWithStatus = (response.data.submitters || []).map((student) => ({
        ...student,
        submitted: true,
      }));
      const nonSubmittersWithStatus = (response.data.non_submitters || []).map((student) => ({
        ...student,
        submitted: false,
        submission_date: null,
        file_url: null,
        submission_assignment_url: null,
      }));

      const allStudents = [...submittersWithStatus, ...nonSubmittersWithStatus];

      // Fetch submission URLs for submitted students
      const dataWithUrls = await Promise.all(
        allStudents.map(async (student) => {
          if (student.submitted) {
            try {
              const res = await apiClient.get(`submission/${student.student_id}/`);
              return { ...student, submission_assignment_url: res.data.url || null };
            } catch {
              return { ...student, submission_assignment_url: null };
            }
          }
          return student;
        })
      );

      setSubmissionData({
        submitters: dataWithUrls,
        submitted_count: response.data.submitted_count || 0,
        not_submitted_count: response.data.not_submitted_count || 0,
      });

      console.log("Updated submissionData:", {
        submitters: dataWithUrls,
        submitted_count: response.data.submitted_count,
        not_submitted_count: response.data.not_submitted_count,
      });
    } catch (error) {
      console.error("Error fetching submission status:", error);
      setSubmissionData({
        submitters: [],
        submitted_count: 0,
        not_submitted_count: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTrackChange = (event) => {
    const trackId = event.target.value;
    console.log("Selected Track:", trackId);
    setSelectedTrack(trackId);
    if (selectedAssignment) {
      fetchSubmissionStatus(selectedAssignment, trackId);
    }
  };

  const handleAssignmentChange = (event) => {
    const assignmentId = event.target.value;
    console.log("Selected Assignment:", assignmentId);
    setSelectedAssignment(assignmentId);
    if (selectedTrack) {
      fetchSubmissionStatus(assignmentId, selectedTrack);
    }
  };

  const handleAccordionChange = (studentId) => (event, isExpanded) => {
    setExpandedStudent(isExpanded ? studentId : null);
  };

  const handleFeedbackChange = (studentId) => (e) => setFeedback({ ...feedback, [studentId]: e.target.value });
  const handleGradeChange = (studentId) => (e) => setGrades({ ...grades, [studentId]: e.target.value });

  const handleSubmitFeedback = async (studentId) => {
    const studentFeedback = feedback[studentId];
    const studentGrade = grades[studentId];

    if (!studentFeedback || !studentGrade || studentGrade < 0 || studentGrade > 10) {
      setSnackbar({ open: true, message: "Invalid input. Check feedback and grade.", severity: "error" });
      return;
    }

    try {
      setSubmitLoading((prev) => ({ ...prev, [studentId]: true }));
      await apiClient.put(`/submissions/${studentId}`, {
        feedback: studentFeedback,
        grade: studentGrade,
        assignment_id: selectedAssignment,
      });
      setSnackbar({ open: true, message: "Evaluation submitted successfully.", severity: "success" });
      setExpandedStudent(null);
      fetchSubmissionStatus(selectedAssignment, selectedTrack);
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to submit evaluation", severity: "error" });
    } finally {
      setSubmitLoading((prev) => ({ ...prev, [studentId]: false }));
    }
  };

  const filteredStudents = () => {
    console.log("submissionData:", submissionData);
    if (!submissionData || !submissionData.submitters) {
      console.log("No submitters found, returning empty array");
      return [];
    }
    const filtered = submissionData.submitters.filter((student) => {
      console.log("Filtering student:", student);
      if (statusFilter === "all") return true;
      if (statusFilter === "submitted") return student.submitted;
      if (statusFilter === "not-submitted") return !student.submitted;
      return false;
    });
    console.log("Filtered students:", filtered);
    return filtered;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", mb: 3 }}>
        Student Submissions
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Select Track</InputLabel>
            <Select value={selectedTrack} onChange={handleTrackChange} label="Select Track">
              {courses?.tracks?.map((track) => (
                <MenuItem key={track.id} value={track.id}>
                  {track.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Select Assignment</InputLabel>
            <Select value={selectedAssignment} onChange={handleAssignmentChange} label="Select Assignment">
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
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Filter by Status">
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

      {submissionData && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Showing {filteredStudents().length} students (
            {submissionData.submitted_count} submitted, {submissionData.not_submitted_count} not submitted)
          </Typography>

          {filteredStudents().length === 0 && (
            <Typography>No students found for this assignment and track.</Typography>
          )}

          {filteredStudents().map((student) => (
            <Accordion
              key={student.student_id}
              expanded={expandedStudent === student.student_id}
              onChange={handleAccordionChange(student.student_id)}
              sx={{ border: "1px solid #ddd", borderRadius: "5px", marginBottom: 2, boxShadow: "none" }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ backgroundColor: "#f9f9f9", borderBottom: "1px solid #ddd" }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <PersonIcon color="action" />
                    <Typography>{student.name}</Typography>
                    <Chip
                      label={student.submitted ? "Submitted" : "Not Submitted"}
                      color={student.submitted ? "success" : "error"}
                      icon={student.submitted ? <CheckCircleIcon /> : <CancelIcon />}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {student.email}
                  </Typography>
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ display: "flex", flexDirection: "column", gap: 2, padding: "16px" }}>
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
                          {student.submission_date
                            ? new Date(student.submission_date).toLocaleString()
                            : "N/A"}
                        </Typography>
                        {student.file_url && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <FileIcon fontSize="small" />
                            <a href={student.file_url} target="_blank" rel="noopener noreferrer">
                              View Submission
                            </a>
                          </Box>
                        )}
                      </>
                    ) : (
                      <Typography variant="body2">No submission yet.</Typography>
                    )}
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Evaluation
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <TextField
                      label="Feedback"
                      multiline
                      rows={4}
                      variant="outlined"
                      fullWidth
                      value={feedback[student.student_id] || ""}
                      onChange={handleFeedbackChange(student.student_id)}
                    />
                    <TextField
                      label="Grade"
                      variant="outlined"
                      fullWidth
                      value={grades[student.student_id] || ""}
                      onChange={handleGradeChange(student.student_id)}
                      type="number"
                      inputProps={{ min: 0, max: 10 }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleSubmitFeedback(student.student_id)}
                      disabled={submitLoading[student.student_id]}
                      sx={{ mt: 2 }}
                    >
                      {submitLoading[student.student_id] ? "Submitting..." : "Submit Evaluation"}
                    </Button>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Submissions;