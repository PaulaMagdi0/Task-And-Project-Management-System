import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api';

// Action to fetch submissions filtered by assignment
export const fetchSubmissions = createAsyncThunk(
  'submissions/fetchSubmissions',
  async (assignmentId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/submission/?assignment=${assignmentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data || error.message);
    }
  }
);

// Action to create a new submission
export const createSubmission = createAsyncThunk(
  'submissions/createSubmission',
  async (submissionData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/submission/', submissionData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data || error.message);
    }
  }
);

const submissionsSlice = createSlice({
  name: 'submissions',
  initialState: {
    submissions: [],
    loading: false,
    error: null,
  },
  reducers: {
    setSubmissions: (state, action) => {
      state.submissions = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubmissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubmissions.fulfilled, (state, action) => {
        state.submissions = action.payload;
        state.loading = false;
      })
      .addCase(fetchSubmissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createSubmission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSubmission.fulfilled, (state, action) => {
        state.submissions.push(action.payload);
        state.loading = false;
      })
      .addCase(createSubmission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setSubmissions } = submissionsSlice.actions;

export default submissionsSlice.reducer;
