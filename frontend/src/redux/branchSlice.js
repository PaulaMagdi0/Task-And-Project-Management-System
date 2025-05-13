import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../services/api";

// Async thunk to fetch all branches
export const fetchBranches = createAsyncThunk(
  "branches/fetchBranches",
  async (_, thunkAPI) => {
    try {
      const response = await apiClient.get("/branch_location/");
      console.log("Branches API response:", response.data);
      const data = response.data;
      return Array.isArray(data)
        ? data
        : data?.results || data?.branches || data?.data || [];
    } catch (error) {
      const errorMessage =
        error.response?.data || error.message || "Failed to fetch branches";
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// Async thunk to create a new branch
export const createBranch = createAsyncThunk(
  "branches/createBranch",
  async (branchData, thunkAPI) => {
    try {
      const response = await apiClient.post("/branch_location/", branchData);
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data || error.message || "Failed to create branch";
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// Async thunk to delete a branch
export const deleteBranch = createAsyncThunk(
  "branches/deleteBranch",
  async (branchId, thunkAPI) => {
    try {
      await apiClient.delete(`/branch_location/${branchId}`);
      return branchId;
    } catch (error) {
      const errorMessage =
        error.response?.data || error.message || "Failed to delete branch";
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

const branchSlice = createSlice({
  name: "branches",
  initialState: {
    branches: [],
    loading: false,
    error: null,
    message: "",
  },
  reducers: {
    clearBranchState: (state) => {
      state.loading = false;
      state.error = null;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    // Handle fetchBranches
    builder
      .addCase(fetchBranches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBranches.fulfilled, (state, action) => {
        state.loading = false;
        state.branches = action.payload;
      })
      .addCase(fetchBranches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.branches = []; // Ensure branches is an array on error
      })
      // Handle createBranch
      .addCase(createBranch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBranch.fulfilled, (state, action) => {
        state.loading = false;
        state.branches.push(action.payload);
        state.message = "Branch created successfully.";
      })
      .addCase(createBranch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Handle deleteBranch
      .addCase(deleteBranch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBranch.fulfilled, (state, action) => {
        state.loading = false;
        state.branches = state.branches.filter(
          (branch) => branch.id !== action.payload
        );
        state.message = "Branch deleted successfully.";
      })
      .addCase(deleteBranch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearBranchState } = branchSlice.actions;
export default branchSlice.reducer;
