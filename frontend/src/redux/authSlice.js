// File: src/redux/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api';

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, thunkAPI) => {
    try {
      const response = await apiClient.post('/auth/login/', { email: email.trim(), password });
      const { token } = response.data;
      if (!token) {
        throw new Error("No token returned from server");
      }
      const jwtDecodeModule = await import('jwt-decode');
      const jwtDecode = jwtDecodeModule.default || jwtDecodeModule.jwtDecode;
      const decoded = jwtDecode(token);
      
      return {
        access: token,
        role: decoded.role,
        userType: decoded.userType,
        username: decoded.username || decoded.email || 'User',
        branch: decoded.branch || null,  // Save branch info from the token
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
    userType: null,
    role: null,
    username: '',
    branch: null,   // <-- This will store branch info (e.g., { id: 1, name: "newcapital" })
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.token = null;
      state.userType = null;
      state.role = null;
      state.username = '';
      state.branch = null;
      localStorage.removeItem('authToken');
      localStorage.removeItem('userType');
      localStorage.removeItem('role');
      localStorage.removeItem('branch');
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
        state.role = action.payload.role;
        state.username = action.payload.username;
        state.branch = action.payload.branch; // <-- branch info stored here
        localStorage.setItem('authToken', action.payload.access);
        localStorage.setItem('userType', action.payload.userType);
        if (action.payload.role) {
          localStorage.setItem('role', action.payload.role);
        }
        if (action.payload.branch) {
          localStorage.setItem('branch', JSON.stringify(action.payload.branch));
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
