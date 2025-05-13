// File: src/redux/chatSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../services/api";

// — Async Thunks —

// Fetch rooms the current user participates in
export const fetchMyRooms = createAsyncThunk(
  "chat/fetchMyRooms",
  async (_, thunkAPI) => {
    try {
      const resp = await apiClient.get("/chat/rooms/my/");
      return resp.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.detail || err.message
      );
    }
  }
);

// Create (or get) a room with another user
export const createRoom = createAsyncThunk(
  "chat/createRoom",
  async (otherUserId, thunkAPI) => {
    try {
      const resp = await apiClient.post("/chat/rooms/", {
        other_user_id: otherUserId,
      });
      return resp.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.detail || err.message
      );
    }
  }
);

// Search users by username/email
export const searchUsers = createAsyncThunk(
  "chat/searchUsers",
  async (query, thunkAPI) => {
    try {
      const resp = await apiClient.get(
        `/chat/users/?q=${encodeURIComponent(query)}`
      );
      return resp.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.detail || err.message
      );
    }
  }
);

// Fetch messages for a single room
export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (roomId, thunkAPI) => {
    try {
      const resp = await apiClient.get(`/chat/rooms/${roomId}/messages/`);
      return { roomId, messages: resp.data };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.detail || err.message
      );
    }
  }
);

// Send a message via REST
export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async ({ roomId, text }, thunkAPI) => {
    try {
      const resp = await apiClient.post(`/chat/rooms/${roomId}/messages/`, {
        text,
      });
      return { roomId, message: resp.data };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.detail || err.message
      );
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    rooms: [],
    roomsLoading: false,
    roomsError: null,

    createRoomLoading: false,
    createRoomError: null,

    searchResults: [],
    searchLoading: false,
    searchError: null,

    messages: {}, // { [roomId]: [ ...messages ] }
    messagesLoading: false,
    messagesError: null,

    sendLoading: false,
    sendError: null,
  },
  reducers: {
    addMessage: (state, action) => {
      const { roomId, message } = action.payload;
      if (!state.messages[roomId]) state.messages[roomId] = [];
      state.messages[roomId].push(message);
    },
    receiveMessage: (state, action) => {
      const { roomId, message } = action.payload;
      if (!state.messages[roomId]) state.messages[roomId] = [];
      state.messages[roomId].push(message);
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    clearChatError: (state) => {
      state.roomsError = null;
      state.createRoomError = null;
      state.searchError = null;
      state.messagesError = null;
      state.sendError = null;
    },
    // NEW: clear all loaded messages
    clearMessages: (state) => {
      state.messages = {};
      state.messagesError = null;
      state.messagesLoading = false;
    },
  },
  extraReducers: (builder) => {
    // fetchMyRooms
    builder
      .addCase(fetchMyRooms.pending, (state) => {
        state.roomsLoading = true;
        state.roomsError = null;
      })
      .addCase(fetchMyRooms.fulfilled, (state, action) => {
        state.roomsLoading = false;
        state.rooms = action.payload;
      })
      .addCase(fetchMyRooms.rejected, (state, action) => {
        state.roomsLoading = false;
        state.roomsError = action.payload;
      });

    // createRoom
    builder
      .addCase(createRoom.pending, (state) => {
        state.createRoomLoading = true;
        state.createRoomError = null;
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.createRoomLoading = false;
        if (!state.rooms.find((r) => r.id === action.payload.id)) {
          state.rooms.unshift(action.payload);
        }
      })
      .addCase(createRoom.rejected, (state, action) => {
        state.createRoomLoading = false;
        state.createRoomError = action.payload;
      });

    // searchUsers
    builder
      .addCase(searchUsers.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload;
      });

    // fetchMessages
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.messagesLoading = true;
        state.messagesError = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { roomId, messages } = action.payload;
        state.messagesLoading = false;
        state.messages[roomId] = messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        state.messagesError = action.payload;
      });

    // sendMessage
    builder
      .addCase(sendMessage.pending, (state) => {
        state.sendLoading = true;
        state.sendError = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendLoading = false;
        const { roomId, message } = action.payload;
        if (!state.messages[roomId]) state.messages[roomId] = [];
        state.messages[roomId].push(message);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendLoading = false;
        state.sendError = action.payload;
      });
  },
});

export const {
  addMessage,
  receiveMessage,
  clearSearchResults,
  clearChatError,
  clearMessages, // ← make sure you import this in your component
} = chatSlice.actions;

export default chatSlice.reducer;
