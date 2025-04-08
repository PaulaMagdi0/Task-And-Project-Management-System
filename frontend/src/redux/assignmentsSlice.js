import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api';

// Fetch assignments for the logged-in instructor
export const fetchAssignments = createAsyncThunk(
  'assignments/fetchAssignments',
  async (instructorId, thunkAPI) => {
    try {
      const response = await apiClient.get(`/assignments/?instructor=${instructorId}`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue('Failed to fetch assignments');
    }
  }
);

// Create a new assignment
export const createAssignment = createAsyncThunk(
  'assignments/createAssignment',
  async (assignmentData, thunkAPI) => {
    try {
      const response = await apiClient.post('/assignments/', assignmentData);
      return response.data; // This returns the newly created assignment
    } catch (error) {
      return thunkAPI.rejectWithValue('Failed to create assignment');
    }
  }
);

const assignmentsSlice = createSlice({
  name: 'assignments',
  initialState: {
    assignments: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.loading = false;
        state.assignments = action.payload;
      })
      .addCase(fetchAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAssignment.fulfilled, (state, action) => {
        state.loading = false;
        state.assignments.push(action.payload); // Add the newly created assignment to the list
      })
      .addCase(createAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default assignmentsSlice.reducer;
