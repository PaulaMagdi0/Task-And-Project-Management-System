import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../services/api";

export const fetchTracksAndCourses = createAsyncThunk(
    "submissions/fetchTracksAndCourses",
    async (instructorId, { rejectWithValue }) => {
        try {
            const response = await apiClient.get(
                `staff/track-and-courses/${instructorId}/`
            );
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    }
);

export const fetchAssignments = createAsyncThunk(
    "submissions/fetchAssignments",
    async ({ trackId, courseId }, { rejectWithValue }) => {
        try {
            const response = await apiClient.get(
                `assignments/track/${trackId}/course/${courseId}/assignments/`
            );
            return response.data.assignments;
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    }
);

export const fetchSubmissions = createAsyncThunk(
    "submissions/fetchSubmissions",
    async ({ assignmentId, trackId, courseId }, { rejectWithValue }) => {
        try {
            const response = await apiClient.get(
                `assignments/${assignmentId}/track/${trackId}/course/${courseId}/submitters/`
            );

            const dataWithGrades = await Promise.all(
                response.data.submitters.map(async (student) => {
                    try {
                        const [submissionRes, gradeRes] = await Promise.all([
                            apiClient.get(`submission/${student.student_id}/`),
                            apiClient.get(`grades/${student.student_id}/`),
                        ]);

                        return {
                            ...student,
                            submission_id: submissionRes.data.id,
                            submission_assignment_url: submissionRes.data.url,
                            submission_date: submissionRes.data.submission_date,
                            existingEvaluation: gradeRes.data[0] || null,
                        };
                    } catch (err) {
                        console.error("Error fetching student data:", err);
                        return student;
                    }
                })
            );

            return {
                ...response.data,
                submitters: dataWithGrades,
            };
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    }
);

export const submitEvaluation = createAsyncThunk(
    "submissions/submitEvaluation",
    async (payload, { rejectWithValue }) => {
        try {
            await apiClient.post("/grades/", payload);
            return payload;
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    }
);

const submissionsSlice = createSlice({
    name: "submissions",
    initialState: {
        tracks: [],
        courses: [],
        assignments: [],
        submissionData: null,
        loading: {
            tracks: false,
            assignments: false,
            submissions: false,
            evaluation: false,
        },
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch Tracks and Courses
            .addCase(fetchTracksAndCourses.pending, (state) => {
                state.loading.tracks = true;
                state.error = null;
            })
            .addCase(fetchTracksAndCourses.fulfilled, (state, action) => {
                state.loading.tracks = false;
                state.tracks = action.payload.tracks;
                state.courses = action.payload.courses;
            })
            .addCase(fetchTracksAndCourses.rejected, (state, action) => {
                state.loading.tracks = false;
                state.error = action.payload?.detail || "Failed to fetch tracks and courses";
            })

            // Fetch Assignments
            .addCase(fetchAssignments.pending, (state) => {
                state.loading.assignments = true;
                state.error = null;
            })
            .addCase(fetchAssignments.fulfilled, (state, action) => {
                state.loading.assignments = false;
                state.assignments = action.payload;
            })
            .addCase(fetchAssignments.rejected, (state, action) => {
                state.loading.assignments = false;
                state.error = action.payload?.detail || "Failed to fetch assignments";
            })

            // Fetch Submissions
            .addCase(fetchSubmissions.pending, (state) => {
                state.loading.submissions = true;
                state.error = null;
            })
            .addCase(fetchSubmissions.fulfilled, (state, action) => {
                state.loading.submissions = false;
                state.submissionData = action.payload;
            })
            .addCase(fetchSubmissions.rejected, (state, action) => {
                state.loading.submissions = false;
                state.error = action.payload?.detail || "Failed to fetch submissions";
            })

            // Submit Evaluation
            .addCase(submitEvaluation.pending, (state) => {
                state.loading.evaluation = true;
                state.error = null;
            })
            .addCase(submitEvaluation.fulfilled, (state) => {
                state.loading.evaluation = false;
            })
            .addCase(submitEvaluation.rejected, (state, action) => {
                state.loading.evaluation = false;
                state.error = action.payload?.detail || "Failed to submit evaluation";
            });
    },
});

export default submissionsSlice.reducer;