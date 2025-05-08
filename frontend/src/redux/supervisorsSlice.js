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

export const fetchInstructors = createAsyncThunk(
  'supervisors/fetchInstructors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/staff/instructors/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data || error.message);
    }
  }
);

export const fetchInstructorsTrackData = createAsyncThunk(
  'supervisors/fetchInstructorsTrackData',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { supervisors: { instructors } } = getState();
      const trackDataPromises = instructors.map(async (instructor) => {
        try {
          const response = await apiClient.get(`/staff/track-and-courses/${instructor.id}/`);
          console.log(`Raw track data response for instructor ${instructor.id}:`, response.data);
          const tracks = (response.data.courses || [])
            .flatMap(course => course.tracks || [])
            .filter(track => track && track.id && track.name)
            .map(track => ({
              id: track.id,
              name: track.name,
            }));
          console.log(`Processed tracks for instructor ${instructor.id}:`, tracks);
          return {
            instructorId: instructor.id,
            tracks,
          };
        } catch (error) {
          console.error(`Failed to fetch track data for instructor ${instructor.id}:`, {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
          });
          return { instructorId: instructor.id, tracks: [] };
        }
      });
      const trackData = await Promise.all(trackDataPromises);
      console.log('Processed instructorsTrackData:', trackData);
      return trackData;
    } catch (error) {
      console.error('Error in fetchInstructorsTrackData:', {
        message: error.message,
        response: error.response?.data,
      });
      return rejectWithValue(error.response?.data || error.message);
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
    instructors: [],
    instructorsTrackData: [],
  },
  reducers: {
    clearSupervisorState: (state) => {
      state.loading = false;
      state.error = null;
      state.message = '';
      state.supervisor = null;
      state.instructors = [];
      state.instructorsTrackData = [];
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
        state.supervisor = action.payload;
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
      })
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
      })
      .addCase(fetchInstructorsTrackData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInstructorsTrackData.fulfilled, (state, action) => {
        state.loading = false;
        state.instructorsTrackData = action.payload;
      })
      .addCase(fetchInstructorsTrackData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error fetching instructors track data';
      });
  },
});

export const { clearSupervisorState } = supervisorsSlice.actions;
export default supervisorsSlice.reducer;