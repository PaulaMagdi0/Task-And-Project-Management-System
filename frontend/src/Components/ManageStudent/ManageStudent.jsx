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
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateStudent,
  deleteStudent,
  clearStudentsState,
} from '../../redux/studentsSlice';
import { fetchStudentsByStaff } from '../../redux/staffSlice';

const ManageStudents = () => {
  const dispatch = useDispatch();
  const { studentsByStaff: students, studentsLoading: loading, studentsError: error, message } = useSelector((state) => state.staff);
  const { user_id } = useSelector((state) => state.auth);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    studentId: null,
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    track: '',
    branch: ''
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [localError, setLocalError] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedIntake, setSelectedIntake] = useState('');
  const [searchName, setSearchName] = useState('');

  // Fetch students by staff on mount
  useEffect(() => {
    if (user_id) {
      dispatch(fetchStudentsByStaff(user_id));
    }
  }, [dispatch, user_id]);

  // Handle error state
  useEffect(() => {
    if (error) setLocalError(error);
    else setLocalError('');
  }, [error]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => dispatch(clearStudentsState()), 3000);
      return () => clearTimeout(timer);
    }
  }, [message, dispatch]);

  const openEditDialog = (student) => {
    setEditData({
      studentId: student.id,
      username: student.username,
      firstName: student.first_name,
      lastName: student.last_name,
      email: student.email,
      password: '',
      track: student.track?.name || '',
      branch: student.branch?.name || '',
    });
    setEditDialogOpen(true);
  };

  const handleEditChange = async () => {
    const { studentId, username, firstName, lastName, email, password, track, branch } = editData;
  
    // Validate only the fields that have been changed
    if (!username && !firstName && !lastName && !email && !track && !branch && !password) {
      setLocalError('At least one field must be changed.');
      return;
    }
  
    if (password && password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }
  
    try {
      const updatedData = {};
  
      // Only include fields that were changed
      if (username) updatedData.username = username;
      if (firstName) updatedData.firstName = firstName;
      if (lastName) updatedData.lastName = lastName;
      if (email) updatedData.email = email;
      if (password) updatedData.password = password;
      if (track) updatedData.track = track;
      if (branch) updatedData.branch = branch;
  
      await dispatch(updateStudent({ studentId, ...updatedData })).unwrap();
  
      setEditDialogOpen(false);
      dispatch(fetchStudentsByStaff(user_id));
    } catch (err) {
      setLocalError(err || 'Failed to update student.');
    }
  };
  
  const openDeleteDialog = (id) => {
    setStudentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteStudent(studentToDelete)).unwrap();
      setDeleteDialogOpen(false);
      dispatch(fetchStudentsByStaff(user_id));
    } catch (err) {
      setLocalError(err || 'Failed to delete student.');
    }
  };

  const handleTrackFilterChange = (event) => {
    setSelectedTrack(event.target.value);
  };

  const handleBranchFilterChange = (event) => {
    setSelectedBranch(event.target.value);
  };

  const handleIntakeFilterChange = (event) => {
    setSelectedIntake(event.target.value);
  };

  const handleNameSearchChange = (event) => {
    setSearchName(event.target.value);
  };

  const handleResetFilters = () => {
    setSelectedTrack('');
    setSelectedBranch('');
    setSelectedIntake('');
    setSearchName('');
  };

  // Compute unique tracks, branches, and intakes
  const trackNames = useMemo(
    () => [...new Set(students?.map((student) => student.track?.name).filter(Boolean))].sort(),
    [students]
  );
  const branchNames = useMemo(
    () => [...new Set(students?.map((student) => student.branch?.name).filter(Boolean))].sort(),
    [students]
  );
  const intakeNames = useMemo(
    () => [...new Set(students?.map((student) => student.intake?.name).filter(Boolean))].sort(),
    [students]
  );

  // Filter students
  const filteredStudents = useMemo(() => {
    if (!students) return [];
    return students.filter((student) => {
      const matchesTrack = selectedTrack ? student.track?.name === selectedTrack : true;
      const matchesBranch = selectedBranch ? student.branch?.name === selectedBranch : true;
      const matchesIntake = selectedIntake ? student.intake?.name === selectedIntake : true;
      const matchesName = searchName
        ? `${student.first_name} ${student.last_name}`
            .toLowerCase()
            .includes(searchName.toLowerCase())
        : true;
      return matchesTrack && matchesBranch && matchesIntake && matchesName;
    });
  }, [students, selectedTrack, selectedBranch, selectedIntake, searchName]);

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
              value={selectedTrack}
              onChange={handleTrackFilterChange}
              label="Track"
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value=""><em>All Tracks</em></MenuItem>
              {trackNames.map((name) => (
                <MenuItem key={name} value={name}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl variant="outlined" fullWidth>
            <InputLabel>Intake</InputLabel>
            <Select
              value={selectedIntake}
              onChange={handleIntakeFilterChange}
              label="Intake"
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value=""><em>All Intakes</em></MenuItem>
              {intakeNames.map((name) => (
                <MenuItem key={name} value={name}>{name}</MenuItem>
              ))}
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
        <Grid item xs={12} sm={4}>
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

        {loading ? (
          <Typography>Loading...</Typography>
        ) : filteredStudents.length > 0 ? (
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
              {filteredStudents.map((student) => (
                <TableRow key={student.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                  <TableCell>{student.id}</TableCell>
                  <TableCell>{student.username}</TableCell>
                  <TableCell>{student.first_name}</TableCell>
                  <TableCell>{student.last_name}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.track?.name}</TableCell>
                  <TableCell>{student.intake?.name}</TableCell>
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
              {trackNames.map((name) => (
                <MenuItem key={name} value={name}>{name}</MenuItem>
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