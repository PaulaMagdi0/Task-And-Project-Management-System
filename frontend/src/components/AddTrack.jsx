// File: src/pages/AdminDashboard/TracksManagement.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTracks,
  createTrack,
  updateTrack,
  deleteTrack,
  clearTrackState,
} from "../redux/tracksSlice";
import { fetchBranches } from '../redux/branchSlice';
import { fetchStaff } from '../redux/staffSlice';
import {
  Box,
  Collapse,
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
  const { tracks, loading, error: serverError, message } = useSelector(state => state.tracks);
  const { branches: allBranches } = useSelector(state => state.branches);
  const { staff: allStaff } = useSelector(state => state.staff);
  const { branch: managerBranch } = useSelector(state => state.auth);

  // Only supervisors in this branch
  const supervisors = allStaff.filter(s => s.role === 'supervisor' && s.branch?.id === managerBranch.id);
  // Only show this branch
  const branchOptions = allBranches.filter(b => b.id === managerBranch.id);
  // Only show tracks in this branch
  const filteredTracks = tracks.filter(t => t.branch === managerBranch.id);

  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    track_type: 'ICC',
    supervisor: '',
    branch: managerBranch.id,
  });
  const [editingId, setEditingId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState(null);
  const [localError, setLocalError] = useState('');

  const flattenError = err => {
    if (!err) return '';
    if (typeof err === 'string') return err;
    return Object.entries(err)
      .map(([f, v]) => `${f}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join(' | ');
  };

  useEffect(() => {
    dispatch(fetchTracks());
    dispatch(fetchBranches());
    dispatch(fetchStaff());
    return () => dispatch(clearTrackState());
  }, [dispatch]);

  useEffect(() => {
    setLocalError(serverError ? flattenError(serverError) : '');
  }, [serverError]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(fd => ({ ...fd, [name]: value }));
    if (localError) setLocalError('');
  };

  const toggleForm = () => {
    if (!formOpen) {
      setEditingId(null);
      setFormData({ name: '', description: '', track_type: 'ICC', supervisor: '', branch: managerBranch.id });
      setLocalError('');
    }
    setFormOpen(o => !o);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLocalError('');

    const trimmedName = formData.name.trim();
    const duplicate = filteredTracks.find(t => t.name === trimmedName && t.track_type === formData.track_type);
    if (duplicate && (!editingId || duplicate.id !== editingId)) {
      setLocalError('A track with this name and type already exists in your branch.');
      return;
    }
    if (!trimmedName) { setLocalError('Name is required.'); return; }
    if (!formData.description.trim()) { setLocalError('Description is required.'); return; }

    const payload = { ...formData, name: trimmedName };
    let result;
    if (editingId) {
      result = await dispatch(updateTrack({ id: editingId, data: payload }));
      if (!result.error) setEditingId(null);
    } else {
      result = await dispatch(createTrack(payload));
    }

    if (result.error) {
      setLocalError(flattenError(result.payload || result.error));
    } else {
      dispatch(fetchTracks());
      setFormOpen(false);
    }
  };

  const handleEdit = track => {
    setEditingId(track.id);
    setFormData({
      name: track.name,
      description: track.description,
      track_type: track.track_type,
      supervisor: track.supervisor || '',
      branch: managerBranch.id,
    });
    setFormOpen(true);
  };

  const openDeleteDialog = id => {
    setTrackToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (trackToDelete != null) {
      await dispatch(deleteTrack(trackToDelete));
      setDeleteDialogOpen(false);
      dispatch(fetchTracks());
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>Track Management</Typography>
      {localError && <Alert severity="error" sx={{ mb:2 }}>{localError}</Alert>}
      {message && <Alert severity="success" sx={{ mb:2 }}>{message}</Alert>}

      <Box sx={{ mb:2 }}>
        <Button variant="contained" onClick={toggleForm}>{formOpen ? 'Cancel' : 'Add Track'}</Button>
      </Box>

      <Collapse in={formOpen}>
        <Paper sx={{ p:2, mb:3 }}>
          <Typography variant="h6" gutterBottom>{editingId ? 'Edit Track' : 'Add New Track'}</Typography>
          <form onSubmit={handleSubmit}>
            <TextField name="name" label="Track Name" value={formData.name} onChange={handleChange} fullWidth required sx={{ mb:2 }} />
            <TextField name="description" label="Description" value={formData.description} onChange={handleChange} fullWidth required multiline rows={3} sx={{ mb:2 }} />
            <FormControl fullWidth required sx={{ mb:2 }}>
              <InputLabel>Track Type</InputLabel>
              <Select name="track_type" value={formData.track_type} onChange={handleChange} label="Track Type">
                <MenuItem value="ICC">ICC</MenuItem>
                <MenuItem value="9month">9 Month</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb:2 }}>
              <InputLabel>Supervisor</InputLabel>
              <Select name="supervisor" value={formData.supervisor} onChange={handleChange} label="Supervisor">
                <MenuItem value=""><em>None</em></MenuItem>
                {supervisors.map(s => <MenuItem key={s.id} value={s.id}>{s.username}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth required sx={{ mb:2 }}>
              <InputLabel>Branch</InputLabel>
              <Select name="branch" value={formData.branch} label="Branch" disabled>
                {branchOptions.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="contained" type="submit" disabled={loading}>{editingId ? 'Update Track' : 'Create Track'}</Button>
          </form>
        </Paper>
      </Collapse>

      <Paper sx={{ p:2 }}>
        <Typography variant="h6" gutterBottom>Tracks in Your Branch</Typography>
        {loading ? <Typography>Loading...</Typography> : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Supervisor</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTracks.map(t => (
                <TableRow key={t.id}>
                  <TableCell>{t.id}</TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.track_type}</TableCell>
                  <TableCell>{t.supervisor ? supervisors.find(s => s.id === t.supervisor)?.username : 'None'}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => handleEdit(t)}>Edit</Button>
                    <Button size="small" color="error" sx={{ ml:1 }} onClick={() => openDeleteDialog(t.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent><Typography>Are you sure you want to delete this track?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrackManagement;
