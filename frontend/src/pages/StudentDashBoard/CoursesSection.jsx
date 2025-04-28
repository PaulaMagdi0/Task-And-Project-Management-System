import React from 'react';
import { Box, Card, CardHeader, CardContent, Grid, Typography, LinearProgress, Chip } from '@mui/material';
import { FiBook } from 'react-icons/fi';
import { getCourseProgress } from './utils';

const CoursesSection = ({ courses, assignments, submittedAssignments }) => {
  return (
    <Card className="modern-card">
      <CardHeader
        title="My Courses"
        avatar={<FiBook className="icon" />}
        subheader={`Track: ${assignments[0]?.track_name || 'Not assigned'}`}
      />
      <CardContent>
        {courses.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No courses assigned
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {courses.map((course) => (
              <Grid item xs={12} sm={6} key={course.course_id}>
                <Card className="sub-card">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" className="course-title">
                        {course.name}
                      </Typography>
                      <Chip
                        label={`${getCourseProgress(course.course_id, assignments, submittedAssignments)}%`}
                        size="small"
                        className="progress-chip"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {course.description}
                    </Typography>
                    <Typography variant="caption" display="block" mt={1}>
                      Started: {new Date(course.created_at).toLocaleDateString()}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={getCourseProgress(course.course_id, assignments, submittedAssignments)}
                      sx={{
                        mt: 2,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': { backgroundColor: '#e53935' },
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default CoursesSection;