import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api';

// Fetch students
export const fetchStudents = createAsyncThunk(
  'students/fetchStudents',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/students');
      return response.data.students;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message;
      console.error('fetchStudents error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage,
      });
      return rejectWithValue(errorMessage);
    }
  }
);

// Update student details (username, email, password)
export const updateStudent = createAsyncThunk(
  'students/updateStudent',
  async ({ studentId, firstName, lastName, username, email, password, track, branch }, { rejectWithValue }) => {
    try {
      // Build payload with required fields
      const payload = { username, email };

      // Add optional fields if provided
      if (firstName) payload.firstName = firstName;
      if (lastName) payload.lastName = lastName;
      if (password) payload.password = password;
      if (track) payload.track = track;
      if (branch) payload.branch = branch;

      // Make the patch request
      const response = await apiClient.patch(`/student/${studentId}/update/`, payload);
      return response.data; // { message: "Student updated successfully", student: { id, username, email } }
    } catch (error) {
      // Handle error and return error message
      const errorMessage = error.response?.data?.error || error.message;
      console.error('updateStudent error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage,
      });
      return rejectWithValue(errorMessage);
    }
  }
);

// Update student password
export const updateStudentPassword = createAsyncThunk(
  'students/updateStudentPassword',
  async ({ studentId, currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/student/${studentId}/update/`, {
        currentPassword,
        newPassword,
      });
      return response.data; // { message: "Password updated" }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      console.error('updateStudentPassword error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage,
      });
      return rejectWithValue(errorMessage);
    }
  }
);

// Delete student
export const deleteStudent = createAsyncThunk(
  'students/deleteStudent',
  async (studentId, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/student/${studentId}/delete/`);
      return studentId; // Return deleted student's ID
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      console.error('deleteStudent error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage,
      });
      return rejectWithValue(errorMessage);
    }
  }
);

const studentsSlice = createSlice({
  name: 'students',
  initialState: {
    data: [],
    loading: false,
    error: null,
    message: null,
  },
  reducers: {
    clearStudentsState(state) {
      state.error = null;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch students
      .addCase(fetchStudents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch students';
      })

      // Update student
      .addCase(updateStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(updateStudent.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message || 'Student updated successfully';
        if (action.payload.student) {
          const index = state.data.findIndex((s) => s.id === action.payload.student.id);
          if (index !== -1) {
            state.data[index] = { ...state.data[index], ...action.payload.student };
          }
        }
        console.log('updateStudent fulfilled:', action.payload);
      })
      .addCase(updateStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update student';
      })

      // Update student password
      .addCase(updateStudentPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(updateStudentPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message || 'Password updated successfully';
        console.log('updateStudentPassword fulfilled:', action.payload);
      })
      .addCase(updateStudentPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update password';
      })

      // Delete student
      .addCase(deleteStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(deleteStudent.fulfilled, (state, action) => {
        state.loading = false;
        state.data = state.data.filter((student) => student.id !== action.payload);
        state.message = 'Student deleted successfully';
        console.log('deleteStudent fulfilled:', action.payload);
      })
      .addCase(deleteStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete student';
      });
  },
});

export const { clearStudentsState } = studentsSlice.actions;
export default studentsSlice.reducer;