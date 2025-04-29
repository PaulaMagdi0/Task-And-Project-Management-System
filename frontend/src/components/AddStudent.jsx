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
  styled
} from '@mui/material';
import { Close, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import CloudUpload from '@mui/icons-material/CloudUpload';
import { useDispatch, useSelector } from 'react-redux';
import apiClient from '../services/api';
import { fetchCourses } from '../redux/coursesSlice'; // ← re-use coursesSlice

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

  // pull in exactly the same "associated tracks" you get in AddCourses:
  const { data: courseContextData, loading: tracksLoading } = useSelector(s => s.courses);
  const tracks = courseContextData?.tracks || [];

  // fetch once on mount
  useEffect(() => {
    dispatch(fetchCourses(user_id));
  }, [dispatch, user_id]);

  const [isExcelUpload, setIsExcelUpload] = useState(false);
  const [studentData, setStudentData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    track_id: '',
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

  const handleStudentInputChange = e => {
    const { name, value } = e.target;
    setStudentData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = e => {
    setExcelFile(e.target.files[0]);
  };

  const handleCloseModal = () => setOpenModal(false);
  const showSuccessModal = message => {
    setModalContent({ title: 'Success!', message, isSuccess: true });
    setOpenModal(true);
  };
  const showErrorModal = message => {
    setModalContent({ title: 'Error', message, isSuccess: false });
    setOpenModal(true);
  };

  const handleSubmitManualStudent = async () => {
    const { first_name, last_name, email, track_id } = studentData;
    if (!first_name || !last_name || !email || !track_id) {
      showErrorModal('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      Object.entries(studentData).forEach(([k, v]) => form.append(k, v));
      await apiClient.post('/student/create/', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showSuccessModal('Student added successfully! Verification email sent.');
      setStudentData({ first_name: '', last_name: '', email: '', track_id: '', role: 'student' });
    } catch (err) {
      showErrorModal(err.response?.data?.error || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadExcel = async () => {
    if (!excelFile) {
      showErrorModal('Please select an Excel file');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('excel_file', excelFile);
      form.append('track_id', studentData.track_id);
      const resp = await apiClient.post('/student/upload/', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (resp.data.errors?.length) {
        showErrorModal(`Completed with ${resp.data.errors.length} errors`);
      } else {
        showSuccessModal(`Created ${resp.data.created_count} students!`);
        setStudentData({ first_name: '', last_name: '', email: '', track_id: '', role: 'student' });
      }
    } catch (err) {
      showErrorModal(err.response?.data?.error || 'Upload failed');
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
                  {tracksLoading
                    ? <MenuItem disabled>Loading…</MenuItem>
                    : tracks.map(t => (
                        <MenuItem key={t.id} value={t.id}>
                          {t.name}
                        </MenuItem>
                      ))}
                </StyledTextField>
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
              {tracksLoading
                ? <MenuItem disabled>Loading…</MenuItem>
                : tracks.map(t => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.name}
                    </MenuItem>
                  ))}
            </StyledTextField>

            <StyledButton
              variant="contained"
              fullWidth
              onClick={handleUploadExcel}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {loading ? 'Uploading...' : 'Upload Students'}
            </StyledButton>
          </Box>
        )}
      </StyledCard>

      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        PaperProps={{ sx: { borderRadius: '16px', minWidth: '400px' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          {modalContent.isSuccess
            ? <CheckCircle color="success" sx={{ mr: 1, fontSize: 28 }} />
            : <ErrorIcon color="error" sx={{ mr: 1, fontSize: 28 }} />}
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
          <Typography variant="body2" color="text.secondary">
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
