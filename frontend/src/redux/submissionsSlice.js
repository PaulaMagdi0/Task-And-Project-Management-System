import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api';

// Action to fetch submissions
export const fetchSubmissions = createAsyncThunk(
  'submissions/fetchSubmissions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/submission/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      return response.data;  // Returning the response directly as you want to use it as is
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
  reducers: {},
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
      });
  },
});

export default submissionsSlice.reducer;
