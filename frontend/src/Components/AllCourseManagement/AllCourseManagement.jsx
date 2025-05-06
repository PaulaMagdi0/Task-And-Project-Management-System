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
  fetchAllCourses,
  updateCourse,
  deleteCourse,
  clearCourseStatus,
  fetchIntakes,
  fetchIntakeCourses,
} from '../../redux/coursesSlice';
import { fetchInstructors } from '../../redux/supervisorsSlice';

const AllCourseManagement = () => {
  const dispatch = useDispatch();
  const {
    allCourses,
    intakes,
    intakeCourses,
    status: {
      fetchAllCoursesLoading: loading,
      fetchAllCoursesError: error,
      fetchIntakesLoading,
      fetchIntakesError,
      fetchIntakeCoursesLoading,
      fetchIntakeCoursesError,
      updateCourseLoading,
      updateCourseError,
      deleteCourseLoading,
      deleteCourseError,
      success: message,
    },
  } = useSelector((state) => state.courses);
  const { instructors } = useSelector((state) => state.supervisors);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    courseId: null,
    name: '',
    description: '',
    instructor: '',
    intake: '',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [localError, setLocalError] = useState('');
  const [searchName, setSearchName] = useState('');
  const [selectedIntake, setSelectedIntake] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [intakeWarning, setIntakeWarning] = useState(false);

  // Fetch courses, instructors, and intakes on mount
  useEffect(() => {
    dispatch(fetchAllCourses());
    dispatch(fetchInstructors());
    dispatch(fetchIntakes());
  }, [dispatch]);

  // Fetch courses for each intake
  useEffect(() => {
    if (intakes?.length > 0) {
      intakes.forEach((intake) => {
        dispatch(fetchIntakeCourses(intake.id));
      });
    }
  }, [intakes, dispatch]);

  // Debug course and intake data
  useEffect(() => {
    console.log('AllCourses data:', allCourses);
    console.log('Intakes data:', intakes);
    console.log('IntakeCourses data:', intakeCourses);
    allCourses?.forEach((course) => {
      console.log(`Course ${course.name} (ID: ${course.id}) - Intake:`, course.intake);
    });
    // Check if any course has intake data or is mapped
    const hasIntakeData =
      allCourses?.some((course) => course.intake) ||
      Object.values(intakeCourses).some((courses) => courses.length > 0);
    setIntakeWarning(!hasIntakeData && allCourses?.length > 0 && intakes?.length > 0);
  }, [allCourses, intakes, intakeCourses]);

  // Handle error state
  useEffect(() => {
    if (error || fetchIntakesError || fetchIntakeCoursesError || updateCourseError || deleteCourseError) {
      setLocalError(
        error ||
        fetchIntakesError ||
        fetchIntakeCoursesError ||
        updateCourseError ||
        deleteCourseError
      );
    } else {
      setLocalError('');
    }
  }, [error, fetchIntakesError, fetchIntakeCoursesError, updateCourseError, deleteCourseError]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => dispatch(clearCourseStatus()), 3000);
      return () => clearTimeout(timer);
    }
  }, [message, dispatch]);

  // Map course IDs to intake names
  const getIntakeName = (courseId) => {
    for (const intakeId in intakeCourses) {
      const courses = intakeCourses[intakeId];
      const course = courses.find((c) => c.id === courseId);
      if (course) {
        const intake = intakes.find((i) => i.id === parseInt(intakeId));
        return intake?.name || 'Not assigned';
      }
    }
    return 'Not assigned';
  };

  const openEditDialog = (course) => {
    setEditData({
      courseId: course.id,
      name: course.name,
      description: course.description || '',
      instructor: course.instructor?.id || '',
      intake: course.intake?.id || '',
    });
    setEditDialogOpen(true);
  };

  const handleEditChange = async () => {
    const { courseId, name, description, instructor, intake } = editData;

    if (!name) {
      setLocalError('Course name is required.');
      return;
    }

    try {
      const updatedData = {
        name,
        description: description || null,
        instructor: instructor || null,
        intake: intake || null,
      };
      await dispatch(updateCourse({ courseId, ...updatedData })).unwrap();
      setEditDialogOpen(false);
      dispatch(fetchAllCourses());
    } catch (err) {
      setLocalError(err || 'Failed to update course.');
    }
  };

  const openDeleteDialog = (id) => {
    setCourseToDelete(id);
    setConfirmText('');
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await dispatch(deleteCourse(courseToDelete)).unwrap();
      setDeleteDialogOpen(false);
      dispatch(fetchAllCourses());
    } catch (err) {
      setLocalError(err || 'Failed to delete course.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNameSearchChange = (event) => {
    setSearchName(event.target.value);
  };

  const handleIntakeFilterChange = (event) => {
    setSelectedIntake(event.target.value);
  };

  const handleResetFilters = () => {
    setSearchName('');
    setSelectedIntake('');
  };

  // Filter courses
  const filteredCourses = useMemo(() => {
    if (!allCourses) return [];
    return allCourses.filter((course) => {
      const matchesName = searchName
        ? course.name.toLowerCase().includes(searchName.toLowerCase())
        : true;
      const matchesIntake = selectedIntake
        ? (course.intake?.name || getIntakeName(course.id)) === selectedIntake
        : true;
      return matchesName && matchesIntake;
    });
  }, [allCourses, searchName, selectedIntake, intakeCourses, intakes]);

  // Intake names for filter
  const intakeNames = useMemo(
    () => [...new Set(intakes?.map((intake) => intake.name) || [])].sort(),
    [intakes]
  );

  // Get course details for delete confirmation
  const course = allCourses.find((c) => c.id === courseToDelete);
  const isConfirmValid = confirmText.trim().toLowerCase() === 'i agree';

  // Combined loading state
  const isLoading = loading || fetchIntakesLoading || fetchIntakeCoursesLoading;

  return (
    <Box sx={{ p: 4, bgcolor: '#f4f6f8' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#1e3a8a', textAlign: 'center' }}>
        Manage Courses
      </Typography>

      {/* Intake Warning */}
      {intakeWarning && (
        <Alert severity="warning" sx={{ mb: 2, maxWidth: '1200px', mx: 'auto' }}>
          No intake data found for courses. Ensure courses are assigned to intakes in the backend.
        </Alert>
      )}

      {/* Filters and Search */}
      <Grid container spacing={3} sx={{ mb: 3, maxWidth: '1200px', mx: 'auto' }}>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Search by Course Name"
            fullWidth
            value={searchName}
            onChange={handleNameSearchChange}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          />
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
          Course List
        </Typography>

        {isLoading ? (
          <Typography>Loading...</Typography>
        ) : filteredCourses.length > 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }}>Instructor</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }}>Intake</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCourses.map((course) => (
                <TableRow key={course.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                  <TableCell>{course.id}</TableCell>
                  <TableCell>{course.name}</TableCell>
                  <TableCell>{course.instructor?.full_name || course.instructor_name || 'Not assigned'}</TableCell>
                  <TableCell>{course.intake?.name || getIntakeName(course.id)}</TableCell>
                  <TableCell>{course.description || '-'}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => openEditDialog(course)}>
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      sx={{ ml: 1 }}
                      onClick={() => openDeleteDialog(course.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography>No courses found</Typography>
        )}
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Course</DialogTitle>
        <DialogContent>
          <TextField
            label="Course Name"
            variant="outlined"
            fullWidth
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            label="Description"
            variant="outlined"
            fullWidth
            multiline
            rows={4}
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl variant="outlined" fullWidth sx={{ mb: 2 }}>
            <InputLabel>Instructor</InputLabel>
            <Select
              value={editData.instructor}
              onChange={(e) => setEditData({ ...editData, instructor: e.target.value })}
              label="Instructor"
            >
              <MenuItem value=""><em>Not assigned</em></MenuItem>
              {instructors.map((instructor) => (
                <MenuItem key={instructor.id} value={instructor.id}>
                  {instructor.full_name || instructor.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl variant="outlined" fullWidth sx={{ mb: 2 }}>
            <InputLabel>Intake</InputLabel>
            <Select
              value={editData.intake}
              onChange={(e) => setEditData({ ...editData, intake: e.target.value })}
              label="Intake"
            >
              <MenuItem value=""><em>Not assigned</em></MenuItem>
              {intakes.map((intake) => (
                <MenuItem key={intake.id} value={intake.id}>
                  {intake.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleEditChange} color="primary" disabled={updateCourseLoading}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#d32f2f', color: 'white', py: 2 }}>
          Confirm Course Deletion
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" color="error" sx={{ mb: 2, fontWeight: 500 }}>
            Warning: You are about to permanently delete the course <strong>{course?.name || 'Unknown'}</strong>{' '}
            associated with your track from the database as well <strong>Assignments , Submissions</strong> attached to it.
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            This action cannot be undone. To confirm, please type <strong>"I agree"</strong> below.
          </Typography>
          <TextField
            label="Type 'I agree' to confirm"
            variant="outlined"
            fullWidth
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            sx={{ mb: 2 }}
            helperText={!isConfirmValid && confirmText ? 'Text must exactly match "I agree"' : ''}
            error={!isConfirmValid && confirmText}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            color="primary"
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={!isConfirmValid || isDeleting}
            sx={{ minWidth: 100 }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AllCourseManagement;