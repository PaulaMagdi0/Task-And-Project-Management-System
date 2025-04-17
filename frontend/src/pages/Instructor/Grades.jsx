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
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  InsertDriveFile as FileIcon,
  Grade as GradeIcon,
  Feedback as FeedbackIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import SendIcon from "@mui/icons-material/Send";
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
            const [submissionRes, gradeRes] = await Promise.all([
              apiClient.get(`submission/${student.student_id}/`),
              apiClient.get(`grades/${student.student_id}/`),
            ]);

            return {
              ...student,
              submission_id: submissionRes.data.id,
              file_url: submissionRes.data.url,
              submission_date: submissionRes.data.submission_date,
              existingEvaluation: gradeRes.data[0] || null,
            };
          } catch (err) {
            return student;
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
    if (value >= 0 && value <= 10) {
      setGrades({ ...grades, [studentId]: value });
    }
  };

  const handleSubmitFeedback = async (studentId) => {
    try {
      const student = filteredStudents.find((s) => s.student_id === studentId);
      if (!student?.submission_id) {
        setSnackbar({
          open: true,
          message: "Submission data not available",
          severity: "error",
        });
        return;
      }

      const payload = {
        student: studentId,
        track: selectedTrack,
        course: selectedCourse,
        assignment: selectedAssignment,
        submission: student.submission_id,
        score: parseInt(grades[studentId]),
        feedback: feedback[studentId].trim(),
      };

      setSubmitLoading((prev) => ({ ...prev, [studentId]: true }));

      await apiClient.post("/grades/", payload);

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
        message:
          err.response?.data?.submission?.[0] ||
          err.response?.data?.detail ||
          "Failed to submit evaluation",
        severity: "error",
      });
    } finally {
      setSubmitLoading((prev) => ({ ...prev, [studentId]: false }));
    }
  };

  const filteredCourses = data.courses.filter((course) =>
    course.tracks.includes(Number(selectedTrack))
  );

  const filteredStudents = submissionData
    ? [
        ...submissionData.submitters.filter(
          (student) => student.existingEvaluation
        ),
        ...submissionData.non_submitters.map((student) => ({
          ...student,
          submitted: false,
          submission_date: null,
          file_url: null,
        })),
      ]
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
      </Grid>

      {/* Loading States */}
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
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        <PersonIcon />
                        <Typography variant="h6">{student.name}</Typography>
                        {student.submitted ? (
                          <Chip
                            label="Evaluated"
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
                                    {format(
                                      new Date(student.submission_date),
                                      "PPpp"
                                    )}
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
                                {/* Feedback Section */}
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
                                    <Typography
                                      variant="h6"
                                      color="text.primary"
                                    >
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

                                {/* Grading Details */}
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
                                    <Typography
                                      variant="h6"
                                      color="text.primary"
                                    >
                                      Grading Summary
                                    </Typography>
                                  </Box>

                                  <Grid container spacing={3}>
                                    {/* Score Card */}
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
                                          <Typography
                                            variant="h2"
                                            color="primary"
                                          >
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

                                    {/* Details Panel */}
                                    <Grid item xs={12} md={6}>
                                      <Stack spacing={2}>
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1.5,
                                          }}
                                        >
                                          <ScheduleIcon color="action" />
                                          <div>
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                            >
                                              Evaluated On
                                            </Typography>
                                            <Typography variant="body1">
                                              {format(
                                                new Date(
                                                  student.existingEvaluation.graded_date
                                                ),
                                                "MMM dd, yyyy 'at' hh:mm a"
                                              )}
                                            </Typography>
                                          </div>
                                        </Box>

                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1.5,
                                          }}
                                        ></Box>
                                      </Stack>
                                    </Grid>
                                  </Grid>
                                </Box>
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
                                    onChange={handleFeedbackChange(
                                      student.student_id
                                    )}
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
                                    type="number"
                                    label="Grade"
                                    inputProps={{ min: 0, max: 10 }}
                                    value={grades[student.student_id] || ""}
                                    onChange={handleGradeChange(
                                      student.student_id
                                    )}
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
                                    sx={{
                                      display: "flex",
                                      justifyContent: "flex-end",
                                    }}
                                  >
                                    <Button
                                      variant="contained"
                                      onClick={() =>
                                        handleSubmitFeedback(student.student_id)
                                      }
                                      disabled={
                                        submitLoading[student.student_id]
                                      }
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
};

export default Grades;
