// File: src/components/StaffManagement.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  clearStaffState,
} from '../redux/staffSlice';
import { fetchBranches } from '../redux/branchSlice';
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

const StaffManagement = () => {
  const dispatch = useDispatch();

  // Redux selectors
  const { staff, loading, error, message } = useSelector((state) => state.staff);
  const { branches } = useSelector((state) => state.branches);

  // Local form state for creating/updating staff
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

  // Editing state (null if creating new)
  const [editingId, setEditingId] = useState(null);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffIdToDelete, setStaffIdToDelete] = useState(null);

  // Local error to display validation messages
  const [localError, setLocalError] = useState('');

  // Flatten error object into a string (if not already done)
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

  // Update local error from Redux error state
  useEffect(() => {
    if (error) {
      setLocalError(flattenError(error));
    } else {
      setLocalError('');
    }
  }, [error]);

  // Fetch staff and branches when the component mounts
  useEffect(() => {
    dispatch(fetchStaff());
    dispatch(fetchBranches());
    // Removed clearStaffState() here so errors remain visible when returned from the backend.
  }, [dispatch]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (localError) setLocalError('');
  };

  // Handle form submission for creating or updating staff member
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // Client-side validation for role and branch based on role
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

    let actionResult;
    if (editingId) {
      actionResult = await dispatch(updateStaff({ id: editingId, data: formData }));
      if (!actionResult.error) {
        setEditingId(null);
        dispatch(clearStaffState()); // Clear on successful update
      }
    } else {
      actionResult = await dispatch(createStaff(formData));
      if (!actionResult.error) {
        dispatch(clearStaffState()); // Clear on successful creation
      }
    }
    // If operation succeeded, reset form and refresh staff list.
    if (!actionResult.error) {
      setFormData({
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: '',
        branch_id: '',
      });
      dispatch(fetchStaff());
    }
  };

  // Populate form for editing
  const handleEdit = (member) => {
    setEditingId(member.id);
    setFormData({
      username: member.username || '',
      password: '', // leave blank on edit
      first_name: member.first_name || '',
      last_name: member.last_name || '',
      email: member.email || '',
      phone: member.phone || '',
      role: member.role || '',
      branch_id: member.branch ? member.branch.id : '',
    });
  };

  // Open delete dialog
  const openDeleteDialog = (id) => {
    setStaffIdToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Handle staff deletion
  const handleDelete = async () => {
    if (staffIdToDelete) {
      await dispatch(deleteStaff(staffIdToDelete));
      setDeleteDialogOpen(false);
      setStaffIdToDelete(null);
      dispatch(fetchStaff());
    }
  };

  // Exclude admin staff from display
  const filteredStaff = staff.filter((member) => member.role !== 'admin');

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Staff Management
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

      {/* Form for creating/updating staff */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          {editingId ? 'Edit Staff Member' : 'Add New Staff Member'}
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            fullWidth
            required={!editingId}
            sx={{ mb: 2 }}
            helperText={editingId ? 'Leave blank to keep current password.' : ''}
          />
          <TextField
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }} required>
            <InputLabel id="role-label">Role</InputLabel>
            <Select
              labelId="role-label"
              name="role"
              value={formData.role}
              onChange={handleChange}
              label="Role"
            >
              <MenuItem value="instructor">Instructor</MenuItem>
              <MenuItem value="supervisor">Supervisor</MenuItem>
         
            </Select>
          </FormControl>
          <FormControl
            fullWidth
            sx={{ mb: 2 }}
            required={formData.role === 'supervisor' || formData.role === 'branch_manager' || formData.role === 'instructor'}
          >
            <InputLabel id="branch-label">Branch</InputLabel>
            <Select
              labelId="branch-label"
              name="branch_id"
              value={formData.branch_id}
              onChange={handleChange}
              label="Branch"
            >
              {branches &&
                branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <Button variant="contained" type="submit" disabled={loading}>
            {editingId ? 'Update Staff' : 'Create Staff'}
          </Button>
        </form>
      </Paper>

      {/* Staff list table */}
      <Paper sx={{ p: 2, mt: 3 }}>
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
              {filteredStaff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.id}</TableCell>
                  <TableCell>{member.username}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>{member.branch ? member.branch.name : 'None'}</TableCell>
                  <TableCell>
                    <Button onClick={() => handleEdit(member)} variant="outlined" size="small">
                      Edit
                    </Button>
                    <Button
                      onClick={() => openDeleteDialog(member.id)}
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
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this staff member?</Typography>
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
