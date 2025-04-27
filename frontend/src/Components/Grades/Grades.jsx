import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
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
  Card,
  CardHeader,
  CardContent,
  IconButton,
  Collapse,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  InsertDriveFile as FileIcon,
  Grade as GradeIcon,
  Feedback as FeedbackIcon,
  Schedule as ScheduleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import InputAdornment from "@mui/material/InputAdornment";
import { format } from "date-fns";
import apiClient from "../../services/api";

const Grades = () => {
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
  const [isEditing, setIsEditing] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    const fetchTracksAndCourses = async () => {
      try {
        setLoading((prev) => ({ ...prev, initial: true }));
        const response = await apiClient.get(
          `staff/track-and-courses/${instructorId}/`
        );
        setData({
          tracks: response.data.tracks || [] ,
          courses: response?.data?.courses ||response.data.taught_courses ,
          trackCourses:response?.data?.track_courses || []
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

  const fetchSubmissionStatus = async (assignmentId) => {
    try {
      setLoading((prev) => ({ ...prev, submissions: true }));
      const response = await apiClient.get(
        `assignments/${assignmentId}/track/${selectedTrack}/course/${selectedCourse}/submitters/`
      );

      const dataWithGrades = await Promise.all(
        response.data.submitters.map(async (student) => {
          try {
            // Fetch submission
            let submission = {};
            try {
              const submissionRes = await apiClient.get(
                `submission/assignments/${assignmentId}/students/${student.student_id}/`
              );
              submission = submissionRes.data.submission || {};
              // Fallback for submission ID
              if (!submission.id && submission.file_url) {
                const altRes = await apiClient.get(
                  `submission/instructor/?student=${student.student_id}&assignment=${assignmentId}`
                );
                if (altRes.data.results?.length > 0) {
                  submission = altRes.data.results[0];
                }
              }
            } catch (submissionError) {
              console.error('Submission fetch error:', submissionError);
            }

            // Validate submission
            const hasValidSubmission = !!submission.file_url;
            const submissionId = submission.id || submission.submission_id || null;

            // Fetch existing grade
            let existingEvaluation = null;
            try {
              const gradeRes = await apiClient.get(
                `grades/student/${student.student_id}/?assignment=${assignmentId}`
              );
              existingEvaluation = gradeRes.data[0] || null;
            } catch (gradeError) {
              console.error('Grade fetch error:', gradeError);
            }

            return {
              ...student,
              submitted: hasValidSubmission,
              submission_id: submissionId,
              submission_date: submission.submission_time,
              file_url: submission.file_url,
              existingEvaluation,
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
      const initialFeedback = {};
      const initialGrades = {};

      dataWithGrades.forEach((student) => {
        if (student.existingEvaluation) {
          evaluations[student.student_id] = student.existingEvaluation;
          initialFeedback[student.student_id] = student.existingEvaluation.feedback;
          initialGrades[student.student_id] = student.existingEvaluation.score.toString();
        }
      });

      setExistingEvaluations(evaluations);
      setFeedback(initialFeedback);
      setGrades(initialGrades);
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

  const handleEditGrade = async (studentId) => {
    try {
      setSubmitLoading((prev) => ({ ...prev, [studentId]: true }));

      if (!selectedTrack || !selectedCourse || !selectedAssignment) {
        throw new Error("Missing required context (track, course, or assignment)");
      }

      const student = submissionData.submitters.find((s) => s.student_id === studentId);
      if (!student) {
        throw new Error("Student not found in submission records");
      }

      let submissionId = student.submission_id;
      if (!submissionId && student.existingEvaluation?.submission) {
        submissionId = student.existingEvaluation.submission;
      }

      if (!submissionId && student.file_url) {
        const urlPatterns = [
          /\/d\/([a-zA-Z0-9-_]+)/,
          /id=([a-zA-Z0-9-_]+)/,
          /\/file\/d\/([a-zA-Z0-9-_]+)/
        ];
        for (const pattern of urlPatterns) {
          const match = student.file_url.match(pattern);
          if (match) {
            submissionId = match[1];
            break;
          }
        }
      }

      if (!submissionId && student.submitted) {
        try {
          const submissionRes = await apiClient.get(
            `submission/assignments/${selectedAssignment}/students/${studentId}/`
          );
          submissionId = submissionRes.data.submission?.id;
        } catch (apiError) {
          console.error('Submission fetch error:', apiError);
        }
      }

      if (!submissionId) {
        throw new Error(`Could not resolve submission for ${student.name}.`);
      }

      const rawScore = grades[studentId];
      const numericScore = parseFloat(rawScore);
      if (isNaN(numericScore) || numericScore < 0 || numericScore > 10) {
        throw new Error("Score must be a number between 0 and 10");
      }

      const rawFeedback = feedback[studentId]?.trim() || "";
      if (!rawFeedback) {
        throw new Error("Feedback is required before saving");
      }

      const evaluation = existingEvaluations[studentId];
      if (!evaluation?.id) {
        throw new Error("No existing evaluation found to update");
      }

      const payload = {
        score: numericScore,
        feedback: rawFeedback,
        submission: submissionId,
        student: studentId,
        assignment: selectedAssignment,
        course: selectedCourse,
        track: selectedTrack,
      };

      await apiClient.put(`grades/${evaluation.id}/`, payload);

      setExistingEvaluations((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          ...payload,
          updated_at: new Date().toISOString(),
        },
      }));

      setSnackbar({
        open: true,
        message: "Evaluation updated successfully",
        severity: "success",
      });

      await fetchSubmissionStatus(selectedAssignment);
      setIsEditing((prev) => ({ ...prev, [studentId]: false }));
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Failed to update evaluation";
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setSubmitLoading((prev) => ({ ...prev, [studentId]: false }));
    }
  };

  const handleDeleteGrade = async () => {
    try {
      const studentId = deleteConfirm;
      const evaluation = existingEvaluations[studentId];
      if (!evaluation?.id) {
        setSnackbar({
          open: true,
          message: "No evaluation found to delete",
          severity: "error",
        });
        return;
      }

      await apiClient.delete(`grades/${evaluation.id}/`);

      setExistingEvaluations((prev) => {
        const updated = { ...prev };
        delete updated[studentId];
        return updated;
      });

      const updatedSubmitters = submissionData.submitters.map((student) =>
        student.student_id === studentId
          ? { ...student, existingEvaluation: null }
          : student
      );

      setSubmissionData((prev) => ({
        ...prev,
        submitters: updatedSubmitters,
      }));

      setSnackbar({
        open: true,
        message: "Evaluation deleted successfully",
        severity: "success",
      });
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to delete evaluation";
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleSubmitFeedback = async (studentId) => {
    try {
      const student = submissionData.submitters.find((s) => s.student_id === studentId);
      if (!student?.submission_id) {
        setSnackbar({
          open: true,
          message: "Submission data not available",
          severity: "error",
        });
        return;
      }

      const feedbackText = feedback[studentId]?.trim();
      if (!feedbackText) {
        setSnackbar({
          open: true,
          message: "Please provide feedback before submitting",
          severity: "error",
        });
        return;
      }

      const gradeValue = parseFloat(grades[studentId]);
      if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 10) {
        setSnackbar({
          open: true,
          message: "Please enter a valid grade between 0 and 10",
          severity: "error",
        });
        return;
      }

      const payload = {
        score: gradeValue,
        feedback: feedbackText,
        submission: student.submission_id,
        student: studentId,
        assignment: selectedAssignment,
        course: selectedCourse,
        track: selectedTrack,
      };

      setSubmitLoading((prev) => ({ ...prev, [studentId]: true }));

      await apiClient.post(`grades/`, payload);

      setFeedback((prev) => ({ ...prev, [studentId]: "" }));
      setGrades((prev) => ({ ...prev, [studentId]: "" }));
      await fetchSubmissionStatus(selectedAssignment);

      setSnackbar({
        open: true,
        message: "Evaluation submitted successfully",
        severity: "success",
      });
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail || "Failed to submit evaluation";
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setSubmitLoading((prev) => ({ ...prev, [studentId]: false }));
    }
  };

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

  const handleFeedbackChange = (studentId) => (e) => {
    setFeedback({ ...feedback, [studentId]: e.target.value });
  };

  const handleGradeChange = (studentId) => (e) => {
    const value = e.target.value;
    const numericValue = parseFloat(value);
    if (
      value === "" ||
      (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 10)
    ) {
      setGrades({ ...grades, [studentId]: value });
    }
  };
  
  const filteredCourses = data?.courses?.filter((course) =>
    course.tracks.some((track) => track?.id === Number(selectedTrack))
);
console.log(data);

  const filteredStudents = submissionData
    ? submissionData?.submitters?.filter((student) => student.existingEvaluation)
    : [];

  const getBorderColor = (student) => {
    if (!student.submitted) return "error.main";
    if (existingEvaluations[student.student_id]) return "success.main";
    return "warning.main";
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold" mb={3}>
        Students Grades
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Select Track</InputLabel>
            <Select
              value={selectedTrack}
              onChange={handleTrackChange}
              label="Select Track"
              disabled={loading.initial}
            >
              {data?.tracks.map((track) => (
                <MenuItem key={track.id} value={track.id}>
                  {track.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Select Course</InputLabel>
            <Select
              value={selectedCourse}
              onChange={handleCourseChange}
              label="Select Course"
              disabled={!selectedTrack || loading.assignments}
            >
              {filteredCourses?.map((course) => (
                <MenuItem key={course?.id} value={course?.id}>
                  {course?.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

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
      </Grid>

      {loading.initial && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading initial data...</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {submissionData && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Showing {filteredStudents.length} evaluated submissions
          </Typography>

          <Grid container spacing={2}>
            {filteredStudents.map((student) => (
              <Grid item xs={12} key={student.student_id}>
                <Card
                  sx={{
                    borderLeft: 5,
                    borderColor: getBorderColor(student),
                    boxShadow: 3,
                  }}
                >
                  <CardHeader
                    title={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <PersonIcon />
                        <Typography variant="h6">{student.name}</Typography>
                        {student.submitted ? (
                          <Chip
                            label="Submitted"
                            color="success"
                            icon={<CheckCircleIcon />}
                          />
                        ) : (
                          <Chip
                            label="Not Submitted"
                            color="error"
                            icon={<CancelIcon />}
                          />
                        )}
                      </Box>
                    }
                    subheader={student.email}
                    action={
                      <IconButton
                        onClick={() =>
                          setExpandedStudent(
                            expandedStudent === student.student_id
                              ? null
                              : student.student_id
                          )
                        }
                      >
                        <ExpandMoreIcon
                          sx={{
                            transform:
                              expandedStudent === student.student_id
                                ? "rotate(180deg)"
                                : "none",
                            transition: "transform 0.3s",
                          }}
                        />
                      </IconButton>
                    }
                  />

                  <Collapse in={expandedStudent === student.student_id}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle1" gutterBottom>
                            <FileIcon sx={{ mr: 1 }} />
                            Submission Details
                          </Typography>
                          <Divider sx={{ mb: 2 }} />
                          {student.submitted ? (
                            <>
                              <Stack spacing={1} sx={{ mb: 2 }}>
                                <Box sx={{ display: "flex", gap: 1 }}>
                                  <ScheduleIcon color="action" />
                                  <Typography variant="body2">
                                    Submitted:{" "}
                                    {student.submission_date
                                      ? format(
                                          new Date(student.submission_date),
                                          "PPpp"
                                        )
                                      : "N/A"}
                                  </Typography>
                                </Box>
                                {student.file_url && (
                                  <Button
                                    variant="outlined"
                                    startIcon={<FileIcon />}
                                    href={student.file_url}
                                    target="_blank"
                                  >
                                    View Submission File
                                  </Button>
                                )}
                              </Stack>
                            </>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No submission received
                            </Typography>
                          )}
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Typography
                            variant="subtitle1"
                            gutterBottom
                            sx={{ display: "flex", alignItems: "center" }}
                          >
                            <GradeIcon
                              color="primary"
                              sx={{ mr: 1, fontSize: 28 }}
                            />
                            Evaluation Details
                          </Typography>
                          <Divider sx={{ mb: 2 }} />
                          {student.existingEvaluation ? (
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 3,
                                position: "relative",
                                overflow: "hidden",
                                "&:before": {
                                  content: '""',
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  width: "4px",
                                  height: "100%",
                                  bgcolor: "primary.main",
                                },
                              }}
                            >
                              <Stack spacing={3}>
                                {isEditing[student.student_id] ? (
                                  <>
                                    <TextField
                                      fullWidth
                                      multiline
                                      rows={4}
                                      label="Feedback"
                                      error={!feedback[student.student_id]?.trim()}
                                      helperText={
                                        !feedback[student.student_id]?.trim() &&
                                        "Feedback is required"
                                      }
                                      value={feedback[student.student_id] || ""}
                                      onChange={handleFeedbackChange(student.student_id)}
                                    />
                                    <TextField
                                      fullWidth
                                      type="number"
                                      label="Grade"
                                      error={
                                        isNaN(grades[student.student_id]) ||
                                        grades[student.student_id] < 0 ||
                                        grades[student.student_id] > 10
                                      }
                                      helperText={
                                        (isNaN(grades[student.student_id]) ||
                                          grades[student.student_id] < 0 ||
                                          grades[student.student_id] > 10) &&
                                        "Must be between 0-10"
                                      }
                                      inputProps={{ min: 0, max: 10, step: "0.1" }}
                                      value={grades[student.student_id] || ""}
                                      onChange={handleGradeChange(student.student_id)}
                                    />
                                    <Box
                                      sx={{
                                        display: "flex",
                                        gap: 2,
                                        justifyContent: "flex-end",
                                      }}
                                    >
                                      <Button
                                        variant="outlined"
                                        onClick={() =>
                                          setIsEditing((prev) => ({
                                            ...prev,
                                            [student.student_id]: false,
                                          }))
                                        }
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        variant="contained"
                                        onClick={() => handleEditGrade(student.student_id)}
                                        disabled={submitLoading[student.student_id]}
                                      >
                                        {submitLoading[student.student_id]
                                          ? "Saving..."
                                          : "Save Changes"}
                                      </Button>
                                    </Box>
                                  </>
                                ) : (
                                  <>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        gap: 2,
                                        justifyContent: "flex-end",
                                      }}
                                    >
                                      <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => setDeleteConfirm(student.student_id)}
                                      >
                                        Delete
                                      </Button>
                                      <Button
                                        variant="contained"
                                        startIcon={<EditIcon />}
                                        onClick={() => {
                                          setIsEditing((prev) => ({
                                            ...prev,
                                            [student.student_id]: true,
                                          }));
                                          setFeedback((prev) => ({
                                            ...prev,
                                            [student.student_id]:
                                              student.existingEvaluation?.feedback || "",
                                          }));
                                          setGrades((prev) => ({
                                            ...prev,
                                            [student.student_id]:
                                              student.existingEvaluation?.score?.toString() || "",
                                          }));
                                        }}
                                      >
                                        Edit
                                      </Button>
                                    </Box>
                                    <Box>
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 1.5,
                                          mb: 2,
                                        }}
                                      >
                                        <FeedbackIcon
                                          color="primary"
                                          sx={{ fontSize: 24 }}
                                        />
                                        <Typography variant="h6" color="text.primary">
                                          Student Feedback
                                        </Typography>
                                      </Box>
                                      <Typography
                                        variant="body1"
                                        sx={{
                                          p: 2,
                                          borderRadius: 1,
                                          bgcolor: "action.hover",
                                          fontStyle: "italic",
                                          whiteSpace: "pre-wrap",
                                          lineHeight: 1.6,
                                        }}
                                      >
                                        {student.existingEvaluation.feedback ||
                                          "No feedback provided"}
                                      </Typography>
                                    </Box>
                                    <Box>
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 1.5,
                                          mb: 2,
                                        }}
                                      >
                                        <GradeIcon
                                          color="primary"
                                          sx={{ fontSize: 24 }}
                                        />
                                        <Typography variant="h6" color="text.primary">
                                          Grading Summary
                                        </Typography>
                                      </Box>
                                      <Grid container spacing={3}>
                                        <Grid item xs={12} md={6}>
                                          <Card
                                            variant="outlined"
                                            sx={{
                                              p: 2,
                                              textAlign: "center",
                                              borderColor: "primary.main",
                                              bgcolor: "primary.light",
                                            }}
                                          >
                                            <Typography
                                              variant="overline"
                                              color="text.secondary"
                                            >
                                              Final Score
                                            </Typography>
                                            <Box
                                              sx={{
                                                display: "flex",
                                                alignItems: "baseline",
                                                justifyContent: "center",
                                                gap: 1,
                                                mt: 1,
                                              }}
                                            >
                                              <Typography variant="h2" color="primary">
                                                {student.existingEvaluation.score}
                                              </Typography>
                                              <Typography
                                                variant="h5"
                                                color="text.secondary"
                                              >
                                                /10
                                              </Typography>
                                            </Box>
                                          </Card>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                          <Card
                                            sx={{
                                              p: 2,
                                              textAlign: "center",
                                              alignContent: "center",
                                            }}
                                          >
                                            <Typography
                                              variant="overline"
                                              color="text.secondary"
                                            >
                                              Submission Time
                                            </Typography>
                                            <Typography variant="h6" sx={{ mt: 1 }}>
                                              {student.existingEvaluation.submission_time
                                                ? format(
                                                    new Date(
                                                      student.existingEvaluation.submission_time
                                                    ),
                                                    "PPpp"
                                                  )
                                                : "N/A"}
                                            </Typography>
                                          </Card>
                                        </Grid>
                                      </Grid>
                                    </Box>
                                  </>
                                )}
                              </Stack>
                            </Paper>
                          ) : (
                            student.submitted && (
                              <Paper
                                variant="outlined"
                                sx={{ p: 3, bgcolor: "background.default" }}
                              >
                                <Stack spacing={3}>
                                  <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Feedback"
                                    placeholder="Provide constructive feedback..."
                                    value={feedback[student.student_id] || ""}
                                    onChange={handleFeedbackChange(student.student_id)}
                                    InputProps={{
                                      startAdornment: (
                                        <InputAdornment position="start">
                                          <FeedbackIcon color="action" />
                                        </InputAdornment>
                                      ),
                                    }}
                                    sx={{
                                      "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                        bgcolor: "background.paper",
                                      },
                                    }}
                                  />
                                  <TextField
                                    fullWidth
                                    type="text"
                                    label="Grade"
                                    inputProps={{ min: 0, max: 10 }}
                                    value={grades[student.student_id] || ""}
                                    onChange={handleGradeChange(student.student_id)}
                                    InputProps={{
                                      startAdornment: (
                                        <InputAdornment position="start">
                                          <GradeIcon color="action" />
                                        </InputAdornment>
                                      ),
                                      endAdornment: (
                                        <InputAdornment position="end">
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                          >
                                            /10
                                          </Typography>
                                        </InputAdornment>
                                      ),
                                    }}
                                    sx={{
                                      "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                        bgcolor: "background.paper",
                                      },
                                    }}
                                  />
                                  <Box
                                    sx={{ display: "flex", justifyContent: "flex-end" }}
                                  >
                                    <Button
                                      variant="contained"
                                      onClick={() => handleSubmitFeedback(student.student_id)}
                                      disabled={submitLoading[student.student_id]}
                                      startIcon={
                                        submitLoading[student.student_id] ? (
                                          <CircularProgress size={20} />
                                        ) : (
                                          <SendIcon />
                                        )
                                      }
                                      sx={{
                                        px: 4,
                                        py: 1.5,
                                        borderRadius: 2,
                                        textTransform: "none",
                                        fontSize: "1rem",
                                      }}
                                    >
                                      {submitLoading[student.student_id]
                                        ? "Submitting..."
                                        : "Submit Evaluation"}
                                    </Button>
                                  </Box>
                                </Stack>
                              </Paper>
                            )
                          )}
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Collapse>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete Evaluation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete this evaluation? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            onClick={handleDeleteGrade}
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
          >
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Grades;