// File: src/components/StaffManagement.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  clearStaffState,
} from '../../redux/staffSlice';
import { fetchBranches } from '../../redux/branchSlice';
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
  const { staff, loading, error, message } = useSelector(s => s.staff);
  const { branches } = useSelector(s => s.branches);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
    branch_id: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    dispatch(fetchStaff());
    dispatch(fetchBranches());
  }, [dispatch]);

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

  useEffect(() => {
    if (error) {
      setLocalError(flattenError(error));
    } else {
      setLocalError('');
    }
  }, [error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (localError) setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!formData.username || !formData.email) {
      setLocalError('Username and email are required.');
      return;
    }
    if (!formData.role) {
      setLocalError('Role is required.');
      return;
    }
    if (
      (formData.role === 'supervisor' || formData.role === 'branch_manager') &&
      !formData.branch_id
    ) {
      setLocalError('Branch is required for Supervisor and Branch Manager roles.');
      return;
    }

    const payload = { ...formData };
    if (editingId && !payload.password) delete payload.password;

    let result;
    if (editingId) {
      result = await dispatch(updateStaff({ id: editingId, data: payload }));
      if (!result.error) {
        setEditingId(null);
        dispatch(clearStaffState());
      }
    } else {
      result = await dispatch(createStaff(payload));
      if (!result.error) dispatch(clearStaffState());
    }

    if (!result.error) {
      setFormData({ username: '', password: '', first_name: '', last_name: '', email: '', phone: '', role: '', branch_id: '' });
      dispatch(fetchStaff());
      setFormOpen(false);
    }
  };

  const handleEdit = (member) => {
    setEditingId(member.id);
    setFormData({
      username: member.username || '',
      password: '',
      first_name: member.first_name || '',
      last_name: member.last_name || '',
      email: member.email || '',
      phone: member.phone || '',
      role: member.role || '',
      branch_id: member.branch ? member.branch.id : '',
    });
    setFormOpen(true);
  };

  const openDeleteDialog = (id) => {
    setStaffToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (staffToDelete) {
      await dispatch(deleteStaff(staffToDelete));
      setDeleteDialogOpen(false);
      setStaffToDelete(null);
      dispatch(fetchStaff());
    }
  };

  const toggleForm = () => {
    if (!formOpen) {
      setEditingId(null);
      setFormData({ username: '', password: '', first_name: '', last_name: '', email: '', phone: '', role: '', branch_id: '' });
    }
    setFormOpen(prev => !prev);
  };

  const filteredStaff = staff.filter(m => m.role !== 'admin');

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Staff Management
      </Typography>

      {localError && <Alert severity="error" sx={{ mb: 2 }}>{localError}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      {/* Add Staff Member Button */}
      <Box sx={{ mb: 2 }}>
        <Button variant="contained" onClick={toggleForm}>
          {formOpen ? 'Cancel' : 'Add Staff Member'}
        </Button>
      </Box>

      {/* Collapsible Form */}
      <Collapse in={formOpen}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {editingId ? 'Edit Staff Member' : 'Add New Staff Member'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField name="username" label="Username" value={formData.username} onChange={handleChange} fullWidth required sx={{ mb: 2 }} />
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
            <TextField name="first_name" label="First Name" value={formData.first_name} onChange={handleChange} fullWidth required sx={{ mb: 2 }} />
            <TextField name="last_name" label="Last Name" value={formData.last_name} onChange={handleChange} fullWidth required sx={{ mb: 2 }} />
            <TextField name="email" label="Email" type="email" value={formData.email} onChange={handleChange} fullWidth required sx={{ mb: 2 }} />
            <TextField name="phone" label="Phone" value={formData.phone} onChange={handleChange} fullWidth sx={{ mb: 2 }} />
            <FormControl fullWidth sx={{ mb: 2 }} required>
              <InputLabel>Role</InputLabel>
              <Select name="role" value={formData.role} onChange={handleChange} label="Role">
                <MenuItem value="instructor">Instructor</MenuItem>
                <MenuItem value="supervisor">Supervisor</MenuItem>
                <MenuItem value="branch_manager">Branch Manager</MenuItem>
                <MenuItem value="admin">System Administrator</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }} required={['supervisor', 'branch_manager'].includes(formData.role)}>
              <InputLabel>Branch</InputLabel>
              <Select name="branch_id" value={formData.branch_id} onChange={handleChange} label="Branch">
                {branches.map(b => (
                  <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" type="submit" disabled={loading}>
              {editingId ? 'Update Staff' : 'Create Staff'}
            </Button>
          </form>
        </Paper>
      </Collapse>

      {/* Staff List Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Staff Members List
        </Typography>
        {loading ? (
          <Typography>Loading staff...</Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStaff.map(member => (
                <TableRow key={member.id}>
                  <TableCell>{member.id}</TableCell>
                  <TableCell>{member.username}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>{member.branch?.name || 'None'}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => handleEdit(member)}>Edit</Button>
                    <Button size="small" color="error" sx={{ ml: 1 }} onClick={() => openDeleteDialog(member.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this staff member?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffManagement;
