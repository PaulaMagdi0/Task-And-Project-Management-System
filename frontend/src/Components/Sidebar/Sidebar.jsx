import React, { useState } from 'react';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Typography, styled } from '@mui/material';
import { LayoutDashboard, User2, FileText, NotebookText, HardDriveDownload, Columns2, Globe } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom'; // Import Link to use for routing

const drawerWidth = 260;

const StyledListItem = styled(ListItem)(({ theme }) => ({
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Hover effect for item
  },
  marginBottom: theme.spacing(1),
  cursor: 'pointer',
  paddingLeft: theme.spacing(2), // Adjust padding to keep items smaller
  paddingRight: theme.spacing(2),
}));

const menuItems = [
  { text: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
  { text: 'User Profile', icon: <User2 size={20} />, path: '/dashboard/user-profile' },
  { text: 'Courses', icon: <Columns2 size={20} />, path: '/dashboard/courses' },
  { text: 'Assignment', icon: <NotebookText size={20} />, path: '/dashboard/assignments' },
  { text: 'Submission', icon: <HardDriveDownload size={20} />, path: '/dashboard/submissions' },
  { text: 'Create Assignment', icon: <HardDriveDownload size={20} />, path: '/dashboard/createassignment' },
  { text: 'Hello', icon: <Globe size={20} />, path: '/dashboard/hello' },
];

function Sidebar() {
  const location = useLocation(); // Get the current location/path
  const [activeItem, setActiveItem] = useState('Dashboard');

  const handleItemClick = (item) => {
    setActiveItem(item.text);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: '#1a1a1a', // Dark background
          color: 'white',
          borderRight: 'none',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <LayoutDashboard size={24} color="#00acc1" /> {/* Logo for sidebar */}
        <Typography variant="h6" sx={{ color: '#fff' }}>
          CREATIVE TIM
        </Typography>
      </Box>

      <List>
        {menuItems.map((item) => (
          <StyledListItem
            key={item.text}
            onClick={() => handleItemClick(item)} // Set active item on click
            sx={{
              backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.2)' : 'transparent', // Highlight active item
            }}
          >
            <ListItemIcon sx={{ color: 'grey.500', minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={
                <Link
                  to={item.path}
                  style={{
                    textDecoration: 'none',
                    color: location.pathname === item.path ? 'white' : 'grey.500',
                  }}
                >
                  {item.text}
                </Link>
              }
            />
          </StyledListItem>
        ))}
      </List>
    </Drawer>
  );
}

export default Sidebar;
