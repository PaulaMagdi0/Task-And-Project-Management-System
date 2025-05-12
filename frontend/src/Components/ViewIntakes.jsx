import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  styled
} from '@mui/material';
import { Close, Error as ErrorIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import apiClient from '../services/api';
import { fetchCourses, fetchIntakeCourses } from '../redux/coursesSlice';

const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: '16px',
  boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.1)',
  maxWidth: '1000px',
  margin: '0 auto',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    '& fieldset': { borderColor: theme.palette.grey[300] },
    '&:hover fieldset': { borderColor: theme.palette.primary.main },
  },
  marginBottom: theme.spacing(2),
  width: '100%',
  maxWidth: '400px',
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.grey[200]}`,
  padding: theme.spacing(1.5),
}));

const DeleteButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.error.main,
  color: '#fff',
  '&:hover': {
    backgroundColor: theme.palette.error.dark,
  },
  borderRadius: '12px',
  padding: theme.spacing(1, 2),
}));

export default function ViewIntakes() {
  const dispatch = useDispatch();
  const { user_id, role, loading: authLoading } = useSelector(s => s.auth);
  const { 
    userCourses, 
    intakeCourses, 
    status: { 
      fetchCoursesLoading: tracksLoading, 
      fetchIntakeCoursesLoading: coursesLoading, 
      fetchIntakeCoursesError: coursesError 
    } 
  } = useSelector(s => s.courses);
  const tracks = userCourses?.tracks || [];

  // State for UI
  const [selectedTrackId, setSelectedTrackId] = useState('');
  const [intakes, setIntakes] = useState([]);
  const [selectedIntakeId, setSelectedIntakeId] = useState('');
  const [students, setStudents] = useState([]);
  const [intakesLoading, setIntakesLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('students'); // 'students' or 'courses'
  const [errorModal, setErrorModal] = useState({ open: false, message: '' });
  const [deleteIntakeModal, setDeleteIntakeModal] = useState({ open: false });

  // Fetch tracks on mount
  useEffect(() => {
    if (user_id) {
      dispatch(fetchCourses(user_id));
    }
  }, [dispatch, user_id]);

  // Pre-select track for supervisors if only one track is available
  useEffect(() => {
    if (!tracksLoading && tracks.length > 0 && role === 'supervisor') {
      if (tracks.length === 1) {
        setSelectedTrackId(tracks[0].id);
      }
    }
  }, [tracks, tracksLoading, role]);

  // Fetch intakes when selectedTrackId changes
  useEffect(() => {
    if (selectedTrackId) {
      fetchIntakes(selectedTrackId);
    } else {
      setIntakes([]);
      setSelectedIntakeId('');
      setStudents([]);
      setIntakesLoading(false);
    }
  }, [selectedTrackId]);

  // Fetch students or courses when selectedIntakeId or viewMode changes
  useEffect(() => {
    if (selectedIntakeId) {
      if (viewMode === 'students') {
        fetchStudents(selectedIntakeId);
      } else {
        dispatch(fetchIntakeCourses(selectedIntakeId));
      }
    } else {
      setStudents([]);
      setStudentsLoading(false);
    }
  }, [selectedIntakeId, viewMode, dispatch]);

  // Handle courses error
  useEffect(() => {
    if (coursesError) {
      setErrorModal({
        open: true,
        message: coursesError || 'Failed to fetch courses. Please try again.',
      });
    }
  }, [coursesError]);

  const fetchIntakes = async (trackId) => {
    if (!trackId) {
      setIntakes([]);
      setIntakesLoading(false);
      return;
    }
    setIntakesLoading(true);
    try {
      const response = await apiClient.get('/student/intakes/', {
        params: { track_id: trackId },
      });
      console.log('Fetched intakes for track_id:', trackId, response.data.intakes);
      setIntakes(response.data.intakes || []);
      setSelectedIntakeId(''); // Reset intake selection
    } catch (error) {
      console.error('Failed to fetch intakes:', error);
      setErrorModal({
        open: true,
        message: error.response?.data?.error || 'Failed to fetch intakes. Please try again.',
      });
      setIntakes([]);
    } finally {
      setIntakesLoading(false);
    }
  };

  const fetchStudents = async (intakeId) => {
    if (!intakeId) {
      setStudents([]);
      setStudentsLoading(false);
      return;
    }
    setStudentsLoading(true);
    try {
      const response = await apiClient.get('/student/list/', {
        params: { intake_id: intakeId },
      });
      console.log('Fetched students for intake_id:', intakeId, response.data.students);
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setErrorModal({
        open: true,
        message: error.response?.data?.error || 'Failed to fetch students. Please try again.',
      });
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleDeleteIntake = async () => {
    setDeleteIntakeModal({ open: false });
    try {
      await apiClient.delete(`/student/intakes/${selectedIntakeId}/`);
      console.log('Deleted intake_id:', selectedIntakeId);
      setIntakes(intakes.filter(i => i.id !== selectedIntakeId));
      setSelectedIntakeId('');
      setStudents([]);
    } catch (error) {
      console.error('Failed to delete intake:', error);
      const message =
        error.response?.status === 404
          ? 'Intake not found.'
          : error.response?.status === 403
          ? 'You do not have permission to delete this intake.'
          : error.response?.data?.error || 'Failed to delete intake. Please try again.';
      setErrorModal({ open: true, message });
    }
  };

  const handleViewModeChange = (event, newViewMode) => {
    if (newViewMode) {
      setViewMode(newViewMode);
    }
  };

  const handleCloseErrorModal = () => {
    setErrorModal({ open: false, message: '' });
  };

  const handleCloseDeleteIntakeModal = () => {
    setDeleteIntakeModal({ open: false });
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  if (authLoading || tracksLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  console.log('Redux state:', { user_id, role, tracks, intakeCourses });

  return (
    <Box sx={{ p: 3, background: '#f5f7fa', minHeight: '100vh' }}>
      <StyledCard>
        <Typography variant="h4" mb={3} fontWeight="bold" color="primary">
          View Intakes
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
          <StyledTextField
            select
            label="Track"
            value={selectedTrackId}
            onChange={(e) => {
              setSelectedTrackId(e.target.value);
              setSelectedIntakeId('');
              setStudents([]);
            }}
            disabled={role === 'supervisor' && tracks.length === 1}
          >
            {tracks.length > 0 ? (
              tracks.map(t => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>No tracks available</MenuItem>
            )}
          </StyledTextField>

          <StyledTextField
            select
            label="Intake"
            value={selectedIntakeId}
            onChange={(e) => setSelectedIntakeId(e.target.value)}
            disabled={intakesLoading || !selectedTrackId || intakes.length === 0}
          >
            {intakesLoading ? (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} /> Loading intakes...
              </MenuItem>
            ) : intakes.length > 0 ? (
              intakes.map(i => (
                <MenuItem key={i.id} value={i.id}>
                  {i.name}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>No intakes available</MenuItem>
            )}
          </StyledTextField>

          {selectedIntakeId && (
            <DeleteButton
              onClick={() => setDeleteIntakeModal({ open: true })}
              disabled={intakesLoading || studentsLoading || coursesLoading}
            >
              Delete Intake
            </DeleteButton>
          )}
        </Box>

        {selectedIntakeId && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="600" color="text.secondary">
                {viewMode === 'students' 
                  ? `Students in ${intakes.find(i => i.id === selectedIntakeId)?.name || 'Selected Intake'}`
                  : `Courses in ${intakes.find(i => i.id === selectedIntakeId)?.name || 'Selected Intake'}`}
              </Typography>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                aria-label="view mode"
                sx={{ borderRadius: '12px' }}
              >
                <ToggleButton 
                  value="students" 
                  sx={{ 
                    borderRadius: '12px 0 0 12px', 
                    '&.Mui-selected': { 
                      backgroundColor: 'primary.main', 
                      color: 'white',
                      '&:hover': { backgroundColor: 'primary.dark' }
                    }
                  }}
                >
                  Students
                </ToggleButton>
                <ToggleButton 
                  value="courses" 
                  sx={{ 
                    borderRadius: '0 12px 12px 0', 
                    '&.Mui-selected': { 
                      backgroundColor: 'primary.main', 
                      color: 'white',
                      '&:hover': { backgroundColor: 'primary.dark' }
                    }
                  }}
                >
                  Courses
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    {viewMode === 'students' ? (
                      <>
                        <StyledTableCell><strong>Name</strong></StyledTableCell>
                        <StyledTableCell><strong>Email</strong></StyledTableCell>
                        <StyledTableCell><strong>Role</strong></StyledTableCell>
                        <StyledTableCell><strong>Date Joined</strong></StyledTableCell>
                      </>
                    ) : (
                      <>
                        <StyledTableCell><strong>Name</strong></StyledTableCell>
                        <StyledTableCell><strong>Description</strong></StyledTableCell>
                        <StyledTableCell><strong>Instructor</strong></StyledTableCell>
                        <StyledTableCell><strong>Created Date</strong></StyledTableCell>
                      </>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {viewMode === 'students' ? (
                    studentsLoading ? (
                      <TableRow>
                        <StyledTableCell colSpan={4} align="center">
                          <CircularProgress size={24} />
                        </StyledTableCell>
                      </TableRow>
                    ) : students.length > 0 ? (
                      students.map(student => (
                        <StyledTableRow key={student.id}>
                          <StyledTableCell>{student.name || `${student.first_name} ${student.last_name}`}</StyledTableCell>
                          <StyledTableCell>{student.email}</StyledTableCell>
                          <StyledTableCell>{student.role}</StyledTableCell>
                          <StyledTableCell>{formatDate(student.date_joined)}</StyledTableCell>
                        </StyledTableRow>
                      ))
                    ) : (
                      <TableRow>
                        <StyledTableCell colSpan={4} align="center">
                          No students found for this intake.
                        </StyledTableCell>
                      </TableRow>
                    )
                  ) : (
                    coursesLoading ? (
                      <TableRow>
                        <StyledTableCell colSpan={4} align="center">
                          <CircularProgress size={24} />
                        </StyledTableCell>
                      </TableRow>
                    ) : intakeCourses[selectedIntakeId]?.length > 0 ? (
                      intakeCourses[selectedIntakeId].map(course => (
                        <StyledTableRow key={course.id}>
                          <StyledTableCell>{course.name}</StyledTableCell>
                          <StyledTableCell>{course.description || 'N/A'}</StyledTableCell>
                          <StyledTableCell>
                            {course.instructor?.name || course.instructor?.username || 'Not assigned'}
                          </StyledTableCell>
                          <StyledTableCell>{formatDate(course.created_at)}</StyledTableCell>
                        </StyledTableRow>
                      ))
                    ) : (
                      <TableRow>
                        <StyledTableCell colSpan={4} align="center">
                          No courses found for this intake.
                        </StyledTableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </StyledCard>

      {/* Error Modal */}
      <Dialog
        open={errorModal.open}
        onClose={handleCloseErrorModal}
        PaperProps={{ sx: { borderRadius: '16px', minWidth: '400px' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <ErrorIcon color="error" sx={{ mr: 1, fontSize: 28 }} />
          Error
          <IconButton
            aria-label="close"
            onClick={handleCloseErrorModal}
            sx={{ position: 'absolute', right: 8, top: 8, color: theme => theme.palette.grey[500] }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {errorModal.message}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseErrorModal} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Intake Confirmation Modal */}
      <Dialog
        open={deleteIntakeModal.open}
        onClose={handleCloseDeleteIntakeModal}
        PaperProps={{ sx: { borderRadius: '16px', minWidth: '400px' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <ErrorIcon color="error" sx={{ mr: 1, fontSize: 28 }} />
          Confirm Intake Deletion
          <IconButton
            aria-label="close"
            onClick={handleCloseDeleteIntakeModal}
            sx={{ position: 'absolute', right: 8, top: 8, color: theme => theme.palette.grey[500] }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete the intake "
            {intakes.find(i => i.id === selectedIntakeId)?.name || 'this intake'}"
            and all its associated students? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteIntakeModal} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteIntake} color="error">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}