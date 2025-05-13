import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../services/api";

// Helper function to convert error objects into a plain string.
const parseError = (error) => {
  let errorMessage = "Operation failed.";
  if (error.response && error.response.data) {
    const data = error.response.data;
    console.log("Raw error data:", data); // Log full error response
    if (typeof data === "string") {
      errorMessage = data;
    } else if (typeof data === "object") {
      const messages = Object.entries(data).map(([field, messages]) =>
        Array.isArray(messages)
          ? `${field}: ${messages.join(", ")}`
          : `${field}: ${messages}`
      );
      errorMessage = messages.join(" | ");
    }
  } else if (error.message) {
    errorMessage = error.message;
  }
  return errorMessage;
};

// ===========================
// STAFF Async Thunks
// ===========================

// Fetch all staff
export const fetchStaff = createAsyncThunk(
  "staff/fetchStaff",
  async (_, thunkAPI) => {
    try {
      const response = await apiClient.get("/staff/");
      console.log("Staff API response:", response.data);
      const data = response.data;
      return Array.isArray(data)
        ? data
        : data?.results || data?.staff || data?.data || [];
    } catch (error) {
      return thunkAPI.rejectWithValue(parseError(error));
    }
  }
);

// Create a new staff member
export const createStaff = createAsyncThunk(
  "staff/createStaff",
  async (staffData, thunkAPI) => {
    try {
      console.log("Creating staff with payload:", staffData); // Log payload
      const response = await apiClient.post("/staff/create/", staffData);
      console.log("Create staff response:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Create staff error:",
        error.response?.data || error.message
      ); // Log error details
      return thunkAPI.rejectWithValue(parseError(error));
    }
  }
);

// Update a staff member
export const updateStaff = createAsyncThunk(
  "staff/updateStaff",
  async ({ id, data }, thunkAPI) => {
    try {
      console.log("Updating staff with payload:", data);
      const response = await apiClient.patch(`/staff/${id}/`, data);
      console.log("Update staff response:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Update staff error:",
        error.response?.data || error.message
      );
      return thunkAPI.rejectWithValue(parseError(error));
    }
  }
);

// Delete a staff member
export const deleteStaff = createAsyncThunk(
  "staff/deleteStaff",
  async (staffId, thunkAPI) => {
    try {
      console.log("Deleting staff with ID:", staffId);
      await apiClient.delete(`/staff/${staffId}/delete/`);
      return staffId;
    } catch (error) {
      console.error(
        "Delete staff error:",
        error.response?.data || error.message
      );
      return thunkAPI.rejectWithValue(parseError(error));
    }
  }
);

// ===========================
// STUDENTS by STAFF Async Thunk
// ===========================

// Fetch students by staff ID
export const fetchStudentsByStaff = createAsyncThunk(
  "staff/fetchStudentsByStaff",
  async (staffId, thunkAPI) => {
    try {
      const response = await apiClient.get(`/student/by-staff/${staffId}`);
      console.log("Students by staff API response:", response.data);
      const data = response.data;
      return Array.isArray(data)
        ? data
        : data?.results || data?.students || data?.data || [];
    } catch (error) {
      console.error(
        "Fetch students by staff error:",
        error.response?.data || error.message
      );
      return thunkAPI.rejectWithValue(parseError(error));
    }
  }
);

// ===========================
// Slice
// ===========================
const staffSlice = createSlice({
  name: "staff",
  initialState: {
    staff: [],
    loading: false,
    error: null,
    message: "",
    studentsByStaff: [],
    studentsLoading: false,
    studentsError: null,
  },
  reducers: {
    clearStaffState: (state) => {
      state.loading = false;
      state.error = null;
      state.message = "";
      state.studentsByStaff = [];
      state.studentsLoading = false;
      state.studentsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchStaff
      .addCase(fetchStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.staff = action.payload;
      })
      .addCase(fetchStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.staff = []; // Ensure staff is an array on error
      })
      // createStaff
      .addCase(createStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStaff.fulfilled, (state, action) => {
        state.loading = false;
        if (!Array.isArray(state.staff)) {
          state.staff = [action.payload]; // Initialize as array if not already
        } else {
          state.staff.push(action.payload);
        }
        state.message = "Staff member created successfully.";
      })
      .addCase(createStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // updateStaff
      .addCase(updateStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStaff.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(state.staff)) {
          const index = state.staff.findIndex(
            (member) => member.id === action.payload.id
          );
          if (index !== -1) {
            state.staff[index] = action.payload;
          }
        }
        state.message = "Staff member updated successfully.";
      })
      .addCase(updateStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // deleteStaff
      .addCase(deleteStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStaff.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(state.staff)) {
          state.staff = state.staff.filter(
            (member) => member.id !== action.payload
          );
        }
        state.message = "Staff member deleted successfully.";
      })
      .addCase(deleteStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchStudentsByStaff
      .addCase(fetchStudentsByStaff.pending, (state) => {
        state.studentsLoading = true;
        state.studentsError = null;
      })
      .addCase(fetchStudentsByStaff.fulfilled, (state, action) => {
        state.studentsLoading = false;
        state.studentsByStaff = action.payload;
      })
      .addCase(fetchStudentsByStaff.rejected, (state, action) => {
        state.studentsLoading = false;
        state.studentsError = action.payload;
        state.studentsByStaff = []; // Ensure studentsByStaff is an array on error
      });
  },
});

export const { clearStaffState } = staffSlice.actions;
export default staffSlice.reducer;
