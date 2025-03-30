import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api';

// Async thunk for logging in
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/token/', { email, password });
      return response.data;
    } catch (err) {
      if (!err.response) {
        return rejectWithValue({ error: "Network error: Cannot connect to server." });
      }
      return rejectWithValue(err.response.data);
    }
  }
);


const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: null,
    userType: null, // 'staff' or 'student'
    role: null,     // for staff: 'supervisor', 'instructor', or 'branch_manager'
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.token = null;
      state.userType = null;
      state.role = null;
      localStorage.removeItem('authToken');
      localStorage.removeItem('userType');
      localStorage.removeItem('role');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.access;
        state.userType = action.payload.userType;
        state.role = action.payload.role || null;
        localStorage.setItem('authToken', action.payload.access);
        localStorage.setItem('userType', action.payload.userType);
        if (action.payload.role) {
          localStorage.setItem('role', action.payload.role);
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.error || 'Login failed';
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
