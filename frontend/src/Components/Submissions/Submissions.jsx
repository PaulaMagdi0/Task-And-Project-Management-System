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
  const [submissionData, setSubmissionData] = useState({
    submitters: [],
    submitted_count: 0,
    not_submitted_count: 0,
  });
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
            tracks: response.data.tracks || [] ,
            courses: response?.data?.courses ||response?.data?.taught_courses ,
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
  const fetchSubmissionStatus = async (assignmentId) => {
    try {
      setLoading((prev) => ({ ...prev, submissions: true }));
      const response = await apiClient.get(
        `assignments/${assignmentId}/track/${selectedTrack}/course/${selectedCourse}/submitters/`
      );
  
      const dataWithGrades = await Promise.all(
        response.data.submitters.map(async (student) => {
          try {
            // 1. Fetch submission with error handling
            let submission = {};
            try {
              const submissionRes = await apiClient.get(
                `submission/assignments/${assignmentId}/students/${student.student_id}/`
              );
              submission = submissionRes.data.submission || {};
              
              // Fallback for submission ID using alternative endpoint
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
  
            // 2. Validate submission existence
            const hasValidSubmission = !!submission.file_url; // Use file presence as submission indicator
            const submissionId = submission.id || submission.submission_id || 1;
  
            // 3. Fetch existing grade
            let existingGrade = null;
            try {
              const gradeRes = await apiClient.get(
                `grades/student/${student.student_id}/?assignment=${assignmentId}`
              );
              existingGrade = gradeRes.data[0] || null;
            } catch (gradeError) {
              console.error('Grade fetch error:', gradeError);
            }
  
            // 4. Return normalized data
            return {
              ...student,
              submitted: hasValidSubmission,
              submission_id: submissionId,
              submission_date: submission.submission_time,
              file_url: submission.file_url,
              existingGrade,
            };
          } catch (err) {
            console.error('Student processing error:', err);
            return {
              ...student,
              submitted: false,
              submission_id: null,
              existingGrade: null,
            };
          }
        })
      );
  
      // Update state with normalized data
      const evaluations = {};
      const initialFeedback = {};
      const initialGrades = {};
  
      dataWithGrades.forEach((student) => {
        if (student.existingGrade) {
          evaluations[student.student_id] = student.existingGrade;
          initialFeedback[student.student_id] = student.existingGrade.feedback;
          initialGrades[student.student_id] = student.existingGrade.score.toString();
          
          // Sync submission ID from grade if missing
          if (!student.submission_id && student.existingGrade.submission) {
            student.submission_id = student.existingGrade.submission;
          }
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
  // Handlers
  const handleTrackChange = (event) => {
    setSelectedTrack(event.target.value);
    setSelectedCourse("");
    setSelectedAssignment("");
    setSubmissionData({ submitters: [], non_submitters: [] });
  };

  const handleCourseChange = (event) => {
    setSelectedCourse(event.target.value);
    setSelectedAssignment("");
    setSubmissionData({ submitters: [], non_submitters: [] });
  };

  const handleAssignmentChange = (event) => {
    const assignmentId = event.target.value;
    setSelectedAssignment(assignmentId);
    fetchSubmissionStatus(assignmentId);
  };

  const handleAccordionChange = (studentId) => (event, isExpanded) => {
    setExpandedStudent(isExpanded ? studentId : null);
  };

  const handleFeedbackChange = (studentId) => (e) =>
    setFeedback({ ...feedback, [studentId]: e.target.value });

  const handleGradeChange = (studentId) => (e) =>
    setGrades({ ...grades, [studentId]: e.target.value });
  const handleSubmitFeedback = async (studentId) => {
    try {
      setSubmitLoading((prev) => ({ ...prev, [studentId]: true }));
  
      // Validate context first
      if (!selectedTrack || !selectedCourse || !selectedAssignment) {
        throw new Error("Missing required context (track, course, or assignment)");
      }
  
      // Find student across all submission data
      const student = [...submissionData.submitters, ...(submissionData.non_submitters || [])]
        .find(s => s.student_id === studentId);
  
      if (!student) {
        throw new Error("Student not found in submission records");
      }
  
      // Enhanced submission ID resolution
      let submissionId = student.submission_id;
  
      // 1. Check existing evaluation first
      if (!submissionId && student.existingEvaluation?.submission) {
        submissionId = student.existingEvaluation.submission;
      }
  
      // 2. Check file URL pattern (support multiple URL formats)
      if (!submissionId && student.file_url) {
        const urlPatterns = [
          /\/d\/([a-zA-Z0-9-_]+)/, // Google Drive direct
          /id=([a-zA-Z0-9-_]+)/, // Standard ID parameter
          /\/file\/d\/([a-zA-Z0-9-_]+)/ // Alternative Google Drive pattern
        ];
        
        for (const pattern of urlPatterns) {
          const match = student.file_url.match(pattern);
          if (match) {
            submissionId = match[1];
            break;
          }
        }
      }
      //submissionId=1;
      // 3. API fallback with better error handling
      if (!submissionId && student.submitted) {
        try {
          const submissionRes = await apiClient.get(
            `submission/instructor/?student=${studentId}&assignment=${selectedAssignment}`
          );
          
          // Handle different API response structures
          if (submissionRes.data?.results?.[0]?.id) {
            submissionId = submissionRes.data.results[0].id;
          } else if (submissionRes.data?.id) {
            submissionId = submissionRes.data.id;
          }
        } catch (apiError) {
          console.error('API fallback failed:', {
            error: apiError.response?.data || apiError.message,
            studentId,
            assignment: selectedAssignment
          });
        }
      }
  
      // Final validation with meaningful error
      if (!submissionId) {
        console.error("Submission resolution failed - technical details:", {
          studentId,
          assignment: selectedAssignment,
          studentData: {
            submitted: student.submitted,
            file_url: student.file_url,
            submission_id: student.submission_id,
            existing_evaluation: !!student.existingEvaluation
          }
        });
        
        throw new Error(`Could not verify submission for ${student.name}. Please ensure:
          1. The student has submitted their work
          2. The submission file is properly uploaded
          3. Refresh the page and try again`);
      }
  
      // Validate and parse grade
      const rawScore = grades[studentId];
      const numericScore = parseFloat(rawScore);
      
      if (isNaN(numericScore)) {
        throw new Error("Please enter a valid numerical grade");
      }
      
      if (numericScore < 0 || numericScore > 10) {
        throw new Error("Grade must be between 0 and 10");
      }
  
      // Prepare API payload
      const payload = {
        score: numericScore,
        feedback: feedback[studentId]?.trim() || "",
        submission: submissionId,
        ...(!existingEvaluations[studentId] && {
          student: studentId,
          assignment: selectedAssignment,
          course: selectedCourse,
          track: selectedTrack
        })
      };
  
      // Execute API request
      const endpoint = existingEvaluations[studentId] 
        ? `grades/${existingEvaluations[studentId].id}/`
        : "grades/";
  
      await apiClient[existingEvaluations[studentId] ? "put" : "post"](endpoint, payload);
  
      // Update state while preserving existing data
      await fetchSubmissionStatus(selectedAssignment);
      
      setSubmissionData(prev => ({
        ...prev,
        submitters: prev.submitters.map(s => 
          s.student_id === studentId ? { ...s, ...student } : s
        )
      }));
  
      if (!existingEvaluations[studentId]) {
        setFeedback(prev => ({ ...prev, [studentId]: "" }));
        setGrades(prev => ({ ...prev, [studentId]: "" }));
      }
  
      setSnackbar({
        open: true,
        message: `Evaluation ${existingEvaluations[studentId] ? "updated" : "submitted"} successfully`,
        severity: "success",
      });
  
    } catch (err) {
      console.error("Grade submission error:", {
        error: err.message,
        stack: err.stack,
        response: err.response?.data
      });
  
      const userMessage = err.response?.data?.detail || 
        err.message.replace(/Error: /, '');
  
      setSnackbar({
        open: true,
        message: userMessage,
        severity: "error",
      });
    } finally {
      setSubmitLoading(prev => ({ ...prev, [studentId]: false }));
    }
  };  
  
  // Filter courses for selected track
  const filteredCourses = data?.courses?.filter((course) =>
    course.tracks.some((track) => track.id === Number(selectedTrack))
  );

  // Student filtering
  const mergedStudents = [
    ...(submissionData.submitters || []),
    ...(submissionData.non_submitters || []).map((s) => ({
      ...s,
      submitted: false,
      submission_date: null,
      file_url: null,
    })),
  ];

  const filteredStudents = mergedStudents.filter((student) =>
    statusFilter === "all"
      ? true
      : statusFilter === "submitted"
      ? student.submitted
      : !student.submitted
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", mb: 3 }}>
        Student Submissions
      </Typography>

      {/* Selection Grids */}
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
              {data.tracks.map((track) => (
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
                <MenuItem key={course.id} value={course.id}>
                  {course.name}
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

      {/* Loading and Error States */}
      {loading.initial && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading initial data...</Typography>
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
                <Box sx={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <PersonIcon />
                    <Typography>{student.name}</Typography>
                    <Chip
                      label={student.submitted ? "Submitted" : "Not Submitted"}
                      color={student.submitted ? "success" : "error"}
                      icon={student.submitted ? <CheckCircleIcon /> : <CancelIcon />}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {student.email}
                  </Typography>
                </Box>
              </AccordionSummary>

              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Submission Details</Typography>
                    <Divider sx={{ mb: 2 }} />
                    {student.submitted ? (
                      <>
                        <Typography variant="body2">
                          Submitted: {new Date(student.submission_date).toLocaleString()}
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
                      <Typography color="text.secondary">No submission found</Typography>
                    )}
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Evaluation</Typography>
                    <Divider sx={{ mb: 2 }} />
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
                          label="Grade (0-10)"
                          inputProps={{ min: 0, max: 10 }}
                          value={grades[student.student_id] || ""}
                          onChange={handleGradeChange(student.student_id)}
                          sx={{ mb: 2 }}
                        />
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleSubmitFeedback(student.student_id)}
                          disabled={submitLoading[student.student_id]}
                        >
                          {submitLoading[student.student_id] ? (
                            <CircularProgress size={24} sx={{ color: "#fff" }} />
                          ) : existingEvaluations[student.student_id] ? (
                            "Update Evaluation"
                          ) : (
                            "Submit Evaluation"
                          )}
                        </Button>
                        {existingEvaluations[student.student_id] && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Last updated:{" "}
                            {new Date(
                              existingEvaluations[student.student_id].updated_at
                            ).toLocaleString()}
                          </Typography>
                        )}
                      </>
                    ) : (
                      <>
                        <TextField
                          fullWidth
                          type="number"
                          label="Grade"
                          value={0}
                          disabled
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Feedback"
                          value="No submission available"
                          disabled
                          sx={{ mb: 2 }}
                        />
                      </>
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
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Submissions;