// File: src/pages/AdminDashboard/TracksManagment.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTracks,
  createTrack,
  updateTrack,
  deleteTrack,
  clearTrackState,
} from "../../redux/tracksSlice";
import { fetchBranches } from '../../redux/branchSlice';
import { fetchStaff } from '../../redux/staffSlice';
import {
  Box,
  TextField,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';

const TrackManagement = () => {
  const dispatch = useDispatch();

  // Redux selectors: tracks, branches, and all staff members.
  const { tracks, loading, error, message } = useSelector((state) => state.tracks);
  const { branches } = useSelector((state) => state.branches);
  const { staff: allStaff } = useSelector((state) => state.staff);

  // Filter supervisors from staff (we assume only users with role 'supervisor' can supervise tracks).
  const supervisors = allStaff ? allStaff.filter(member => member.role === 'supervisor') : [];

  // Local form state for creating/updating a track.
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    track_type: 'ICC',
    supervisor: '',
    branch: '',
  });

  // Editing state (null if creating a new track).
  const [editingId, setEditingId] = useState(null);

  // Delete confirmation dialog state.
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [trackIdToDelete, setTrackIdToDelete] = useState(null);

  // Local error state for validation messages.
  const [localError, setLocalError] = useState('');

  // Flatten error object into a plain string if needed.
  const flattenError = (err) => {
    if (!err) return '';
    if (typeof err === 'string') return err;
    return Object.entries(err)
      .map(([field, messages]) =>
        Array.isArray(messages)
          ? `${field}: ${messages.join(', ')}`
          : `${field}: ${messages}`
      )
      .join(' | ');
  };

  // Update local error from the Redux error state.
  useEffect(() => {
    if (error) {
      setLocalError(flattenError(error));
    } else {
      setLocalError('');
    }
  }, [error]);

  // Fetch tracks, branches, and staff when the component mounts.
  useEffect(() => {
    dispatch(fetchTracks());
    dispatch(fetchBranches());
    dispatch(fetchStaff());
  }, [dispatch]);

  // Handle input field changes.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (localError) setLocalError('');
  };

  // Handle form submission for creating or updating a track.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // Basic client-side validation.
    if (!formData.name.trim()) {
      setLocalError('Name is required.');
      return;
    }
    if (!formData.description.trim()) {
      setLocalError('Description is required.');
      return;
    }
    if (!formData.track_type) {
      setLocalError('Track type is required.');
      return;
    }
    if (!formData.branch) {
      setLocalError('Branch is required.');
      return;
    }

    let actionResult;
    if (editingId) {
      actionResult = await dispatch(updateTrack({ id: editingId, data: formData }));
      if (!actionResult.error) {
        setEditingId(null);
        dispatch(clearTrackState());
      }
    } else {
      actionResult = await dispatch(createTrack(formData));
      if (!actionResult.error) {
        dispatch(clearTrackState());
      }
    }
    if (!actionResult.error) {
      setFormData({
        name: '',
        description: '',
        track_type: 'ICC',
        supervisor: '',
        branch: '',
      });
      dispatch(fetchTracks());
    }
  };

  // Populate form for editing an existing track.
  const handleEdit = (track) => {
    setEditingId(track.id);
    setFormData({
      name: track.name || '',
      description: track.description || '',
      track_type: track.track_type || 'ICC',
      supervisor: track.supervisor || '',
      branch: track.branch || '',
    });
  };

  // Open the delete confirmation dialog.
  const openDeleteDialog = (id) => {
    setTrackIdToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Handle the deletion of a track.
  const handleDelete = async () => {
    if (trackIdToDelete) {
      await dispatch(deleteTrack(trackIdToDelete));
      setDeleteDialogOpen(false);
      setTrackIdToDelete(null);
      dispatch(fetchTracks());
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Track Management
      </Typography>

      {(localError || error) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {localError}
        </Alert>
      )}
      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      {/* Form for creating/updating tracks */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          {editingId ? 'Edit Track' : 'Add New Track'}
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Track Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            required
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth required sx={{ mb: 2 }}>
            <InputLabel id="track-type-label">Track Type</InputLabel>
            <Select
              labelId="track-type-label"
              name="track_type"
              value={formData.track_type}
              onChange={handleChange}
              label="Track Type"
            >
              <MenuItem value="ICC">ICC</MenuItem>
              <MenuItem value="9month">9 Month</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="supervisor-label">Supervisor</InputLabel>
            <Select
              labelId="supervisor-label"
              name="supervisor"
              value={formData.supervisor}
              onChange={handleChange}
              label="Supervisor"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {supervisors.map((sup) => (
                <MenuItem key={sup.id} value={sup.id}>
                  {sup.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth required sx={{ mb: 2 }}>
            <InputLabel id="branch-label">Branch</InputLabel>
            <Select
              labelId="branch-label"
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              label="Branch"
            >
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" type="submit" disabled={loading}>
            {editingId ? 'Update Track' : 'Create Track'}
          </Button>
        </form>
      </Paper>

      {/* Table listing all tracks */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Tracks List
        </Typography>
        {loading ? (
          <Typography>Loading tracks...</Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Track Type</TableCell>
                <TableCell>Supervisor</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tracks.map((track) => (
                <TableRow key={track.id}>
                  <TableCell>{track.id}</TableCell>
                  <TableCell>{track.name}</TableCell>
                  <TableCell>{track.track_type}</TableCell>
                  <TableCell>
                    {track.supervisor 
                      ? (supervisors.find(sup => sup.id === track.supervisor)?.username || 'N/A')
                      : 'None'}
                  </TableCell>
                  <TableCell>
                    {track.branch 
                      ? (branches.find(b => b.id === track.branch)?.name || 'N/A')
                      : 'None'}
                  </TableCell>
                  <TableCell>
                    <Button onClick={() => handleEdit(track)} variant="outlined" size="small">
                      Edit
                    </Button>
                    <Button
                      onClick={() => openDeleteDialog(track.id)}
                      variant="outlined"
                      color="error"
                      size="small"
                      sx={{ ml: 1 }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this track?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrackManagement;
