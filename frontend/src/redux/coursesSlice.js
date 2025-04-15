// src/redux/coursesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api';

// Fetch courses and tracks for instructor
export const fetchCourses = createAsyncThunk(
  'courses/fetchCourses',
  async (user_id, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/staff/track-and-courses/${user_id}/`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch');
    }
  }
);

// Create a new course
export const createCourse = createAsyncThunk(
  'courses/createCourse',
  async (courseData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/courses/', courseData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create course');
    }
  }
);

const coursesSlice = createSlice({
  name: 'courses',
  initialState: {
    data: [],
    loading: false,
    error: null,
    success: null,
  },
  reducers: {
    clearCourseStatus(state) {
      state.success = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create
      .addCase(createCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.success = 'Course created successfully!';
        // Optional: Add course to local state
      })
      .addCase(createCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCourseStatus } = coursesSlice.actions;

export default coursesSlice.reducer;
