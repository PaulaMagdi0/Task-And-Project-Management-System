// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import coursesReducer from './coursesSlice';
import authReducer from './authSlice';
import supervisorsReducer from './supervisorsSlice';
import tracksReducer from './tracksSlice';
// Import other reducers here when you create them (e.g., tracksSlice, assignmentsSlice, gradesSlice)

const store = configureStore({
  reducer: {
    courses: coursesReducer,
    auth: authReducer,
    supervisors: supervisorsReducer,
    tracks: tracksReducer,
  },
});

export default store;
