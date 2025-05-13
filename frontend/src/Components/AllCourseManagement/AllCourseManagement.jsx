import React, { useEffect, useState, useMemo } from "react";
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
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCourses,
  updateCourse,
  deleteCourse,
  clearCourseStatus,
} from "../../redux/coursesSlice";
import { fetchInstructors } from "../../redux/supervisorsSlice";

const AllCourseManagement = () => {
  const dispatch = useDispatch();
  const {
    allCourses,
    status: {
      fetchAllCoursesLoading: loading,
      fetchAllCoursesError: error,
      success: message,
    },
  } = useSelector((state) => state.courses);
  const { instructors } = useSelector((state) => state.supervisors);
  const { user_id } = useSelector((state) => state.auth);

  // State management
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    courseId: null,
    name: "",
    description: "",
    instructor: "",
    intake: "",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [localError, setLocalError] = useState("");
  const [searchName, setSearchName] = useState("");
  const [selectedTrack, setSelectedTrack] = useState(""); // Added missing state
  const [selectedIntake, setSelectedIntake] = useState(""); // Added missing state
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Placeholder for missing variables (replace with actual data)
  const tracks = []; // Replace with actual tracks data
  const intakes = []; // Replace with actual intakes data
  const intakeCourses = {}; // Replace with actual intakeCourses data
  const availableIntakes = []; // Replace with actual availableIntakes data
  const instructorsTrackData = []; // Replace with actual instructorsTrackData
  const intakeNames = intakes.map((intake) => intake.name); // Derived from intakes
  const instructorsLoading = false; // Replace with actual loading state
  const fetchAvailableIntakesLoading = false; // Replace with actual loading state
  const updateCourseLoading = false; // Replace with actual loading state

  // Fetch courses and instructors on mount
  useEffect(() => {
    dispatch(fetchCourses(user_id));
    dispatch(fetchInstructors());
  }, [dispatch, user_id]);

  // Log data for debugging
  useEffect(() => {
    console.log("Courses data:", allCourses);
    console.log("Instructors data:", instructors);
  }, [allCourses, instructors]);

  // Handle error and success states
  useEffect(() => {
    if (error) setLocalError(error);
    else setLocalError("");
  }, [error]);

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
        return intake?.name || "Not assigned";
      }
    }
    return "Not assigned";
  };

  // Filter instructors by track
  const getTrackInstructors = (trackId) => {
    if (!trackId || !allCourses?.length || !instructors?.length) {
      return [];
    }
    const trackCourses = allCourses.filter((course) =>
      course.tracks?.some((track) => track.id === trackId)
    );
    const instructorIds = [
      ...new Set(
        trackCourses
          .filter((course) => course.instructor?.id)
          .map((course) => course.instructor.id)
      ),
    ];
    return instructors.filter((instructor) =>
      instructorIds.includes(instructor.id)
    );
  };

  // Handlers
  const openEditDialog = (course, trackId = null) => {
    setEditData({
      courseId: course.id,
      name: course.name,
      description: course.description || "",
      instructor: course.instructor?.id || "",
      intake: course.intake || "",
      trackId: trackId || "",
    });
    setEditDialogOpen(true);
  };

  const handleEditChange = async () => {
    const { courseId, name, description, instructor, intake } = editData;

    if (!name) {
      setLocalError("Course name is required.");
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
      setLocalError(err.message || "Failed to update course.");
    }
  };

  const openDeleteDialog = (id) => {
    setCourseToDelete(id);
    setConfirmText("");
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await dispatch(deleteCourse(courseToDelete)).unwrap();
      setDeleteDialogOpen(false);
      dispatch(fetchCourses(user_id));
    } catch (err) {
      setLocalError(err.message || "Failed to delete course.");
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
    setSearchName("");
    setSelectedTrack("");
    setSelectedIntake("");
  };

  // Filter courses
  const filteredCourses = useMemo(() => {
    const courses = Array.isArray(allCourses)
      ? allCourses
      : allCourses?.results || [];
    return courses.filter((course) =>
      searchName
        ? course.name.toLowerCase().includes(searchName.toLowerCase())
        : true
    );
  }, [allCourses, searchName]);

  // Get course details for delete confirmation
  const courses = Array.isArray(allCourses)
    ? allCourses
    : allCourses?.results || [];
  const course = courses.find((c) => c.id === courseToDelete);
  const isConfirmValid = confirmText.trim().toLowerCase() === "i agree";

  return (
    <Box sx={{ p: 4, bgcolor: "#f4f6f8" }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: 700, color: "#1e3a8a", textAlign: "center" }}
      >
        Manage Courses
      </Typography>

      {/* Filters and Search */}
      <Grid
        container
        spacing={3}
        sx={{ mb: 3, maxWidth: "1200px", mx: "auto" }}
      >
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
            <InputLabel>Track</InputLabel>
            <Select
              value={selectedTrack}
              onChange={handleTrackFilterChange}
              label="Track"
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">
                <em>All Tracks</em>
              </MenuItem>
              {tracks.map((track) => (
                <MenuItem key={track.id} value={track.id}>
                  {track.name}
                </MenuItem>
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
              <MenuItem value="">
                <em>All Intakes</em>
              </MenuItem>
              {intakeNames.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
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

      {/* Error Alert */}
      {localError && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: "1200px", mx: "auto" }}>
          {localError}
        </Alert>
      )}
      {/* Success Message Alert */}
      {message && (
        <Alert
          severity="success"
          sx={{ mb: 2, maxWidth: "1200px", mx: "auto" }}
        >
          {message}
        </Alert>
      )}

      <Paper
        sx={{
          p: 2,
          maxWidth: "1200px",
          mx: "auto",
          borderRadius: 2,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography variant="h6" gutterBottom>
          Course List
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, bgcolor: "#f1f5f9" }}>
                  ID
                </TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: "#f1f5f9" }}>
                  Name
                </TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: "#f1f5f9" }}>
                  Instructor
                </TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: "#f1f5f9" }}>
                  Description
                </TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: "#f1f5f9" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredCourses.length > 0 ? (
                filteredCourses.map((course) => (
                  <TableRow
                    key={course.id}
                    sx={{ "&:hover": { bgcolor: "#f8fafc" } }}
                  >
                    <TableCell>{course.id}</TableCell>
                    <TableCell>{course.name}</TableCell>
                    <TableCell>
                      {course.instructor_name || "Not assigned"}
                    </TableCell>
                    <TableCell>{course.description || "-"}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => openEditDialog(course)}
                      >
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No courses found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
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
            onChange={(e) =>
              setEditData({ ...editData, description: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <FormControl variant="outlined" fullWidth sx={{ mb: 2 }}>
            <InputLabel>Instructor</InputLabel>
            <Select
              value={editData.instructor}
              onChange={(e) =>
                setEditData({ ...editData, instructor: e.target.value })
              }
              label="Instructor"
              sx={{ borderRadius: 2 }}
              disabled={instructorsLoading || !getTrackInstructors(editData.trackId).length}
            >
              <MenuItem value="">
                <em>Not assigned</em>
              </MenuItem>
              {instructors.map((instructor) => (
                <MenuItem key={instructor.id} value={instructor.id}>
                  {instructor.full_name ||
                    instructor.username ||
                    `Instructor ${instructor.id}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl variant="outlined" fullWidth sx={{ mb: 2 }}>
            <InputLabel>Intake</InputLabel>
            <Select
              value={editData.intake}
              onChange={(e) =>
                setEditData({ ...editData, intake: e.target.value })
              }
              label="Intake"
              sx={{ borderRadius: 2 }}
              disabled={fetchAvailableIntakesLoading}
            >
              <MenuItem value="">
                <em>Not assigned</em>
              </MenuItem>
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
            sx={{ color: "#64748b", borderRadius: 2 }}
            disabled={updateCourseLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditChange}
            variant="contained"
            disabled={updateCourseLoading}
            sx={{
              bgcolor: "#3b82f6",
              "&:hover": { bgcolor: "#2563eb" },
              borderRadius: 2,
            }}
          >
            {updateCourseLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Save"
            )}
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
        <DialogTitle sx={{ bgcolor: "#d32f2f", color: "white", py: 2 }}>
          Confirm Course Deletion
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography
            variant="body1"
            color="error"
            sx={{ mb: 2, fontWeight: 500 }}
          >
            Warning: You are about to permanently delete the course{" "}
            <strong>{course?.name || "Unknown"}</strong> from the database.
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
            This action cannot be undone. To confirm, please type{" "}
            <strong>"I agree"</strong> below.
          </Typography>
          <TextField
            label="Type 'I agree' to confirm"
            variant="outlined"
            fullWidth
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            sx={{ mb: 2 }}
            helperText={
              !isConfirmValid && confirmText
                ? 'Text must exactly match "I agree"'
                : ""
            }
            error={!isConfirmValid && confirmText}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: "#64748b", borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={!isConfirmValid || isDeleting}
            sx={{
              bgcolor: "#ef4444",
              "&:hover": { bgcolor: "#dc2626" },
              borderRadius: 2,
            }}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AllCourseManagement;