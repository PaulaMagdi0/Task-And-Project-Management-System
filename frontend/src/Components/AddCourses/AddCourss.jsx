import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Button, Card, Typography, TextField, Divider, Grid, CircularProgress,
  Snackbar, Alert, FormControl, Autocomplete, Tabs, Tab, Skeleton, Chip,
  Radio, RadioGroup, FormControlLabel
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { styled } from '@mui/material/styles';
import { fetchInstructors } from '../../redux/supervisorsSlice';
import { fetchCourses, fetchAllCourses, createCourse, assignCourseToTrack } from '../../redux/coursesSlice';

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
      reassignCourseInstructorLoading,
      fetchCoursesError,
      fetchAllCoursesError,
      createCourseError,
      assignCourseToTrackError,
      reassignCourseInstructorError,
    },
  } = useSelector((state) => state.courses);

  // State management
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
    selectedOption: { name: "As Existing", value: "notNull", id: 0 },
  });
  const [reassignInstructorForm, setReassignInstructorForm] = useState({
    selectedCourse: null,
    selectedInstructor: null,
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    description: '',
    course: '',
    track: '',
    instructor: '',
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
        setRetryCount(0);
      } catch (error) {
        console.error('Data fetch failed:', error);
        if (retryCount < maxRetries) {
          setSnackbar({
            open: true,
            message: `Failed to load data. Retrying (${retryCount + 1}/${maxRetries})...`,
            severity: 'warning',
          });
          setRetryCount((prev) => prev + 1);
          setTimeout(fetchData, 3000);
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
    if (tabIndex === 0) {
      const errors = {
        name: newCourseForm.name.trim() ? '' : 'Course name is required',
        description: newCourseForm.description.trim() ? '' : 'Description is required',
        course: '',
        track: '',
        instructor: '',
      };
      setFormErrors(errors);
      return !errors.name && !errors.description;
    } else if (tabIndex === 1 && assignCourseForm.selectedOption.id === 0) {
      const errors = {
        name: '',
        description: '',
        course: assignCourseForm.selectedCourse ? '' : 'Please select a course',
        track: assignCourseForm.selectedTrack ? '' : 'Please select a track',
        instructor: '',
      };
      setFormErrors(errors);
      return !errors.course && !errors.track;
    } else if (tabIndex === 1 && assignCourseForm.selectedOption.id === 1) {
      const errors = {
        name: newCourseForm.name.trim() ? '' : 'Course name is required',
        description: newCourseForm.description.trim() ? '' : 'Description is required',
        course: '',
        track: newCourseForm.tracks.length > 0 ? '' : 'Please select a track',
        instructor: '',
      };
      setFormErrors(errors);
      return !errors.name && !errors.description && !errors.track;
    } else {
      // tabIndex === 2 (Reassign Instructor)
      const errors = {
        name: '',
        description: '',
        course: reassignInstructorForm.selectedCourse ? '' : 'Please select a course',
        track: '',
        instructor: reassignInstructorForm.selectedInstructor ? '' : 'Please select an instructor',
      };
      setFormErrors(errors);
      return !errors.course && !errors.instructor;
    }
  }, [tabIndex, newCourseForm, assignCourseForm, reassignInstructorForm]);

  // Event handlers
  const handleTabChange = useCallback((event, newValue) => {
    setTabIndex(newValue);
    setFormErrors({ name: '', description: '', course: '', track: '', instructor: '' });
    setAssignCourseForm({
      selectedCourse: null,
      selectedTrack: null,
      selectedOption: { name: "As Existing", value: "notNull", id: 0 },
    });
    setNewCourseForm({ name: '', description: '', instructor: null, tracks: [] });
    setReassignInstructorForm({ selectedCourse: null, selectedInstructor: null });
  }, []);

  const handleOptionChange = useCallback((event) => {
    const selectedId = parseInt(event.target.value);
    const selectedOption = [
      { name: "As Existing", value: "notNull", id: 0 },
      { name: "As Form", value: "Null", id: 1 }
    ].find(option => option.id === selectedId);
    setAssignCourseForm((prev) => ({ ...prev, selectedOption }));
    setFormErrors({ name: '', description: '', course: '', track: '', instructor: '' });
    setNewCourseForm({ name: '', description: '', instructor: null, tracks: [] });
  }, []);

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

  const handleTracksSelect = useCallback((_, value) => {
    const tracks = tabIndex === 0 ? value : value.slice(-1); // Multiple for create, single for assign
    setNewCourseForm((prev) => ({ ...prev, tracks }));
  }, [tabIndex]);

  const handleReassignCourseSelect = useCallback((_, value) => {
    setReassignInstructorForm((prev) => ({ ...prev, selectedCourse: value }));
  }, []);

  const handleReassignInstructorSelect = useCallback((_, value) => {
    setReassignInstructorForm((prev) => ({ ...prev, selectedInstructor: value }));
  }, []);

  const handleResetForm = useCallback(() => {
    if (tabIndex === 0 || (tabIndex === 1 && assignCourseForm.selectedOption.id === 1)) {
      setNewCourseForm({ name: '', description: '', instructor: null, tracks: [] });
      setFormErrors({ name: '', description: '', course: '', track: '', instructor: '' });
    } else if (tabIndex === 1) {
      setAssignCourseForm({
        selectedCourse: null,
        selectedTrack: null,
        selectedOption: { name: "As Existing", value: "notNull", id: 0 },
      });
      setFormErrors({ name: '', description: '', course: '', track: '', instructor: '' });
    } else {
      setReassignInstructorForm({ selectedCourse: null, selectedInstructor: null });
      setFormErrors({ name: '', description: '', course: '', track: '', instructor: '' });
 Writ
    }
  }, [tabIndex, assignCourseForm.selectedOption]);

  const handleSnackbarClose = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      if (tabIndex === 0) {
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
      } else if (tabIndex === 1 && assignCourseForm.selectedOption.id === 0) {
        // Check for existing course-track association
        const isAlreadyAssigned = userCourses?.track_courses?.some(
          (course) =>
            course.id === assignCourseForm.selectedCourse?.id &&
            course.tracks?.some((track) => track.id === assignCourseForm.selectedTrack?.id)
        );
        if (isAlreadyAssigned) {
          setSnackbar({
            open: true,
            message: 'This course is already assigned to the selected track',
            severity: 'warning',
          });
          setLoading(false);
          return;
        }

        const response = await dispatch(
          assignCourseToTrack({
            courseId: assignCourseForm.selectedCourse.id,
            trackId: assignCourseForm.selectedTrack.id,
          })
        ).unwrap();
        console.log('Course assigned:', response);
        setSnackbar({ open: true, message: 'Course assigned to track successfully!', severity: 'success' });
        handleResetForm();
        await dispatch(fetchCourses(user_id)).unwrap();
      } else if (tabIndex === 1 && assignCourseForm.selectedOption.id === 1) {
        const payload = {
          name: newCourseForm.name,
          description: newCourseForm.description,
          instructor: newCourseForm.instructor?.id || null,
          tracks: newCourseForm.tracks.map((track) => track.id), // Single track
        };
        const response = await dispatch(createCourse(payload)).unwrap();
        console.log('Course created and assigned:', response);
        setSnackbar({ open: true, message: 'Course created and assigned to track successfully!', severity: 'success' });
        handleResetForm();
        await Promise.all([
          dispatch(fetchCourses(user_id)).unwrap(),
          dispatch(fetchAllCourses()).unwrap(),
        ]);
      } else {
        // tabIndex === 2 (Reassign Instructor)
        const response = await dispatch(
          reassignCourseInstructor({
            courseId: reassignInstructorForm.selectedCourse.id,
            instructorId: reassignInstructorForm.selectedInstructor.id,
          })
        ).unwrap();
        console.log('Instructor reassigned:', response);
        setSnackbar({ open: true, message: response.detail || 'Instructor reassigned successfully!', severity: 'success' });
        handleResetForm();
        await Promise.all([
          dispatch(fetchCourses(user_id)).unwrap(),
          dispatch(fetchAllCourses()).unwrap(),
        ]);
      }
    } catch (error) {
      const errorMsg = error || `Failed to ${tabIndex === 0 || (tabIndex === 1 && assignCourseForm.selectedOption.id === 1) ? 'create course' : tabIndex === 2 ? 'reassign instructor' : 'assign course to track'}`;
      console.error(`${tabIndex === 0 || (tabIndex === 1 && assignCourseForm.selectedOption.id === 1) ? 'Create' : tabIndex === 2 ? 'Reassign' : 'Assign'} error:`, errorMsg);
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [
    tabIndex,
    newCourseForm,
    assignCourseForm,
    reassignInstructorForm,
    validateForm,
    dispatch,
    user_id,
    userCourses,
    handleResetForm,
  ]);

  // Memoized options with deduplication and filtering
  const instructorOptions = useMemo(() => instructors || [], [instructors]);
  const trackOptions = useMemo(() => {
    const uniqueTracks = new Map();
    (userCourses?.tracks || []).forEach((track) => {
      if (!uniqueTracks.has(track.id)) {
        uniqueTracks.set(track.id, track);
      }
    });
    return Array.from(uniqueTracks.values());
  }, [userCourses]);

  const courseOptions = useMemo(() => {
    const uniqueCourses = new Map();
    (allCourses || []).forEach((course) => {
      if (!uniqueCourses.has(course.id)) {
        uniqueCourses.set(course.id, course);
      }
    });
    const availableCourses = Array.from(uniqueCourses.values());
    if (tabIndex === 1 && assignCourseForm.selectedOption.id === 0 && assignCourseForm.selectedTrack) {
      return availableCourses.filter(
        (course) =>
          !userCourses?.track_courses?.some(
            (tc) =>
              tc.id === course.id &&
              tc.tracks?.some((track) => track.id === assignCourseForm.selectedTrack?.id)
          )
      );
    }
    return availableCourses;
  }, [allCourses, tabIndex, assignCourseForm.selectedTrack, assignCourseForm.selectedOption, userCourses]);

  // Log state for debugging
  console.log('State:', {
    tabIndex,
    selectedOption: assignCourseForm.selectedOption,
    newCourseForm,
    assignCourseForm,
    reassignInstructorForm,
    instructors: instructorOptions,
    tracks: trackOptions,
    courses: courseOptions,
    loading: { fetchCoursesLoading, fetchAllCoursesLoading, instructorsLoading, reassignCourseInstructorLoading },
    errors: { fetchCoursesError, fetchAllCoursesError, instructorsError, reassignCourseInstructorError },
  });

  // Combined loading state
  const isLoading = fetchCoursesLoading || fetchAllCoursesLoading || instructorsLoading;

  // Combined error state
  const hasError = fetchCoursesError || fetchAllCoursesError || instructorsError;

  // Combined action loading state
  const isActionLoading = createCourseLoading || assignCourseToTrackLoading || reassignCourseInstructorLoading || loading;

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
          {tabIndex === 0 ? 'Create New Course' : tabIndex === 1 ? 'Assign Course to Track' : 'Reassign Instructor'}
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
          <Tab label="Assign Course" />
          <Tab label="Reassign Instructor" />
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
                onClick={handleSubmit}
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
        ) : tabIndex === 1 ? (
          <Box sx={{ maxWidth: '600px', mx: 'auto' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#64748b', mb: 3 }}>
              Assign Course to Track
            </Typography>
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <RadioGroup
                row
                value={assignCourseForm.selectedOption.id.toString()}
                onChange={handleOptionChange}
                sx={{ justifyContent: 'center' }}
              >
                <FormControlLabel
                  value="0"
                  control={<Radio />}
                  label="As Existing"
                  sx={{ mr: 4 }}
                />
                <FormControlLabel
                  value="1"
                  control={<Radio />}
                  label="As Form"
                />
              </RadioGroup>
            </FormControl>

            {assignCourseForm.selectedOption.id === 0 ? (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <Autocomplete
                      options={courseOptions}
                      getOptionLabel={(option) => option.name || ''}
                      value={assignCourseForm.selectedCourse}
                      onChange={(_, value) => setAssignCourseForm((prev) => ({ ...prev, selectedCourse: value }))}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select Course *"
                          error={!!formErrors.course}
                          helperText={formErrors.course}
                        />
                      )}
                      disabled={fetchAllCoursesLoading}
                      noOptionsText="No courses available"
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <Autocomplete
                      options={trackOptions}
                      getOptionLabel={(option) => option.name || ''}
                      value={assignCourseForm.selectedCourse}
                      onChange={(_, value) => setAssignCourseForm((prev) => ({ ...prev, selectedTrack: value }))}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select Track *"
                          error={!!formErrors.track}
                          helperText={formErrors.track}
                        />
                      )}
                      disabled={fetchCoursesLoading}
                      noOptionsText="No tracks available"
                    />
                  </FormControl>
                </Grid>
              </Grid>
            ) : (
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
                      options={trackOptions}
                      getOptionLabel={(option) => option.name || ''}
                      value={newCourseForm.tracks[0] || null}
                      onChange={handleTracksSelect}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select Track *"
                          error={!!formErrors.track}
                          helperText={formErrors.track}
                        />
                      )}
                      disabled={fetchCoursesLoading}
                      noOptionsText="No tracks available"
                    />
                  </FormControl>
                </Grid>
              </Grid>
            )}
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <StyledButton
                variant="contained"
                fullWidth
                onClick={handleSubmit}
                disabled={isActionLoading || isLoading}
                startIcon={isActionLoading ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
              >
                {isActionLoading
                  ? assignCourseForm.selectedOption.id === 1
                    ? 'Creating Course...'
                    : 'Assigning Course...'
                  : assignCourseForm.selectedOption.id === 1
                  ? 'Create Course'
                  : 'Assign Course'}
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
              Reassign Instructor
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <Autocomplete
                    options={courseOptions}
                    getOptionLabel={(option) => option.name || ''}
                    value={reassignInstructorForm.selectedCourse}
                    onChange={handleReassignCourseSelect}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Course *"
                        error={!!formErrors.course}
                        helperText={formErrors.course}
                      />
                    )}
                    disabled={fetchAllCoursesLoading}
                    noOptionsText="No courses available"
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <Autocomplete
                    options={instructorOptions}
                    getOptionLabel={(option) => option.full_name || option.username || ''}
                    value={reassignInstructorForm.selectedInstructor}
                    onChange={handleReassignInstructorSelect}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Instructor *"
                        error={!!formErrors.instructor}
                        helperText={formErrors.instructor}
                      />
                    )}
                    disabled={instructorsLoading}
                    noOptionsText="No instructors available"
                  />
                </FormControl>
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <StyledButton
                variant="contained"
                fullWidth
                onClick={handleSubmit}
                disabled={isActionLoading || isLoading}
                startIcon={isActionLoading ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
              >
                {isActionLoading ? 'Reassigning Instructor...' : 'Reassign Instructor'}
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