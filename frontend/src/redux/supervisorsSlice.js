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

const supervisorsSlice = createSlice({
  name: 'supervisors',
  initialState: {
    loading: false,
    error: null,
    message: '',
  },
  reducers: {
    clearSupervisorState: (state) => {
      state.loading = false;
      state.error = null;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createSupervisor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSupervisor.fulfilled, (state, action) => {
        state.loading = false;
        state.message = 'Supervisor created successfully!';
      })
      .addCase(createSupervisor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error creating supervisor';
      })
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
      });
  },
});

export const { clearSupervisorState } = supervisorsSlice.actions;
export default supervisorsSlice.reducer;
