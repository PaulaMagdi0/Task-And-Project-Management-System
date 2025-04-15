// File: src/redux/branchSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api';

// Async thunk to fetch all branches
export const fetchBranches = createAsyncThunk(
  'branches/fetchBranches',
  async (_, thunkAPI) => {
    try {
      const response = await apiClient.get('/branch_location/'); // Adjust endpoint if needed
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || error.message || 'Failed to fetch branches'
      );
    }
  }
);

// Async thunk to create a new branch
export const createBranch = createAsyncThunk(
  'branches/createBranch',
  async (branchData, thunkAPI) => {
    try {
      const response = await apiClient.post('/branch_location/', branchData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || error.message || 'Failed to create branch'
      );
    }
  }
);

// Async thunk to delete a branch
export const deleteBranch = createAsyncThunk(
  'branches/deleteBranch',
  async (branchId, thunkAPI) => {
    try {
      // Use a URL without a trailing slash to match your backend route for deletion
      await apiClient.delete(`/branch_location/${branchId}`);
      return branchId;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || error.message || 'Failed to delete branch'
      );
    }
  }
);

const branchSlice = createSlice({
  name: 'branches',
  initialState: {
    branches: [],
    loading: false,
    error: null,
    message: '',
  },
  reducers: {
    clearBranchState: (state) => {
      state.loading = false;
      state.error = null;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    // Handle fetchBranches
    builder.addCase(fetchBranches.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBranches.fulfilled, (state, action) => {
      state.loading = false;
      state.branches = action.payload;
    });
    builder.addCase(fetchBranches.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Handle createBranch
    builder.addCase(createBranch.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createBranch.fulfilled, (state, action) => {
      state.loading = false;
      state.branches.push(action.payload); // add the new branch to the array
      state.message = 'Branch created successfully.';
    });
    builder.addCase(createBranch.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Handle deleteBranch
    builder.addCase(deleteBranch.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteBranch.fulfilled, (state, action) => {
      state.loading = false;
      state.branches = state.branches.filter(
        (branch) => branch.id !== action.payload
      );
      state.message = 'Branch deleted successfully.';
    });
    builder.addCase(deleteBranch.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const { clearBranchState } = branchSlice.actions;
export default branchSlice.reducer;
