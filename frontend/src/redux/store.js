// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import coursesReducer from './coursesSlice';
import authReducer from './authSlice';
import supervisorsReducer from './supervisorsSlice';
import tracksReducer from './tracksSlice';
import assignmentsReducer from './assignmentsSlice'; // Import assignments reducer
import submissionsReducer from './submissionsSlice';
import gradesReducer from './gradesSlice';
import studentsReducer from './studentsSlice';  // Import the students reducer
import createAssignmentReducer from './createassignmentsSlice';
import listAssignmentsReducer from './viewassignmentSlice';

const store = configureStore({
  reducer: {
    courses: coursesReducer,
    auth: authReducer,
    supervisors: supervisorsReducer,
    tracks: tracksReducer,
    assignments: assignmentsReducer, // Add it to the store
    submissions: submissionsReducer,
    grades: gradesReducer,
    students: studentsReducer,  // Add students reducer
    createassignments: createAssignmentReducer,
    listassignments: listAssignmentsReducer,


  },
});

export default store;
