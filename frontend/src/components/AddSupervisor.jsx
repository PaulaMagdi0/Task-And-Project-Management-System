import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  clearStaffState,
} from '../redux/staffSlice';
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

const StaffManagement = () => {
  const dispatch = useDispatch();
  const { staff, loading, error: serverError, message } = useSelector(s => s.staff);
  const { branch } = useSelector(s => s.auth); // Branch manager's branch from token

  // Log staff for debugging
  console.log('Staff state:', staff);

  // Normalize staff to ensure it's an array
  const normalizedStaff = Array.isArray(staff)
    ? staff
    : staff?.results || [];

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [localError, setLocalError] = useState('');

  const flattenError = err => {
    if (!err) return '';
    if (typeof err === 'string') return err;
    return Object.entries(err)
      .map(([f, v]) => `${f}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join(' | ');
  };

  useEffect(() => {
    dispatch(fetchStaff());
    return () => dispatch(clearStaffState());
  }, [dispatch]);

  useEffect(() => {
    if (serverError) setLocalError(flattenError(serverError));
    else setLocalError('');
  }, [serverError]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(fd => ({ ...fd, [name]: value }));
    if (localError) setLocalError('');
  };

  const toggleForm = () => {
    if (!formOpen) {
      setEditingId(null);
      setFormData({ username: '', password: '', first_name: '', last_name: '', email: '', phone: '', role: '' });
      setLocalError('');
    }
    setFormOpen(o => !o);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLocalError('');
    // Validation
    if (!formData.username.trim() || !formData.email.trim()) {
      setLocalError('Username and email are required.');
      return;
    }
    if (!['supervisor', 'instructor'].includes(formData.role)) {
      setLocalError('Role must be Supervisor or Instructor.');
      return;
    }
    if (!branch?.id) {
      setLocalError('Branch ID is missing.');
      return;
    }
    // Prepare payload, include branch_id automatically
    const payload = {
      ...formData,
      branch_id: branch.id,
    };
    if (editingId && !payload.password) delete payload.password;

    let result;
    if (editingId) {
      result = await dispatch(updateStaff({ id: editingId, data: payload }));
      if (!result.error) setEditingId(null);
    } else {
      result = await dispatch(createStaff(payload));
    }
    if (result.error) {
      setLocalError(flattenError(result.payload || result.error));
    } else {
      dispatch(fetchStaff());
      setFormOpen(false);
    }
  };

  const handleEdit = member => {
    setEditingId(member.id);
    setFormData({
      username: member.username,
      password: '',
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      phone: member.phone,
      role: member.role,
    });
    setFormOpen(true);
  };

  const openDeleteDialog = id => {
    setStaffToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (staffToDelete != null) {
      await dispatch(deleteStaff(staffToDelete));
      setDeleteDialogOpen(false);
      dispatch(fetchStaff());
    }
  };

  // Show only supervisors & instructors in manager's branch
  const filteredStaff = normalizedStaff.filter(m =>
    ['supervisor', 'instructor'].includes(m.role) && m.branch?.id === branch?.id
  );

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Team Members
      </Typography>

      {localError && <Alert severity="error" sx={{ mb: 2 }}>{localError}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      {/* Add Member Button */}
      <Box sx={{ mb: 2 }}>
        <Button variant="contained" onClick={toggleForm}>
          {formOpen ? 'Cancel' : 'Add Member'}
        </Button>
      </Box>

      {/* Collapsible Form */}
      <Collapse in={formOpen}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {editingId ? 'Edit Member' : 'Add New Member'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              name="username"
              label="Username"
              value={formData.username}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            {!editingId && (
              <TextField
                name="password"
                label="Password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                fullWidth
                required
                sx={{ mb: 2 }}
              />
            )}
            <TextField
              name="first_name"
              label="First Name"
              value={formData.first_name}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              name="last_name"
              label="Last Name"
              value={formData.last_name}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              name="phone"
              label="Phone"
              value={formData.phone}
              onChange={handleChange}
              fullWidth
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth required sx={{ mb: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                label="Role"
              >
                <MenuItem value="instructor">Instructor</MenuItem>
                <MenuItem value="supervisor">Supervisor</MenuItem>
              </Select>
            </FormControl>
            <Button variant="contained" type="submit" disabled={loading}>
              {editingId ? 'Update Member' : 'Create Member'}
            </Button>
          </form>
        </Paper>
      </Collapse>

      {/* Staff List Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Branch Team
        </Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : normalizedStaff.length === 0 ? (
          <Typography>No staff available.</Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStaff.length > 0 ? (
                filteredStaff.map(member => (
                  <TableRow key={member.id}>
                    <TableCell>{member.id}</TableCell>
                    <TableCell>{member.username}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => handleEdit(member)}>
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        sx={{ ml: 1 }}
                        onClick={() => openDeleteDialog(member.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography>No supervisors or instructors in this branch.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this member?</Typography>
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

export default StaffManagement;