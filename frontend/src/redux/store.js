import { configureStore } from '@reduxjs/toolkit';
import coursesReducer from './coursesSlice';
import authReducer from './authSlice';
import supervisorsReducer from './supervisorsSlice';
import tracksReducer from './tracksSlice';
import assignmentsReducer from './assignmentsSlice'; // Import the assignments reducer
import submissionsReducer from './submissionsSlice'; // Import the submissions reducer
import gradesReducer from './gradesSlice'; // Import the grades reducer

const store = configureStore({
  reducer: {
    courses: coursesReducer,
    auth: authReducer,
    supervisors: supervisorsReducer,
    tracks: tracksReducer,
    assignments: assignmentsReducer, // Add it to the store
    submissions: submissionsReducer, // Add submissionsReducer to the store
    grades: gradesReducer, // Add gradesReducer to the store
  },
});

export default store;