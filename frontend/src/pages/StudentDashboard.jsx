import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FiMenu, FiX, FiBook, FiCalendar, FiAward, FiAlertTriangle, FiClipboard, FiUsers } from 'react-icons/fi';
import { Box, Card, CardHeader, CardContent, LinearProgress, Grid, Typography, Chip, Button, List, ListItem, ListItemIcon, ListItemText, Divider, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';
import './StudentDashboard.css'; // Custom CSS file for styling

const menuItems = [
  { id: 'deadlines', icon: <FiCalendar />, label: 'Upcoming Deadlines' },
  { id: 'averageGrade', icon: <FiAward />, label: 'Average Grade' },
  { id: 'correctives', icon: <FiAlertTriangle />, label: 'Pending Correctives' },
  { id: 'courses', icon: <FiBook />, label: 'My Courses' },
  { id: 'assignments', icon: <FiClipboard />, label: 'Pending Assignments' },
  { id: 'activities', icon: <FiUsers />, label: 'Recent Activities' },
];

const StudentDashboard = () => {
  const { username } = useSelector((state) => state.auth);
  const [selectedSection, setSelectedSection] = useState('deadlines');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    pendingAssignments: [],
    pendingCorrectives: [],
    upcomingDeadlines: 0,
    recentActivities: [],
    averageGrade: null,
    gradeTrend: 0,
    courses: [],
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
          courses: data.courses || [],
        });
      } catch (error) {
        setError(error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const renderSection = () => {
    switch (selectedSection) {
      case 'deadlines':
        return (
          <Card elevation={3}>
            <CardHeader title="Upcoming Deadlines" avatar={<FiCalendar />} subheader={`${dashboardData.upcomingDeadlines} urgent items`} />
            <CardContent>
              <LinearProgress variant="determinate" value={Math.min(dashboardData.upcomingDeadlines * 10, 100)} />
            </CardContent>
          </Card>
        );
      case 'averageGrade':
        return (
          <Card elevation={3}>
            <CardHeader title="Average Grade" avatar={<FiAward />} subheader={`${dashboardData.gradeTrend >= 0 ? '+' : ''}${dashboardData.gradeTrend.toFixed(1)}%`} />
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3">{dashboardData.averageGrade?.toFixed(1) || 'N/A'}%</Typography>
            </CardContent>
          </Card>
        );
      case 'correctives':
        return (
          <Card elevation={3}>
            <CardHeader title="Pending Correctives" avatar={<FiAlertTriangle />} subheader={`${dashboardData.pendingCorrectives.length} items`} />
            <CardContent>
              <LinearProgress variant="determinate" value={Math.min(dashboardData.pendingCorrectives.length * 20, 100)} />
            </CardContent>
          </Card>
        );
      case 'courses':
        return (
          <Card elevation={3}>
            <CardHeader title="My Courses" avatar={<FiBook />} />
            <CardContent>
              <Grid container spacing={2}>
                {dashboardData.courses.map((course) => (
                  <Grid item xs={12} key={course.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6">{course.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{course.instructor} • {course.duration} days</Typography>
                        <LinearProgress variant="determinate" value={course.progress} sx={{ mt: 2 }} />
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
          <Card elevation={3}>
            <CardHeader title="Pending Assignments" avatar={<FiClipboard />} />
            <List>
              {dashboardData.pendingAssignments.map((assignment) => (
                <React.Fragment key={assignment.id}>
                  <ListItem>
                    <ListItemIcon><FiBook color="action" /></ListItemIcon>
                    <ListItemText primary={assignment.title} secondary={assignment.description} />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Card>
        );
      case 'activities':
        return (
          <Card elevation={3}>
            <CardHeader title="Recent Activities" avatar={<FiUsers />} />
            <CardContent>
              <List>
                {dashboardData.recentActivities.map((activity) => (
                  <ListItem key={activity.id}>
                    <ListItemIcon>{activity.type === 'grade' ? <FiAward color="success" /> : <FiUsers color="primary" />}</ListItemIcon>
                    <ListItemText primary={activity.title} secondary={activity.date} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

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
    <div className="dashboard-container">
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          {sidebarOpen && (
            <>
              <div className="welcome-message">
                <h3>Welcome back,</h3>
                <h2>{username || 'User'}</h2>
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
