import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAssignments } from "../../redux/viewassignmentSlice";
import apiClient from "../../services/api";
import {
  Box,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  IconButton,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  GetApp as DownloadIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";

const Assignments = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const dispatch = useDispatch();
  const { assignments, loading, error } = useSelector(
    (state) => state.listassignments
  );
  const { user_id, token } = useSelector((state) => state.auth);

  // State management
  const [expandedAssignment, setExpandedAssignment] = useState(null);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [editData, setEditData] = useState({});
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  // Filter states
  const [filterType, setFilterType] = useState("");
  const [filterDueDateStart, setFilterDueDateStart] = useState("");
  const [filterDueDateEnd, setFilterDueDateEnd] = useState("");
  const [filterTrackCourse, setFilterTrackCourse] = useState("");

  useEffect(() => {
    if (user_id) dispatch(fetchAssignments(user_id));
  }, [dispatch, user_id]);

  // Filter assignments based on user input
  const filteredAssignments = assignments.filter((assignment) => {
    const dueDate = new Date(assignment.due_date);
    const startDate = filterDueDateStart ? new Date(filterDueDateStart) : null;
    const endDate = filterDueDateEnd ? new Date(filterDueDateEnd) : null;

    return (
      (!filterType || assignment.assignment_type === filterType) &&
      (!startDate || dueDate >= startDate) &&
      (!endDate || dueDate <= endDate) &&
      (!filterTrackCourse ||
        assignment.track_name
          .toLowerCase()
          .includes(filterTrackCourse.toLowerCase()) ||
        assignment.course_name
          .toLowerCase()
          .includes(filterTrackCourse.toLowerCase()))
    );
  });

  // Clear all filters
  const handleClearFilters = () => {
    setFilterType("");
    setFilterDueDateStart("");
    setFilterDueDateEnd("");
    setFilterTrackCourse("");
  };

  // Accordion toggle handler
  const handleAccordionToggle = (assignmentId) => {
    setExpandedAssignment(
      expandedAssignment === assignmentId ? null : assignmentId
    );
  };

  // Delete handlers
  const handleDeleteInitiate = (assignment) => {
    setSelectedAssignment(assignment);
    setDeleteConfirmationOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await apiClient.delete(`/assignments/${selectedAssignment.id}/`);
      setAlert({
        open: true,
        message: "Assignment deleted successfully",
        severity: "success",
      });
      dispatch(fetchAssignments(user_id));
    } catch (error) {
      setAlert({ open: true, message: "Delete failed", severity: "error" });
    }
    setDeleteConfirmationOpen(false);
  };

  // Report download handler
  const handleDownloadReport = async (assignmentId) => {
    try {
      const response = await apiClient.get(
        `/submission/assignments/${assignmentId}/report/`,
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `assignment-${assignmentId}-report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setAlert({
        open: true,
        message: "Failed to download report",
        severity: "error",
      });
    }
  };

  const handleEditInitiate = (assignment) => {
    setEditData({
      title: assignment.title,
      description: assignment.description,
      due_date: assignment.due_date.slice(0, 10),
      end_date: assignment.end_date.slice(0, 10),
      assignment_type: assignment.assignment_type,
      file_url: assignment.file_url || "",
    });
    handleAccordionToggle(assignment.id);
  };

  const handleEditSubmit = async (assignmentId) => {
    try {
      const payload = {
        ...editData,
        due_date: editData.due_date
          ? `${editData.due_date}T23:59:00Z`
          : undefined,
        end_date: editData.end_date
          ? `${editData.end_date}T23:59:00Z`
          : undefined,
      };

      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, v]) => v !== undefined)
      );

      await apiClient.patch(`/assignments/${assignmentId}/`, cleanPayload);
      setAlert({
        open: true,
        message: "Assignment updated successfully",
        severity: "success",
      });
      dispatch(fetchAssignments(user_id));
      handleAccordionToggle(null);
    } catch (error) {
      setAlert({ open: true, message: "Update failed", severity: "error" });
    }
  };

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      <Typography
        variant="h4"
        component="h2"
        sx={{ fontWeight: "bold", mb: 3 }}
      >
        Assignments
      </Typography>

      {/* Filter Section */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Assignment Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Assignment Type"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="task">Task</MenuItem>
                <MenuItem value="project">Project</MenuItem>
                <MenuItem value="exam">Exam</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              variant="outlined"
              type="date"
              label="Due Date (Start)"
              value={filterDueDateStart}
              onChange={(e) => setFilterDueDateStart(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              variant="outlined"
              type="date"
              label="Due Date (End)"
              value={filterDueDateEnd}
              onChange={(e) => setFilterDueDateEnd(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              variant="outlined"
              label="Track or Course"
              value={filterTrackCourse}
              onChange={(e) => setFilterTrackCourse(e.target.value)}
              placeholder="Enter track or course name"
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              sx={{ mt: 1 }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert severity={alert.severity}>{alert.message}</Alert>
      </Snackbar>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmationOpen}
        onClose={() => setDeleteConfirmationOpen(false)}
        PaperProps={{ sx: { borderRadius: 2, width: "450px" } }}
      >
        <DialogTitle sx={{ textAlign: "center", pt: 4 }}>
          <WarningIcon color="warning" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h6" component="div">
            Delete Assignment
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ textAlign: "center", pb: 3 }}>
          <Typography variant="body1">
            Are you sure you want to delete
          </Typography>
          <Typography variant="body1" fontWeight={600} color="text.primary">
            "{selectedAssignment?.title}"?
          </Typography>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center", pb: 4, gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setDeleteConfirmationOpen(false)}
            sx={{ width: 120 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            startIcon={<DeleteIcon />}
            sx={{ width: 120 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <TableContainer
        component={Paper}
        sx={{ width: "100%", overflowY: "hidden" }}
      >
        <Table sx={{ minWidth: 650, tableLayout: "fixed" }}>
          <TableHead sx={{ bgcolor: theme.palette.primary.main }}>
            <TableRow>
              <TableCell sx={{ color: "white", textAlign: "center" }}>
                Title
              </TableCell>
              <TableCell sx={{ color: "white", textAlign: "center" }}>
                Type
              </TableCell>
              <TableCell sx={{ color: "white", textAlign: "center" }}>
                Track & Course
              </TableCell>
              <TableCell sx={{ color: "white", textAlign: "center" }}>
                Due Date
              </TableCell>
              <TableCell sx={{ color: "white", textAlign: "center" }}>
                End Date
              </TableCell>
              <TableCell sx={{ color: "white", textAlign: "center" }}>
                Report
              </TableCell>
              <TableCell sx={{ color: "white", textAlign: "center" }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredAssignments.map((assignment) => (
              <React.Fragment key={assignment.id}>
                <TableRow hover>
                  <TableCell sx={{ textAlign: "center" }}>
                    {assignment.title}
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    <Chip label={assignment.assignment_type} color="primary" />
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    {assignment.track_name} / {assignment.course_name}
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    {new Date(assignment.due_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    {new Date(assignment.end_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    <Tooltip title="Download Report">
                      <IconButton
                        onClick={() => handleDownloadReport(assignment.id)}
                        color="primary"
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    <Box display="flex" gap={1}>
                      <Tooltip title="Edit">
                        <IconButton
                          onClick={() => handleEditInitiate(assignment)}
                        >
                          <EditIcon color="primary" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          onClick={() => handleDeleteInitiate(assignment)}
                        >
                          <DeleteIcon color="error" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell colSpan={7} sx={{ p: 0 }}>
                    <Accordion
                      expanded={expandedAssignment === assignment.id}
                      sx={{
                        width: "100%",
                        border: "1px solid #e0e0e0",
                        borderRadius: 2,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      }}
                    >
                      <AccordionSummary sx={{ display: "none" }} />
                      <AccordionDetails sx={{ px: 0 }}>
                        <Box
                          component="form"
                          sx={{
                            p: 3,
                            display: "flex",
                            flexDirection: "column",
                            gap: 3,
                            width: "100%",
                            bgcolor: "background.paper",
                          }}
                        >
                          <Box
                            sx={{
                              display: "grid",
                              gap: 3,
                              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                              "& .MuiTextField-root": { mb: 0 },
                            }}
                          >
                            <TextField
                              variant="outlined"
                              fullWidth
                              label="Title"
                              value={editData.title || ""}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  title: e.target.value,
                                })
                              }
                              InputLabelProps={{ shrink: true }}
                            />

                            <TextField
                              variant="outlined"
                              fullWidth
                              select
                              label="Assignment Type"
                              value={editData.assignment_type || ""}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  assignment_type: e.target.value,
                                })
                              }
                              InputLabelProps={{ shrink: true }}
                            >
                              <MenuItem value="task">Task</MenuItem>
                              <MenuItem value="project">Project</MenuItem>
                              <MenuItem value="exam">Exam</MenuItem>
                            </TextField>
                          </Box>

                          <TextField
                            variant="outlined"
                            fullWidth
                            multiline
                            rows={4}
                            label="Description"
                            value={editData.description || ""}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                description: e.target.value,
                              })
                            }
                            InputLabelProps={{ shrink: true }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                alignItems: "flex-start",
                              },
                            }}
                          />

                          <Box
                            sx={{
                              display: "grid",
                              gap: 3,
                              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                            }}
                          >
                            <TextField
                              variant="outlined"
                              fullWidth
                              type="date"
                              label="Due Date"
                              InputLabelProps={{ shrink: true }}
                              value={editData.due_date || ""}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  due_date: e.target.value,
                                })
                              }
                            />

                            <TextField
                              variant="outlined"
                              fullWidth
                              type="date"
                              label="End Date"
                              InputLabelProps={{ shrink: true }}
                              value={editData.end_date || ""}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  end_date: e.target.value,
                                })
                              }
                            />
                          </Box>

                          <TextField
                            variant="outlined"
                            fullWidth
                            label="File URL"
                            value={editData.file_url || ""}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                file_url: e.target.value,
                              })
                            }
                            InputLabelProps={{ shrink: true }}
                            placeholder="https://drive.google.com/..."
                          />

                          <Box
                            sx={{
                              display: "flex",
                              gap: 2,
                              justifyContent: "flex-end",
                              mt: 2,
                              borderTop: "1px solid #eee",
                              pt: 3,
                            }}
                          >
                            <Button
                              variant="contained"
                              onClick={() => handleEditSubmit(assignment.id)}
                              sx={{
                                minWidth: 140,
                                textTransform: "uppercase",
                                fontWeight: "bold",
                              }}
                            >
                              Save Changes
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => handleAccordionToggle(null)}
                              sx={{
                                minWidth: 100,
                                textTransform: "uppercase",
                              }}
                            >
                              Cancel
                            </Button>
                          </Box>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredAssignments.length === 0 && (
        <Typography variant="body1" sx={{ mt: 2, textAlign: "center" }}>
          No assignments match the applied filters.
        </Typography>
      )}
    </Box>
  );
};

export default Assignments;