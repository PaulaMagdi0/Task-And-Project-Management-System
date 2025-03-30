// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import coursesReducer from './coursesSlice';
import authReducer from './authSlice';
// Import other reducers here when you create them (e.g., tracksSlice, assignmentsSlice, gradesSlice)

const store = configureStore({
  reducer: {
    courses: coursesReducer,
    auth: authReducer,
    // Add other reducers here
  },
});

export default store;
