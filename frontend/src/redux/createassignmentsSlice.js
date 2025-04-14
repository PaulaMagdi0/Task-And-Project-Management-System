import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api';

const initialState = {
  tracks: [],
  courses: [],
  students: [],
  assignment: null,
  loading: false,
  error: null,
  success: false,
};

export const fetchTracks = createAsyncThunk(
  'assignments/fetchTracks',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/tracks/instructors/${userId}/available_tracks/`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchCourses = createAsyncThunk(
  'assignments/fetchCourses',
  async ({ userId, trackId }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(
        `/courses/instructors/${userId}/tracks/${trackId}/assigned_courses/`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchStudents = createAsyncThunk(
  'assignments/fetchStudents',
  async ({ trackId, courseId }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(
        `/student/tracks/${trackId}/courses/${courseId}/students/`
      );
      // Directly return the array response since your API returns the array directly
      return response.data; // Changed from response.data.students to response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createAssignment = createAsyncThunk(
  'assignments/createAssignment',
  async (assignmentData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/assignments/create/', assignmentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const assignmentSlice = createSlice({
  name: 'assignments',
  initialState,
  reducers: {
    resetAssignmentState: (state) => {
      return { ...initialState };
    },
    clearStudents: (state) => {
      state.students = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTracks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTracks.fulfilled, (state, action) => {
        state.loading = false;
        state.tracks = action.payload;
      })
      .addCase(fetchTracks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch tracks';
      })

      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch courses';
      })

      .addCase(fetchStudents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.students = action.payload; // Now correctly sets the student array
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading = false;
        state.students = [];
        state.error = action.payload || 'Failed to fetch students';
      })

      .addCase(createAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createAssignment.fulfilled, (state, action) => {
        state.loading = false;
        state.assignment = action.payload;
        state.success = true;
      })
      .addCase(createAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create assignment';
        state.success = false;
      });
  },
});

export const { resetAssignmentState, clearStudents } = assignmentSlice.actions;
export default assignmentSlice.reducer;