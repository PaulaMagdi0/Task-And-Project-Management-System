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
      console.error('fetchTracks error:', error);
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch tracks');
    }
  }
);

export const fetchCourses = createAsyncThunk(
  'assignments/fetchCourses',
  async ({ userId, trackId }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/staff/track-and-courses/${userId}/`);
      console.log('fetchCourses API Response:', response.data);

      const trackCourses = Array.isArray(response.data.track_courses)
        ? response.data.track_courses
        : [];
      const filteredTrackCourses = trackCourses.filter((tc) =>
        Array.isArray(tc.tracks) && tc.tracks.some((track) => track.id === trackId)
      );
      console.log('Filtered Track Courses:', filteredTrackCourses);
      const courseIds = filteredTrackCourses.map((tc) => tc.id);

      const courses = Array.isArray(response.data.taught_courses)
        ? response.data.taught_courses
        : [];
      let filteredCourses = courses.filter((course) =>
        courseIds.includes(course.id)
      );
      console.log('Filtered Courses (before intake):', filteredCourses);

      const intakeResponse = await apiClient.get('/student/intakes/');
      const intakes = Array.isArray(intakeResponse.data.intakes)
        ? intakeResponse.data.intakes
        : [];
      console.log('All Intakes:', intakes);

      const intakeCourses = {};
      await Promise.all(
        intakes.map(async (intake) => {
          try {
            const response = await apiClient.get(`/courses/intakes/${intake.id}/courses/`);
            intakeCourses[intake.id] = Array.isArray(response.data) ? response.data : [];
          } catch (error) {
            console.warn(`Failed to fetch courses for intake ${intake.id}:`, error);
            intakeCourses[intake.id] = [];
          }
        })
      );
      console.log('Intake Courses:', intakeCourses);

      filteredCourses = filteredCourses.map((course) => {
        let intake = null;
        for (const intakeId in intakeCourses) {
          const courses = intakeCourses[intakeId];
          if (courses.some((c) => c.id === course.id)) {
            const matchingIntake = intakes.find((i) => i.id === parseInt(intakeId));
            if (matchingIntake) {
              intake = { id: matchingIntake.id, name: matchingIntake.name };
              break;
            }
          }
        }
        return {
          ...course,
          intake,
        };
      });
      console.log('Filtered Courses (with intake):', filteredCourses);

      return filteredCourses;
    } catch (error) {
      console.error('fetchCourses error:', error);
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch courses');
    }
  }
);

export const fetchStudents = createAsyncThunk(
  'assignments/fetchStudents',
  async ({ trackId, courseId, intakeId }, { rejectWithValue }) => {
    try {
      console.log('Fetching students with:', { trackId, courseId, intakeId });
      const response = await apiClient.get(
        `/student/tracks/${trackId}/courses/${courseId}/intakes/${intakeId}/students/`
      );
      console.log('fetchStudents API Response:', response.data);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('fetchStudents error:', error);
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch students'
      );
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
      console.error('createAssignment error:', error);
      return rejectWithValue(error.response?.data?.detail || 'Failed to create assignment');
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
      state.error = null;
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
        state.tracks = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchTracks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch tracks';
      })
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.courses = [];
        state.students = [];
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.courses = [];
        state.students = [];
        state.error = action.payload || 'Failed to fetch courses';
      })
      .addCase(fetchStudents.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.students = [];
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.students = Array.isArray(action.payload) ? action.payload : [];
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