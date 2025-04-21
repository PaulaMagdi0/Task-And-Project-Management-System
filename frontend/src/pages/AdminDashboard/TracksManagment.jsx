// File: src/pages/AdminDashboard/TracksManagement.jsx
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
  const { tracks = [], loading, error: serverError, message } = useSelector(state => state.tracks);
  const { branches = [] } = useSelector(state => state.branches);
  const { staff: allStaff = [] } = useSelector(state => state.staff);
  const supervisors = allStaff.filter(member => member.role === 'supervisor');

  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    track_type: 'ICC',
    supervisor: '',
    branch: '',
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
    if (serverError) setLocalError(flattenError(serverError)); else setLocalError('');
  }, [serverError]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(fd => ({ ...fd, [name]: value }));
    if (localError) setLocalError('');
  };

  const toggleForm = () => {
    if (!formOpen) {
      setEditingId(null);
      setFormData({ name: '', description: '', track_type: 'ICC', supervisor: '', branch: '' });
      setLocalError('');
    }
    setFormOpen(o => !o);
  };

  const handleSubmit = async e => {
    e.preventDefault(); setLocalError('');
    if (!formData.name.trim()) { setLocalError('Name is required.'); return; }
    if (!formData.description.trim()) { setLocalError('Description is required.'); return; }
    if (!formData.track_type) { setLocalError('Track type is required.'); return; }
    if (!formData.branch) { setLocalError('Branch is required.'); return; }

    const payload = { ...formData, name: formData.name.trim() };
    let result;
    if (editingId) {
      result = await dispatch(updateTrack({ id: editingId, data: payload }));
      if (!result.error) setEditingId(null);
    } else {
      result = await dispatch(createTrack(payload));
    }

    if (result.error) setLocalError(flattenError(result.payload || result.error));
    else { dispatch(fetchTracks()); setFormOpen(false); }
  };

  const handleEdit = track => {
    setEditingId(track.id);
    setFormData({
      name: track.name,
      description: track.description,
      track_type: track.track_type,
      supervisor: track.supervisor || '',
      branch: track.branch || '',
    });
    setFormOpen(true);
  };

  const openDeleteDialog = id => {
    setTrackToDelete(id); setDeleteDialogOpen(true);
  };
  const handleDelete = async () => {
    if (trackToDelete != null) {
      await dispatch(deleteTrack(trackToDelete));
      setDeleteDialogOpen(false);
      dispatch(fetchTracks());
    }
  };

  // Filter supervisors dynamically based on selected branch in form
  const filteredSupervisors = supervisors.filter(sup => sup.branch?.id === formData.branch);

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
                {filteredSupervisors.map(s => <MenuItem key={s.id} value={s.id}>{s.username}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth required sx={{ mb:2 }}>
              <InputLabel>Branch</InputLabel>
              <Select name="branch" value={formData.branch} onChange={handleChange} label="Branch">
                {branches.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="contained" type="submit" disabled={loading}>{editingId ? 'Update Track' : 'Create Track'}</Button>
          </form>
        </Paper>
      </Collapse>

      <Paper sx={{ p:2 }}>
        <Typography variant="h6" gutterBottom>Tracks List</Typography>
        {loading ? (<Typography>Loading tracks...</Typography>) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell><TableCell>Name</TableCell><TableCell>Type</TableCell><TableCell>Supervisor</TableCell><TableCell>Branch</TableCell><TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tracks.map(t => (
                <TableRow key={t.id}>
                  <TableCell>{t.id}</TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.track_type}</TableCell>
                  <TableCell>{t.supervisor ? supervisors.find(s=>s.id===t.supervisor)?.username : 'None'}</TableCell>
                  <TableCell>{branches.find(b=>b.id===t.branch)?.name}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={()=>handleEdit(t)}>Edit</Button>
                    <Button size="small" color="error" sx={{ ml:1 }} onClick={()=>openDeleteDialog(t.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={deleteDialogOpen} onClose={()=>setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent><Typography>Are you sure you want to delete this track?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={()=>setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrackManagement;
