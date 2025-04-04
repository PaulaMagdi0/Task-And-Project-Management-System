// File: src/redux/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api';

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, thunkAPI) => {
    try {
      // Use the correct login endpoint
      const response = await apiClient.post('/auth/login/', { email: email.trim(), password });
      // Now, the backend returns { "token": "JWT_TOKEN_STRING" }
      const { token } = response.data;
      if (!token) {
        throw new Error("No token returned from server");
      }
      
      // Dynamically import jwt-decode.
      const jwtDecodeModule = await import('jwt-decode');
      const jwtDecode = jwtDecodeModule.default || jwtDecodeModule.jwtDecode;
      if (typeof jwtDecode !== 'function') {
        throw new Error("jwtDecode is not a function");
      }
      
      // Decode the token to extract custom claims.
      const decoded = jwtDecode(token);
      
      return {
        access: token,
        role: decoded.role,
        userType: decoded.userType,
        username: decoded.username || decoded.email || 'User',
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
    username: '',   // Logged-in user's username
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.token = null;
      state.userType = null;
      state.role = null;
      state.username = '';
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
        state.username = action.payload.username;
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
