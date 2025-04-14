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
  IconButton,
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
  Close as CloseIcon,
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
    console.log("formData in useEffect", formData);  // Check values of track and course
    if (!formData.assignToAll && formData.course) {
      dispatch(fetchStudents({ trackId: formData.track, courseId: formData.course }));
    }
  }, [dispatch, formData.assignToAll, formData.track, formData.course]);
  
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
    if (!validateCurrentStep()) {
      return;
    }
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
    setFormData(prev => {
      const newSelectedStudents = prev.selectedStudents.includes(studentId)
        ? prev.selectedStudents.filter(id => id !== studentId)
        : [...prev.selectedStudents, studentId];
      
      return { ...prev, selectedStudents: newSelectedStudents };
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!validateCurrentStep()) return;
  
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
        ? students.map((s) => s.id) // All students if checkbox is checked
        : formData.selectedStudents, // Only selected students if checkbox is not checked
    };
  
    try {
      const action = await dispatch(createAssignment(assignmentData));
  
      if (action.payload && action.payload.success) {
        setSuccessDialog(true);
        setFormData({
          title: '',
          due_date: null,
          end_date: null,
          description: '',
          course: '',
          track: '',
          file_url: '',
          assignToAll: true, // Reset to default
          selectedStudents: [], // Clear selections
          assignment_type: 'task',
        });
        setActiveStep(0);
      } else {
        console.error('Error creating assignment:', action.error?.message);
      }
    } catch (error) {
      console.error('Error during assignment creation:', error);
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
                variant="outlined"
                size="small"
                error={validationErrors.title}
                helperText={validationErrors.title ? "Title is required" : ""}
                InputProps={{
                  startAdornment: (
                    <DescriptionIcon color={validationErrors.title ? "error" : "action"} sx={{ mr: 1 }} />
                  ),
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
                      fullWidth 
                      size="small" 
                      required 
                      error={validationErrors.due_date}
                      helperText={validationErrors.due_date ? "Due date is required" : ""}
                      InputProps={{
                        startAdornment: (
                          <CalendarIcon color={validationErrors.due_date ? "error" : "action"} sx={{ mr: 1 }} />
                        ),
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
                      fullWidth 
                      size="small"
                      required
                      error={validationErrors.end_date}
                      helperText={validationErrors.end_date ? "End date is required" : ""}
                      InputProps={{
                        startAdornment: (
                          <CalendarIcon color={validationErrors.end_date ? "error" : "action"} sx={{ mr: 1 }} />
                        ),
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
                variant="outlined"
                size="small"
                error={validationErrors.description}
                helperText={validationErrors.description ? "Description is required" : ""}
                placeholder="Provide detailed instructions for the assignment..."
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
                variant="outlined"
                size="small"
                error={validationErrors.file_url}
                helperText={validationErrors.file_url ? "Please enter a valid URL (e.g., https://example.com)" : ""}
                InputProps={{
                  startAdornment: (
                    <LinkIcon color={validationErrors.file_url ? "error" : "action"} sx={{ mr: 1 }} />
                  ),
                }}
                placeholder="https://example.com/assignment"
              />
              {formData.file_url && !validationErrors.file_url && (
                <Box sx={{ mt: 1 }}>
                  <Link href={formData.file_url} target="_blank" rel="noopener noreferrer">
                    Test this link
                  </Link>
                </Box>
              )}
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required size="small" error={validationErrors.track}>
                <InputLabel>Track *</InputLabel>
                <Select 
                  value={formData.track} 
                  onChange={handleChange} 
                  name="track"
                  label="Track *"
                >
                  {Array.isArray(tracks) && tracks.length > 0 ? (
                    tracks.map((track) => (
                      <MenuItem key={track.id} value={track.id}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 24, height: 24 }}>
                            <SchoolIcon sx={{ fontSize: 14 }} />
                          </Avatar>
                          <Box>
                            <Typography variant="body1">{track.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {track.description}
                            </Typography>
                          </Box>
                        </Stack>
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No Tracks Available</MenuItem>
                  )}
                </Select>
                {validationErrors.track && (
                  <Typography variant="caption" color="error">
                    Track selection is required
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth 
                required 
                size="small" 
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
                  {Array.isArray(courses) && courses.length > 0 ? (
                    courses.map((course) => (
                      <MenuItem key={course.id} value={course.id}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar sx={{ bgcolor: theme.palette.secondary.main, width: 24, height: 24 }}>
                            <DescriptionIcon sx={{ fontSize: 14 }} />
                          </Avatar>
                          <Typography>{course.name}</Typography>
                        </Stack>
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No Courses Available</MenuItem>
                  )}
                </Select>
                {validationErrors.course && (
                  <Typography variant="caption" color="error">
                    Course selection is required
                  </Typography>
                )}
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
                  <Typography variant="body1">
                    Assign to all students in this course
                    <Tooltip title="If unchecked, you can select specific students">
                      <InfoIcon color="action" fontSize="small" sx={{ ml: 1 }} />
                    </Tooltip>
                  </Typography>
                }
              />
            </Grid>
            
            {!formData.assignToAll && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Select Students
                </Typography>
                {students && students.length > 0 ? (
                  <Grid container spacing={2}>
                    {students.map((student) => (
                      <Grid item key={student.id}>
                        <Chip
                          label={student.name}
                          onClick={() => handleStudentSelection(student.id)}
                          color={formData.selectedStudents.includes(student.id) ? "primary" : "default"}
                          avatar={
                            <Avatar>
                              <PersonIcon />
                            </Avatar>
                          }
                        />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No students available in this course
                  </Typography>
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
                  <Typography variant="h6" gutterBottom>
                    Assignment Summary
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Title
                      </Typography>
                      <Typography variant="body1">{formData.title}</Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Type
                      </Typography>
                      <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                        {formData.assignment_type}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Description
                      </Typography>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                        {formData.description}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Due Date
                      </Typography>
                      <Typography variant="body1">
                        {formData.due_date ? new Date(formData.due_date).toLocaleString() : 'Not set'}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        End Date
                      </Typography>
                      <Typography variant="body1">
                        {formData.end_date ? new Date(formData.end_date).toLocaleString() : 'Not set'}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Assignment URL
                      </Typography>
                      <Link href={formData.file_url} target="_blank" rel="noopener noreferrer">
                        {formData.file_url}
                      </Link>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Course
                      </Typography>
                      <Typography variant="body1">
                        {courses.find(c => c.id === formData.course)?.name || 'Not selected'}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Assigned To
                      </Typography>
                      <Typography variant="body1">
                        {formData.assignToAll 
                          ? 'All students in course' 
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
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress size={60} />
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
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
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit Assignment'}
                </ColorButton>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  size="large"
                >
                  Next
                </Button>
              )}
            </Box>
          </form>
        </Paper>
        
        <Dialog open={successDialog} onClose={() => setSuccessDialog(false)}>
          <DialogTitle sx={{ textAlign: 'center' }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5">Assignment Created Successfully!</Typography>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" align="center" gutterBottom>
              Your assignment has been successfully created and assigned to students.
            </Typography>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link href={formData.file_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outlined" startIcon={<LinkIcon />}>
                  View Assignment URL
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