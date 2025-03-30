import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api';

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, thunkAPI) => {
    try {
      const response = await apiClient.post('/auth/token/', { email: email.trim(), password });
      const { access, refresh } = response.data;
      
      // Dynamically import jwt-decode and destructure the named export
      const jwtDecodeModule = await import('jwt-decode');
      const { jwtDecode } = jwtDecodeModule;
      
      if (typeof jwtDecode !== 'function') {
        throw new Error("jwtDecode is not a function");
      }
      
      const decoded = jwtDecode(access);
      
      return {
        access,
        refresh,
        role: decoded.role,
        userType: decoded.userType,
      };
    } catch (error) {
      return thunkAPI.rejectWithValue({
        error: error.response?.data?.detail || error.message || 'Login failed',
      });
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: null,
    userType: null, // 'staff' or 'student'
    role: null,     // e.g., 'supervisor', 'instructor', or 'branch_manager'
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
