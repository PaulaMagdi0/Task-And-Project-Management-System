// File: src/redux/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../services/api";

// Custom JWT decode helper – decodes the payload from a JWT.
function jwtDecode(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    throw new Error("Invalid token");
  }
}

export const selectToken = (state) => state.auth.token;

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, thunkAPI) => {
    try {
      // Use the correct login endpoint.
      const response = await apiClient.post("/auth/login/", {
        email: email.trim(),
        password,
      });
      const token = response.data.access;
      if (!token) {
        throw new Error("No token returned from server");
      }
      // Decode the JWT token using our custom helper.
      const decoded = jwtDecode(token);

      // Return branch from the decoded token if available.
      return {
        access: token,
        role: decoded.role,
        userType: decoded.userType,
        username: decoded.username || decoded.email || "User",
        user_id: decoded.user_id,
        branch: decoded.branch || null, // <-- Extract branch from the token
      };
    } catch (error) {
      return thunkAPI.rejectWithValue({
        error: error.response?.data?.detail || error.message || "Login failed",
      });
    }
  }
);

// Initialize state using localStorage values for persistence.
const initialState = {
  token: localStorage.getItem("authToken") || null,
  userType: localStorage.getItem("userType") || null,
  role: localStorage.getItem("role") || null,
  username: localStorage.getItem("username") || "",
  user_id: localStorage.getItem("user_id") || null,
  // Parse branch from localStorage if available
  branch: localStorage.getItem("branch")
    ? JSON.parse(localStorage.getItem("branch"))
    : null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.token = null;
      state.userType = null;
      state.role = null;
      state.username = "";
      state.user_id = null;
      state.branch = null;
      localStorage.removeItem("authToken");
      localStorage.removeItem("userType");
      localStorage.removeItem("role");
      localStorage.removeItem("username");
      localStorage.removeItem("user_id");
      localStorage.removeItem("branch");
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
        state.user_id = action.payload.user_id;
        state.branch = action.payload.branch; // Store branch info
        localStorage.setItem("authToken", action.payload.access);
        localStorage.setItem("userType", action.payload.userType);
        localStorage.setItem("role", action.payload.role || "");
        localStorage.setItem("username", action.payload.username);
        localStorage.setItem("user_id", action.payload.user_id);
        localStorage.setItem("branch", JSON.stringify(action.payload.branch));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.error || "Login failed";
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
