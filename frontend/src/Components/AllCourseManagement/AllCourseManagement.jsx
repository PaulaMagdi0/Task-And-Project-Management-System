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
import Assignments from "./../../pages/Instructor/Assignments";
import WarningIcon from "@mui/icons-material/Warning";
import Submissions from "./../Submissions/Submissions";

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
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [localError, setLocalError] = useState("");
  const [searchName, setSearchName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState(""); // State for "I agree" input

  // Fetch courses and instructors on mount
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
    if (error) setLocalError(error);
    else setLocalError("");
  }, [error]);

  // Clear success message after 3 seconds
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
      description: course.description,
      instructor: course.instructor || "",
    });
    setEditDialogOpen(true);
    // Fetch track-specific intakes
    if (trackId) {
      dispatch(fetchAvailableIntakes([trackId]));
    }
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
    console.log("Opening delete dialog for course ID:", id);
    setCourseToDelete(id);
    setConfirmText(""); // Reset confirmation text
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    console.log("Deleting course with ID:", courseToDelete);
    setIsDeleting(true);
    try {
      await dispatch(deleteCourse(courseToDelete.courseId)).unwrap();
      setDeleteDialogOpen(false);
      dispatch(fetchCourses(user_id));
    } catch (err) {
      console.error("Delete error:", err);
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
  };

  // Filter courses
  const filteredCourses = useMemo(() => {
    // Ensure courses is an array; use results if allCourses is an object
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

        {loading ? (
          <Typography>Loading...</Typography>
        ) : filteredCourses.length > 0 ? (
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
              {filteredCourses.map((course) => (
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
              disabled={instructorsLoading || fetchAvailableIntakesLoading || !getTrackInstructors(editData.trackId).length}
            >
              <MenuItem value="">
                <em>Not assigned</em>
              </MenuItem>
              {instructors.map((instructor) => (
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
            <strong>{course?.name || "Unknown"}</strong> associated with your
            track from the database as well{" "}
            <strong>Assignments , Submissions</strong> attached to it.
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
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AllCourseManagement;
