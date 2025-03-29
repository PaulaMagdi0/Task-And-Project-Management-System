// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import coursesReducer from './coursesSlice';
// Import other reducers here when you create them (e.g., tracksSlice, assignmentsSlice, gradesSlice)

const store = configureStore({
  reducer: {
    courses: coursesReducer,
    // Add other reducers here
  },
});

export default store;
