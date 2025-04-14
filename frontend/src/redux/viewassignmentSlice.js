import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import apiClient from '../services/api';

export const fetchAssignments = createAsyncThunk(
  'assignments/fetchAssignments',
  async (instructorId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`assignments/instructor/${instructorId}/assignments/`);
      return response.data;
    } catch (error) {
      if (error.response) {
        // Server responded with a status other than 2xx
        return rejectWithValue({
          message: error.response.data.message || 'Request failed',
          status: error.response.status
        });
      } else if (error.request) {
        // Request was made but no response received
        return rejectWithValue({
          message: 'No response from server',
          status: 503 // Service Unavailable
        });
      } else {
        // Something happened in setting up the request
        return rejectWithValue({
          message: error.message,
          status: 500 // Internal Server Error
        });
      }
    }
  }
);

const initialState = {
  assignments: [],
  students: [],
  tracks: [],
  courses: [],
  loading: false,
  error: null,
  lastFetched: null,
};

const assignmentsSlice = createSlice({
  name: 'assignments',
  initialState,
  reducers: {
    clearAssignments: (state) => {
      state.assignments = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.lastFetched = new Date().toISOString();

        // Normalize the response structure
        const payload = action.payload;
        
        if (payload.assignments) {
          // Structured response
          state.assignments = payload.assignments;
          state.students = payload.students || state.students;
          state.tracks = payload.tracks || state.tracks;
          state.courses = payload.courses || state.courses;
        } else if (Array.isArray(payload)) {
          // Array response
          state.assignments = payload;
        }
      })
      .addCase(fetchAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error.message;
      });
  },
});

export const { clearAssignments } = assignmentsSlice.actions;
export default assignmentsSlice.reducer;