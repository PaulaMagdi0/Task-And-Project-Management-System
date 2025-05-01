import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api';

// Fetch courses and tracks for a user
export const fetchCourses = createAsyncThunk(
  'courses/fetchCourses',
  async (user_id, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/staff/track-and-courses/${user_id}/`);
      return response.data;
    } catch (error) {
      console.error('fetchCourses error:', error);
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch user courses');
    }
  }
);

// Fetch all courses
export const fetchAllCourses = createAsyncThunk(
  'courses/fetchAllCourses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/courses');
      return response.data;
    } catch (error) {
      console.error('fetchAllCourses error:', error);
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch all courses');
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
      console.error('createCourse error:', error);
      return rejectWithValue(error.response?.data?.error || 'Failed to create course');
    }
  }
);

// Update a course
export const updateCourse = createAsyncThunk(
  'courses/updateCourse',
  async ({ courseId, ...courseData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/courses/${courseId}/`, courseData);
      return response.data;
    } catch (error) {
      console.error('updateCourse error:', error);
      return rejectWithValue(error.response?.data?.error || 'Failed to update course');
    }
  }
);

// Delete a course
export const deleteCourse = createAsyncThunk(
  'courses/deleteCourse',
  async (courseId, { rejectWithValue }) => {
    try {
      console.log('Sending DELETE request to:', `/courses/${courseId}/`); // Debug log
      const response = await apiClient.delete(`/courses/${courseId}/`);
      console.log('Delete response:', response); // Debug log
      return courseId; // Return courseId for state update
    } catch (error) {
      console.error('deleteCourse error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return rejectWithValue(error.response?.data?.error || 'Failed to delete course');
    }
  }
);

// Reassign instructor for a course
export const reassignInstructor = createAsyncThunk(
  'courses/reassignInstructor',
  async ({ courseId, instructorId, trackId }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/courses/reassign-instructor/${courseId}/`, {
        instructor_id: instructorId,
        track_id: trackId,
      });
      return response.data;
    } catch (error) {
      console.error('reassignInstructor error:', error);
      return rejectWithValue(error.response?.data?.error || 'Failed to reassign instructor');
    }
  }
);

// Assign an existing course to a new track
export const assignCourseToTrack = createAsyncThunk(
  'courses/assignCourseToTrack',
  async ({ courseId, trackId, optionId }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/courses/assign-course-to-track/', {
        course_id: courseId,
        track_id: trackId,
        option_id: optionId,
      });
      return response.data;
    } catch (error) {
      console.error('Error response:', error.response?.data);
      return rejectWithValue(error.response?.data?.detail || 'Failed to assign course to track');
    }
  }
);

// Remove a course from a track
export const removeCourseFromTrack = createAsyncThunk(
  'courses/removeCourseFromTrack',
  async ({ trackId, courseId }, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/tracks/remove-course-from-track/track/${trackId}/course/${courseId}/`);
      return response.data; // Return the response message
    } catch (error) {
      console.error('removeCourseFromTrack error:', error);
      return rejectWithValue(error.response?.data?.error || 'Failed to remove course from track');
    }
  }
);

const coursesSlice = createSlice({
  name: 'courses',
  initialState: {
    userCourses: {
      tracks: [],
      track_courses: [],
    },
    allCourses: [],
    status: {
      fetchCoursesLoading: false,
      fetchAllCoursesLoading: false,
      createCourseLoading: false,
      updateCourseLoading: false,
      deleteCourseLoading: false,
      reassignInstructorLoading: false,
      assignCourseToTrackLoading: false,
      removeCourseFromTrackLoading: false,
      fetchCoursesError: null,
      fetchAllCoursesError: null,
      createCourseError: null,
      updateCourseError: null,
      deleteCourseError: null,
      reassignInstructorError: null,
      assignCourseToTrackError: null,
      removeCourseFromTrackError: null,
      success: null,
    },
  },
  reducers: {
    clearCourseStatus(state) {
      state.status.success = null;
      state.status.fetchCoursesError = null;
      state.status.fetchAllCoursesError = null;
      state.status.createCourseError = null;
      state.status.updateCourseError = null;
      state.status.deleteCourseError = null;
      state.status.reassignInstructorError = null;
      state.status.assignCourseToTrackError = null;
      state.status.removeCourseFromTrackError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch courses
      .addCase(fetchCourses.pending, (state) => {
        state.status.fetchCoursesLoading = true;
        state.status.fetchCoursesError = null;
        state.status.success = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.status.fetchCoursesLoading = false;
        state.userCourses = {
          tracks: action.payload.tracks || [],
          track_courses: action.payload.track_courses || [],
        };
        console.log('fetchCourses fulfilled:', action.payload);
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.status.fetchCoursesLoading = false;
        state.status.fetchCoursesError = action.payload;
      })
      // Fetch all courses
      .addCase(fetchAllCourses.pending, (state) => {
        state.status.fetchAllCoursesLoading = true;
        state.status.fetchAllCoursesError = null;
        state.status.success = null;
      })
      .addCase(fetchAllCourses.fulfilled, (state, action) => {
        state.status.fetchAllCoursesLoading = false;
        state.allCourses = action.payload || [];
        console.log('fetchAllCourses fulfilled:', action.payload);
      })
      .addCase(fetchAllCourses.rejected, (state, action) => {
        state.status.fetchAllCoursesLoading = false;
        state.status.fetchAllCoursesError = action.payload;
      })
      // Create course
      .addCase(createCourse.pending, (state) => {
        state.status.createCourseLoading = true;
        state.status.createCourseError = null;
        state.status.success = null;
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.status.createCourseLoading = false;
        state.allCourses = [...state.allCourses, action.payload];
        state.status.success = 'Course created successfully!';
        console.log('createCourse fulfilled:', action.payload);
      })
      .addCase(createCourse.rejected, (state, action) => {
        state.status.createCourseLoading = false;
        state.status.createCourseError = action.payload;
      })
      // Update course
      .addCase(updateCourse.pending, (state) => {
        state.status.updateCourseLoading = true;
        state.status.updateCourseError = null;
        state.status.success = null;
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.status.updateCourseLoading = false;
        state.allCourses = state.allCourses.map((course) =>
          course.id === action.payload.id ? action.payload : course
        );
        state.status.success = 'Course updated successfully!';
        console.log('updateCourse fulfilled:', action.payload);
      })
      .addCase(updateCourse.rejected, (state, action) => {
        state.status.updateCourseLoading = false;
        state.status.updateCourseError = action.payload;
      })
      // Delete course
      .addCase(deleteCourse.pending, (state) => {
        state.status.deleteCourseLoading = true;
        state.status.deleteCourseError = null;
        state.status.success = null;
      })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.status.deleteCourseLoading = false;
        state.allCourses = state.allCourses.filter((course) => course.id !== action.payload);
        state.status.success = 'Course deleted successfully!';
        console.log('deleteCourse fulfilled:', action.payload);
      })
      .addCase(deleteCourse.rejected, (state, action) => {
        state.status.deleteCourseLoading = false;
        state.status.deleteCourseError = action.payload;
      })
      // Reassign instructor
      .addCase(reassignInstructor.pending, (state) => {
        state.status.reassignInstructorLoading = true;
        state.status.reassignInstructorError = null;
        state.status.success = null;
      })
      .addCase(reassignInstructor.fulfilled, (state, action) => {
        state.status.reassignInstructorLoading = false;
        state.status.success = action.payload.detail || 'Instructor reassigned successfully!';
        const courseIndex = state.userCourses.track_courses.findIndex(
          (course) => course.id === action.meta.arg.courseId
        );
        if (courseIndex !== -1) {
          state.userCourses.track_courses[courseIndex].instructor = {
            id: action.meta.arg.instructorId,
            ...action.payload.instructor,
          };
        }
        console.log('reassignInstructor fulfilled:', action.payload);
      })
      .addCase(reassignInstructor.rejected, (state, action) => {
        state.status.reassignInstructorLoading = false;
        state.status.reassignInstructorError = action.payload;
      })
      // Assign course to track
      .addCase(assignCourseToTrack.pending, (state) => {
        state.status.assignCourseToTrackLoading = true;
        state.status.assignCourseToTrackError = null;
        state.status.success = null;
      })
      .addCase(assignCourseToTrack.fulfilled, (state, action) => {
        state.status.assignCourseToTrackLoading = false;
        state.status.success = action.payload.detail || 'Course assigned to track successfully!';
        const courseIndex = state.userCourses.track_courses.findIndex(
          (course) => course.id === action.meta.arg.courseId
        );
        if (courseIndex !== -1) {
          const track = state.userCourses.tracks.find(
            (t) => t.id === action.meta.arg.trackId
          );
          if (track) {
            state.userCourses.track_courses[courseIndex].tracks = [
              ...(state.userCourses.track_courses[courseIndex].tracks || []),
              track,
            ];
          }
        }
        console.log('assignCourseToTrack fulfilled:', action.payload);
      })
      .addCase(assignCourseToTrack.rejected, (state, action) => {
        state.status.assignCourseToTrackLoading = false;
        state.status.assignCourseToTrackError = action.payload;
      })
      // Remove course from track
      .addCase(removeCourseFromTrack.pending, (state) => {
        state.status.removeCourseFromTrackLoading = true;
        state.status.removeCourseFromTrackError = null;
        state.status.success = null;
      })
      .addCase(removeCourseFromTrack.fulfilled, (state, action) => {
        state.status.removeCourseFromTrackLoading = false;
        state.status.success = action.payload.detail || 'Course removed from track successfully!';
        const courseIndex = state.userCourses.track_courses.findIndex(
          (course) => course.id === action.meta.arg.courseId
        );
        if (courseIndex !== -1) {
          state.userCourses.track_courses[courseIndex].tracks = state.userCourses.track_courses[courseIndex].tracks.filter(
            (track) => track.id !== action.meta.arg.trackId
          );
        }
        console.log('removeCourseFromTrack fulfilled:', action.payload);
      })
      .addCase(removeCourseFromTrack.rejected, (state, action) => {
        state.status.removeCourseFromTrackLoading = false;
        state.status.removeCourseFromTrackError = action.payload;
      });
  },
});

export const { clearCourseStatus } = coursesSlice.actions;

export default coursesSlice.reducer;