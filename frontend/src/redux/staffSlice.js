// File: src/redux/staffSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api';

// Helper function to convert error objects into a plain string.
const parseError = (error) => {
  let errorMessage = 'Operation failed.';
  if (error.response && error.response.data) {
    const data = error.response.data;
    // Debug log the raw error response
    console.log('Raw error data:', data);
    if (typeof data === 'string') {
      errorMessage = data;
    } else if (typeof data === 'object') {
      const messages = Object.entries(data)
        .map(([field, messages]) =>
          Array.isArray(messages)
            ? `${field}: ${messages.join(', ')}`
            : `${field}: ${messages}`
        );
      errorMessage = messages.join(' | ');
    }
  } else if (error.message) {
    errorMessage = error.message;
  }
  return errorMessage;
};

// Async thunk to fetch all staff
export const fetchStaff = createAsyncThunk(
  'staff/fetchStaff',
  async (_, thunkAPI) => {
    try {
      const response = await apiClient.get('/staff/');
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(parseError(error));
    }
  }
);

// Async thunk to create a new staff member
export const createStaff = createAsyncThunk(
  'staff/createStaff',
  async (staffData, thunkAPI) => {
    try {
      const response = await apiClient.post('/staff/create/', staffData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(parseError(error));
    }
  }
);

// Async thunk to update a staff member
export const updateStaff = createAsyncThunk(
  'staff/updateStaff',
  async ({ id, data }, thunkAPI) => {
    try {
      const response = await apiClient.patch(`/staff/${id}/`, data);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(parseError(error));
    }
  }
);

// Async thunk to delete a staff member
export const deleteStaff = createAsyncThunk(
  'staff/deleteStaff',
  async (staffId, thunkAPI) => {
    try {
      await apiClient.delete(`/staff/${staffId}/delete/`);
      return staffId;
    } catch (error) {
      return thunkAPI.rejectWithValue(parseError(error));
    }
  }
);

const staffSlice = createSlice({
  name: 'staff',
  initialState: {
    staff: [],
    loading: false,
    error: null,
    message: '',
  },
  reducers: {
    clearStaffState: (state) => {
      state.loading = false;
      state.error = null;
      state.message = '';
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
      })
      // createStaff
      .addCase(createStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.staff.push(action.payload);
        state.message = 'Staff member created successfully.';
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
        const index = state.staff.findIndex(
          (member) => member.id === action.payload.id
        );
        if (index !== -1) {
          state.staff[index] = action.payload;
        }
        state.message = 'Staff member updated successfully.';
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
        state.staff = state.staff.filter(
          (member) => member.id !== action.payload
        );
        state.message = 'Staff member deleted successfully.';
      })
      .addCase(deleteStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearStaffState } = staffSlice.actions;
export default staffSlice.reducer;
