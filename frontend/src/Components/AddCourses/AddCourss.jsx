import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Button, Card, Typography, TextField, Divider, Grid, CircularProgress,
  Snackbar, Alert, FormControl, Autocomplete, Tabs, Tab, Skeleton,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { styled } from '@mui/material/styles';
import { fetchInstructors } from '../../redux/supervisorsSlice';
import { fetchCourses, fetchAllCourses, createCourse, assignCourseToTrack } from '../../redux/coursesSlice';
import Chip from '@mui/material/Chip';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: '16px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
  maxWidth: '900px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
}));

const StyledButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5),
  fontSize: '1rem',
  fontWeight: 600,
  textTransform: 'none',
  borderRadius: '12px',
  '&:hover': {
    transition: 'background-color 0.2s ease-in-out',
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    '& fieldset': {
      borderColor: theme.palette.grey[300],
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  backgroundColor: '#ffffff',
  marginTop: theme.spacing(3),
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  backgroundColor: theme.palette.grey[100],
  padding: theme.spacing(1.5),
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

const AddCourses = () => {
  const dispatch = useDispatch();
  const { user_id } = useSelector((state) => state.auth);
  const {
    instructors,
    loading: instructorsLoading,
    error: instructorsError,
  } = useSelector((state) => state.supervisors);
  const {
    userCourses,
    allCourses,
    status: {
      fetchCoursesLoading,
      fetchAllCoursesLoading,
      createCourseLoading,
      assignCourseToTrackLoading,
      fetchCoursesError,
      fetchAllCoursesError,
      createCourseError,
      assignCourseToTrackError,
    },
  } = useSelector((state) => state.courses);

  const [tabIndex, setTabIndex] = useState(0);
  const [newCourseForm, setNewCourseForm] = useState({
    name: '',
    description: '',
    instructor: null,
    tracks: [],
  });
  const [assignCourseForm, setAssignCourseForm] = useState({
    selectedCourse: null,
    selectedTrack: null,
    selectedOption: null
  });
  // console.log(assignCourseForm.selectedOption);
  const [formErrors, setFormErrors] = useState({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [retryCount, setRetryCount] = useState(0);

  // Fetch data with retry mechanism (max 3 attempts)
  useEffect(() => {
    const maxRetries = 3;
    const fetchData = async () => {
      try {
        const [instructorsRes, coursesRes, allCoursesRes] = await Promise.all([
          dispatch(fetchInstructors()).unwrap(),
          dispatch(fetchCourses(user_id)).unwrap(),
          dispatch(fetchAllCourses()).unwrap(),
        ]);
        console.log('Fetched data:', {
          instructors: instructorsRes,
          userCourses: coursesRes,
          allCourses: allCoursesRes,
        });
        setRetryCount(0); // Reset retry count on success
      } catch (error) {
        console.error('Data fetch failed:', error);
        if (retryCount < maxRetries) {
          setSnackbar({
            open: true,
            message: `Failed to load data. Retrying (${retryCount + 1}/${maxRetries})...`,
            severity: 'warning',
          });
          setRetryCount((prev) => prev + 1);
          setTimeout(fetchData, 3000); // Retry after 3 seconds
        } else {
          setSnackbar({
            open: true,
            message: 'Failed to load data after multiple attempts.',
            severity: 'error',
          });
        }
      }
    };
    fetchData();
  }, [dispatch, user_id, retryCount]);

  // Form validation
  const validateForm = useCallback(() => {
    const errors = {
      name: newCourseForm.name.trim() ? '' : 'Course name is required',
      description: newCourseForm.description.trim() ? '' : 'Description is required',
    };
    setFormErrors(errors);
    return !errors.name && !errors.description;
  }, [newCourseForm]);

  // Event handlers
  const handleNewCourseChange = useCallback((e) => {
    const { name, value } = e.target;
    setNewCourseForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({
      ...prev,
      [name]: value.trim() ? '' : `${name.charAt(0).toUpperCase() + name.slice(1)} is required`,
    }));
  }, []);

  const handleInstructorSelect = useCallback((_, value) => {
    setNewCourseForm((prev) => ({ ...prev, instructor: value }));
  }, []);

  const handleTracksSelect = useCallback((_, values) => {
    setNewCourseForm((prev) => ({ ...prev, tracks: values }));
  }, []);

  const handleTabChange = useCallback((event, newValue) => {
    setTabIndex(newValue);
  }, []);

  const handleResetForm = useCallback(() => {
    if (tabIndex === 0) {
      setNewCourseForm({ name: '', description: '', instructor: null, tracks: [] });
      setFormErrors({ name: '', description: '' });
    } else {
      setAssignCourseForm({ selectedCourse: null, selectedTrack: null, selectedOption: null });
    }
  }, [tabIndex]);

  const handleSnackbarClose = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const handleSubmitNewCourse = useCallback(async () => {
    if (!validateForm()) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: newCourseForm.name,
        description: newCourseForm.description,
        instructor: newCourseForm.instructor?.id || null,
        tracks: newCourseForm.tracks.map((track) => track.id),
      };
      const response = await dispatch(createCourse(payload)).unwrap();
      console.log('Course created:', response);
      setSnackbar({ open: true, message: 'Course created successfully!', severity: 'success' });
      handleResetForm();
      await Promise.all([
        dispatch(fetchCourses(user_id)).unwrap(),
        dispatch(fetchAllCourses()).unwrap(),
      ]);
    } catch (error) {
      const errorMsg = error || 'Failed to create course';
      console.error('Create course error:', errorMsg);
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [newCourseForm, validateForm, handleResetForm, dispatch, user_id]);

  const handleAssignCourseToTrack = useCallback(async () => {
    if (!assignCourseForm.selectedCourse || !assignCourseForm.selectedTrack || !assignCourseForm.selectedOption) {
      setSnackbar({ open: true, message: 'Please select a course, track, and option', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await dispatch(assignCourseToTrack({
        courseId: assignCourseForm.selectedCourse.id,
        trackId: assignCourseForm.selectedTrack.id,
        optionId: assignCourseForm.selectedOption.id,
      })).unwrap();
      console.log('Course assigned:', response);
      setSnackbar({ open: true, message: 'Course assigned to track successfully!', severity: 'success' });
      handleResetForm();
      await dispatch(fetchCourses(user_id)).unwrap();
    } catch (error) {
      const errorMsg = error || 'Failed to assign course to track';
      console.error('Assign course error:', errorMsg);
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [assignCourseForm, dispatch, user_id, handleResetForm]);

  // Memoized options with fallbacks
  const instructorOptions = useMemo(() => instructors || [], [instructors]);
  const trackOptions = useMemo(() => userCourses?.tracks || [], [userCourses]);
  const courseOptions = useMemo(() => allCourses || [], [allCourses]);
  const CreateOptions = [
    { name: "As Existing", value: "notNull", id: 0 },
    { name: "As Form", value: "Null", id: 1 }
  ];

  // Log state for debugging
  console.log('State:', {
    instructors: instructorOptions,
    tracks: trackOptions,
    courses: courseOptions,
    options: CreateOptions,
    loading: { fetchCoursesLoading, fetchAllCoursesLoading, instructorsLoading },
    errors: { fetchCoursesError, fetchAllCoursesError, instructorsError },
  });

  // Combined loading state
  const isLoading = fetchCoursesLoading || fetchAllCoursesLoading || instructorsLoading;

  // Combined error state
  const hasError = fetchCoursesError || fetchAllCoursesError || instructorsError;

  // Combined action loading state
  const isActionLoading = createCourseLoading || assignCourseToTrackLoading || loading;

  // Error state
  if (hasError) {
    return (
      <Box sx={{ p: 3, bgcolor: '#f4f6f8', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
        <StyledCard>
          <Typography variant="h6" color="error" sx={{ mb: 2, textAlign: 'center' }}>
            Error: {fetchCoursesError || fetchAllCoursesError || instructorsError}
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              if (instructorsError) dispatch(fetchInstructors());
              if (fetchCoursesError) dispatch(fetchCourses(user_id));
              if (fetchAllCoursesError) dispatch(fetchAllCourses());
              setRetryCount(0); // Reset retry count
            }}
            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, borderRadius: 2, mx: 'auto', display: 'block' }}
          >
            Retry
          </Button>
        </StyledCard>
      </Box>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ p: 3, bgcolor: '#f4f6f8', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
        <StyledCard>
          <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={40} sx={{ mb: 2, borderRadius: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12}>
              <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12}>
              <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 2 }} />
            </Grid>
          </Grid>
          <Skeleton variant="rectangular" height={56} sx={{ mt: 3, borderRadius: 2 }} />
        </StyledCard>
      </Box>
    );
  }

  // Empty data state
  if (!instructorOptions.length && !trackOptions.length && !courseOptions.length) {
    return (
      <Box sx={{ p: 3, bgcolor: '#f4f6f8', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
        <StyledCard>
          <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', color: '#64748b' }}>
            No data available. Please try again or contact support.
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              dispatch(fetchInstructors());
              dispatch(fetchCourses(user_id));
              dispatch(fetchAllCourses());
              setRetryCount(0);
            }}
            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, borderRadius: 2, mx: 'auto', display: 'block' }}
          >
            Retry
          </Button>
        </StyledCard>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
      <StyledCard>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e3a8a', mb: 3, textAlign: 'center' }}>
          {tabIndex === 0 ? 'Create New Course' : 'Assign Existing Course to Track'}
        </Typography>

        <Divider sx={{ my: 3, borderColor: '#e2e8f0' }} />

        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            mb: 3,
            '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', fontSize: '1rem' },
            '& .Mui-selected': { color: '#3b82f6' },
            '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' },
          }}
        >
          <Tab label="Create New Course" />
          <Tab label="Assign Existing Course" />
        </Tabs>

        {tabIndex === 0 ? (
          <Box sx={{ maxWidth: '600px', mx: 'auto' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#64748b', mb: 3 }}>
              Course Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <StyledTextField
                  label="Course Name *"
                  fullWidth
                  name="name"
                  value={newCourseForm.name}
                  onChange={handleNewCourseChange}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                />
              </Grid>
              <Grid item xs={12}>
                <StyledTextField
                  label="Description *"
                  fullWidth
                  name="description"
                  multiline
                  rows={4}
                  value={newCourseForm.description}
                  onChange={handleNewCourseChange}
                  error={!!formErrors.description}
                  helperText={formErrors.description}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <Autocomplete
                    options={instructorOptions}
                    getOptionLabel={(option) => option.full_name || option.username || ''}
                    value={newCourseForm.instructor}
                    onChange={handleInstructorSelect}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Instructor (Optional)"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: params.InputProps.endAdornment,
                        }}
                      />
                    )}
                    disabled={instructorsLoading}
                    noOptionsText="No instructors available"
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <Autocomplete
                    multiple
                    options={trackOptions}
                    getOptionLabel={(option) => option.name || ''}
                    value={newCourseForm.tracks}
                    onChange={handleTracksSelect}
                    renderInput={(params) => (
                      <TextField {...params} label="Associated Tracks" placeholder="Select tracks" />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option.name}
                          {...getTagProps({ index })}
                          key={option.id}
                          sx={{ bgcolor: '#3b82f6', color: '#fff' }}
                        />
                      ))
                    }
                    disabled={fetchCoursesLoading}
                    noOptionsText="No tracks available"
                  />
                </FormControl>
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <StyledButton
                variant="contained"
                fullWidth
                onClick={handleSubmitNewCourse}
                disabled={isActionLoading || isLoading}
                startIcon={isActionLoading ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
              >
                {isActionLoading ? 'Creating Course...' : 'Create Course'}
              </StyledButton>
              <StyledButton
                variant="outlined"
                fullWidth
                onClick={handleResetForm}
                disabled={isActionLoading || isLoading}
                sx={{ borderColor: '#64748b', color: '#64748b', '&:hover': { borderColor: '#475569', color: '#475569' } }}
              >
                Reset Form
              </StyledButton>
            </Box>
          </Box>
        ) : (
          <Box sx={{ maxWidth: '600px', mx: 'auto' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#64748b', mb: 3 }}>
              Assign Course to Track
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
              <FormControl fullWidth>
                    <Autocomplete
                      options={courseOptions}
                      getOptionLabel={(option) => {
                        // Display course name and instructor name if available
                        return `${option.name}${option.instructor_name ? ` - ${option.instructor_name}` : ''}`;
                      }}
                      value={assignCourseForm.selectedCourse}
                      onChange={(_, value) => setAssignCourseForm((prev) => ({ ...prev, selectedCourse: value }))}
                      renderInput={(params) => <TextField {...params} label="Select Course" />}
                      disabled={fetchAllCoursesLoading}
                      noOptionsText="No courses available"
                      renderOption={(props, option) => (
                        <li {...props} key={option.id}>
                          <Box>
                            <Typography>{option.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {option.instructor_name || 'No instructor assigned'}
                            </Typography>
                          </Box>
                        </li>
                      )}
                    />
                  </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <Autocomplete
                    options={trackOptions}
                    getOptionLabel={(option) => option.name || ''}
                    value={assignCourseForm.selectedTrack}
                    onChange={(_, value) => setAssignCourseForm((prev) => ({ ...prev, selectedTrack: value }))}
                    renderInput={(params) => <TextField {...params} label="Select Track" />}
                    disabled={fetchCoursesLoading}
                    noOptionsText="No tracks available"
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <Autocomplete
                    options={CreateOptions}
                    getOptionLabel={(option) => option.name || ''}
                    value={assignCourseForm.selectedOption}
                    onChange={(_, value) => setAssignCourseForm((prev) => ({ ...prev, selectedOption: value }))}
                    renderInput={(params) => <TextField {...params} label="Select Option" />}
                    disabled={fetchAllCoursesLoading}
                    noOptionsText="No options available"
                  />
                </FormControl>
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <StyledButton
                variant="contained"
                fullWidth
                onClick={handleAssignCourseToTrack}
                disabled={isActionLoading || isLoading}
                startIcon={isActionLoading ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
              >
                {isActionLoading ? 'Assigning Course...' : 'Assign Course'}
              </StyledButton>
              <StyledButton
                variant="outlined"
                fullWidth
                onClick={handleResetForm}
                disabled={isActionLoading || isLoading}
                sx={{ borderColor: '#64748b', color: '#64748b', '&:hover': { borderColor: '#475569', color: '#475569' } }}
              >
                Reset Form
              </StyledButton>
            </Box>

            {/* Courses Table */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#64748b', mb: 2 }}>
                Available Courses
              </Typography>
              <StyledTableContainer component={Paper}>
                <Table aria-label="courses table">
                  <TableHead>
                    <TableRow>
                      <StyledTableCell>Course Name</StyledTableCell>
                      <StyledTableCell>Instructor</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fetchAllCoursesLoading ? (
                      [...Array(3)].map((_, index) => (
                        <TableRow key={index}>
                          <TableCell><Skeleton variant="text" /></TableCell>
                          <TableCell><Skeleton variant="text" /></TableCell>
                        </TableRow>
                      ))
                    ) : allCourses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} align="center">
                          <Typography variant="body2" sx={{ color: '#64748b', py: 2 }}>
                            No courses available
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      allCourses.map((course) => (
                        <StyledTableRow key={course.id}>
                          <TableCell>{course.name}</TableCell>
                          <TableCell>{course.instructor_name || 'Not assigned'}</TableCell>
                        </StyledTableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </StyledTableContainer>
            </Box>
          </Box>
        )}
      </StyledCard>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddCourses;