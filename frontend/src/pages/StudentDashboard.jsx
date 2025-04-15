import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FiMenu, FiX, FiBook, FiCalendar, FiAward, FiAlertTriangle, FiClipboard, FiUsers } from 'react-icons/fi';
import { Box, Card, CardHeader, CardContent, LinearProgress, Grid, Typography, List, ListItem, ListItemIcon, ListItemText, Divider, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';
import './StudentDashboard.css';

const menuItems = [
  {
    id: 'deadlines',
    icon: <FiCalendar style={{ color: 'inherit' }} />,
    label: 'Upcoming Deadlines'
  },
  {
    id: 'averageGrade',
    icon: <FiAward style={{ color: 'inherit' }} />,
    label: 'Average Grade'
  },
  {
    id: 'correctives',
    icon: <FiAlertTriangle style={{ color: 'inherit' }} />,
    label: 'Pending Correctives'
  },
  {
    id: 'courses',
    icon: <FiBook style={{ color: 'inherit' }} />,
    label: 'My Courses'
  },
  {
    id: 'assignments',
    icon: <FiClipboard style={{ color: 'inherit' }} />,
    label: 'Pending Assignments'
  },
  {
    id: 'activities',
    icon: <FiUsers style={{ color: 'inherit' }} />,
    label: 'Recent Activities'
  },
];

const StudentDashboard = () => {
  const { username } = useSelector((state) => state.auth);
  const [selectedSection, setSelectedSection] = useState('courses');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [studentData, setStudentData] = useState({
    student: null,
    courses: [],
    loading: true,
    error: null
  });
  const [dashboardData, setDashboardData] = useState({
    pendingAssignments: [],
    pendingCorrectives: [],
    upcomingDeadlines: 0,
    recentActivities: [],
    averageGrade: null,
    gradeTrend: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentId = localStorage.getItem('user_id');
        const authToken = localStorage.getItem('authToken');

        if (!authToken) throw new Error('No auth token found');
        if (!studentId) throw new Error('No student ID found');

        console.log('Token from localStorage:', localStorage.getItem('authToken'));
        console.log('Token length:', localStorage.getItem('authToken')?.length);

        // If using JWT, decode it at jwt.io or with:
        const tokenParts = authToken.split('.');
        if (tokenParts?.length === 3) {
          const decodedPayload = JSON.parse(atob(tokenParts[1]));
          console.log('Token payload:', decodedPayload);
          // Check expiration in payload
        }
        // 1. First verify the token works
        try {
          const userResponse = await axios.get(
            'http://127.0.0.1:8000/api/auth/user/',
            { headers: { 'Authorization': `Bearer ${authToken}` } }
          );
          console.log('Current user:', userResponse.data);
        } catch (tokenError) {
          console.error('Token is invalid:', tokenError.response?.data);
          throw new Error('Invalid token');
        }

        // 2. Now make the courses request
        const coursesResponse = await axios.get(
          `http://127.0.0.1:8000/api/student/${studentId}/courses/`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000
          }
        );

        console.log('Courses response:', coursesResponse.data);
        setStudentData({
          student: coursesResponse.data.student,
          courses: coursesResponse.data.courses,
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Full error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });

        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          navigate('/login');
        } else {
          setError(error.response?.data?.error || error.message);
        }
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderSection = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress sx={{ color: '#e53935' }} />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          Error loading data: {error}
        </Alert>
      );
    }

    switch (selectedSection) {
      case 'deadlines':
        return (
          <Card elevation={3} sx={{ borderTop: '4px solid #e53935' }}>
            <CardHeader
              title="Upcoming Deadlines"
              avatar={<FiCalendar style={{ color: '#e53935' }} />}
              subheader={`${dashboardData.upcomingDeadlines} urgent items`}
            />
            <CardContent>
              <LinearProgress
                variant="determinate"
                value={Math.min(dashboardData.upcomingDeadlines * 10, 100)}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: '#ffcdd2',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#e53935'
                  }
                }}
              />
            </CardContent>
          </Card>
        );

      case 'averageGrade':
        return (
          <Card elevation={3} sx={{ borderTop: '4px solid #e53935' }}>
            <CardHeader
              title="Average Grade"
              avatar={<FiAward style={{ color: '#e53935' }} />}
              subheader={
                <Typography
                  sx={{
                    color: dashboardData.gradeTrend >= 0 ? '#43a047' : '#e53935',
                    fontWeight: 'bold'
                  }}
                >
                  {`${dashboardData.gradeTrend >= 0 ? '+' : ''}${dashboardData.gradeTrend.toFixed(1)}%`}
                </Typography>
              }
            />
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ color: '#e53935' }}>
                {dashboardData.averageGrade?.toFixed(1) || 'N/A'}%
              </Typography>
            </CardContent>
          </Card>
        );

      case 'correctives':
        return (
          <Card elevation={3} sx={{ borderTop: '4px solid #e53935' }}>
            <CardHeader
              title="Pending Correctives"
              avatar={<FiAlertTriangle style={{ color: '#e53935' }} />}
              subheader={`${dashboardData.pendingCorrectives.length} items`}
            />
            <List>
              {dashboardData.pendingCorrectives.map((item, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      <FiAlertTriangle style={{ color: '#e53935' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      secondary={item.description}
                    />
                  </ListItem>
                  {index < dashboardData.pendingCorrectives.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Card>
        );

      case 'courses':
        return (
          <Card elevation={3} sx={{ borderTop: '4px solid #e53935' }}>
            <CardHeader
              title="My Courses"
              avatar={<FiBook style={{ color: '#e53935' }} />}
              subheader={`Track: ${studentData.student?.track?.name || 'Not assigned'}`}
            />
            <CardContent>
              <Grid container spacing={2}>
                {studentData.courses.map((course) => (
                  <Grid item xs={12} md={6} key={course.id}>
                    <Card variant="outlined" sx={{ borderLeft: '4px solid #e53935' }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: '#e53935' }}>
                          {course.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {course.description}
                        </Typography>
                        <Typography variant="caption" display="block" mt={1}>
                          Started: {new Date(course.created_at).toLocaleDateString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        );

      case 'assignments':
        return (
          <Card elevation={3} sx={{ borderTop: '4px solid #e53935' }}>
            <CardHeader
              title="Pending Assignments"
              avatar={<FiClipboard style={{ color: '#e53935' }} />}
            />
            <List>
              {dashboardData.pendingAssignments.map((assignment, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      <FiClipboard style={{ color: '#e53935' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={assignment.title}
                      secondary={assignment.description}
                    />
                  </ListItem>
                  {index < dashboardData.pendingAssignments.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Card>
        );

      case 'activities':
        return (
          <Card elevation={3} sx={{ borderTop: '4px solid #e53935' }}>
            <CardHeader
              title="Recent Activities"
              avatar={<FiUsers style={{ color: '#e53935' }} />}
            />
            <List>
              {dashboardData.recentActivities.map((activity, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {activity.type === 'grade' ? (
                      <FiAward style={{ color: '#43a047' }} />
                    ) : (
                      <FiUsers style={{ color: '#e53935' }} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={activity.title}
                    secondary={activity.date}
                  />
                </ListItem>
              ))}
            </List>
          </Card>
        );

      default:
        return null;
    }
  };

  const displayName = username ? username.split('@')[0] : 'User';

  return (
    <div className="dashboard-container">
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          {sidebarOpen && (
            <>
              <div className="welcome-message">
                <h3>Welcome back,</h3>
                <h3><b>{displayName}</b></h3>
              </div>
              <button className="toggle-btn" onClick={() => setSidebarOpen(false)}>
                <FiX size={24} />
              </button>
            </>
          )}
          {!sidebarOpen && (
            <button className="toggle-btn" onClick={() => setSidebarOpen(true)}>
              <FiMenu size={24} />
            </button>
          )}
        </div>

        <div className="menu-items">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`menu-item ${selectedSection === item.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedSection(item.id);
                if (!sidebarOpen) setSidebarOpen(true);
              }}
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="main-content">
        <div className="content-card">
          {renderSection()}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;