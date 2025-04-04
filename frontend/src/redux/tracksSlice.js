// File: src/redux/tracksSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api';

export const createTrack = createAsyncThunk(
  'tracks/createTrack',
  async (trackData, { rejectWithValue }) => {
    try {
      // Updated URL endpoint
      const response = await apiClient.post('/tracks/', trackData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data || error.message);
    }
  }
);

const tracksSlice = createSlice({
  name: 'tracks',
  initialState: {
    loading: false,
    error: null,
    message: '',
  },
  reducers: {
    clearTrackState: (state) => {
      state.loading = false;
      state.error = null;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTrack.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTrack.fulfilled, (state, action) => {
        state.loading = false;
        state.message = 'Track created successfully!';
      })
      .addCase(createTrack.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error creating track';
      });
  },
});

export const { clearTrackState } = tracksSlice.actions;
export default tracksSlice.reducer;
