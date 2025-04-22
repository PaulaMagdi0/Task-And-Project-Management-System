import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../services/api";

// Helper to decode JWT payload
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
  } catch {
    throw new Error("Invalid token");
  }
}

// Thunk: login
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, thunkAPI) => {
    try {
      // Use the correct login endpoint.
      const response = await apiClient.post("/auth/login/", {
        email: email.trim(),
        password,
      });
      const response = await apiClient.post("/auth/login/", {
        email: email.trim(),
        password,
      });
      const token = response.data.access;
      if (!token) throw new Error("No token returned from server");
      const decoded = jwtDecode(token);
      return {
        access: token,
        role: decoded.role,
        userType: decoded.userType,
        username: decoded.username || decoded.email || "User",
        user_id: decoded.user_id,
        branch: decoded.branch || null,
      };
    } catch (error) {
      const data = error.response?.data;
      let msg = "Login failed";
      if (data) {
        // DRF sends { detail: "..." }
        if (typeof data === "string") msg = data;
        else if (data.detail) msg = data.detail;
        else if (Array.isArray(data)) msg = data[0];
      } else if (error.message) {
        msg = error.message;
      }
      return thunkAPI.rejectWithValue({ error: msg });
    }
  }
);

const initialState = {
  token: localStorage.getItem("authToken") || null,
  userType: localStorage.getItem("userType") || null,
  role: localStorage.getItem("role") || null,
  username: localStorage.getItem("username") || "",
  user_id: localStorage.getItem("user_id") || null,
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
    logout(state) {
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
        state.role = action.payload.role;
        state.username = action.payload.username;
        state.user_id = action.payload.user_id;
        state.branch = action.payload.branch;
        // persist
        localStorage.setItem("authToken", action.payload.access);
        localStorage.setItem("userType", action.payload.userType);
        localStorage.setItem("role", action.payload.role || "");
        localStorage.setItem("username", action.payload.username);
        localStorage.setItem("user_id", action.payload.user_id);
        localStorage.setItem("branch", JSON.stringify(action.payload.branch));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Login failed";
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
