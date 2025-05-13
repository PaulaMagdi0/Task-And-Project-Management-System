import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../services/api";

// Helper function to convert error objects into a plain string.
const parseError = (error) => {
  let errorMessage = "Operation failed.";
  if (error.response && error.response.data) {
    const data = error.response.data;
    // Debug log the raw error response
    console.log("Raw error data:", data);
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

// Async thunk to fetch all tracks.
export const fetchTracks = createAsyncThunk(
  "tracks/fetchTracks",
  async (_, thunkAPI) => {
    try {
      const response = await apiClient.get("/tracks/");
      console.log("Tracks API response:", response.data);
      const data = response.data;
      return Array.isArray(data)
        ? data
        : data?.results || data?.tracks || data?.data || [];
    } catch (error) {
      return thunkAPI.rejectWithValue(parseError(error));
    }
  }
);

// Async thunk to create a new track.
export const createTrack = createAsyncThunk(
  "tracks/createTrack",
  async (trackData, thunkAPI) => {
    try {
      const response = await apiClient.post("/tracks/", trackData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(parseError(error));
    }
  }
);

// Async thunk to update an existing track.
export const updateTrack = createAsyncThunk(
  "tracks/updateTrack",
  async ({ id, data }, thunkAPI) => {
    try {
      const response = await apiClient.patch(`/tracks/${id}/`, data);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(parseError(error));
    }
  }
);

// Async thunk to delete a track.
export const deleteTrack = createAsyncThunk(
  "tracks/deleteTrack",
  async (trackId, thunkAPI) => {
    try {
      await apiClient.delete(`/tracks/${trackId}/`);
      return trackId;
    } catch (error) {
      return thunkAPI.rejectWithValue(parseError(error));
    }
  }
);

const trackSlice = createSlice({
  name: "tracks",
  initialState: {
    tracks: [],
    loading: false,
    error: null,
    message: "",
  },
  reducers: {
    clearTrackState: (state) => {
      state.loading = false;
      state.error = null;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchTracks
      .addCase(fetchTracks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTracks.fulfilled, (state, action) => {
        state.loading = false;
        state.tracks = action.payload;
      })
      .addCase(fetchTracks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.tracks = []; // Ensure tracks is an array on error
      })
      // createTrack
      .addCase(createTrack.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTrack.fulfilled, (state, action) => {
        state.loading = false;
        if (!Array.isArray(state.tracks)) {
          state.tracks = [action.payload]; // Initialize as array if not already
        } else {
          state.tracks.push(action.payload);
        }
        state.message = "Track created successfully.";
      })
      .addCase(createTrack.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // updateTrack
      .addCase(updateTrack.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTrack.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(state.tracks)) {
          const index = state.tracks.findIndex(
            (track) => track.id === action.payload.id
          );
          if (index !== -1) {
            state.tracks[index] = action.payload;
          }
        }
        state.message = "Track updated successfully.";
      })
      .addCase(updateTrack.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // deleteTrack
      .addCase(deleteTrack.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTrack.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(state.tracks)) {
          state.tracks = state.tracks.filter(
            (track) => track.id !== action.payload
          );
        }
        state.message = "Track deleted successfully.";
      })
      .addCase(deleteTrack.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearTrackState } = trackSlice.actions;
export default trackSlice.reducer;
