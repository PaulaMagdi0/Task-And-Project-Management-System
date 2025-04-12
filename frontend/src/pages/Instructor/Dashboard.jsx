import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  IconButton, 
  Typography, 
  Box, 
  CssBaseline, 
  AppBar, 
  Toolbar 
} from '@mui/material';
import { 
  Menu as MenuIcon,
  Book as CoursesIcon,
  Assignment as AssignmentsIcon,
  AddCircle as CreateAssignmentIcon,
  FileUpload as SubmissionsIcon,
  Grade as GradesIcon
} from '@mui/icons-material';
import Courses from './Courses';
import Assignments from './Assignments';
import Submissions from './Submissions';
import Grades from './Grades';
import CreateAssignment from './CreateAssignment';

const drawerWidth = 240;

const InstructorDashboard = () => {
  const { username } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    { text: 'My Courses', icon: <CoursesIcon />, path: '/courses' },
    { text: 'Assignments', icon: <AssignmentsIcon />, path: '/assignments' },
    { text: 'Create Assignment', icon: <CreateAssignmentIcon />, path: '/create-assignment' },
    { text: 'Submissions', icon: <SubmissionsIcon />, path: '/submissions' },
    { text: 'Grades', icon: <GradesIcon />, path: '/grades' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          ml: sidebarOpen ? `${drawerWidth}px` : 0
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap>
            Instructor Dashboard
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        open={sidebarOpen}
        sx={{
          width: sidebarOpen ? drawerWidth : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: sidebarOpen ? drawerWidth : 0,
            boxSizing: 'border-box',
            transition: 'width 0.3s ease',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', p: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ pl: 2 }}>
            Welcome, {username || 'Instructor'}
          </Typography>
          
          <List>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem
                  button
                  key={item.text}
                  component={Link}
                  to={item.path}
                  selected={isActive}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    bgcolor: isActive ? 'action.selected' : 'transparent',
                    '&:hover': {
                      bgcolor: isActive ? 'action.selected' : 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{
                      fontWeight: isActive ? 'bold' : 'normal',
                      color: isActive ? 'primary.main' : 'inherit'
                    }} 
                  />
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          transition: 'margin 0.3s ease',
          ml: sidebarOpen ? `${drawerWidth}px` : 0
        }}
      >
        <Toolbar />
        <Routes>
          <Route path="/" element={<Courses />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/create-assignment" element={<CreateAssignment />} />
          <Route path="/submissions" element={<Submissions />} />
          <Route path="/grades" element={<Grades />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default InstructorDashboard;