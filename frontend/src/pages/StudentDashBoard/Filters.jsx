import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

export const CourseFilter = ({ courses, courseFilter, setCourseFilter, deadlineFilter, setDeadlineFilter, assignments, submittedAssignments }) => {
  const getUniqueDeadlines = () => {
    if (!Array.isArray(assignments)) return [];
    const deadlines = new Set(
      assignments
        .filter(
          (assignment) =>
            assignment?.end_date &&
            !submittedAssignments[assignment?.id]?.submitted &&
            new Date(assignment.end_date) >= new Date()
        )
        .map((assignment) => new Date(assignment.end_date).toISOString().slice(0, 10))
    );
    return Array.from(deadlines).sort();
  };

  return (
    <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel>Filter by Course</InputLabel>
        <Select value={courseFilter} label="Filter by Course" onChange={(e) => setCourseFilter(e.target.value)}>
          <MenuItem value="all">All Courses</MenuItem>
          {Array.isArray(courses) && courses.map((course) => (
            <MenuItem key={course?.course_id || Math.random()} value={course?.name}>
              {course?.name || 'Unknown Course'}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel>Filter by Deadline</InputLabel>
        <Select value={deadlineFilter} label="Filter by Deadline" onChange={(e) => setDeadlineFilter(e.target.value)}>
          <MenuItem value="">All Deadlines</MenuItem>
          {getUniqueDeadlines().map((deadline) => (
            <MenuItem key={deadline} value={deadline}>
              {new Date(deadline).toLocaleDateString()}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export const GradeFilter = ({
  courses = [],
  gradeCourseFilter,
  setGradeCourseFilter,
  gradeSubmissionDateFilter,
  setGradeSubmissionDateFilter,
  getUniqueSubmissionDates,
}) => {
  console.log('GradeFilter Props:', { courses, gradeCourseFilter, gradeSubmissionDateFilter });

  return (
    <>
      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel>Filter by Course</InputLabel>
        <Select value={gradeCourseFilter} label="Filter by Course" onChange={(e) => setGradeCourseFilter(e.target.value)}>
          <MenuItem value="all">All Courses</MenuItem>
          {Array.isArray(courses) && courses.map((course) => (
            <MenuItem key={course?.course_id || Math.random()} value={course?.name}>
              {course?.name || 'Unknown Course'}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel>Filter by Submission Date</InputLabel>
        <Select
          value={gradeSubmissionDateFilter}
          label="Filter by Submission Date"
          onChange={(e) => setGradeSubmissionDateFilter(e.target.value)}
        >
          <MenuItem value="">All Dates</MenuItem>
          {getUniqueSubmissionDates().map((date) => (
            <MenuItem key={date} value={date}>
              {new Date(date).toLocaleDateString()}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );
};

export default CourseFilter;