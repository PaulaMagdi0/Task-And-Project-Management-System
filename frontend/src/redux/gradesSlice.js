// File: src/redux/gradesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api';

export const fetchGrades = createAsyncThunk(
  'grades/fetchGrades',
  async (instructorId, thunkAPI) => {
    try {
      const response = await apiClient.get(`grades/?instructor=${instructorId}`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue('Failed to fetch grades');
    }
  }
);

export const createGrade = createAsyncThunk(
  'grades/createGrade',
  async (gradeData, thunkAPI) => {
    try {
      const response = await apiClient.post('grades/', gradeData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue('Failed to create grade');
    }
  }
);

const gradesSlice = createSlice({
  name: 'grades',
  initialState: {
    grades: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGrades.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGrades.fulfilled, (state, action) => {
        state.loading = false;
        state.grades = action.payload;
      })
      .addCase(fetchGrades.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createGrade.fulfilled, (state, action) => {
        state.grades.push(action.payload);  
      });
  },
});

export default gradesSlice.reducer;
