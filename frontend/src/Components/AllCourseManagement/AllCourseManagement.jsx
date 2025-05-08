import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
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
  Skeleton,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  fetchCourses,
  updateCourse,
  deleteCourse,
  clearCourseStatus,
  fetchIntakes,
  fetchIntakeCourses,
  fetchAvailableIntakes,
} from '../../redux/coursesSlice';
import { fetchInstructors, fetchInstructorsTrackData } from '../../redux/supervisorsSlice';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
  margin: theme.spacing(3),
  backgroundColor: '#ffffff',
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  backgroundColor: theme.palette.grey[100],
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StyledTableRow = styled(TableRow)(() => ({
  '&:nth-of-type(odd)': {
    backgroundColor: '#f8fafc',
  },
  '&:hover': {
    backgroundColor: '#f1f5f9',
    transition: 'background-color 0.2s ease-in-out',
  },
}));

// Helper function for sorting
const sortRows = (rows, sortBy, sortOrder) => {
  return [...rows].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    if (sortBy === 'instructor') {
      aValue = a.instructor?.name || 'Not assigned';
      bValue = b.instructor?.name || 'Not assigned';
    }
    if (sortBy === 'intake') {
      aValue = a.intakeName || 'Not assigned';
      bValue = b.intakeName || 'Not assigned';
    }
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
};

const AllCourseManagement = () => {
  const dispatch = useDispatch();
  const user_id = useSelector((state) => state.auth.user_id);
  const {
    userCourses: { tracks, track_courses: courses },
    intakes,
    intakeCourses,
    availableIntakes,
    status: {
      fetchCoursesLoading,
      fetchCoursesError,
      fetchIntakesLoading,
      fetchIntakesError,
      fetchIntakeCoursesLoading,
      fetchIntakeCoursesError,
      fetchAvailableIntakesLoading,
      fetchAvailableIntakesError,
      updateCourseLoading,
      updateCourseError,
      deleteCourseLoading,
      deleteCourseError,
      success,
    },
  } = useSelector((state) => state.courses);
  const {
    instructors,
    instructorsTrackData,
    loading: instructorsLoading,
    error: instructorsError,
  } = useSelector((state) => state.supervisors);

  // State management
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    courseId: null,
    name: '',
    description: '',
    instructor: '',
    intake: '',
    trackId: null,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [localError, setLocalError] = useState('');
  const [searchName, setSearchName] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('');
  const [selectedIntake, setSelectedIntake] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [intakeWarning, setIntakeWarning] = useState(false);
  const [instructorWarning, setInstructorWarning] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isDeleteConfirmed, setIsDeleteConfirmed] = useState(false);

  // Fetch data
  useEffect(() => {
    if (user_id) {
      dispatch(fetchCourses(user_id));
    }
    dispatch(fetchInstructors()).then(() => dispatch(fetchInstructorsTrackData()));
    dispatch(fetchIntakes());
  }, [dispatch, user_id]);

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
    console.log('Courses data:', courses);
    console.log('Tracks data:', tracks);
    console.log('Intakes data:', intakes);
    console.log('IntakeCourses data:', intakeCourses);
    console.log('AvailableIntakes data:', availableIntakes);
    console.log('Instructors data:', instructors);
    console.log('InstructorsTrackData:', instructorsTrackData);
    courses?.forEach((course) => {
      console.log(`Course ${course.name} (ID: ${course.id}) - Intake:`, course.intake, 'Tracks:', course.tracks, 'Instructor:', course.instructor);
    });
    const hasIntakeData = courses?.some((course) =>
      course.intake || Object.values(intakeCourses).some((ic) => ic.some((c) => c.id === course.id))
    );
    setIntakeWarning(!hasIntakeData && courses?.length > 0 && intakes?.length > 0);
  }, [courses, tracks, intakes, intakeCourses, availableIntakes, instructors, instructorsTrackData]);

  // Handle error and success states
  useEffect(() => {
    if (
      fetchCoursesError ||
      fetchIntakesError ||
      fetchIntakeCoursesError ||
      fetchAvailableIntakesError ||
      updateCourseError ||
      deleteCourseError ||
      instructorsError
    ) {
      setLocalError(
        fetchCoursesError ||
        fetchIntakesError ||
        fetchIntakeCoursesError ||
        fetchAvailableIntakesError ||
        updateCourseError ||
        deleteCourseError ||
        instructorsError
      );
    } else {
      setLocalError('');
    }
  }, [
    fetchCoursesError,
    fetchIntakesError,
    fetchIntakeCoursesError,
    fetchAvailableIntakesError,
    updateCourseError,
    deleteCourseError,
    instructorsError,
  ]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => dispatch(clearCourseStatus()), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

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

  // Filter instructors by track
  const getTrackInstructors = (trackId) => {
    if (!trackId || !courses.length || !instructors.length) {
      console.log('No trackId, courses, or instructors, returning empty array', {
        trackId,
        coursesLength: courses.length,
        instructorsLength: instructors.length,
      });
      return [];
    }

    // Get all courses in the track
    const trackCourses = courses.filter((course) =>
      course.tracks?.some((track) => track.id === trackId)
    );
    console.log(`Courses for trackId ${trackId}:`, trackCourses);

    // Collect unique instructor IDs from track courses
    const instructorIds = [
      ...new Set(
        trackCourses
          .filter((course) => course.instructor?.id)
          .map((course) => {
            console.log(`Course ${course.name} (ID: ${course.id}) has instructor:`, course.instructor);
            return course.instructor.id;
          })
      ),
    ];
    console.log(`Unique instructor IDs for trackId ${trackId}:`, instructorIds);

    // Get instructor objects
    const trackInstructors = instructors.filter((instructor) =>
      instructorIds.includes(instructor.id)
    );
    console.log(`Track instructors for trackId ${trackId}:`, trackInstructors);

    return trackInstructors;
  };

  // Handlers
  const openEditDialog = (course, trackId) => {
    console.log('Opening edit dialog for course:', course, 'with trackId:', trackId);
    const trackCourses = courses.filter((c) => c.tracks?.some((t) => t.id === trackId));
    console.log(`Courses for trackId ${trackId}:`, trackCourses);
    setEditData({
      courseId: course.id,
      name: course.name,
      description: course.description || '',
      instructor: course.instructor?.id || '',
      intake: course.intake?.id || '',
      trackId,
    });
    // Determine instructor warning
    const trackInstructors = getTrackInstructors(trackId);
    console.log('Track instructors in openEditDialog for trackId', trackId, ':', trackInstructors);
    setInstructorWarning(
      trackInstructors.length === 0
        ? 'No instructors assigned to courses in this track.'
        : ''
    );
    setEditDialogOpen(true);
    // Fetch track-specific intakes
    if (trackId) {
      dispatch(fetchAvailableIntakes([trackId]));
    }
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
      dispatch(fetchCourses(user_id));
    } catch (err) {
      setLocalError(err || 'Failed to update course.');
    }
  };

  const openDeleteDialog = (courseId) => {
    setCourseToDelete({ courseId });
    setConfirmText('');
    setIsDeleteConfirmed(false);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!isDeleteConfirmed) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteCourse(courseToDelete.courseId)).unwrap();
      setDeleteDialogOpen(false);
      dispatch(fetchCourses(user_id));
    } catch (err) {
      setLocalError(err || 'Failed to delete course.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNameSearchChange = (event) => {
    setSearchName(event.target.value);
  };

  const handleTrackFilterChange = (event) => {
    setSelectedTrack(event.target.value);
  };

  const handleIntakeFilterChange = (event) => {
    setSelectedIntake(event.target.value);
  };

  const handleResetFilters = () => {
    setSearchName('');
    setSelectedTrack('');
    setSelectedIntake('');
  };

  const handleSort = (columnId) => {
    const isAsc = sortBy === columnId && sortOrder === 'asc';
    setSortBy(columnId);
    setSortOrder(isAsc ? 'desc' : 'asc');
  };

  // Filter and prepare rows
  const trackNames = useMemo(
    () => [...new Set(tracks?.map((track) => track.name) || [])].sort(),
    [tracks]
  );
  const intakeNames = useMemo(
    () => [...new Set(intakes?.map((intake) => intake.name) || [])].sort(),
    [intakes]
  );

  const filteredRows = useMemo(() => {
    const uniqueRows = new Map();
    tracks?.forEach((track) => {
      console.log('Processing track for filteredRows:', track);
      const filteredCourses = courses
        ?.filter((course) => {
          const hasTrack = course?.tracks?.some((t) => t.id === track.id);
          console.log(`Course ${course.name} (ID: ${course.id}) has track ${track.id}:`, hasTrack);
          return hasTrack;
        })
        ?.filter((course) => {
          const matchesTrack = selectedTrack ? track.name === selectedTrack : true;
          const matchesName = searchName
            ? course.name.toLowerCase().includes(searchName.toLowerCase())
            : true;
          const matchesIntake = selectedIntake
            ? (course.intake?.name || getIntakeName(course.id)) === selectedIntake
            : true;
          return matchesTrack && matchesName && matchesIntake;
        })
        ?.map((course) => ({
          id: course.id,
          courseName: course.name,
          instructor: course.instructor,
          intakeName: course.intake?.name || getIntakeName(course.id),
          courseId: course.id,
          trackId: track.id,
          description: course.description || '-',
        }));

      filteredCourses.forEach((row) => {
        const key = `${row.courseId}-${row.trackId}`;
        if (!uniqueRows.has(key)) {
          uniqueRows.set(key, row);
        }
      });
    });

    const result = Array.from(uniqueRows.values());
    console.log('Filtered rows:', result);
    return result;
  }, [tracks, courses, intakes, intakeCourses, selectedTrack, searchName, selectedIntake]);

  const sortedRows = useMemo(
    () => sortRows(filteredRows, sortBy, sortOrder),
    [filteredRows, sortBy, sortOrder]
  );

  // Combined loading state
  const isLoading = fetchCoursesLoading || instructorsLoading || fetchIntakesLoading || fetchIntakeCoursesLoading;

  // Combined error state
  const hasError = fetchCoursesError || instructorsError || fetchIntakesError || fetchIntakeCoursesError || fetchAvailableIntakesError;

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', bgcolor: '#f4f6f8' }}>
        <Box sx={{ width: '100%', maxWidth: '1200px' }}>
          <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 2 }} />
            </Grid>
          </Grid>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={40} sx={{ mb: 1, borderRadius: 2 }} />
          ))}
        </Box>
      </Box>
    );
  }

  // Error state
  if (hasError) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '200px', bgcolor: '#f4f6f8' }}>
        <Alert severity="error" sx={{ mb: 2, maxWidth: '600px' }}>
          {fetchCoursesError || instructorsError || fetchIntakesError || fetchIntakeCoursesError || fetchAvailableIntakesError}
        </Alert>
        <Button
          variant="contained"
          onClick={() => {
            if (fetchCoursesError) dispatch(fetchCourses(user_id));
            if (instructorsError) dispatch(fetchInstructors()).then(() => dispatch(fetchInstructorsTrackData()));
            if (fetchIntakesError) dispatch(fetchIntakes());
            if (fetchIntakeCoursesError) intakes.forEach((intake) => dispatch(fetchIntakeCourses(intake.id)));
            if (fetchAvailableIntakesError && editData.trackId) dispatch(fetchAvailableIntakes([editData.trackId]));
          }}
          sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, borderRadius: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  // Empty data state
  if (!tracks?.length && !courses?.length && !intakes?.length) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '200px', bgcolor: '#f4f6f8' }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#64748b' }}>
          No tracks, courses, or intakes available
        </Typography>
        <Button
          variant="contained"
          onClick={() => {
            dispatch(fetchCourses(user_id));
            dispatch(fetchIntakes());
          }}
          sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, borderRadius: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  // Get course details for delete confirmation
  const course = courses.find((c) => c.id === courseToDelete?.courseId);

  return (
    <Box sx={{ p: 3, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
      <Typography
        variant="h4"
        sx={{ fontWeight: 700, color: '#1e3a8a', mb: 2, textAlign: 'center' }}
      >
        Manage Track-Related Courses
      </Typography>

      {/* Intake Warning */}
      {intakeWarning && (
        <Alert severity="warning" sx={{ mb: 2, maxWidth: '1200px', mx: 'auto' }}>
          No intake data found for courses. Ensure courses are assigned to intakes in the backend.
        </Alert>
      )}

      {/* Instructor Warning */}
      {instructorWarning && (
        <Alert severity="warning" sx={{ mb: 2, maxWidth: '1200px', mx: 'auto' }}>
          {instructorWarning}
        </Alert>
      )}

      {/* Error Alert */}
      {localError && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: '1200px', mx: 'auto' }}>
          {localError}
        </Alert>
      )}
      {/* Success Message Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 2, maxWidth: '1200px', mx: 'auto' }}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Grid container spacing={3} sx={{ mb: 3, maxWidth: '1200px', mx: 'auto' }}>
        <Grid item xs={12} md={3}>
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
        <Grid item xs={12} md={3}>
          <TextField
            label="Search by Course Name"
            fullWidth
            value={searchName}
            onChange={handleNameSearchChange}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
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
        <Grid item xs={12} md={3}>
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

      {/* Table */}
      <StyledPaper sx={{ maxWidth: '1200px', mx: 'auto' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Table stickyHeader aria-label="track-related courses table">
            <TableHead>
              <TableRow>
                {[
                  { id: 'id', label: 'ID', minWidth: 100 },
                  { id: 'courseName', label: 'Name', minWidth: 150 },
                  { id: 'instructor', label: 'Instructor', minWidth: 150 },
                  { id: 'intake', label: 'Intake', minWidth: 150 },
                  { id: 'description', label: 'Description', minWidth: 200 },
                  { id: 'actions', label: 'Actions', minWidth: 180, align: 'right' },
                ].map((column) => (
                  <StyledTableCell
                    key={column.id}
                    align={column.align || 'left'}
                    sx={{ minWidth: column.minWidth, cursor: column.id !== 'actions' ? 'pointer' : 'default' }}
                    onClick={column.id !== 'actions' ? () => handleSort(column.id) : undefined}
                  >
                    {column.label}
                    {sortBy === column.id && column.id !== 'actions' && (
                      <Box component="span" sx={{ ml: 1 }}>
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </Box>
                    )}
                  </StyledTableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" sx={{ color: '#64748b' }}>
                      No track-related courses found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedRows.map((row, index) => (
                  <StyledTableRow key={`${row.courseId}-${row.trackId}-${index}`}>
                    <TableCell sx={{ p: 2 }}>{row.id}</TableCell>
                    <TableCell sx={{ p: 2 }}>{row.courseName}</TableCell>
                    <TableCell sx={{ p: 2 }}>
                      {row.instructor?.name || 'Not assigned'}
                    </TableCell>
                    <TableCell sx={{ p: 2 }}>{row.intakeName}</TableCell>
                    <TableCell sx={{ p: 2 }}>{row.description}</TableCell>
                    <TableCell align="right" sx={{ p: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() =>
                          openEditDialog(courses.find((c) => c.id === row.courseId), row.trackId)
                        }
                        disabled={instructorsLoading || updateCourseLoading}
                        sx={{
                          borderColor: '#3b82f6',
                          color: '#3b82f6',
                          '&:hover': { borderColor: '#2563eb', color: '#2563eb' },
                          borderRadius: 2,
                          mr: 1,
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => openDeleteDialog(row.courseId)}
                        disabled={instructorsLoading || deleteCourseLoading || isDeleting}
                        sx={{
                          borderColor: '#ef4444',
                          color: '#ef4444',
                          '&:hover': { borderColor: '#dc2626', color: '#dc2626' },
                          borderRadius: 2,
                        }}
                      >
                        {isDeleting && courseToDelete?.courseId === row.courseId ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          'Delete'
                        )}
                      </Button>
                    </TableCell>
                  </StyledTableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </StyledPaper>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Course: {editData.name}</DialogTitle>
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
              sx={{ borderRadius: 2 }}
              disabled={instructorsLoading || fetchAvailableIntakesLoading || !getTrackInstructors(editData.trackId).length}
            >
              <MenuItem value=""><em>Not assigned</em></MenuItem>
              {getTrackInstructors(editData.trackId).map((instructor) => (
                <MenuItem key={instructor.id} value={instructor.id}>
                  {instructor.full_name || instructor.username || `Instructor ${instructor.id}`}
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
              sx={{ borderRadius: 2 }}
              disabled={fetchAvailableIntakesLoading}
            >
              <MenuItem value=""><em>Not assigned</em></MenuItem>
              {availableIntakes.map((intake) => (
                <MenuItem key={intake.id} value={intake.id}>
                  {intake.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEditDialogOpen(false)}
            sx={{ color: '#64748b', borderRadius: 2 }}
            disabled={updateCourseLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditChange}
            variant="contained"
            disabled={updateCourseLoading}
            sx={{
              bgcolor: '#3b82f6',
              '&:hover': { bgcolor: '#2563eb' },
              borderRadius: 2,
            }}
          >
            {updateCourseLoading ? <CircularProgress size={20} color="inherit" /> : 'Save'}
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
        <DialogTitle>Confirm Course Deletion</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to permanently delete the course <strong>{course?.name || 'Unknown'}</strong>?
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            This action will also remove associated assignments and submissions and cannot be undone.
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={isDeleteConfirmed}
                onChange={(e) => setIsDeleteConfirmed(e.target.checked)}
                color="error"
              />
            }
            label="I confirm the deletion"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: '#64748b', borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={!isDeleteConfirmed || isDeleting}
            sx={{
              bgcolor: '#ef4444',
              '&:hover': { bgcolor: '#dc2626' },
              borderRadius: 2,
            }}
          >
            {isDeleting ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AllCourseManagement;