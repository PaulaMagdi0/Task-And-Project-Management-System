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
  Button,
  TextField,
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
} from '@mui/material';

const BranchManagement = () => {
  const dispatch = useDispatch();
  const { branches, loading, error, message } = useSelector((state) => state.branches);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [branchIdToDelete, setBranchIdToDelete] = useState(null);

  // Fetch branches on component mount.
  useEffect(() => {
    dispatch(fetchBranches());
    // Optionally, clear residual state when unmounting:
    return () => {
      dispatch(clearBranchState());
    };
  }, [dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    await dispatch(createBranch(formData));
    setFormData({ name: '', address: '', city: '', state: '' });
    // Re-fetch branches in case new branch is added.
    dispatch(fetchBranches());
  };

  const openDeleteDialog = (branchId) => {
    setBranchIdToDelete(branchId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteBranch = async () => {
    if (branchIdToDelete) {
      await dispatch(deleteBranch(branchIdToDelete));
      setDeleteDialogOpen(false);
      setBranchIdToDelete(null);
      // Refresh branches after deletion
      dispatch(fetchBranches());
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Branch Management 
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      {message && <Typography color="primary">{message}</Typography>}

      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6">Add New Branch</Typography>
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
            required
            sx={{ mb: 2 }}
          />
          <TextField
            name="city"
            label="City"
            value={formData.city}
            onChange={handleChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            name="state"
            label="State/Province"
            value={formData.state}
            onChange={handleChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <Button variant="contained" type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Branch'}
          </Button>
        </form>
      </Paper>

      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6">Existing Branches</Typography>
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
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {branches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell>{branch.id}</TableCell>
                  <TableCell>{branch.name}</TableCell>
                  <TableCell>{branch.code}</TableCell>
                  <TableCell>{branch.address}</TableCell>
                  <TableCell>{branch.city}</TableCell>
                  <TableCell>{branch.state}</TableCell>
                  <TableCell>
                    {branch.manager && branch.manager.name
                      ? branch.manager.name
                      : 'None'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="error"
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

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this branch?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteBranch} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BranchManagement;
