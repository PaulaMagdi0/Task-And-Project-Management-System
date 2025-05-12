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
  const { user_id, track_id } = useSelector(s => s.auth);

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
    if (track_id) {
      fetchIntakes(track_id);
    }
  }, [dispatch, user_id, track_id]);

  const fetchIntakes = (trackId) => {
    if (!trackId) {
      setIntakes([]);
      setIntakesLoading(false);
      return;
    }
    setIntakesLoading(true);
    apiClient
      .get('/student/intakes/', { params: { track_id: trackId } })
      .then(response => {
        setIntakes(response.data.intakes || []);
      })
      .catch(error => {
        console.error('Failed to fetch intakes:', error);
        setIntakes([]);
      })
      .finally(() => {
        setIntakesLoading(false);
      });
  };

  const [isExcelUpload, setIsExcelUpload] = useState(false);
  const [studentData, setStudentData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    track_id: track_id || '',
    intake_id: '',
    intake_name: '',
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
    setStudentStatuses([]);
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
    if (details && typeof details === 'object' && details.field === 'email' && details.error === message) {
      // Skip redundant details
    } else if (details) {
      if (typeof details === 'object') {
        if (details.details) {
          fullMessage += '\n\nDetails:\n' + Object.entries(details.details)
            .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
            .join('\n');
        } else if (details.field && details.error && details.error !== message) {
          fullMessage += `\n\n${details.field}: ${details.error}`;
        } else if (details.detail && details.errors) {
          fullMessage += `\n\n${details.detail}\n\nErrors:\n` + details.errors.join('\n');
        } else if (Object.keys(details).length > 0) {
          fullMessage += '\n\nDetails:\n' + JSON.stringify(details, null, 2);
        }
      } else if (typeof details === 'string') {
        fullMessage += '\n\nDetails:\n' + details;
      }
    }
    setModalContent({ title: 'Error', message: fullMessage, isSuccess: false });
    setOpenModal(true);
  };

  const createNewIntake = async (name) => {
    if (!studentData.track_id) {
      showErrorModal('Please select a track before creating an intake');
      return null;
    }
    try {
      const payload = { name, track: studentData.track_id };
      console.log('Creating intake with payload:', payload); // Debug log
      const response = await apiClient.post('/student/intakes/create/', payload);
      setIntakes(prev => [...prev, response.data]);
      return response.data.id;
    } catch (err) {
      console.error('Create intake error:', err.response?.data || err.message);
      showErrorModal('Failed to create intake', err.response?.data);
      return null;
    }
  };

  const handleSubmitManualStudent = async () => {
    const { first_name, last_name, email, track_id, intake_id, intake_name } = studentData;
    if (!first_name || !last_name || !email || !track_id || (!intake_id && !intake_name)) {
      showErrorModal('Please fill all required fields', {
        details: {
          ...(first_name ? {} : { first_name: ['This field is required'] }),
          ...(last_name ? {} : { last_name: ['This field is required'] }),
          ...(email ? {} : { email: ['This field is required'] }),
          ...(track_id ? {} : { track_id: ['This field is required'] }),
          ...(intake_id || intake_name ? {} : { intake: ['This field is required'] })
        }
      });
      return;
    }

    setLoading(true);
    try {
      let finalIntakeId = intake_id;
      if (intake_name && !intake_id) {
        finalIntakeId = await createNewIntake(intake_name);
        if (!finalIntakeId) {
          setLoading(false);
          return;
        }
      }

      const form = new FormData();
      form.append('first_name', first_name);
      form.append('last_name', last_name);
      form.append('email', email);
      form.append('track_id', track_id);
      form.append('intake_id', finalIntakeId);
      form.append('role', studentData.role);

      const response = await apiClient.post('/student/create/', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showSuccessModal('Student added successfully! Verification email sent.');
      setStudentData({ first_name: '', last_name: '', email: '', track_id: track_id || '', intake_id: '', intake_name: '', role: 'student' });
      // Refresh intakes
      fetchIntakes(studentData.track_id);
    } catch (err) {
      console.error('Create student error:', err.response?.data || err.message);
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
    if (!studentData.intake_id && !studentData.intake_name) {
      showErrorModal('Please select or enter an intake');
      return;
    }
    setLoading(true);
    setStudentStatuses([]);
    try {
      let finalIntakeId = studentData.intake_id;
      if (studentData.intake_name && !studentData.intake_id) {
        finalIntakeId = await createNewIntake(studentData.intake_name);
        if (!finalIntakeId) {
          setLoading(false);
          return;
        }
      }

      const form = new FormData();
      form.append('excel_file', excelFile);
      form.append('track_id', studentData.track_id);
      form.append('intake_name', studentData.intake_name || intakes.find(i => i.id === finalIntakeId)?.name || '');
      const resp = await apiClient.post('/student/upload/', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log('Excel upload response:', resp.data);
      const errors = resp.data.errors || [];
      const createdCount = resp.data.created_count || 0;
      const students = resp.data.students || [];

      const statuses = students.map(student => ({
        email: student.email || `Student ${student.id}`,
        status: 'Sending...',
        success: false
      }));
      setStudentStatuses(statuses);

      for (let i = 0; i < statuses.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setStudentStatuses(prev =>
          prev.map((s, index) =>
            index === i ? { ...s, status: 'Email sent', success: true } : s
          )
        );
      }

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

      setStudentData({ first_name: '', last_name: '', email: '', track_id: track_id || '', intake_id: '', intake_name: '', role: 'student' });
      setExcelFile(null);
      fetchIntakes(studentData.track_id);
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
                  onChange={e => {
                    const newTrackId = e.target.value;
                    setStudentData(prev => ({
                      ...prev,
                      track_id: newTrackId,
                      intake_id: '',
                      intake_name: ''
                    }));
                    fetchIntakes(newTrackId);
                  }}
                  disabled={!!track_id || tracksLoading}
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
                  getOptionLabel={option => (typeof option === 'string' ? option : option.name)}
                  value={intakes.find(i => i.id === studentData.intake_id) || studentData.intake_name}
                  onChange={(event, newValue) => {
                    if (typeof newValue === 'object' && newValue) {
                      setStudentData(prev => ({ ...prev, intake_id: newValue.id, intake_name: '' }));
                    } else {
                      setStudentData(prev => ({ ...prev, intake_id: '', intake_name: newValue || '' }));
                    }
                  }}
                  onInputChange={(event, newInputValue) => {
                    setStudentData(prev => ({ ...prev, intake_name: newInputValue, intake_id: '' }));
                  }}
                  renderInput={params => (
                    <StyledTextField
                      {...params}
                      label="Intake *"
                      fullWidth
                      placeholder="Select or enter new intake (e.g., Intake 45)"
                    />
                  )}
                  disabled={intakesLoading || !studentData.track_id}
                />
              </Grid>
            </Grid>

            <StyledButton
              variant="contained"
              fullWidth
              onClick={handleSubmitManualStudent}
              disabled={loading || !studentData.track_id}
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
              onChange={e => {
                const newTrackId = e.target.value;
                setStudentData(prev => ({
                  ...prev,
                  track_id: newTrackId,
                  intake_id: '',
                  intake_name: ''
                }));
                fetchIntakes(newTrackId);
              }}
              disabled={!!track_id || tracksLoading}
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
                  getOptionLabel={option => (typeof option === 'string' ? option : option.name)}
                  value={intakes.find(i => i.id === studentData.intake_id) || studentData.intake_name}
                  onChange={(event, newValue) => {
                    if (typeof newValue === 'object' && newValue) {
                      setStudentData(prev => ({ ...prev, intake_id: newValue.id, intake_name: '' }));
                    } else {
                      setStudentData(prev => ({ ...prev, intake_id: '', intake_name: newValue || '' }));
                    }
                  }}
                  onInputChange={(event, newInputValue) => {
                    setStudentData(prev => ({ ...prev, intake_name: newInputValue, intake_id: '' }));
                  }}
                  renderInput={params => (
                    <StyledTextField
                      {...params}
                      label="Intake *"
                      fullWidth
                      placeholder="Select or enter new intake (e.g., Intake 45)"
                      sx={{ mb: 3 }}
                    />
                  )}
                  disabled={intakesLoading || !studentData.track_id}
                />
  
                <StyledButton
                  variant="contained"
                  fullWidth
                  onClick={handleUploadExcel}
                  disabled={loading || !studentData.track_id}
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