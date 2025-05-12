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
  async ({ email, password, intake_id }, thunkAPI) => {
    try {
      const payload = {
        email: email.trim().toLowerCase(),
        password,
        ...(intake_id !== null && { intake_id }),
      };
      console.log('authSlice login payload:', JSON.stringify(payload, null, 2));
      const response = await apiClient.post("/auth/login/", payload);
      console.log('authSlice response:', JSON.stringify(response.data, null, 2));
      const { access, user } = response.data;
      if (!access) throw new Error("No access token returned from server");
      const decoded = jwtDecode(access);
      const result = {
        access,
        role: user.role || decoded.role || 'unknown',
        userType: user.userType || decoded.userType || 'unknown',
        username: user.username || decoded.username || decoded.email || "User",
        user_id: user.id || decoded.user_id || decoded.sub,
        branch: user.branch || decoded.branch || null,
        intake: user.intake || decoded.intake || null,
        track: user.track || decoded.track || null,
      };
      console.log('authSlice result:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      const data = error.response?.data;
      let msg = "Login failed";
      if (data) {
        if (typeof data === "string") msg = data;
        else if (data.detail) msg = data.detail;
        else if (data.error) msg = data.error;
        else if (Array.isArray(data)) msg = data[0];
      } else if (error.message) {
        msg = error.message;
      }
      console.error('authSlice error:', JSON.stringify({ msg, data }, null, 2));
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
  intake: localStorage.getItem("intake")
    ? JSON.parse(localStorage.getItem("intake"))
    : null,
  track: localStorage.getItem("track")
    ? JSON.parse(localStorage.getItem("track"))
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
      state.intake = null;
      state.track = null;
      localStorage.removeItem("authToken");
      localStorage.removeItem("userType");
      localStorage.removeItem("role");
      localStorage.removeItem("username");
      localStorage.removeItem("user_id");
      localStorage.removeItem("branch");
      localStorage.removeItem("intake");
      localStorage.removeItem("track");
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
        state.intake = action.payload.intake;
        state.track = action.payload.track;
        // Persist to localStorage
        localStorage.setItem("authToken", action.payload.access);
        localStorage.setItem("userType", action.payload.userType);
        localStorage.setItem("role", action.payload.role || "");
        localStorage.setItem("username", action.payload.username);
        localStorage.setItem("user_id", action.payload.user_id);
        localStorage.setItem("branch", JSON.stringify(action.payload.branch));
        localStorage.setItem("intake", JSON.stringify(action.payload.intake));
        localStorage.setItem("track", JSON.stringify(action.payload.track));
        console.log('authSlice stored in localStorage:', {
          authToken: action.payload.access,
          userType: action.payload.userType,
          role: action.payload.role,
          username: action.payload.username,
          user_id: action.payload.user_id,
          branch: action.payload.branch,
          intake: action.payload.intake,
          track: action.payload.track,
        });
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Login failed";
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;