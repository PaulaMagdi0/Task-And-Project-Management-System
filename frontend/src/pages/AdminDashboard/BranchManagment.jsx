// File: src/components/BranchManagement.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchBranches,
  createBranch,
  deleteBranch,
  clearBranchState,
} from '../../redux/branchSlice';
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
  Alert,
} from '@mui/material';

const BranchManagement = () => {
  const dispatch = useDispatch();
  const { branches, loading, error: serverError, message } = useSelector(s => s.branches);

  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
  });
  const [localError, setLocalError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);

  // Utility to flatten error messages
  const flattenError = err => {
    if (!err) return '';
    if (typeof err === 'string') return err;
    return Object.entries(err)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join(' | ');
  };

  useEffect(() => {
    dispatch(fetchBranches());
    return () => {
      dispatch(clearBranchState());
    };
  }, [dispatch]);

  useEffect(() => {
    // sync server error
    if (serverError) setLocalError(flattenError(serverError));
  }, [serverError]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (localError) setLocalError('');
  };

  const handleCreateBranch = async e => {
    e.preventDefault();
    setLocalError('');
    // Basic client-side: name required
    if (!formData.name.trim()) {
      setLocalError('Branch name is required.');
      return;
    }
    const result = await dispatch(createBranch(formData));
    if (result.error) {
      // Show validation error
      setLocalError(flattenError(result.payload || result.error));
    } else {
      // Success
      setFormData({ name: '', address: '', city: '', state: '' });
      dispatch(fetchBranches());
      setFormOpen(false);
    }
  };

  const toggleForm = () => {
    if (!formOpen) setLocalError('');
    setFormOpen(open => !open);
  };

  const openDeleteDialog = id => {
    setBranchToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (branchToDelete != null) {
      await dispatch(deleteBranch(branchToDelete));
      setDeleteDialogOpen(false);
      setBranchToDelete(null);
      dispatch(fetchBranches());
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Branch Management
      </Typography>

      {localError && <Alert severity="error" sx={{ mb: 2 }}>{localError}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      {/* Add Branch Button */}
      <Box sx={{ mb: 2 }}>
        <Button variant="contained" onClick={toggleForm}>
          {formOpen ? 'Cancel' : 'Add Branch'}
        </Button>
      </Box>

      {/* Collapsible Form */}
      <Collapse in={formOpen}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Add New Branch
          </Typography>
          <form onSubmit={handleCreateBranch}>
            <TextField
              name="name"
              label="Branch Name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              name="address"
              label="Address"
              value={formData.address}
              onChange={handleChange}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              name="city"
              label="City"
              value={formData.city}
              onChange={handleChange}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              name="state"
              label="State/Province"
              value={formData.state}
              onChange={handleChange}
              fullWidth
              sx={{ mb: 2 }}
            />
            <Button variant="contained" type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Branch'}
            </Button>
          </form>
        </Paper>
      </Collapse>

      {/* Branches Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Existing Branches
        </Typography>
        {loading ? (
          <Typography>Loading branches...</Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>City</TableCell>
                <TableCell>State</TableCell>
                <TableCell>Manager</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {branches.map(branch => (
                <TableRow key={branch.id}>
                  <TableCell>{branch.id}</TableCell>
                  <TableCell>{branch.name}</TableCell>
                  <TableCell>{branch.code}</TableCell>
                  <TableCell>{branch.address}</TableCell>
                  <TableCell>{branch.city}</TableCell>
                  <TableCell>{branch.state}</TableCell>
                  <TableCell>{branch.manager?.name || 'None'}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => openDeleteDialog(branch.id)}
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
          <Typography>Are you sure you want to delete this branch?</Typography>
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

export default BranchManagement;
