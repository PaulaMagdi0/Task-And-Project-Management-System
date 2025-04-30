import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateStudent,
  deleteStudent,
  clearStudentsState,
} from '../../redux/studentsSlice';
import { fetchStudentsByStaff } from '../../redux/staffSlice';
import { fetchCourses } from '../../redux/coursesSlice';
import apiClient from '../../services/api';

const ManageStudents = () => {
  const dispatch = useDispatch();
  const { studentsByStaff: students, studentsLoading: loading, studentsError: error, message } = useSelector((state) => state.staff);
  const { user_id } = useSelector((state) => state.auth);
  const { userCourses, status } = useSelector((state) => state.courses);
  const tracks = userCourses?.tracks || [];
  const tracksLoading = status.fetchCoursesLoading;
  const tracksError = status.fetchCoursesError;

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    studentId: null,
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    track: '',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [localError, setLocalError] = useState('');
  const [selectedTrackId, setSelectedTrackId] = useState('');
  const [selectedIntakeId, setSelectedIntakeId] = useState('');
  const [searchName, setSearchName] = useState('');
  const [intakes, setIntakes] = useState([]);
  const [intakesLoading, setIntakesLoading] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Fetch tracks and students on mount
  useEffect(() => {
    if (user_id) {
      dispatch(fetchCourses(user_id));
      dispatch(fetchStudentsByStaff(user_id));
    }
  }, [dispatch, user_id]);

  // Fetch intakes when selectedTrackId changes
  useEffect(() => {
    if (selectedTrackId) {
      fetchIntakes(selectedTrackId);
    } else {
      setIntakes([]);
      setSelectedIntakeId('');
      setIntakesLoading(false);
    }
  }, [selectedTrackId]);

  // Fetch students when selectedIntakeId changes
  useEffect(() => {
    if (selectedIntakeId) {
      fetchStudentsByIntake(selectedIntakeId);
    } else {
      setFilteredStudents(students || []);
      setStudentsLoading(false);
    }
  }, [selectedIntakeId, students]);

  // Handle error state
  useEffect(() => {
    if (error || tracksError) {
      setLocalError(error || tracksError);
    } else {
      setLocalError('');
    }
  }, [error, tracksError]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => dispatch(clearStudentsState()), 3000);
      return () => clearTimeout(timer);
    }
  }, [message, dispatch]);

  // Debug student data, tracks, and intakes
  useEffect(() => {
    if (filteredStudents.length > 0) {
      console.log('Student objects (first 3):', filteredStudents.slice(0, 3).map(s => ({
        id: s.id,
        track: s.track,
        track_id: s.track_id,
        trackId: s.trackId,
        intake: s.intake,
        intake_id: s.intake_id,
        intakeId: s.intakeId,
        fullObject: s,
      })));
      console.log('Parsed track names:', filteredStudents.slice(0, 3).map(s => ({
        id: s.id,
        rawTrackName: s.track?.name || s.track_id,
        parsedTrackName: getTrackName(s),
      })));
      console.log('Parsed intake names:', filteredStudents.slice(0, 3).map(s => ({
        id: s.id,
        rawIntakeName: s.intake?.name || s.intake_id,
        parsedIntakeName: getIntakeName(s),
      })));
    }
    console.log('Tracks:', tracks.map(t => ({ id: t.id, name: t.name })));
    console.log('Intakes:', intakes.map(i => ({ id: i.id, name: i.name })));
  }, [filteredStudents, tracks, intakes]);

  const fetchIntakes = async (trackId) => {
    setIntakesLoading(true);
    try {
      const response = await apiClient.get('/student/intakes/', {
        params: { track_id: trackId },
      });
      console.log('Intakes API response:', response.data.intakes);
      setIntakes(response.data.intakes || []);
      setSelectedIntakeId(''); // Reset intake selection
    } catch (err) {
      setLocalError(err.response?.data?.error || 'Failed to fetch intakes.');
      setIntakes([]);
    } finally {
      setIntakesLoading(false);
    }
  };

  const fetchStudentsByIntake = async (intakeId) => {
    setStudentsLoading(true);
    try {
      const response = await apiClient.get('/student/list/', {
        params: { intake_id: intakeId },
      });
      console.log('Students API response for intake_id', intakeId, ':', response.data.students);
      setFilteredStudents(response.data.students || []);
    } catch (err) {
      setLocalError(err.response?.data?.error || 'Failed to fetch students.');
      setFilteredStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const openEditDialog = (student) => {
    setEditData({
      studentId: student.id,
      username: student.username,
      firstName: student.first_name,
      lastName: student.last_name,
      email: student.email,
      password: '',
      track: getTrackName(student),
    });
    setEditDialogOpen(true);
  };

  const handleEditChange = async () => {
    const { studentId, username, firstName, lastName, email, password, track } = editData;
    if (!username && !firstName && !lastName && !email && !track && !password) {
      setLocalError('At least one field must be changed.');
      return;
    }
    if (password && password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }
    try {
      const updatedData = {};
      if (username) updatedData.username = username;
      if (firstName) updatedData.firstName = firstName;
      if (lastName) updatedData.lastName = lastName;
      if (email) updatedData.email = email;
      if (password) updatedData.password = password;
      if (track) {
        const selectedTrack = tracks.find((t) => t.name.includes(track));
        updatedData.track_id = selectedTrack ? selectedTrack.id : null;
      }
      await dispatch(updateStudent({ studentId, ...updatedData })).unwrap();
      setEditDialogOpen(false);
      if (selectedIntakeId) {
        fetchStudentsByIntake(selectedIntakeId);
      } else {
        dispatch(fetchStudentsByStaff(user_id));
      }
    } catch (err) {
      setLocalError(err.message || 'Failed to update student.');
    }
  };

  const openDeleteDialog = (id) => {
    setStudentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!studentToDelete) {
      setLocalError('No student selected for deletion.');
      return;
    }
    try {
      await dispatch(deleteStudent(studentToDelete)).unwrap();
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
      if (selectedIntakeId) {
        fetchStudentsByIntake(selectedIntakeId);
      } else {
        dispatch(fetchStudentsByStaff(user_id));
      }
    } catch (err) {
      setLocalError(err.message || 'Failed to delete student.');
    }
  };

  const handleTrackFilterChange = (event) => {
    setSelectedTrackId(event.target.value);
    setSelectedIntakeId(''); // Reset intake when track changes
  };

  const handleIntakeFilterChange = (event) => {
    setSelectedIntakeId(event.target.value);
  };

  const handleNameSearchChange = (event) => {
    setSearchName(event.target.value);
  };

  const handleResetFilters = () => {
    setSelectedTrackId('');
    setSelectedIntakeId('');
    setSearchName('');
  };

  // Filter students by name
  const displayedStudents = useMemo(() => {
    if (!filteredStudents) return [];
    return filteredStudents.filter((student) =>
      searchName
        ? `${student.first_name} ${student.last_name}`
            .toLowerCase()
            .includes(searchName.toLowerCase())
        : true
    );
  }, [filteredStudents, searchName]);

  // Helper functions to get track and intake names
  const getTrackName = (student) => {
    let trackName = '';
    if (student.track?.name) {
      trackName = student.track.name;
    } else if (student.track_id) {
      const track = tracks.find((t) => t.id === student.track_id);
      trackName = track?.name || '';
    } else if (typeof student.track === 'string') {
      trackName = student.track;
    }
    // Extract core track name (e.g., "Full Stack Python" from "Full Stack Python (mena nagy) - Branch: New Capital")
    if (trackName) {
      // Split on first parenthesis or remove branch details
      const coreName = trackName.split(' (')[0].trim();
      return coreName || 'N/A';
    }
    return 'N/A';
  };

  const getIntakeName = (student) => {
    let intakeName = '';
    if (student.intake?.name) {
      intakeName = student.intake.name;
    } else if (student.intake_id) {
      const intake = intakes.find((i) => i.id === student.intake_id);
      intakeName = intake?.name || String(student.intake_id);
    } else if (typeof student.intake === 'string') {
      intakeName = student.intake;
    } else if (selectedIntakeId) {
      const intake = intakes.find((i) => i.id === selectedIntakeId);
      intakeName = intake?.name || String(selectedIntakeId);
    }
    // Extract core intake name (e.g., "2" from "2 (Track: Full Stack Python)")
    if (intakeName) {
      const coreName = intakeName.split(' (')[0].trim();
      return coreName || 'N/A';
    }
    return 'N/A';
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f4f6f8' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#1e3a8a', textAlign: 'center' }}>
        Manage Students
      </Typography>

      {/* Filters and Search */}
      <Grid container spacing={3} sx={{ mb: 3, maxWidth: '1200px', mx: 'auto' }}>
        <Grid item xs={12} sm={4}>
          <FormControl variant="outlined" fullWidth>
            <InputLabel>Track</InputLabel>
            <Select
              value={selectedTrackId}
              onChange={handleTrackFilterChange}
              label="Track"
              sx={{ borderRadius: 2 }}
              disabled={tracksLoading}
            >
              <MenuItem value=""><em>All Tracks</em></MenuItem>
              {tracks.map((track) => (
                <MenuItem key={track.id} value={track.id}>{track.name.split(' (')[0].trim()}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl variant="outlined" fullWidth>
            <InputLabel>Intake</InputLabel>
            <Select
              value={selectedIntakeId}
              onChange={handleIntakeFilterChange}
              label="Intake"
              sx={{ borderRadius: 2 }}
              disabled={intakesLoading || !selectedTrackId || intakes.length === 0}
            >
              <MenuItem value=""><em>All Intakes</em></MenuItem>
              {intakesLoading ? (
                <MenuItem disabled>
                  <CircularProgress size={20} sx={{ mr: 1 }} /> Loading intakes...
                </MenuItem>
              ) : (
                intakes.map((intake) => (
                  <MenuItem key={intake.id} value={intake.id}>{intake.name.split(' (')[0].trim()}</MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Search by Name"
            fullWidth
            value={searchName}
            onChange={handleNameSearchChange}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleResetFilters}
            sx={{
              height: '56px',
              bgcolor: '#3b82f6',
              '&:hover': { bgcolor: '#2563eb' },
              borderRadius: 2,
            }}
          >
            Reset Filters
          </Button>
        </Grid>
      </Grid>

      {/* Error Alert */}
      {localError && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: '1200px', mx: 'auto' }}>
          {localError}
        </Alert>
      )}
      {/* Success Message Alert */}
      {message && (
        <Alert severity="success" sx={{ mb: 2, maxWidth: '1200px', mx: 'auto' }}>
          {message}
        </Alert>
      )}

      <Paper sx={{ p: 2, maxWidth: '1200px', mx: 'auto', borderRadius: 2, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}>
        <Typography variant="h6" gutterBottom>
          Student List
        </Typography>

        {loading || tracksLoading || studentsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        ) : displayedStudents.length > 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }}>Username</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }}>First Name</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }}>Last Name</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }}>Track</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }}>Intake</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedStudents.map((student) => (
                <TableRow key={student.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                  <TableCell>{student.id}</TableCell>
                  <TableCell>{student.username}</TableCell>
                  <TableCell>{student.first_name}</TableCell>
                  <TableCell>{student.last_name}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{getTrackName(student)}</TableCell>
                  <TableCell>{getIntakeName(student)}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => openEditDialog(student)}>
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      sx={{ ml: 1 }}
                      onClick={() => openDeleteDialog(student.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography>No students found</Typography>
        )}
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Student</DialogTitle>
        <DialogContent>
          <TextField
            label="First Name"
            variant="outlined"
            fullWidth
            value={editData.firstName}
            onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Last Name"
            variant="outlined"
            fullWidth
            value={editData.lastName}
            onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            value={editData.email}
            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Password"
            variant="outlined"
            fullWidth
            type="password"
            value={editData.password}
            onChange={(e) => setEditData({ ...editData, password: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl variant="outlined" fullWidth sx={{ mb: 2 }}>
            <InputLabel>Track</InputLabel>
            <Select
              value={editData.track}
              onChange={(e) => setEditData({ ...editData, track: e.target.value })}
              label="Track"
            >
              {tracks.map((track) => (
                <MenuItem key={track.id} value={track.name.split(' (')[0].trim()}>{track.name.split(' (')[0].trim()}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleEditChange} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Student</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this student?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="secondary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageStudents;