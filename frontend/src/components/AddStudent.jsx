import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Typography,
  TextField,
  Divider,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Paper,
  MenuItem,
  styled,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Autocomplete
} from '@mui/material';
import { Close, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import CloudUpload from '@mui/icons-material/CloudUpload';
import { useDispatch, useSelector } from 'react-redux';
import apiClient from '../services/api';
import { fetchCourses } from '../redux/coursesSlice';

const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: '16px',
  boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.1)',
  maxWidth: '800px',
  margin: '0 auto'
}));

const StyledButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5),
  fontSize: '1rem',
  fontWeight: 600,
  textTransform: 'none',
  borderRadius: '12px'
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    '& fieldset': { borderColor: theme.palette.grey[300] },
    '&:hover fieldset': { borderColor: theme.palette.primary.main }
  }
}));

export default function UploadStudentPage() {
  const dispatch = useDispatch();
  const { user_id } = useSelector(s => s.auth);

  // Access tracks and loading state from Redux store
  const { userCourses, status } = useSelector(s => s.courses);
  const tracks = userCourses?.tracks || [];
  const tracksLoading = status.fetchCoursesLoading;

  // State for intakes
  const [intakes, setIntakes] = useState([]);
  const [intakesLoading, setIntakesLoading] = useState(false);

  // Fetch tracks and intakes on mount
  useEffect(() => {
    if (user_id) {
      dispatch(fetchCourses(user_id));
    }
    // Fetch intakes
    setIntakesLoading(true);
    apiClient.get('/student/intakes/')
      .then(response => {
        setIntakes(response.data.intakes || []);
      })
      .catch(error => {
        console.error('Failed to fetch intakes:', error);
      })
      .finally(() => {
        setIntakesLoading(false);
      });
  }, [dispatch, user_id]);

  const [isExcelUpload, setIsExcelUpload] = useState(false);
  const [studentData, setStudentData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    track_id: '',
    intake: '',
    role: 'student'
  });
  const [excelFile, setExcelFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    isSuccess: false
  });
  const [studentStatuses, setStudentStatuses] = useState([]);

  const handleStudentInputChange = e => {
    const { name, value } = e.target;
    setStudentData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = e => {
    setExcelFile(e.target.files[0]);
    setStudentStatuses([]); // Clear previous statuses
  };

  const handleCloseModal = () => setOpenModal(false);

  const showSuccessModal = (message, warnings = []) => {
    let fullMessage = message;
    if (warnings.length > 0) {
      fullMessage += '\n\nWarnings:\n' + warnings.join('\n');
    }
    setModalContent({ title: 'Success!', message: fullMessage, isSuccess: true });
    setOpenModal(true);
  };

  const showErrorModal = (message, details = null) => {
    let fullMessage = message;
    // Skip details for duplicate email errors to avoid redundancy
    if (details && typeof details === 'object' && details.field === 'email' && details.error === message) {
      // Do nothing, keep fullMessage as just the main message
    } else if (details) {
      if (typeof details === 'object') {
        // Handle validation errors with details
        if (details.details) {
          fullMessage += '\n\nDetails:\n' + Object.entries(details.details)
            .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
            .join('\n');
        }
        // Handle single field errors, but skip if it repeats the main message
        else if (details.field && details.error && details.error !== message) {
          fullMessage += `\n\n${details.field}: ${details.error}`;
        }
        // Handle Excel upload validation errors
        else if (details.detail && details.errors) {
          fullMessage += `\n\n${details.detail}\n\nErrors:\n` + details.errors.join('\n');
        }
        // Handle generic object details
        else if (Object.keys(details).length > 0) {
          fullMessage += '\n\nDetails:\n' + JSON.stringify(details, null, 2);
        }
      } else if (typeof details === 'string') {
        fullMessage += '\n\nDetails:\n' + details;
      }
    }
    setModalContent({ title: 'Error', message: fullMessage, isSuccess: false });
    setOpenModal(true);
  };

  const handleSubmitManualStudent = async () => {
    const { first_name, last_name, email, track_id, intake } = studentData;
    if (!first_name || !last_name || !email || !track_id || !intake) {
      showErrorModal('Please fill all required fields', {
        details: {
          ...(first_name ? {} : { first_name: ['This field is required'] }),
          ...(last_name ? {} : { last_name: ['This field is required'] }),
          ...(email ? {} : { email: ['This field is required'] }),
          ...(track_id ? {} : { track_id: ['This field is required'] }),
          ...(intake ? {} : { intake: ['This field is required'] })
        }
      });
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      Object.entries(studentData).forEach(([k, v]) => {
        console.log(`FormData: ${k} = ${v}`); // Debug FormData
        form.append(k, v);
      });
      const response = await apiClient.post('/student/create/', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showSuccessModal('Student added successfully! Verification email sent.');
      setStudentData({ first_name: '', last_name: '', email: '', track_id: '', intake: '', role: 'student' });
      // Refresh intakes
      const intakeResponse = await apiClient.get('/student/intakes/');
      setIntakes(intakeResponse.data.intakes || []);
    } catch (err) {
      console.error('Create student error:', err.response?.data || err.message); // Debug full error
      const errorData = err.response?.data || { error: 'Unknown error occurred' };
      showErrorModal(
        errorData.error || 'Failed to add student',
        errorData.details || errorData.field ? errorData : null
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUploadExcel = async () => {
    if (!excelFile) {
      showErrorModal('Please select an Excel file');
      return;
    }
    if (!studentData.track_id) {
      showErrorModal('Please select a track');
      return;
    }
    if (!studentData.intake) {
      showErrorModal('Please select or enter an intake');
      return;
    }
    setLoading(true);
    setStudentStatuses([]); // Clear previous statuses
    try {
      const form = new FormData();
      form.append('excel_file', excelFile);
      form.append('track_id', studentData.track_id);
      form.append('intake', studentData.intake);
      const resp = await apiClient.post('/student/upload/', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log('Excel upload response:', resp.data); // Debug log
      const errors = resp.data.errors || [];
      const createdCount = resp.data.created_count || 0;
      const students = resp.data.students || [];

      // Initialize student statuses with emails from response
      const statuses = students.map(student => ({
        email: student.email || `Student ${student.id}`,
        status: 'Sending...',
        success: false
      }));
      setStudentStatuses(statuses);

      // Simulate per-student feedback with delay
      for (let i = 0; i < statuses.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 300)); // 300ms delay
        setStudentStatuses(prev =>
          prev.map((s, index) =>
            index === i ? { ...s, status: 'Email sent', success: true } : s
          )
        );
      }

      // Show final success modal
      if (createdCount > 0) {
        const warnings = errors.map(e => e || 'Unknown error');
        showSuccessModal(`Done correctly! Created ${createdCount} students!`, warnings);
      } else if (errors.length > 0) {
        showErrorModal('Failed to create students', {
          detail: 'All rows failed validation',
          errors
        });
      } else {
        showErrorModal('No students were created and no specific errors reported.');
      }

      setStudentData({ first_name: '', last_name: '', email: '', track_id: '', intake: '', role: 'student' });
      setExcelFile(null);
      // Refresh intakes
      const intakeResponse = await apiClient.get('/student/intakes/');
      setIntakes(intakeResponse.data.intakes || []);
    } catch (err) {
      console.error('Excel upload error:', err.response?.data || err.message);
      const errorData = err.response?.data || { error: 'Upload failed' };
      showErrorModal(
        errorData.error || 'Upload failed',
        errorData.detail && errorData.errors ? errorData : errorData.details || errorData
      );
      setStudentStatuses([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, background: '#f5f7fa', minHeight: '100vh' }}>
      <StyledCard>
        <Typography variant="h4" mb={3} fontWeight="bold" color="primary">
          {isExcelUpload ? 'Upload Students Sheet' : 'Add New Student'}
        </Typography>

        <Grid container spacing={2} mb={3}>
          <Grid item xs={6}>
            <StyledButton
              fullWidth
              variant={!isExcelUpload ? 'contained' : 'outlined'}
              onClick={() => setIsExcelUpload(false)}
              color={!isExcelUpload ? 'primary' : 'inherit'}
            >
              Add Single Student
            </StyledButton>
          </Grid>
          <Grid item xs={6}>
            <StyledButton
              fullWidth
              variant={isExcelUpload ? 'contained' : 'outlined'}
              onClick={() => setIsExcelUpload(true)}
              color={isExcelUpload ? 'primary' : 'inherit'}
            >
              Add Multiple Students
            </StyledButton>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, borderColor: 'rgba(0, 0, 0, 0.08)' }} />

        {!isExcelUpload ? (
          <Box sx={{ maxWidth: '600px', mx: 'auto' }}>
            <Typography variant="h6" mb={3} fontWeight="600" color="text.secondary">
              Student Information
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  label="First Name *"
                  fullWidth
                  name="first_name"
                  value={studentData.first_name}
                  onChange={handleStudentInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  label="Last Name *"
                  fullWidth
                  name="last_name"
                  value={studentData.last_name}
                  onChange={handleStudentInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <StyledTextField
                  label="Email *"
                  fullWidth
                  name="email"
                  type="email"
                  value={studentData.email}
                  onChange={handleStudentInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <StyledTextField
                  select
                  label="Track *"
                  fullWidth
                  name="track_id"
                  value={studentData.track_id}
                  onChange={handleStudentInputChange}
                >
                  {tracksLoading ? (
                    <MenuItem disabled>Loading tracks...</MenuItem>
                  ) : tracks.length > 0 ? (
                    tracks.map(t => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No tracks available</MenuItem>
                  )}
                </StyledTextField>
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  freeSolo
                  options={intakes}
                  value={studentData.intake}
                  onChange={(event, newValue) => {
                    setStudentData(prev => ({ ...prev, intake: newValue || '' }));
                  }}
                  onInputChange={(event, newInputValue) => {
                    setStudentData(prev => ({ ...prev, intake: newInputValue }));
                  }}
                  renderInput={params => (
                    <StyledTextField
                      {...params}
                      label="Intake *"
                      fullWidth
                      name="intake"
                      placeholder="Select or enter new intake (e.g., Intake 45)"
                    />
                  )}
                  disabled={intakesLoading}
                />
              </Grid>
            </Grid>

            <StyledButton
              variant="contained"
              fullWidth
              onClick={handleSubmitManualStudent}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ mt: 3 }}
            >
              {loading ? 'Processing...' : 'Add Student'}
            </StyledButton>
          </Box>
        ) : (
          <Box sx={{ maxWidth: '600px', mx: 'auto' }}>
            <Typography variant="h6" mb={3} fontWeight="600" color="text.secondary">
              Upload Excel File
            </Typography>

            <Paper
              variant="outlined"
              sx={{
                p: 3,
                mb: 3,
                borderStyle: 'dashed',
                borderColor: 'grey.300',
                textAlign: 'center'
              }}
            >
              <label htmlFor="file-upload">
                <input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <Button variant="outlined" component="span" startIcon={<CloudUpload />}>
                  Choose File
                </Button>
              </label>
              {excelFile && (
                <Typography variant="body2" mt={2}>
                  Selected file: <strong>{excelFile.name}</strong>
                </Typography>
              )}
              <Typography variant="caption" display="block" mt={1} color="text.secondary">
                Supported formats: .xlsx, .xls, .csv
              </Typography>
            </Paper>

            <StyledTextField
              select
              label="Track *"
              fullWidth
              name="track_id"
              value={studentData.track_id}
              onChange={handleStudentInputChange}
              sx={{ mb: 3 }}
            >
              {tracksLoading ? (
                <MenuItem disabled>Loading tracks...</MenuItem>
              ) : tracks.length > 0 ? (
                tracks.map(t => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No tracks available</MenuItem>
              )}
            </StyledTextField>

            <Autocomplete
              freeSolo
              options={intakes}
              value={studentData.intake}
              onChange={(event, newValue) => {
                setStudentData(prev => ({ ...prev, intake: newValue || '' }));
              }}
              onInputChange={(event, newInputValue) => {
                setStudentData(prev => ({ ...prev, intake: newInputValue }));
              }}
              renderInput={params => (
                <StyledTextField
                  {...params}
                  label="Intake *"
                  fullWidth
                  name="intake"
                  placeholder="Select or enter new intake (e.g., Intake 45)"
                  sx={{ mb: 3 }}
                />
              )}
              disabled={intakesLoading}
            />

            <StyledButton
              variant="contained"
              fullWidth
              onClick={handleUploadExcel}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {loading ? 'Uploading...' : 'Upload Students'}
            </StyledButton>

            {studentStatuses.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" mb={2} fontWeight="600" color="text.secondary">
                  Processing Students
                </Typography>
                <List dense>
                  {studentStatuses.map((s, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {s.success ? (
                          <CheckCircle color="success" />
                        ) : (
                          <CircularProgress size={20} />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={s.email}
                        secondary={s.status}
                        primaryTypographyProps={{ fontWeight: s.success ? 'bold' : 'normal' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}
      </StyledCard>

      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        PaperProps={{ sx: { borderRadius: '16px', minWidth: '400px' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          {modalContent.isSuccess ? (
            <CheckCircle color="success" sx={{ mr: 1, fontSize: 28 }} />
          ) : (
            <ErrorIcon color="error" sx={{ mr: 1, fontSize: 28 }} />
          )}
          {modalContent.title}
          <IconButton
            aria-label="close"
            onClick={handleCloseModal}
            sx={{ position: 'absolute', right: 8, top: 8, color: theme => theme.palette.grey[500] }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" whiteSpace="pre-wrap">
            {modalContent.message}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="primary">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}