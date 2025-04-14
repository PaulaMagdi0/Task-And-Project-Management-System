import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTracks, fetchCourses, fetchStudents, createAssignment } from '../../redux/createassignmentsSlice';
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
  useTheme,
  useMediaQuery,
  Link,
  Chip,
} from '@mui/material';
import {
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Send as SendIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { isValidUrl } from '../../../utils/validation';

const steps = ['Basic Info', 'Course Details', 'Assignment Target', 'Review'];

const ColorButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  color: theme.palette.common.white,
  fontWeight: 'bold',
  '&:hover': {
    background: `linear-gradient(45deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
  },
}));

const CreateAssignment = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch();
  const { user_id } = useSelector((state) => state.auth);
  const { tracks, courses, students, assignment, loading, error } = useSelector((state) => state.createassignments);

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    due_date: null,
    end_date: null,
    description: '',
    course: '',
    track: '',
    file_url: '',
    assignToAll: true,
    selectedStudents: [],
    assignment_type: 'task',
  });
  const [successDialog, setSuccessDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    title: false,
    due_date: false,
    end_date: false,
    description: false,
    file_url: false,
    track: false,
    course: false,
  });

  useEffect(() => {
    dispatch(fetchTracks(user_id));
  }, [dispatch, user_id]);

  useEffect(() => {
    if (formData.track) {
      dispatch(fetchCourses({ userId: user_id, trackId: formData.track }));
    }
  }, [dispatch, user_id, formData.track]);

  useEffect(() => {
    if (formData.course && formData.track) {
      dispatch(fetchStudents({ trackId: formData.track, courseId: formData.course }));
    }
  }, [dispatch, formData.track, formData.course]);

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
    }

    if (activeStep === 1) {
      if (!formData.track) {
        errors.track = true;
        isValid = false;
      }
      if (!formData.course) {
        errors.course = true;
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
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleDateChange = (name) => (date) => {
    setFormData((prev) => ({ ...prev, [name]: date }));
    
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleStudentSelection = (studentId) => {
    setFormData(prev => ({
      ...prev,
      selectedStudents: prev.selectedStudents.includes(studentId)
        ? prev.selectedStudents.filter(id => id !== studentId)
        : [...prev.selectedStudents, studentId]
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    if (formData.assignToAll) {
      if (!students || students.length === 0) {
        alert('Please wait while student data loads');
        return;
      }
    }

    const assignmentData = {
      title: formData.title,
      description: formData.description,
      due_date: formData.due_date.toISOString(),
      end_date: formData.end_date.toISOString(),
      file_url: formData.file_url,
      course: formData.course,
      track: formData.track,
      assignment_type: formData.assignment_type,
      assigned_to: formData.assignToAll
        ? students.map((s) => s.id)
        : formData.selectedStudents,
    };

    try {
      const action = await dispatch(createAssignment(assignmentData));
      if (action.payload?.success) {
        setSuccessDialog(true);
        setFormData({
          title: '',
          due_date: null,
          end_date: null,
          description: '',
          course: '',
          track: '',
          file_url: '',
          assignToAll: true,
          selectedStudents: [],
          assignment_type: 'task',
        });
        setActiveStep(0);
      }
    } catch (error) {
      console.error('Assignment creation error:', error);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Assignment Title *"
                value={formData.title}
                onChange={handleChange}
                name="title"
                fullWidth
                required
                error={validationErrors.title}
                helperText={validationErrors.title && "Title is required"}
                InputProps={{
                  startAdornment: <DescriptionIcon color={validationErrors.title ? "error" : "action"} sx={{ mr: 1 }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Due Date *"
                  value={formData.due_date}
                  onChange={handleDateChange('due_date')}
                  renderInput={(params) => (
                    <TextField 
                      {...params}
                      error={validationErrors.due_date}
                      helperText={validationErrors.due_date && "Due date required"}
                      InputProps={{
                        startAdornment: <CalendarIcon color={validationErrors.due_date ? "error" : "action"} sx={{ mr: 1 }} />,
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="End Date *"
                  value={formData.end_date}
                  onChange={handleDateChange('end_date')}
                  minDateTime={formData.due_date}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      error={validationErrors.end_date}
                      helperText={validationErrors.end_date && "End date required"}
                      InputProps={{
                        startAdornment: <CalendarIcon color={validationErrors.end_date ? "error" : "action"} sx={{ mr: 1 }} />,
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Assignment Type *</InputLabel>
                <Select
                  value={formData.assignment_type}
                  onChange={handleChange}
                  name="assignment_type"
                  label="Assignment Type *"
                >
                  <MenuItem value="task">Task</MenuItem>
                  <MenuItem value="project">Project</MenuItem>
                  <MenuItem value="exam">Exam</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description *"
                value={formData.description}
                onChange={handleChange}
                name="description"
                fullWidth
                required
                multiline
                rows={4}
                error={validationErrors.description}
                helperText={validationErrors.description && "Description required"}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Assignment URL *"
                value={formData.file_url}
                onChange={handleChange}
                name="file_url"
                fullWidth
                required
                error={validationErrors.file_url}
                helperText={validationErrors.file_url ? "Valid URL required" : ""}
                InputProps={{
                  startAdornment: <LinkIcon color={validationErrors.file_url ? "error" : "action"} sx={{ mr: 1 }} />,
                }}
              />
              {formData.file_url && !validationErrors.file_url && (
                <Link href={formData.file_url} target="_blank" rel="noopener" sx={{ mt: 1, display: 'block' }}>
                  Test Link
                </Link>
              )}
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={validationErrors.track}>
                <InputLabel>Track *</InputLabel>
                <Select 
                  value={formData.track} 
                  onChange={handleChange} 
                  name="track"
                  label="Track *"
                >
                  {tracks.map((track) => (
                    <MenuItem key={track.id} value={track.id}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 24, height: 24 }}>
                          <SchoolIcon sx={{ fontSize: 14 }} />
                        </Avatar>
                        <Box>
                          <Typography>{track.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {track.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
                {validationErrors.track && <Typography variant="caption" color="error">Track required</Typography>}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth 
                required 
                disabled={!formData.track}
                error={validationErrors.course}
              >
                <InputLabel>Course *</InputLabel>
                <Select 
                  value={formData.course} 
                  onChange={handleChange} 
                  name="course"
                  label="Course *"
                >
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar sx={{ bgcolor: theme.palette.secondary.main, width: 24, height: 24 }}>
                          <DescriptionIcon sx={{ fontSize: 14 }} />
                        </Avatar>
                        <Typography>{course.name}</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
                {validationErrors.course && <Typography variant="caption" color="error">Course required</Typography>}
              </FormControl>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.assignToAll}
                    onChange={handleChange}
                    name="assignToAll"
                    color="primary"
                  />
                }
                label={
                  <>
                    Assign to all course students
                    <Tooltip title="Toggle to select individual students">
                      <InfoIcon color="action" sx={{ ml: 1 }} />
                    </Tooltip>
                  </>
                }
              />
            </Grid>
            {!formData.assignToAll && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Select Students ({students?.length || 0} available)
                </Typography>
                {students && students.length > 0 ? (
                  <Grid container spacing={2}>
                    {students.map((student) => (
                      <Grid item key={student.id}>
                        <Chip
                          label={student.name}
                          onClick={() => handleStudentSelection(student.id)}
                          color={formData.selectedStudents.includes(student.id) ? "primary" : "default"}
                          avatar={<Avatar><PersonIcon /></Avatar>}
                        />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Alert severity="info">
                    No students found in this course/track combination
                  </Alert>
                )}
              </Grid>
            )}
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Assignment Summary</Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Title</Typography>
                      <Typography>{formData.title}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                      <Typography sx={{ textTransform: 'capitalize' }}>{formData.assignment_type}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                      <Typography sx={{ whiteSpace: 'pre-line' }}>{formData.description}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Dates</Typography>
                      <Typography>
                        Due: {formData.due_date?.toLocaleString() || 'Not set'}
                        <br />
                        End: {formData.end_date?.toLocaleString() || 'Not set'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">URL</Typography>
                      <Link href={formData.file_url} target="_blank">{formData.file_url}</Link>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Course & Track</Typography>
                      <Typography>
                        {courses.find(c => c.id === formData.course)?.name}
                        <br />
                        {tracks.find(t => t.id === formData.track)?.name}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Assigned To</Typography>
                      <Typography>
                        {formData.assignToAll 
                          ? `All students (${students?.length || 0}) in course` 
                          : formData.selectedStudents.length > 0 
                            ? formData.selectedStudents.map(id => 
                                students.find(s => s.id === id)?.name
                              ).join(', ')
                            : 'No students selected'}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ maxWidth: 800, mx: 'auto', p: isMobile ? 2 : 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
          Create New Assignment
        </Typography>

        {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        <Paper elevation={3} sx={{ p: isMobile ? 2 : 4 }}>
          <form onSubmit={handleSubmit}>
            {getStepContent(activeStep)}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant="outlined"
                size="large"
              >
                Back
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <ColorButton
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  endIcon={<SendIcon />}
                >
                  {loading ? <CircularProgress size={24} /> : 'Submit Assignment'}
                </ColorButton>
              ) : (
                <Button variant="contained" onClick={handleNext} size="large">
                  Next
                </Button>
              )}
            </Box>
          </form>
        </Paper>

        <Dialog open={successDialog} onClose={() => setSuccessDialog(false)}>
          <DialogTitle sx={{ textAlign: 'center' }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5">Assignment Created!</Typography>
          </DialogTitle>
          <DialogContent>
            <Typography align="center" gutterBottom>
              Assignment successfully created and assigned
            </Typography>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link href={formData.file_url} target="_blank">
                <Button variant="outlined" startIcon={<LinkIcon />}>
                  View Assignment
                </Button>
              </Link>
            </Box>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
            <Button 
              variant="contained" 
              onClick={() => setSuccessDialog(false)}
              size="large"
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default CreateAssignment;