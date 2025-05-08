import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCourses, reassignInstructor, removeCourseFromTrack, fetchIntakes, fetchIntakeCourses } from "../../redux/coursesSlice";
import { fetchInstructors } from "../../redux/supervisorsSlice";
import {
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Modal,
  Box,
  Alert,
  Snackbar,
  Grid,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { styled } from "@mui/material/styles";

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
  overflow: "hidden",
  margin: theme.spacing(3),
  backgroundColor: "#ffffff",
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  backgroundColor: theme.palette.grey[100],
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StyledTableRow = styled(TableRow)(() => ({
  "&:nth-of-type(odd)": {
    backgroundColor: "#f8fafc",
  },
  "&:hover": {
    backgroundColor: "#f1f5f9",
    transition: "background-color 0.2s ease-in-out",
  },
}));

// Helper function for sorting
const sortRows = (rows, sortBy, sortOrder) => {
  return [...rows].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    if (sortBy === "instructor") {
      aValue = a.instructor?.name || "Not assigned";
      bValue = b.instructor?.name || "Not assigned";
    }
    if (sortBy === "intake") {
      aValue = a.intakeName || "Not assigned";
      bValue = b.intakeName || "Not assigned";
    }
    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });
};

const ReAssignCourses = () => {
  const dispatch = useDispatch();
  const user_id = useSelector((state) => state.auth.user_id);
  const {
    userCourses: { tracks, track_courses: courses },
    intakes,
    intakeCourses,
    status: { 
      fetchCoursesLoading, 
      fetchCoursesError, 
      reassignInstructorLoading,
      removeCourseFromTrackLoading,
      removeCourseFromTrackError,
      fetchIntakesLoading,
      fetchIntakesError,
      fetchIntakeCoursesLoading,
      fetchIntakeCoursesError,
      success
    },
  } = useSelector((state) => state.courses);
  const {
    instructors,
    loading: instructorsLoading,
    error: instructorsError,
  } = useSelector((state) => state.supervisors);

  // State management
  const [editingCourse, setEditingCourse] = useState(null);
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [selectedTrack, setSelectedTrack] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [selectedIntake, setSelectedIntake] = useState("");
  const [sortBy, setSortBy] = useState("trackName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [deletingRows, setDeletingRows] = useState(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCourseTrack, setDeleteCourseTrack] = useState(null);
  const [isDeleteConfirmed, setIsDeleteConfirmed] = useState(false);
  const [intakeWarning, setIntakeWarning] = useState(false);
  const [instructorWarning, setInstructorWarning] = useState("");

  // Debug course and intake data
  useEffect(() => {
    console.log('Courses data:', courses);
    console.log('Intakes data:', intakes);
    console.log('IntakeCourses data:', intakeCourses);
    console.log('Instructors data:', instructors);
    courses?.forEach((course) => {
      console.log(`Course ${course.name} (ID: ${course.id}) - Intake:`, course.intake, 'Tracks:', course.tracks, 'Instructor:', course.instructor);
    });
    // Check if any course has intake data or is mapped
    const hasIntakeData = courses?.some((course) => course.intake || Object.values(intakeCourses).some((ic) => ic.some((c) => c.id === course.id)));
    setIntakeWarning(!hasIntakeData && courses?.length > 0 && intakes?.length > 0);
  }, [courses, intakes, intakeCourses, instructors]);

  // Fetch data
  useEffect(() => {
    if (user_id) {
      dispatch(fetchCourses(user_id));
    }
    dispatch(fetchInstructors());
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

  // Set instructor ID when editing course
  useEffect(() => {
    if (editingCourse) {
      setSelectedInstructorId(editingCourse.instructor?.id || "");
      // Set instructor warning based on track instructors
      const trackInstructors = getTrackInstructors(selectedTrackId);
      console.log('Track instructors for trackId', selectedTrackId, ':', trackInstructors);
      setInstructorWarning(
        trackInstructors.length === 0
          ? 'No instructors assigned to courses in this track.'
          : ''
      );
    }
  }, [editingCourse, selectedTrackId]);

  // Handle success/error messages
  useEffect(() => {
    if (success) {
      setSnackbar({
        open: true,
        message: success,
        severity: "success",
      });
      dispatch(fetchCourses(user_id)); // Refetch to update table
    }
    if (removeCourseFromTrackError || fetchIntakesError || fetchIntakeCoursesError) {
      setSnackbar({
        open: true,
        message: removeCourseFromTrackError || fetchIntakesError || fetchIntakeCoursesError,
        severity: "error",
      });
    }
  }, [success, removeCourseFromTrackError, fetchIntakesError, fetchIntakeCoursesError, dispatch, user_id]);

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
  const handleEditClick = (course, trackName) => {
    const track = tracks.find((t) => t.name === trackName);
    setEditingCourse(course);
    setSelectedTrackId(track?.id || null);
  };

  const handleDeleteClick = (courseId, trackId, courseName, trackName) => {
    setDeleteCourseTrack({ courseId, trackId, courseName, trackName });
    setIsDeleteConfirmed(false);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!isDeleteConfirmed) return;

    const { courseId, trackId } = deleteCourseTrack;
    const key = `${courseId}-${trackId}`;
    setDeletingRows((prev) => new Set([...prev, key]));
    try {
      console.log('Dispatching removeCourseFromTrack:', { courseId, trackId });
      await dispatch(removeCourseFromTrack({ courseId, trackId })).unwrap();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Remove course from track failed:', error);
    } finally {
      setDeletingRows((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setDeleteCourseTrack(null);
    setIsDeleteConfirmed(false);
  };

  const handleSaveChanges = async () => {
    if (!selectedInstructorId) {
      setSnackbar({
        open: true,
        message: "Please select an instructor",
        severity: "error",
      });
      return;
    }

    if (!selectedTrackId) {
      setSnackbar({
        open: true,
        message: "Track ID is missing",
        severity: "error",
      });
      return;
    }

    try {
      console.log('Dispatching reassignInstructor:', {
        courseId: editingCourse.id,
        instructorId: selectedInstructorId,
        trackId: selectedTrackId,
      });
      await dispatch(
        reassignInstructor({
          courseId: editingCourse.id,
          instructorId: selectedInstructorId,
          trackId: selectedTrackId,
        })
      ).unwrap();
      setEditingCourse(null);
      setSelectedTrackId(null);
    } catch (error) {
      console.error('Reassign instructor failed:', error);
      setSnackbar({
        open: true,
        message: error,
        severity: "error",
      });
    }
  };

  const handleModalClose = () => {
    setEditingCourse(null);
    setSelectedTrackId(null);
    setInstructorWarning("");
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
    dispatch({ type: 'courses/clearCourseStatus' });
  };

  const handleSort = (columnId) => {
    const isAsc = sortBy === columnId && sortOrder === "asc";
    setSortBy(columnId);
    setSortOrder(isAsc ? "desc" : "asc");
  };

  const handleTrackFilterChange = (event) => {
    setSelectedTrack(event.target.value);
  };

  const handleCourseFilterChange = (event) => {
    setSelectedCourse(event.target.value);
  };

  const handleInstructorFilterChange = (event) => {
    setSelectedInstructor(event.target.value);
  };

  const handleIntakeFilterChange = (event) => {
    setSelectedIntake(event.target.value);
  };

  const handleResetFilters = () => {
    setSelectedTrack("");
    setSelectedCourse("");
    setSelectedInstructor("");
    setSelectedIntake("");
  };

  // Map course IDs to intake names
  const getIntakeName = (courseId) => {
    for (const intakeId in intakeCourses) {
      const courses = intakeCourses[intakeId];
      const course = courses.find((c) => c.id === courseId);
      if (course) {
        const intake = intakes.find((i) => i.id === parseInt(intakeId));
        return intake?.name || "Not assigned";
      }
    }
    return "Not assigned";
  };

  // Filter and prepare rows
  const trackNames = useMemo(
    () => [...new Set(tracks?.map((track) => track.name) || [])].sort(),
    [tracks]
  );
  const courseNames = useMemo(
    () => [...new Set(courses?.map((course) => course.name) || [])].sort(),
    [courses]
  );
  const instructorNames = useMemo(
    () =>
      [...new Set(instructors?.map((instructor) => instructor.full_name) || [])].sort(),
    [instructors]
  );
  const intakeNames = useMemo(
    () => [...new Set(intakes?.map((intake) => intake.name) || [])].sort(),
    [intakes]
  );

  const filteredRows = useMemo(() => {
    const uniqueRows = new Map();
    tracks?.forEach((track) => {
      const filteredCourses = courses
        ?.filter((course) => course?.tracks?.some((t) => t.id === track.id))
        ?.filter((course) => {
          const matchesTrack = selectedTrack ? track.name === selectedTrack : true;
          const matchesCourse = selectedCourse ? course.name === selectedCourse : true;
          const matchesInstructor = selectedInstructor
            ? course.instructor?.name === selectedInstructor
            : true;
          const matchesIntake = selectedIntake
            ? (course.intake?.name || getIntakeName(course.id)) === selectedIntake
            : true;
          return matchesTrack && matchesCourse && matchesInstructor && matchesIntake;
        })
        ?.map((course) => ({
          trackName: track.name,
          courseName: course.name,
          instructor: course.instructor,
          intakeName: course.intake?.name || getIntakeName(course.id),
          courseId: course.id,
          trackId: track.id,
        }));

      filteredCourses.forEach((row) => {
        const key = `${row.courseId}-${row.trackId}`;
        if (!uniqueRows.has(key)) {
          uniqueRows.set(key, row);
        }
      });
    });

    const result = Array.from(uniqueRows.values());
    console.log("Filtered rows:", result);
    return result;
  }, [tracks, courses, intakes, intakeCourses, selectedTrack, selectedCourse, selectedInstructor, selectedIntake]);

  const sortedRows = useMemo(
    () => sortRows(filteredRows, sortBy, sortOrder),
    [filteredRows, sortBy, sortOrder]
  );

  // Combined loading state
  const isLoading = fetchCoursesLoading || instructorsLoading || fetchIntakesLoading || fetchIntakeCoursesLoading;

  // Combined error state
  const hasError = fetchCoursesError || instructorsError || fetchIntakesError || fetchIntakeCoursesError;

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px", bgcolor: "#f4f6f8" }}>
        <Box sx={{ width: "100%", maxWidth: "1200px" }}>
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
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "200px", bgcolor: "#f4f6f8" }}>
        <Alert severity="error" sx={{ mb: 2, maxWidth: "600px" }}>
          {fetchCoursesError || instructorsError || fetchIntakesError || fetchIntakeCoursesError}
        </Alert>
        <Button
          variant="contained"
          onClick={() => {
            if (fetchCoursesError) dispatch(fetchCourses(user_id));
            if (instructorsError) dispatch(fetchInstructors());
            if (fetchIntakesError) dispatch(fetchIntakes());
            if (fetchIntakeCoursesError) intakes.forEach((intake) => dispatch(fetchIntakeCourses(intake.id)));
          }}
          sx={{ bgcolor: "#3b82f6", "&:hover": { bgcolor: "#2563eb" }, borderRadius: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  // Empty data state
  if (!tracks?.length && !courses?.length && !intakes?.length) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "200px", bgcolor: "#f4f6f8" }}>
        <Typography variant="h6" sx={{ mb: 2, color: "#64748b" }}>
          No tracks, courses, or intakes available
        </Typography>
        <Button
          variant="contained"
          onClick={() => {
            dispatch(fetchCourses(user_id));
            dispatch(fetchIntakes());
          }}
          sx={{ bgcolor: "#3b82f6", "&:hover": { bgcolor: "#2563eb" }, borderRadius: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: "#f4f6f8", minHeight: "100vh" }}>
      <Typography
        variant="h4"
        sx={{ fontWeight: 700, color: "#1e3a8a", mb: 2, textAlign: "center" }}
      >
        My Tracks and Courses
      </Typography>

      {/* Intake Warning */}
      {intakeWarning && (
        <Alert severity="warning" sx={{ mb: 2, maxWidth: "1200px", mx: "auto" }}>
          No intake data found for courses. Ensure courses are assigned to intakes in the backend.
        </Alert>
      )}

      {/* Instructor Warning */}
      {instructorWarning && editingCourse && (
        <Alert severity="warning" sx={{ mb: 2, maxWidth: "1200px", mx: "auto" }}>
          {instructorWarning}
        </Alert>
      )}

      {/* Filters */}
      <Grid container spacing={3} sx={{ mb: 3, maxWidth: "1200px", mx: "auto" }}>
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
          <FormControl variant="outlined" fullWidth>
            <InputLabel>Course</InputLabel>
            <Select
              value={selectedCourse}
              onChange={handleCourseFilterChange}
              label="Course"
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value=""><em>All Courses</em></MenuItem>
              {courseNames.map((name) => (
                <MenuItem key={name} value={name}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl variant="outlined" fullWidth>
            <InputLabel>Instructor</InputLabel>
            <Select
              value={selectedInstructor}
              onChange={handleInstructorFilterChange}
              label="Instructor"
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value=""><em>All Instructors</em></MenuItem>
              {instructorNames.map((name) => (
                <MenuItem key={name} value={name}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
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
              height: "56px",
              bgcolor: "#3b82f6",
              "&:hover": { bgcolor: "#2563eb" },
              borderRadius: 2,
            }}
          >
            Reset Filters
          </Button>
        </Grid>
      </Grid>

      {/* Table */}
      <StyledPaper sx={{ maxWidth: "1200px", mx: "auto" }}>
        <TableContainer sx={{ maxHeight: "calc(100vh - 300px)" }}>
          <Table stickyHeader aria-label="tracks and courses table">
            <TableHead>
              <TableRow>
                {[
                  { id: "trackName", label: "Track Name", minWidth: 150 },
                  { id: "courseName", label: "Course Name", minWidth: 150 },
                  { id: "instructor", label: "Instructor", minWidth: 150 },
                  { id: "intake", label: "Intake", minWidth: 150 },
                  { id: "actions", label: "Actions", minWidth: 180, align: "right" },
                ].map((column) => (
                  <StyledTableCell
                    key={column.id}
                    align={column.align || "left"}
                    sx={{ minWidth: column.minWidth, cursor: column.id !== "actions" ? "pointer" : "default" }}
                    onClick={column.id !== "actions" ? () => handleSort(column.id) : undefined}
                  >
                    {column.label}
                    {sortBy === column.id && column.id !== "actions" && (
                      <Box component="span" sx={{ ml: 1 }}>
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </Box>
                    )}
                  </StyledTableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" sx={{ color: "#64748b" }}>
                      No tracks or courses found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedRows.map((row, index) => (
                  <StyledTableRow key={`${row.courseId}-${row.trackId}-${index}`}>
                    <TableCell sx={{ p: 2 }}>{row.trackName}</TableCell>
                    <TableCell sx={{ p: 2 }}>{row.courseName}</TableCell>
                    <TableCell sx={{ p: 2 }}>
                      {row.instructor?.name || "Not assigned"}
                    </TableCell>
                    <TableCell sx={{ p: 2 }}>
                      {row.intakeName}
                    </TableCell>
                    <TableCell align="right" sx={{ p: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() =>
                          handleEditClick(
                            courses.find((c) => c.id === row.courseId),
                            row.trackName
                          )
                        }
                        disabled={instructorsLoading || reassignInstructorLoading}
                        sx={{
                          borderColor: "#3b82f6",
                          color: "#3b82f6",
                          "&:hover": { borderColor: "#2563eb", color: "#2563eb" },
                          borderRadius: 2,
                          mr: 1,
                        }}
                      >
                        Assign Instructor
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleDeleteClick(row.courseId, row.trackId, row.courseName, row.trackName)}
                        disabled={
                          instructorsLoading ||
                          reassignInstructorLoading ||
                          deletingRows.has(`${row.courseId}-${row.trackId}`)
                        }
                        sx={{
                          borderColor: "#ef4444",
                          color: "#ef4444",
                          "&:hover": { borderColor: "#dc2626", color: "#dc2626" },
                          borderRadius: 2,
                        }}
                      >
                        {deletingRows.has(`${row.courseId}-${row.trackId}`) ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          "Delete"
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

      {/* Edit Course Modal */}
      <Modal
        open={!!editingCourse}
        onClose={handleModalClose}
        aria-labelledby="edit-course-modal"
        aria-describedby="edit-course-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 400 },
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Assign Instructor for: {editingCourse?.name}
          </Typography>

          {instructorWarning && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {instructorWarning}
            </Alert>
          )}

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="instructor-select-label">Instructor</InputLabel>
            <Select
              labelId="instructor-select-label"
              value={selectedInstructorId}
              onChange={(e) => setSelectedInstructorId(e.target.value)}
              label="Instructor"
              sx={{ borderRadius: 2 }}
              disabled={reassignInstructorLoading || !getTrackInstructors(selectedTrackId).length}
            >
              <MenuItem value="">
                <em>Not assigned</em>
              </MenuItem>
              {getTrackInstructors(selectedTrackId).map((instructor) => (
                <MenuItem key={instructor.id} value={instructor.id}>
                  {instructor.full_name || instructor.username || `Instructor ${instructor.id}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={handleModalClose}
              sx={{ mr: 2, borderColor: "#64748b", color: "#64748b", borderRadius: 2 }}
              disabled={reassignInstructorLoading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveChanges}
              disabled={!selectedInstructorId || reassignInstructorLoading}
              startIcon={reassignInstructorLoading ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{
                bgcolor: "#3b82f6",
                "&:hover": { bgcolor: "#2563eb" },
                borderRadius: 2,
              }}
            >
              Save Changes
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        aria-labelledby="delete-confirmation-dialog"
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to remove <strong>{deleteCourseTrack?.courseName}</strong> from the <strong>{deleteCourseTrack?.trackName}</strong> track?
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
            onClick={handleDeleteDialogClose}
            sx={{ color: "#64748b", borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={!isDeleteConfirmed || removeCourseFromTrackLoading}
            startIcon={removeCourseFromTrackLoading ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{
              bgcolor: "#ef4444",
              "&:hover": { bgcolor: "#dc2626" },
              borderRadius: 2,
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for success/error */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReAssignCourses;