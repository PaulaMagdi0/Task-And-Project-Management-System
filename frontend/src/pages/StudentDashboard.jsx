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
    assignments: [],
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
        setStudentData((prevState) => ({
          ...prevState,
          loading: true,
          error: null,  // Reset error before retrying
        }));

        const studentId = localStorage.getItem('user_id');
        const authToken = localStorage.getItem('authToken');

        if (!authToken || !studentId) {
          throw new Error('Missing authentication token or student ID');
        }

        const response = await axios.get(
          `http://127.0.0.1:8000/api/student/${studentId}/courses/`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
            timeout: 5000,
          }
        );

        console.log('Courses and Assignments response:', response.data); // Can remove this later
        setLoading(false)
        // Update state with fetched data
        setStudentData({
          student: response.data.student,
          courses: response.data.courses || [],
          assignments: response.data.assignments || [],
          loading: false,
          error: null,
        });

        // Set dashboard data based on response
        setDashboardData({
          pendingAssignments: response.data.assignments || [],
          pendingCorrectives: [], // Update as needed
          upcomingDeadlines: 0, // Update as needed
          recentActivities: [], // Update as needed
          averageGrade: null, // Update as needed
          gradeTrend: 0, // Update as needed
        });
      } catch (error) {
        console.error('Error fetching data:', error);

        // Handle Unauthorized error and remove token
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          navigate('/login');
        } else {
          setStudentData((prevState) => ({
            ...prevState,
            loading: false,
            error: error.response?.data?.error || error.message,
          }));
        }
      }
    };

    fetchData();
  }, []);
  // console.log(dashboardData);


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
              subheader={`${dashboardData.pendingAssignments.filter((a) => {
                const endDate = new Date(a.end_date);
                const now = new Date();
                const diffInDays = Math.floor((endDate - now) / (1000 * 60 * 60 * 24));
                return diffInDays >= 0 && diffInDays <= 3;
              }).length
                } urgent items`}
            />
            <CardContent>
              <LinearProgress
                variant="determinate"
                value={Math.min(
                  dashboardData.pendingAssignments.filter((a) => {
                    const endDate = new Date(a.end_date);
                    const now = new Date();
                    const diffInDays = Math.floor((endDate - now) / (1000 * 60 * 60 * 24));
                    return diffInDays >= 0 && diffInDays <= 3;
                  }).length * 10,
                  100
                )}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: '#ffcdd2',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#e53935'
                  }
                }}
              />

              <List sx={{ mt: 2 }}>
                {dashboardData.pendingAssignments
                  .filter((assignment) => {
                    const endDate = new Date(assignment.end_date);
                    const now = new Date();
                    const diffInDays = Math.floor((endDate - now) / (1000 * 60 * 60 * 24));
                    return diffInDays >= 0 && diffInDays <= 3;
                  })
                  .sort((a, b) => new Date(a.end_date) - new Date(b.end_date)) // 👈 Sorting by end_date ascending
                  ?.map((assignment, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <FiCalendar style={{ color: '#e53935' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={assignment.title}
                        secondary={`Ends: ${new Date(assignment.end_date).toLocaleDateString()} (${assignment.course_name})`}
                      />
                    </ListItem>
                  ))}
              </List>

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
              {dashboardData.pendingCorrectives?.map((item, index) => (
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
              subheader={`Track: ${studentData?.assignments[0]?.track_name || 'Not assigned'}`}
            />
            <CardContent>
              <Grid container spacing={2} >
                {studentData.courses?.map((course) => (
                  <Grid item xs={12} md={6} key={course.id}>
                    <Card variant="outlined" sx={{ borderLeft: '4px solid #e53935' }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: '#e53935' }}>
                          {course.name} {/* Use course.name to display each course */}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {course.description} {/* Use course.description to display each course */}
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
          <Card elevation={3} sx={{ borderTop: '4px solid #e53935', mb: 4 }}>
            <CardHeader
              title="Pending Assignments"
              avatar={<FiClipboard style={{ color: '#e53935' }} />}
            />
            <CardContent>
              <Grid container spacing={2}>
                {dashboardData.pendingAssignments?.map((assignment, index) => (
                  <Grid item xs={12} key={index}>
                    <Card variant="outlined" sx={{ borderLeft: '4px solid #e53935', p: 1 }}>
                      <CardContent sx={{ pl: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#e53935' }}>
                          {assignment.course_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {assignment.title}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Ends: {new Date(assignment.end_date).toLocaleDateString()}
                        </Typography>
                        {assignment.file_url && (
                          <Typography variant="caption" display="block">
                            File: <a href={assignment.file_url} target="_blank" rel="noopener noreferrer">Open File</a>
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
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
              {dashboardData.recentActivities?.map((activity, index) => (
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
          {menuItems?.map((item) => (
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