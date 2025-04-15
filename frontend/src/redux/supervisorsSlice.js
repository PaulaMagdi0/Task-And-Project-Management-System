// File: src/redux/supervisorsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api';

export const createSupervisor = createAsyncThunk(
  'supervisors/createSupervisor',
  async (supervisorData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/staff/create/', supervisorData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data || error.message);
    }
  }
);

export const bulkUploadSupervisors = createAsyncThunk(
  'supervisors/bulkUploadSupervisors',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('excel_file', file);
      const response = await apiClient.post('/staff/bulk-upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data || error.message);
    }
  }
);

// ✅ New: Fetch all instructors
export const fetchInstructors = createAsyncThunk(
  'supervisors/fetchInstructors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/staff/instructors/');
      return response.data; // Expecting an array of instructors
    } catch (error) {
      return rejectWithValue(error.response.data || error.message);
    }
  }
);

const supervisorsSlice = createSlice({
  name: 'supervisors',
  initialState: {
    loading: false,
    error: null,
    message: '',
    supervisor: null,
    instructors: [], // ✅ Add instructors array
  },
  reducers: {
    clearSupervisorState: (state) => {
      state.loading = false;
      state.error = null;
      state.message = '';
      state.supervisor = null;
      state.instructors = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Supervisor
      .addCase(createSupervisor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSupervisor.fulfilled, (state, action) => {
        state.loading = false;
        state.message = 'Supervisor created successfully!';
        state.supervisor = action.payload;
      })
      .addCase(createSupervisor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error creating supervisor';
      })

      // Bulk Upload
      .addCase(bulkUploadSupervisors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkUploadSupervisors.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message || 'Bulk upload successful!';
      })
      .addCase(bulkUploadSupervisors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error during bulk upload';
      })

      // ✅ Fetch Instructors
      .addCase(fetchInstructors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInstructors.fulfilled, (state, action) => {
        state.loading = false;
        state.instructors = action.payload;
      })
      .addCase(fetchInstructors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error fetching instructors';
      });
  },
});

export const { clearSupervisorState } = supervisorsSlice.actions;
export default supervisorsSlice.reducer;
