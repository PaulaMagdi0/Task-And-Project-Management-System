import React, { useState, Component } from 'react';
import { Box, Card, CardHeader, CardContent, Grid, Typography, FormControl, InputLabel, Select, MenuItem, Button, CircularProgress } from '@mui/material';
import { FiAward } from 'react-icons/fi';
import GradeFilter from './Filters';

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="error">
            Something went wrong loading grades.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Error: {this.state.error?.message || 'Unknown error'}
          </Typography>
        </Box>
      );
    }
    return this.props.children;
  }
}

const GradesSection = ({ grades = [], assignments = [], courses = [] }) => {
  const [gradeCourseFilter, setGradeCourseFilter] = useState('all');
  const [gradeSubmissionDateFilter, setGradeSubmissionDateFilter] = useState('');

  // Log props for debugging
  console.log('GradesSection Props:', { grades, assignments, courses });

  const getUniqueSubmissionDates = () => {
    if (!Array.isArray(grades)) {
      console.warn('grades is not an array:', grades);
      return [];
    }
    const submissionDates = new Set(
      grades
        .filter((grade) => grade && grade.submitted_at)
        .map((grade) => new Date(grade.submitted_at).toISOString().slice(0, 10))
    );
    return Array.from(submissionDates).sort();
  };

  const filterGrades = () => {
    if (!Array.isArray(grades)) {
      console.warn('grades is not an array in filterGrades:', grades);
      return [];
    }
    return grades.filter((grade) => {
      if (!grade || !grade.assignment) return false;
      const matchingAssignment = assignments.find((assignment) => assignment?.id === grade.assignment) || {};
      const courseName = matchingAssignment.course_name || '';
      const matchesCourse = gradeCourseFilter === 'all' || courseName === gradeCourseFilter;
      const matchesSubmissionDate =
        !gradeSubmissionDateFilter ||
        (grade.submitted_at && new Date(grade.submitted_at).toISOString().slice(0, 10) === gradeSubmissionDateFilter);
      return matchesCourse && matchesSubmissionDate;
    });
  };

  const averageGrade = Array.isArray(grades) && grades.length
    ? (grades.reduce((sum, grade) => sum + (grade?.score || 0), 0) / grades.length).toFixed(1)
    : 'N/A';

  return (
    <ErrorBoundary>
      <Card elevation={3} sx={{ borderTop: '4px solid #43a047' }}>
        <CardHeader
          title="Grades & Feedback"
          avatar={<FiAward style={{ color: '#43a047' }} />}
          subheader={`Average Grade: ${averageGrade}/100`}
        />
        <CardContent>
          {!Array.isArray(grades) ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress sx={{ color: '#43a047' }} />
            </Box>
          ) : (
            <>
              <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                <GradeFilter
                  courses={Array.isArray(courses) ? courses : []}
                  gradeCourseFilter={gradeCourseFilter}
                  setGradeCourseFilter={setGradeCourseFilter}
                  gradeSubmissionDateFilter={gradeSubmissionDateFilter}
                  setGradeSubmissionDateFilter={setGradeSubmissionDateFilter}
                  getUniqueSubmissionDates={getUniqueSubmissionDates}
                />
                {(gradeCourseFilter !== 'all' || gradeSubmissionDateFilter) && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setGradeCourseFilter('all');
                      setGradeSubmissionDateFilter('');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </Box>
              {filterGrades().length > 0 ? (
                <Grid container spacing={2}>
                  {filterGrades().map((grade, index) => {
                    const matchingAssignment = assignments.find((assignment) => assignment?.id === grade?.assignment) || {};
                    const courseName = matchingAssignment.course_name || 'No Course Name';
                    const assignmentTitle = matchingAssignment.title || 'No Assignment Name';
                    return (
                      <Grid item xs={12} md={6} key={index}>
                        <Card variant="outlined" sx={{ borderLeft: '4px solid #43a047', height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="h6" sx={{ color: '#43a047' }}>
                                {courseName}
                              </Typography>
                              <Typography
                                variant="h6"
                                fontWeight="bold"
                                color={grade.score >= 70 ? '#43a047' : grade.score >= 50 ? '#ff9800' : '#e53935'}
                              >
                                {grade.score || 0}/10
                              </Typography>
                            </Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              {assignmentTitle}
                            </Typography>
                            {grade.feedback && (
                              <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, borderLeft: '3px solid #43a047' }}>
                                <Typography variant="body2" component="div">
                                  <Box component="span" fontWeight="bold" color="#43a047">
                                    Feedback:
                                  </Box>{' '}
                                  {grade.feedback}
                                </Typography>
                                <Box sx={{ mt: 1 }}>
                                  {grade.submitted_at && (
                                    <Typography variant="caption" display="block" color="text.secondary">
                                      Submitted: {new Date(grade.submitted_at).toLocaleDateString()}
                                    </Typography>
                                  )}
                                  {grade.graded_at && (
                                    <Typography variant="caption" display="block" color="text.secondary">
                                      Graded: {new Date(grade.graded_at).toLocaleDateString()}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              ) : (
                <Box textAlign="center" py={4}>
                  <FiAward size={48} style={{ color: '#bdbdbd', marginBottom: 16 }} />
                  <Typography variant="body1" color="text.secondary">
                    No grades available for the selected filters
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Try adjusting the course or submission date filters
                  </Typography>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};

export default GradesSection;