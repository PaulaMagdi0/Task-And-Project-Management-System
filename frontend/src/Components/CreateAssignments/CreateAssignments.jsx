import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTracks,
  fetchCourses,
  fetchStudents,
  createAssignment,
} from "../../redux/createassignmentsSlice";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
  FormControlLabel,
  Checkbox,
  Stack,
  Avatar,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  useTheme,
  useMediaQuery,
  Link,
  Chip,
  Fade,
  IconButton,
} from "@mui/material";
import {
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Send as SendIcon,
  Link as LinkIcon,
  Error as ErrorIcon,
  AutoAwesome as AutoAwesomeIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { isValidUrl } from "../../../utils/validation";

const steps = ["Basic Info", "Assignment Target", "Review"];

const SimpleButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  fontWeight: 500,
  padding: theme.spacing(1, 3),
  borderRadius: "8px",
  textTransform: "none",
  boxShadow: "none",
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
    boxShadow: theme.shadows[2],
  },
  "&:disabled": {
    backgroundColor: theme.palette.grey[400],
    color: theme.palette.grey[600],
  },
}));

const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: "12px",
    padding: theme.spacing(3),
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[8],
    border: `1px solid ${theme.palette.grey[200]}`,
    maxWidth: "800px",
  },
}));

const RecommendationCard = styled(Card)(({ theme }) => ({
  margin: theme.spacing(1),
  borderRadius: "10px",
  border: `1px solid ${theme.palette.grey[200]}`,
  transition: "box-shadow 0.3s ease-in-out",
  "&:hover": {
    boxShadow: theme.shadows[4],
  },
  backgroundColor: theme.palette.background.default,
}));

const ChatContainer = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.grey[200]}`,
  borderRadius: "10px",
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  maxHeight: "450px",
  overflowY: "auto",
  boxShadow: theme.shadows[1],
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: theme.palette.grey[50],
    "&:hover": {
      backgroundColor: theme.palette.grey[100],
    },
    "&.Mui-focused": {
      backgroundColor: theme.palette.grey[100],
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.primary.main,
      },
    },
  },
  "& .MuiInputLabel-root": {
    color: theme.palette.text.secondary,
    fontWeight: 500,
    "&.Mui-focused": {
      color: theme.palette.primary.main,
    },
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.grey[300],
  },
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  borderRadius: "8px",
  backgroundColor: theme.palette.grey[50],
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.grey[300],
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.grey[500],
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.main,
  },
}));

const ChatMessage = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.grey[50],
  borderRadius: "10px",
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  border: `1px solid ${theme.palette.grey[200]}`,
  "& p": {
    margin: 0,
    lineHeight: 1.7,
    color: theme.palette.text.primary,
  },
}));

const CreateAssignment = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const dispatch = useDispatch();
  const { user_id } = useSelector((state) => state.auth);
  const { tracks, courses, students, loading, error } = useSelector(
    (state) => state.createassignments
  );

  // Debug logging to verify data
  useEffect(() => {
    console.log("Tracks:", tracks);
    console.log("Courses:", courses);
    console.log("Loading:", loading);
    console.log("Error:", error);
  }, [tracks, courses, loading, error]);

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    title: "",
    due_date: null,
    end_date: null,
    description: "",
    course: "",
    track: "",
    file_url: "",
    assignToAll: true,
    selectedStudents: [],
    assignment_type: "task",
    difficulty: "Medium",
  });
  const [submitDialog, setSubmitDialog] = useState({
    open: false,
    success: false,
    message: "",
  });
  const [recommendationDialog, setRecommendationDialog] = useState({
    open: false,
    recommendations: [],
    loading: false,
    methodChoice: "1",
    briefDescription: "",
    chatInput: "",
    chatResponse: "",
  });
  const [showResetIndicator, setShowResetIndicator] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    title: false,
    due_date: false,
    end_date: false,
    description: false,
    file_url: false,
    track: false,
    course: false,
    difficulty: false,
  });

  // Memoized fetch functions to prevent unnecessary re-renders
  const fetchCoursesMemoized = useCallback(() => {
    if (formData.track) {
      dispatch(fetchCourses({ userId: user_id, trackId: formData.track }));
    }
  }, [dispatch, user_id, formData.track]);

  const fetchStudentsMemoized = useCallback(() => {
    if (formData.course && formData.track) {
      dispatch(
        fetchStudents({ trackId: formData.track, courseId: formData.course })
      );
    }
  }, [dispatch, formData.track, formData.course]);

  useEffect(() => {
    dispatch(fetchTracks(user_id));
  }, [dispatch, user_id]);

  useEffect(() => {
    fetchCoursesMemoized();
  }, [fetchCoursesMemoized]);

  useEffect(() => {
    fetchStudentsMemoized();
  }, [fetchStudentsMemoized]);

  const fetchRecommendations = async () => {
    setRecommendationDialog((prev) => ({ ...prev, loading: true }));

    if (recommendationDialog.methodChoice === "3") {
      if (!recommendationDialog.chatInput.trim()) {
        setRecommendationDialog((prev) => ({ ...prev, loading: false }));
        setSubmitDialog({
          open: true,
          success: false,
          message: "Please enter a message for the AI chat",
        });
        return;
      }

      try {
        const response = await fetch("http://localhost:8000/api/chatAI/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: recommendationDialog.chatInput }),
        });

        const data = await response.json();
        if (response.ok) {
          const cleanedResponse = data.response
            .replace(/(\*\*|###|```|`|[-*+]\s)/g, "")
            .replace(/\n+/g, "\n")
            .trim();
          setRecommendationDialog((prev) => ({
            ...prev,
            chatResponse: cleanedResponse,
            recommendations: [
              {
                title: formData.title || "AI-Generated Assignment",
                description: cleanedResponse,
              },
            ],
            loading: false,
            chatInput: "",
          }));
        } else {
          throw new Error(data.error || "Failed to fetch AI response");
        }
      } catch (error) {
        setRecommendationDialog((prev) => ({
          ...prev,
          loading: false,
          recommendations: [],
          chatResponse: "",
        }));
        setSubmitDialog({
          open: true,
          success: false,
          message: "Error fetching AI chat response",
        });
      }
      return;
    }

    let url = `http://127.0.0.1:8000/ai/recommendations/?method_choice=${recommendationDialog.methodChoice}`;
    if (recommendationDialog.methodChoice === "1") {
      const courseName = courses.find((c) => c.id === formData.course)?.name || "";
      url += `&course_name=${encodeURIComponent(courseName)}&difficulty=${encodeURIComponent(formData.difficulty)}`;
    } else {
      url += `&brief_description=${encodeURIComponent(recommendationDialog.briefDescription)}`;
    }

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setRecommendationDialog((prev) => ({
          ...prev,
          recommendations: data.recommendations,
          loading: false,
        }));
      } else {
        setRecommendationDialog((prev) => ({
          ...prev,
          loading: false,
          recommendations: [],
        }));
        setSubmitDialog({
          open: true,
          success: false,
          message: data.error || "Failed to fetch recommendations",
        });
      }
    } catch (error) {
      setRecommendationDialog((prev) => ({
        ...prev,
        loading: false,
        recommendations: [],
      }));
      setSubmitDialog({
        open: true,
        success: false,
        message: "Error fetching recommendations",
      });
    }
  };

  const handleRecommendationSelect = (recommendation) => {
    setFormData((prev) => ({
      ...prev,
      description: recommendation.description,
      title: recommendation.title || prev.title,
    }));
    setRecommendationDialog((prev) => ({ ...prev, open: false }));
    setValidationErrors((prev) => ({ ...prev, description: false }));
  };

  const handleRecommendationMethodChange = (e) => {
    setRecommendationDialog((prev) => ({
      ...prev,
      methodChoice: e.target.value,
      recommendations: [],
      briefDescription: "",
      chatInput: "",
      chatResponse: "",
    }));
  };

  const handleBriefDescriptionChange = (e) => {
    setRecommendationDialog((prev) => ({
      ...prev,
      briefDescription: e.target.value,
    }));
  };

  const handleChatInputChange = (e) => {
    setRecommendationDialog((prev) => ({
      ...prev,
      chatInput: e.target.value,
    }));
  };

  const validateCurrentStep = () => {
    const errors = { ...validationErrors };
    let isValid = true;

    if (activeStep === 0) {
      if (!formData.title.trim()) {
        errors.title = true;
        isValid = false;
      }
      if (!formData.due_date) {
        errors.due_date = true;
        isValid = false;
      }
      if (!formData.end_date) {
        errors.end_date = true;
        isValid = false;
      }
      if (!formData.description.trim()) {
        errors.description = true;
        isValid = false;
      }
      if (!formData.file_url.trim() || !isValidUrl(formData.file_url)) {
        errors.file_url = true;
        isValid = false;
      }
      if (!formData.track) {
        errors.track = true;
        isValid = false;
      }
      if (!formData.course) {
        errors.course = true;
        isValid = false;
      }
      if (!formData.difficulty) {
        errors.difficulty = true;
        isValid = false;
      }
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    let updatedValue = value;

    if (name === "file_url") {
      if (value.trim() && !value.match(/^https?:\/\//)) {
        updatedValue = `https://${value.trim()}`;
      }
    }

    if (name === "track") {
      // Reset course and students when track changes
      setFormData((prev) => ({
        ...prev,
        track: value,
        course: "",
        selectedStudents: [],
      }));
      setValidationErrors((prev) => ({ ...prev, track: false, course: false }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : updatedValue,
      }));
      setValidationErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleDateChange = (name) => (date) => {
    setFormData((prev) => ({ ...prev, [name]: date }));
    setValidationErrors((prev) => ({ ...prev, [name]: false }));
  };

  const handleStudentSelection = (studentId) => {
    setFormData((prev) => ({
      ...prev,
      selectedStudents: prev.selectedStudents.includes(studentId)
        ? prev.selectedStudents.filter((id) => id !== studentId)
        : [...prev.selectedStudents, studentId],
    }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      due_date: null,
      end_date: null,
      description: "",
      course: "",
      track: "",
      file_url: "",
      assignToAll: true,
      selectedStudents: [],
      assignment_type: "task",
      difficulty: "Medium",
    });
    setActiveStep(0);
    setShowResetIndicator(true);
  };

  const handleDialogClose = () => {
    setSubmitDialog((prev) => ({ ...prev, open: false }));
    if (submitDialog.success) resetForm();
  };

  const handleRecommendationDialogClose = () => {
    setRecommendationDialog((prev) => ({
      ...prev,
      open: false,
      recommendations: [],
      briefDescription: "",
      chatInput: "",
      chatResponse: "",
    }));
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    if (formData.assignToAll && (!students || students.length === 0)) {
      setSubmitDialog({
        open: true,
        success: false,
        message: "Please wait while student data loads",
      });
      return;
    }

    const assignmentData = {
      title: formData.title,
      description: formData.description,
      due_date: formData.due_date?.toISOString(),
      end_date: formData.end_date?.toISOString(),
      file_url: formData.file_url,
      course: formData.course,
      track: formData.track,
      assignment_type: formData.assignment_type,
      difficulty: formData.difficulty,
      assigned_to: formData.assignToAll
        ? students.map((s) => s.id)
        : formData.selectedStudents,
    };

    try {
      const action = await dispatch(createAssignment(assignmentData));
      if (createAssignment.fulfilled.match(action)) {
        setSubmitDialog({
          open: true,
          success: true,
          message: "Assignment successfully created and assigned",
        });
      } else {
        setSubmitDialog({
          open: true,
          success: false,
          message: action.error?.message || "Failed to create assignment",
        });
      }
    } catch (error) {
      setSubmitDialog({
        open: true,
        success: false,
        message: "An unexpected error occurred",
      });
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <StyledTextField
                label="Assignment Title"
                value={formData.title}
                onChange={handleChange}
                name="title"
                fullWidth
                required
                error={validationErrors.title}
                helperText={validationErrors.title ? "Title is required" : ""}
                InputProps={{
                  startAdornment: (
                    <DescriptionIcon
                      color={validationErrors.title ? "error" : "action"}
                      sx={{ mr: 1, opacity: 0.6 }}
                    />
                  ),
                }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Due Date"
                  value={formData.due_date}
                  onChange={handleDateChange("due_date")}
                  renderInput={(params) => (
                    <StyledTextField
                      {...params}
                      error={validationErrors.due_date}
                      helperText={
                        validationErrors.due_date ? "Due date is required" : ""
                      }
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <CalendarIcon
                            color={validationErrors.due_date ? "error" : "action"}
                            sx={{ mr: 1, opacity: 0.6 }}
                          />
                        ),
                      }}
                      fullWidth
                      required
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="End Date"
                  value={formData.end_date}
                  onChange={handleDateChange("end_date")}
                  minDateTime={formData.due_date}
                  renderInput={(params) => (
                    <StyledTextField
                      {...params}
                      error={validationErrors.end_date}
                      helperText={
                        validationErrors.end_date ? "End date is required" : ""
                      }
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <CalendarIcon
                            color={validationErrors.end_date ? "error" : "action"}
                            sx={{ mr: 1, opacity: 0.6 }}
                          />
                        ),
                      }}
                      fullWidth
                      required
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={validationErrors.track}>
                <InputLabel sx={{ fontWeight: 500 }}>Track</InputLabel>
                <StyledSelect
                  value={formData.track}
                  onChange={handleChange}
                  name="track"
                  label="Track"
                  disabled={loading}
                >
                  {loading ? (
                    <MenuItem disabled>Loading tracks...</MenuItem>
                  ) : tracks.length > 0 ? (
                    tracks.map((track) => (
                      <MenuItem key={track.id} value={track.id}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar
                            sx={{
                              bgcolor: theme.palette.primary.main,
                              width: 24,
                              height: 24,
                            }}
                          >
                            <SchoolIcon sx={{ fontSize: 14 }} />
                          </Avatar>
                          <Box>
                            <Typography variant="body2">{track.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {track.description}
                            </Typography>
                          </Box>
                        </Stack>
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>You must be assigned to course first</MenuItem>
                  )}
                </StyledSelect>
                {validationErrors.track && (
                  <Typography variant="caption" color="error">
                    Track is required
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl
                fullWidth
                required
                disabled={!formData.track || loading}
                error={validationErrors.course}
              >
                <InputLabel sx={{ fontWeight: 500 }}>Course</InputLabel>
                <StyledSelect
                  value={formData.course}
                  onChange={handleChange}
                  name="course"
                  label="Course"
                >
                  {loading ? (
                    <MenuItem disabled>Loading courses...</MenuItem>
                  ) : !formData.track ? (
                    <MenuItem disabled>Select a track first</MenuItem>
                  ) : courses.length > 0 ? (
                    courses.map((course) => (
                      <MenuItem key={course.id} value={course.id}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar
                            sx={{
                              bgcolor: theme.palette.primary.main,
                              width: 24,
                              height: 24,
                            }}
                          >
                            <DescriptionIcon sx={{ fontSize: 14 }} />
                          </Avatar>
                          <Typography variant="body2">{course.name}</Typography>
                        </Stack>
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No assigned courses</MenuItem>
                  )}
                </StyledSelect>
                {validationErrors.course && (
                  <Typography variant="caption" color="error">
                    Course is required
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={validationErrors.difficulty}>
                <InputLabel sx={{ fontWeight: 500 }}>Difficulty</InputLabel>
                <StyledSelect
                  value={formData.difficulty}
                  onChange={handleChange}
                  name="difficulty"
                  label="Difficulty"
                >
                  <MenuItem value="Easy">Easy</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Hard">Hard</MenuItem>
                </StyledSelect>
                {validationErrors.difficulty && (
                  <Typography variant="caption" color="error">
                    Difficulty is required
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontWeight: 500 }}>Assignment Type</InputLabel>
                <StyledSelect
                  value={formData.assignment_type}
                  onChange={handleChange}
                  name="assignment_type"
                  label="Assignment Type"
                >
                  <MenuItem value="task">Task</MenuItem>
                  <MenuItem value="project">Project</MenuItem>
                  <MenuItem value="exam">Exam</MenuItem>
                </StyledSelect>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <StyledTextField
                label="Description"
                value={formData.description}
                onChange={handleChange}
                name="description"
                fullWidth
                required
                multiline
                rows={4}
                error={validationErrors.description}
                helperText={
                  validationErrors.description ? "Description is required" : ""
                }
                InputProps={{
                  endAdornment: (
                    <Tooltip title="Get AI Recommendations">
                      <IconButton
                        onClick={() =>
                          setRecommendationDialog((prev) => ({
                            ...prev,
                            open: true,
                          }))
                        }
                        disabled={!formData.course || !formData.difficulty}
                        color="primary"
                        sx={{ p: 1 }}
                      >
                        <AutoAwesomeIcon />
                      </IconButton>
                    </Tooltip>
                  ),
                }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <StyledTextField
                label="Assignment URL"
                value={formData.file_url}
                onChange={handleChange}
                name="file_url"
                fullWidth
                required
                error={validationErrors.file_url}
                helperText={
                  validationErrors.file_url
                    ? "Valid URL is required"
                    : "Enter a URL (https:// will be added if omitted)"
                }
                InputProps={{
                  startAdornment: (
                    <LinkIcon
                      color={validationErrors.file_url ? "error" : "action"}
                      sx={{ mr: 1, opacity: 0.6 }}
                    />
                  ),
                }}
                variant="outlined"
              />
              {formData.file_url && !validationErrors.file_url && (
                <Link
                  href={formData.file_url}
                  target="_blank"
                  rel="noopener"
                  sx={{
                    mt: 1,
                    display: "block",
                    color: theme.palette.primary.main,
                    fontSize: "0.875rem",
                  }}
                >
                  Test Link
                </Link>
              )}
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.assignToAll}
                    onChange={handleChange}
                    name="assignToAll"
                    color="primary"
                    sx={{ "& .MuiSvgIcon-root": { fontSize: 24 } }}
                  />
                }
                label={
                  <Box display="flex" alignItems="center">
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 500, color: theme.palette.text.primary }}
                    >
                      Assign to all course students
                    </Typography>
                    <Tooltip title="Toggle to select individual students">
                      <InfoIcon
                        color="action"
                        sx={{ ml: 1, fontSize: 18, opacity: 0.6 }}
                      />
                    </Tooltip>
                  </Box>
                }
              />
            </Grid>
            {!formData.assignToAll && (
              <Grid item xs={12}>
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{ fontWeight: 500, color: theme.palette.text.primary }}
                >
                  Select Students ({students?.length || 0} available)
                </Typography>
                {students && students.length > 0 ? (
                  <Grid container spacing={1}>
                    {students.map((student) => (
                      <Grid item key={student.id}>
                        <Chip
                          label={student.name}
                          onClick={() => handleStudentSelection(student.id)}
                          color={
                            formData.selectedStudents.includes(student.id)
                              ? "primary"
                              : "default"
                          }
                          avatar={
                            <Avatar sx={{ bgcolor: theme.palette.primary.light }}>
                              <PersonIcon sx={{ fontSize: 16 }} />
                            </Avatar>
                          }
                          sx={{
                            borderRadius: "16px",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Alert
                    severity="info"
                    sx={{
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      bgcolor: theme.palette.info.light,
                    }}
                  >
                    No students found in this course/track combination
                  </Alert>
                )}
              </Grid>
            )}
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: "10px",
                  border: `1px solid ${theme.palette.grey[200]}`,
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 500, color: theme.palette.text.primary }}
                  >
                    Assignment Summary
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 500 }}
                      >
                        Title
                      </Typography>
                      <Typography variant="body2">{formData.title}</Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 500 }}
                      >
                        Type
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ textTransform: "capitalize" }}
                      >
                        {formData.assignment_type}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 500 }}
                      >
                        Difficulty
                      </Typography>
                      <Typography variant="body2">
                        {formData.difficulty}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 500 }}
                      >
                        Description
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: "pre-line" }}
                      >
                        {formData.description}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 500 }}
                      >
                        Dates
                      </Typography>
                      <Typography variant="body2">
                        Due: {formData.due_date?.toLocaleString() || "Not set"}
                        <br />
                        End: {formData.end_date?.toLocaleString() || "Not set"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 500 }}
                      >
                        URL
                      </Typography>
                      <Link
                        href={formData.file_url}
                        target="_blank"
                        sx={{
                          color: theme.palette.primary.main,
                          fontSize: "0.875rem",
                        }}
                      >
                        {formData.file_url}
                      </Link>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 500 }}
                      >
                        Course & Track
                      </Typography>
                      <Typography variant="body2">
                        {courses.find((c) => c.id === formData.course)?.name || "Not selected"}
                        <br />
                        {tracks.find((t) => t.id === formData.track)?.name || "Not selected"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 500 }}
                      >
                        Assigned To
                      </Typography>
                      <Typography variant="body2">
                        {formData.assignToAll
                          ? `All students (${students?.length || 0}) in course`
                          : formData.selectedStudents.length > 0
                          ? formData.selectedStudents
                              .map(
                                (id) => students.find((s) => s.id === id)?.name
                              )
                              .join(", ")
                          : "No students selected"}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      default:
        return "Unknown step";
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          maxWidth: 800,
          mx: "auto",
          p: isMobile ? 2 : 3,
          bgcolor: theme.palette.background.default,
          borderRadius: "12px",
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            fontWeight: 500,
            color: theme.palette.text.primary,
            mb: 3,
            textAlign: "center",
          }}
        >
          Create New Assignment
        </Typography>

        {loading && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              my: 3,
            }}
          >
            <CircularProgress size={32} />
          </Box>
        )}
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              borderRadius: "8px",
              fontSize: "0.875rem",
              bgcolor: theme.palette.error.light,
            }}
          >
            {error}
          </Alert>
        )}
        {!loading && courses.length === 0 && formData.track && (
          <Alert
            severity="warning"
            sx={{
              mb: 2,
              borderRadius: "8px",
              fontSize: "0.875rem",
              bgcolor: theme.palette.warning.light,
            }}
          >
            No courses assigned for the selected track. Please contact an admin to get assigned to a course.
          </Alert>
        )}

        <Stepper
          activeStep={activeStep}
          alternativeLabel
          sx={{
            mb: 4,
            "& .MuiStepLabel-label": {
              fontWeight: 500,
              fontSize: "0.9rem",
              color: theme.palette.text.primary,
            },
            "& .MuiStepIcon-root": {
              fontSize: "1.5rem",
            },
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Paper
          elevation={2}
          sx={{
            p: isMobile ? 2 : 3,
            borderRadius: "10px",
            background: theme.palette.background.paper,
            border: `1px solid ${theme.palette.grey[200]}`,
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (activeStep === steps.length - 1) {
                handleSubmit();
              } else {
                handleNext();
              }
            }}
          >
            {getStepContent(activeStep)}

            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4, gap: 2 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant="outlined"
                sx={{
                  borderRadius: "8px",
                  fontWeight: 500,
                  px: 3,
                  py: 1,
                  borderColor: theme.palette.grey[300],
                  color: theme.palette.text.primary,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: theme.palette.primary.main,
                    bgcolor: theme.palette.grey[50],
                  },
                }}
              >
                Back
              </Button>

              {activeStep === steps.length - 1 ? (
                <SimpleButton
                  type="submit"
                  variant="contained"
                  disabled={loading || !formData.course}
                  endIcon={<SendIcon />}
                >
                  {loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    "Submit Assignment"
                  )}
                </SimpleButton>
              ) : (
                <SimpleButton type="submit" variant="contained">
                  Next
                </SimpleButton>
              )}
            </Box>
          </form>
        </Paper>

        <StyledDialog
          open={submitDialog.open}
          onClose={handleDialogClose}
          TransitionComponent={Fade}
          transitionDuration={400}
        >
          <DialogTitle sx={{ textAlign: "center", pb: 2 }}>
            {submitDialog.success ? (
              <CheckCircleIcon
                color="success"
                sx={{ fontSize: 50, mb: 1, animation: "bounce 0.5s" }}
              />
            ) : (
              <ErrorIcon
                color="error"
                sx={{ fontSize: 50, mb: 1, animation: "shake 0.5s" }}
              />
            )}
            <Typography
              component="div"
              sx={{
                fontWeight: 500,
                color: theme.palette.text.primary,
                fontSize: "1.25rem",
              }}
            >
              {submitDialog.success ? "Assignment Created" : "Submission Failed"}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ textAlign: "center" }}>
            <Typography
              sx={{ mb: 2, fontSize: "0.875rem", color: theme.palette.text.secondary }}
            >
              {submitDialog.message}
            </Typography>
            {submitDialog.success && formData.file_url && (
              <Box sx={{ mt: 2 }}>
                <Link href={formData.file_url} target="_blank" rel="noopener">
                  <SimpleButton
                    variant="contained"
                    startIcon={<LinkIcon />}
                    sx={{ fontSize: "0.875rem" }}
                  >
                    View Assignment
                  </SimpleButton>
                </Link>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
            <Button
              onClick={handleDialogClose}
              variant="outlined"
              color={submitDialog.success ? "primary" : "error"}
              sx={{
                borderRadius: "8px",
                fontWeight: 500,
                px: 3,
                py: 1,
                textTransform: "none",
              }}
            >
              Close
            </Button>
          </DialogActions>
        </StyledDialog>

        <StyledDialog
          open={recommendationDialog.open}
          onClose={handleRecommendationDialogClose}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: "flex", alignItems: "center", pb: 2 }}>
            <AutoAwesomeIcon
              sx={{ mr: 1, color: theme.palette.primary.main, fontSize: 22 }}
            />
            <Typography
              component="div"
              sx={{
                fontWeight: 500,
                color: theme.palette.text.primary,
                fontSize: "1.25rem",
              }}
            >
              AI Task Recommendations
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12}>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel sx={{ fontWeight: 500, fontSize: "0.875rem" }}>
                    Recommendation Method
                  </InputLabel>
                  <StyledSelect
                    value={recommendationDialog.methodChoice}
                    onChange={handleRecommendationMethodChange}
                    label="Recommendation Method"
                    sx={{ fontSize: "0.875rem" }}
                  >
                    <MenuItem value="1" sx={{ fontSize: "0.875rem" }}>
                      Latest Assignments Created
                    </MenuItem>
                    <MenuItem value="2" sx={{ fontSize: "0.875rem" }}>
                      Brief Description
                    </MenuItem>
                    <MenuItem value="3" sx={{ fontSize: "0.875rem" }}>
                      Chat with AI
                    </MenuItem>
                  </StyledSelect>
                </FormControl>
              </Grid>
              {recommendationDialog.methodChoice === "2" && (
                <Grid item xs={12}>
                  <StyledTextField
                    label="Brief Description"
                    value={recommendationDialog.briefDescription}
                    onChange={handleBriefDescriptionChange}
                    fullWidth
                    multiline
                    rows={3}
                    helperText="Provide a brief description to generate recommendations"
                    sx={{ "& .MuiInputBase-input": { fontSize: "0.875rem" } }}
                  />
                </Grid>
              )}
              {recommendationDialog.methodChoice === "3" && (
                <Grid item xs={12}>
                  <ChatContainer>
                    {recommendationDialog.chatResponse && (
                      <ChatMessage>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            mb: 1,
                            color: theme.palette.text.primary,
                          }}
                        >
                          AI Response
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            whiteSpace: "pre-line",
                            lineHeight: 1.8,
                            color: theme.palette.text.primary,
                            fontSize: "0.875rem",
                          }}
                        >
                          {recommendationDialog.chatResponse}
                        </Typography>
                      </ChatMessage>
                    )}
                    {recommendationDialog.loading && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          fontStyle: "italic",
                          textAlign: "center",
                          fontSize: "0.875rem",
                        }}
                      >
                        Generating response...
                      </Typography>
                    )}
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        alignItems: "center",
                        bgcolor: theme.palette.grey[50],
                        p: 1,
                        borderRadius: "8px",
                        border: `1px solid ${theme.palette.grey[200]}`,
                      }}
                    >
                      <StyledTextField
                        label="Ask AI for assignment ideas"
                        value={recommendationDialog.chatInput}
                        onChange={handleChatInputChange}
                        onKeyDown={(e) =>
                          e.key === "Enter" && fetchRecommendations()
                        }
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="E.g., Suggest a project for a Python course"
                        sx={{
                          "& .MuiInputBase-input": { fontSize: "0.875rem" },
                          "& .MuiInputLabel-root": { fontSize: "0.875rem" },
                        }}
                      />
                      <SimpleButton
                        variant="contained"
                        onClick={fetchRecommendations}
                        disabled={
                          !recommendationDialog.chatInput.trim() ||
                          recommendationDialog.loading
                        }
                        sx={{ py: 1, px: 2, minWidth: "80px" }}
                      >
                        Send
                      </SimpleButton>
                    </Box>
                  </ChatContainer>
                </Grid>
              )}
              {(recommendationDialog.methodChoice === "1" ||
                recommendationDialog.methodChoice === "2") && (
                <Grid item xs={12}>
                  <SimpleButton
                    variant="contained"
                    onClick={fetchRecommendations}
                    disabled={
                      recommendationDialog.methodChoice === "2" &&
                      !recommendationDialog.briefDescription.trim()
                    }
                    fullWidth
                    sx={{ py: 1 }}
                  >
                    Get Recommendations
                  </SimpleButton>
                </Grid>
              )}
            </Grid>
            {recommendationDialog.loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  my: 3,
                }}
              >
                <CircularProgress size={32} />
              </Box>
            ) : recommendationDialog.recommendations.length > 0 ? (
              <Grid container spacing={2}>
                {recommendationDialog.recommendations.map((rec, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <RecommendationCard variant="outlined">
                      <CardContent>
                        <Typography
                          variant="subtitle2"
                          gutterBottom
                          sx={{
                            fontWeight: 500,
                            color: theme.palette.text.primary,
                          }}
                        >
                          {rec.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          paragraph
                          sx={{ lineHeight: 1.7, fontSize: "0.875rem" }}
                        >
                          {rec.description}
                        </Typography>
                        {recommendationDialog.methodChoice === "1" && (
                          <>
                            <Typography
                              variant="caption"
                              display="block"
                              sx={{
                                color: theme.palette.text.secondary,
                                fontSize: "0.75rem",
                              }}
                            >
                              Course: {rec.course_name}
                            </Typography>
                            <Typography
                              variant="caption"
                              display="block"
                              sx={{
                                color: theme.palette.text.secondary,
                                fontSize: "0.75rem",
                              }}
                            >
                              Difficulty: {rec.difficulty}
                            </Typography>
                          </>
                        )}
                        <SimpleButton
                          variant="contained"
                          size="small"
                          sx={{
                            mt: 2,
                            fontSize: "0.75rem",
                            px: 2,
                            py: 0.5,
                          }}
                          onClick={() => handleRecommendationSelect(rec)}
                        >
                          Use this
                        </SimpleButton>
                      </CardContent>
                    </RecommendationCard>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "center", mt: 2, fontSize: "0.875rem" }}
              >
                No recommendations available. Try adjusting your input.
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: "flex-end", pt: 2 }}>
            <Button
              onClick={handleRecommendationDialogClose}
              variant="outlined"
              color="primary"
              sx={{
                borderRadius: "8px",
                fontWeight: 500,
                px: 3,
                py: 1,
                textTransform: "none",
                fontSize: "0.875rem",
              }}
            >
              Close
            </Button>
          </DialogActions>
        </StyledDialog>

        <Snackbar
          open={showResetIndicator}
          autoHideDuration={3000}
          onClose={() => setShowResetIndicator(false)}
          message="Form reset successfully"
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          sx={{
            "& .MuiSnackbarContent-root": {
              borderRadius: "8px",
              bgcolor: theme.palette.success.light,
              color: theme.palette.success.contrastText,
              fontSize: "0.875rem",
            },
          }}
        />
      </Box>
    </LocalizationProvider>
  );
};

// Add global animations
const styleSheet = document.createElement("style");
styleSheet.innerHTML = `
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-15px); }
    60% { transform: translateY(-7px); }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
    20%, 40%, 60%, 80% { transform: translateX(3px); }
  }
`;
document.head.appendChild(styleSheet);

export default CreateAssignment;