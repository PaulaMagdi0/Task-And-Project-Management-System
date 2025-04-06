// src/redux/studentsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api';

// Async action to fetch students
export const fetchStudents = createAsyncThunk(
  'students/fetchStudents',
  async (_, thunkAPI) => {
    try {
      const response = await apiClient.get('students');
      console.log('Students data:', response.data); // Log the API response to check the data
      return response.data.students; // Access the students array directly from the response
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

const studentsSlice = createSlice({
  name: 'students',
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload; // Store the array of students
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch students';
      });
  },
});

export default studentsSlice.reducer;
