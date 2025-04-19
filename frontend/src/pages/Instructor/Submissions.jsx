import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
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
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  InsertDriveFile as FileIcon,
} from "@mui/icons-material";
import apiClient from "../../services/api";

const Submissions = () => {
  const instructorId = useSelector((state) => state.auth.user_id);
  const [loading, setLoading] = useState({
    initial: true,
    assignments: false,
    submissions: false,
  });
  const [error, setError] = useState(null);
  const [data, setData] = useState({ tracks: [], courses: [] });
  const [selectedTrack, setSelectedTrack] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [submissionData, setSubmissionData] = useState(null);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [grades, setGrades] = useState({});
  const [submitLoading, setSubmitLoading] = useState({});
  const [existingEvaluations, setExistingEvaluations] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch tracks and courses on mount
  useEffect(() => {
    const fetchTracksAndCourses = async () => {
      try {
        setLoading((prev) => ({ ...prev, initial: true }));
        const response = await apiClient.get(
          `staff/track-and-courses/${instructorId}/`
        );
        setData({
          tracks: response.data.tracks,
          courses: response.data.courses,
        });
        setError(null);
      } catch (err) {
        setError("Failed to fetch tracks and courses");
      } finally {
        setLoading((prev) => ({ ...prev, initial: false }));
      }
    };
    fetchTracksAndCourses();
  }, [instructorId]);

  // Fetch assignments when track and course are selected
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!selectedTrack || !selectedCourse) return;

      try {
        setLoading((prev) => ({ ...prev, assignments: true }));
        const response = await apiClient.get(
          `assignments/track/${selectedTrack}/course/${selectedCourse}/assignments/`
        );
        setAssignments(response.data.assignments);
      } catch (err) {
        setError("Failed to fetch assignments");
      } finally {
        setLoading((prev) => ({ ...prev, assignments: false }));
      }
    };
    fetchAssignments();
  }, [selectedTrack, selectedCourse]);

  // Fetch submissions when assignment is selected
  const fetchSubmissionStatus = async (assignmentId) => {
    try {
      setLoading((prev) => ({ ...prev, submissions: true }));
      const response = await apiClient.get(
        `assignments/${assignmentId}/track/${selectedTrack}/course/${selectedCourse}/submitters/`
      );

      const dataWithGrades = await Promise.all(
        response.data.submitters.map(async (student) => {
          try {
            const { data } = await apiClient.get(
              `submission/assignments/${assignmentId}/students/${student.student_id}/`
            );
            return {
              ...student,
              submitted: data.submission?.status === "Submitted",
              submission_id: data.submission?.id,
              submission_date: data.submission?.submission_time,
              file_url: data.submission?.file_url,
              existingEvaluation: data.submission || null,
            };
          } catch (err) {
            return {
              ...student,
              submitted: false,
              submission_id: null,
              submission_date: null,
              file_url: null,
              existingEvaluation: null,
            };
          }
        })
      );

      const evaluations = {};
      dataWithGrades.forEach((student) => {
        if (student.existingEvaluation) {
          evaluations[student.student_id] = student.existingEvaluation;
        }
      });
      setExistingEvaluations(evaluations);

      setSubmissionData({
        ...response.data,
        submitters: dataWithGrades,
      });
    } catch (err) {
      setError("Failed to fetch submission data");
    } finally {
      setLoading((prev) => ({ ...prev, submissions: false }));
    }
  };

  // Handler functions
  const handleTrackChange = (event) => {
    setSelectedTrack(event.target.value);
    setSelectedCourse("");
    setSelectedAssignment("");
    setSubmissionData(null);
  };

  const handleCourseChange = (event) => {
    setSelectedCourse(event.target.value);
    setSelectedAssignment("");
    setSubmissionData(null);
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
    try {
      const student = filteredStudents.find((s) => s.student_id === studentId);
      console.log("Student:", student);
      // if (!student?.submission_id) {
      //   setSnackbar({
      //     open: true,
      //     message: "Submission data not available",
      //     severity: "error",
      //   });
      //   return;
      // }

      const payload = {
        score: parseInt(grades[studentId]),
        feedback: feedback[studentId]?.trim() || "",
      };

      setSubmitLoading((prev) => ({ ...prev, [studentId]: true }));

      const endpoint = `submission/assignments/${selectedAssignment}/students/${studentId}/`;
      if (existingEvaluations[studentId]) {
        await apiClient.put(endpoint, payload);
      } else {
        await apiClient.post(endpoint, payload);
      }

      setFeedback((prev) => ({ ...prev, [studentId]: "" }));
      setGrades((prev) => ({ ...prev, [studentId]: "" }));
      fetchSubmissionStatus(selectedAssignment);

      setSnackbar({
        open: true,
        message: "Evaluation submitted successfully",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || "Failed to submit evaluation",
        severity: "error",
      });
    } finally {
      setSubmitLoading((prev) => ({ ...prev, [studentId]: false }));
    }
  };

  // Filter courses for selected track
  const filteredCourses = data.courses.filter((course) =>
    course.tracks.includes(Number(selectedTrack))
  );

  // Filter students based on status
  const filteredStudents = submissionData
    ? [
        ...submissionData.submitters,
        ...submissionData.non_submitters.map((student) => ({
          ...student,
          submitted: false,
          submission_date: null,
          file_url: null,
        })),
      ].filter((student) =>
        statusFilter === "all"
          ? true
          : statusFilter === "submitted"
          ? student.submitted
          : !student.submitted
      )
    : [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", mb: 3 }}>
        Student Submissions
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Track Selector */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Select Track</InputLabel>
            <Select
              value={selectedTrack}
              onChange={handleTrackChange}
              label="Select Track"
              disabled={loading.initial}
            >
              {data.tracks.map((track) => (
                <MenuItem key={track.id} value={track.id}>
                  {track.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Course Selector */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Select Course</InputLabel>
            <Select
              value={selectedCourse}
              onChange={handleCourseChange}
              label="Select Course"
              disabled={!selectedTrack || loading.assignments}
            >
              {filteredCourses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Assignment Selector */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Select Assignment</InputLabel>
            <Select
              value={selectedAssignment}
              onChange={handleAssignmentChange}
              label="Select Assignment"
              disabled={!selectedCourse || loading.assignments}
            >
              {assignments.map((assignment) => (
                <MenuItem key={assignment.id} value={assignment.id}>
                  {assignment.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Status Filter */}
        <Grid item xs={12} md={12}>
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

      {/* Loading States */}
      {loading.initial && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading initial data...</Typography>
        </Box>
      )}

      {/* Error Handling */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Submissions List */}
      {submissionData && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Showing {filteredStudents.length} students (
            {submissionData.submitted_count} submitted,{" "}
            {submissionData.not_submitted_count} not submitted)
          </Typography>

          {filteredStudents.map((student) => (
            <Accordion
              key={student.student_id}
              expanded={expandedStudent === student.student_id}
              onChange={handleAccordionChange(student.student_id)}
              sx={{ mb: 2, boxShadow: 3 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box
                  sx={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <PersonIcon />
                    <Typography>{student.name}</Typography>
                    <Chip
                      label={student.submitted ? "Submitted" : "Not Submitted"}
                      color={student.submitted ? "success" : "error"}
                      icon={
                        student.submitted ? <CheckCircleIcon /> : <CancelIcon />
                      }
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ alignContent: "center" }}
                  >
                    {student.email}
                  </Typography>
                </Box>
              </AccordionSummary>

              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">
                      Submission Details
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    {student.submitted ? (
                      <>
                        <Typography variant="body2">
                          Submitted:{" "}
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
                            View Submission
                          </Button>
                        )}
                      </>
                    ) : (
                      <Typography color="text.secondary">
                        No submission found
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Evaluation</Typography>
                    <Divider sx={{ mb: 2 }} />

                    {student.submitted ? (
                      student.existingEvaluation?.score !== null &&
                      student.existingEvaluation?.feedback !== null ? (
                        // Display existing evaluation details
                        <>
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Feedback"
                            value={
                              student.existingEvaluation.feedback ||
                              "No feedback provided"
                            }
                            disabled
                            sx={{
                              mb: 2,
                              "& .Mui-disabled": {
                                color: "text.primary",
                                "-webkit-text-fill-color": "unset",
                              },
                            }}
                          />
                          <TextField
                            fullWidth
                            type="number"
                            label="Grade (0-10)"
                            value={student.existingEvaluation.score}
                            disabled
                            inputProps={{ min: 0, max: 10 }}
                            sx={{
                              "& .Mui-disabled": {
                                color: "text.primary",
                                "-webkit-text-fill-color": "unset",
                              },
                            }}
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 2 }}
                          >
                            Graded on:{" "}
                            {new Date(
                              student.existingEvaluation.submission_time
                            ).toLocaleString()}
                          </Typography>
                        </>
                      ) : (
                        // Show evaluation form for submitted but ungraded/null entries
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
                            type="text"
                            label="Grade (0-10)"
                            inputProps={{ min: 0, max: 10 }}
                            value={grades[student.student_id] || ""}
                            onChange={handleGradeChange(student.student_id)}
                          />
                          <Button
                            variant="contained"
                            onClick={() =>
                              handleSubmitFeedback(student.student_id)
                            }
                            disabled={submitLoading[student.student_id]}
                            sx={{ mt: 2 }}
                          >
                            {submitLoading[student.student_id] ? (
                              <CircularProgress size={24} />
                            ) : (
                              "Submit Evaluation"
                            )}
                          </Button>
                        </>
                      )
                    ) : (
                      <Typography color="text.secondary">
                        No submission to evaluate
                      </Typography>
                    )}
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
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Submissions;
