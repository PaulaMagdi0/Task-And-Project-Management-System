import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAssignments } from "../../redux/viewassignmentSlice";
import {
  Box,
  Typography,
  CircularProgress,
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
} from "@mui/material";
import {
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  DeleteForever as DeleteForeverIcon,
  Warning as WarningIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";

const Assignments = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const dispatch = useDispatch();
  const { assignments, loading, error } = useSelector(
    (state) => state.listassignments
  );
  const { user_id } = useSelector((state) => state.auth);

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

  useEffect(() => {
    if (user_id) dispatch(fetchAssignments(user_id));
  }, [dispatch, user_id]);

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
      const response = await fetch(
        `http://127.0.0.1:8000/api/assignments/${selectedAssignment.id}/`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setAlert({
          open: true,
          message: "Assignment deleted successfully",
          severity: "success",
        });
        dispatch(fetchAssignments(user_id));
      }
    } catch (error) {
      setAlert({ open: true, message: "Delete failed", severity: "error" });
    }
    setDeleteConfirmationOpen(false);
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
        // Only send changed fields
        due_date: editData.due_date
          ? `${editData.due_date}T23:59:00Z`
          : undefined,
        end_date: editData.end_date
          ? `${editData.end_date}T23:59:00Z`
          : undefined,
      };

      // Remove undefined values
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, v]) => v !== undefined)
      );

      const response = await fetch(
        `http://127.0.0.1:8000/api/assignments/${assignmentId}/`,
        {
          method: "PATCH", // Changed to PATCH for partial updates
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanPayload),
        }
      );

      if (response.ok) {
        setAlert({
          open: true,
          message: "Assignment updated successfully",
          severity: "success",
        });
        dispatch(fetchAssignments(user_id));
        handleAccordionToggle(null);
      }
    } catch (error) {
      setAlert({ open: true, message: "Update failed", severity: "error" });
    }
  };

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      {/* Alert Snackbar */}
      <Typography
        variant="h4"
        component="h2"
        sx={{ fontWeight: "bold", marginBottom: 3 }}
      >
        Assignments
      </Typography>
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert severity={alert.severity} sx={{ width: "100%" }}>
          {alert.message}
        </Alert>
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

      {/* Assignments Table */}
      <TableContainer
        component={Paper}
        sx={{ width: "100%", overflowY: "hidden" }}
      >
        <Table sx={{ minWidth: 650, tableLayout: "fixed" }}>
          <TableHead sx={{ bgcolor: theme.palette.primary.main }}>
            <TableRow>
              <TableCell sx={{ color: "white" }}>Title</TableCell>
              <TableCell sx={{ color: "white" }}>Type</TableCell>
              <TableCell sx={{ color: "white" }}>Track & Course</TableCell>
              <TableCell sx={{ color: "white" }}>Due Date</TableCell>
              <TableCell sx={{ color: "white" }}>End Date</TableCell>
              <TableCell sx={{ color: "white" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.map((assignment) => (
              <React.Fragment key={assignment.id}>
                <TableRow hover>
                  {/* Existing table cells */}
                  <TableCell>{assignment.title}</TableCell>
                  <TableCell>
                    <Chip label={assignment.assignment_type} color="primary" />
                  </TableCell>
                  <TableCell>
                    {assignment.track_name} / {assignment.course_name}
                  </TableCell>
                  <TableCell>
                    {new Date(assignment.due_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(assignment.end_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
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

                {/* Updated Accordion Section */}
                <TableRow>
                  <TableCell colSpan={6} sx={{ p: 0 }}>
                    <Accordion
                      expanded={expandedAssignment === assignment.id}
                      sx={{ width: "100%" }}
                    >
                      <AccordionSummary sx={{ display: "none" }} />
                      <AccordionDetails sx={{ px: 0 }}>
                        <Box
                          component="form"
                          sx={{
                            p: 3,
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                            width: "100%",
                          }}
                        >
                          {/* Form Fields */}
                          <Box
                            sx={{
                              display: "flex",
                              gap: 2,
                              flexDirection: isMobile ? "column" : "row",
                              width: "100%",
                            }}
                          >
                            <TextField
                              fullWidth
                              label="Title"
                              value={editData.title || ""}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  title: e.target.value,
                                })
                              }
                            />

                            <TextField
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
                            >
                              <MenuItem value="task">Task</MenuItem>
                              <MenuItem value="project">Project</MenuItem>
                              <MenuItem value="exam">Exam</MenuItem>
                            </TextField>
                          </Box>

                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Description"
                            value={editData.description || ""}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                description: e.target.value,
                              })
                            }
                          />

                          <Box
                            sx={{
                              display: "flex",
                              gap: 2,
                              flexDirection: isMobile ? "column" : "row",
                              width: "100%",
                            }}
                          >
                            <TextField
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
                            fullWidth
                            label="File URL"
                            value={editData.file_url || ""}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                file_url: e.target.value,
                              })
                            }
                          />

                          <Box
                            sx={{
                              display: "flex",
                              gap: 2,
                              justifyContent: "flex-end",
                              mt: 2,
                            }}
                          >
                            <Button
                              variant="contained"
                              onClick={() => handleEditSubmit(assignment.id)}
                            >
                              Save Changes
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => handleAccordionToggle(null)}
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
    </Box>
  );
};

export default Assignments;
