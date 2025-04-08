import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api';

// Action to fetch submissions filtered by assignment
export const fetchSubmissions = createAsyncThunk(
  'submissions/fetchSubmissions',
  async (instructorId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/submission/?instructor=${instructorId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      // Process the submission data to add student, course, and assignment names
      const submissions = await Promise.all(
        response.data.map(async (submission) => {
          // Fetch student details
          const studentResponse = await apiClient.get(`/students/${submission.student}/`);
          const student = studentResponse.data.username;

          // Fetch course details
          const courseResponse = await apiClient.get(`/courses/${submission.course}/`);
          const course = courseResponse.data.name;

          // Fetch assignment details
          const assignmentResponse = await apiClient.get(`/assignments/${submission.assignment}/`);
          const assignment = assignmentResponse.data.title;

          return {
            ...submission,
            student_username: student,
            course_name: course,
            assignment_title: assignment,
          };
        })
      );

      return submissions;
    } catch (error) {
      return rejectWithValue(error.response.data || error.message);
    }
  }
);

const submissionsSlice = createSlice({
  name: 'submissions',
  initialState: {
    submissions: [], // Store the list of submissions
    loading: false, // Track loading state
    error: null, // Track any errors
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
      });
  },
});

export default submissionsSlice.reducer;
