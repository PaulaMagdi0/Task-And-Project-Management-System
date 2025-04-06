import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Avatar,
  Button,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Assignment,
  Book,
  Notifications,
  Event,
  Grade,
  Message,
  Science,
  Warning
} from '@mui/icons-material';

const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    pendingAssignments: [],
    pendingCorrectives: [],
    upcomingDeadlines: 0,
    recentActivities: [],
    averageGrade: null,
    gradeTrend: 0,
    courses: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data } = await axios.get('/api/students/dashboard/');
        setDashboardData({
          pendingAssignments: data.pendingAssignments || [],
          pendingCorrectives: data.pendingCorrectives || [],
          upcomingDeadlines: data.upcomingDeadlines || 0,
          recentActivities: data.recentActivities || [],
          averageGrade: data.averageGrade || null,
          gradeTrend: data.gradeTrend || 0,
          courses: data.courses || []
        });
      } catch (error) {
        setError(error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error loading dashboard: {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Student Dashboard
      </Typography>

      {/* Top Stats Row - 3 equal height cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Upcoming Deadlines Card */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardHeader
              title="Upcoming Deadlines"
              avatar={<Event color="error" />}
              subheader={`${dashboardData.upcomingDeadlines} urgent items`}
            />
            <CardContent>
              <LinearProgress
                variant="determinate"
                value={Math.min(dashboardData.upcomingDeadlines * 10, 100)}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Average Grade Card - Fixed height */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardHeader
              title="Average Grade"
              avatar={<Grade color="primary" />}
              subheader={`${dashboardData.gradeTrend >= 0 ? '+' : ''}${dashboardData.gradeTrend.toFixed(1)}%`}
            />
            <CardContent sx={{ textAlign: 'center', pt: 0 }}>
              <Typography variant="h3" sx={{ mt: 1 }}>
                {dashboardData.averageGrade?.toFixed(1) || 'N/A'}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Correctives Card */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardHeader
              title="Pending Correctives"
              avatar={<Warning color="warning" />}
              subheader={`${dashboardData.pendingCorrectives.length} items`}
            />
            <CardContent>
              <LinearProgress
                variant="determinate"
                value={Math.min(dashboardData.pendingCorrectives.length * 20, 100)}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content - Swapped Courses and Activities */}
      <Grid container spacing={3}>
        {/* Left Column - Now contains Courses */}
        <Grid item xs={12} md={8}>
          {/* Courses Card (moved to left) */}
          <Card elevation={3} sx={{ mb: 3 }}>
            <CardHeader
              title="My Courses"
              avatar={<Book color="primary" />}
            />
            <CardContent>
              <Grid container spacing={2}>
                {dashboardData.courses.map((course) => (
                  <Grid item xs={12} key={course.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6">{course.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {course.instructor} • {course.duration} days
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={course.progress}
                          sx={{ mt: 2 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Pending Assignments Card with Submit Lab Button */}
          <Card elevation={3}>
            <CardHeader
              title="Pending Assignments"
              avatar={<Assignment color="warning" />}
              action={
                <Button
                  variant="contained"
                  startIcon={<Science />}
                  sx={{ textTransform: 'none' }}
                >
                  Submit Lab
                </Button>
              }
            />
            <List>
              {dashboardData.pendingAssignments.map((assignment) => (
                <React.Fragment key={assignment.id}>
                  <ListItem>
                    <ListItemIcon>
                      <Book color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary={assignment.title}
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            {assignment.courseName} - {assignment.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Chip
                              label={`Due: ${new Date(assignment.dueDate).toLocaleDateString()}`}
                              size="small"
                            />
                            <Chip
                              label={assignment.status}
                              color={assignment.status === 'Late' ? 'error' : 'warning'}
                              size="small"
                            />
                          </Box>
                        </>
                      }
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Card>
        </Grid>

        {/* Right Column - Now contains Recent Activities */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardHeader
              title="Recent Activities"
              avatar={<Notifications color="primary" />}
            />
            <CardContent>
              <List>
                {dashboardData.recentActivities.map((activity) => (
                  <ListItem key={activity.id}>
                    <ListItemIcon>
                      {activity.type === 'grade' ? (
                        <Grade color="success" />
                      ) : (
                        <Message color="primary" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.title}
                      secondary={
                        <>
                          {new Date(activity.date).toLocaleString()}
                          {activity.type === 'grade' && (
                            <Chip
                              label={`${activity.value}%`}
                              size="small"
                              sx={{ ml: 1 }}
                              color={activity.value >= 70 ? 'success' : 'error'}
                            />
                          )}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentDashboard;