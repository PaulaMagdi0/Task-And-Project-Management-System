import React from 'react';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Typography, styled } from '@mui/material';
import { LayoutDashboard, User2, FileText, Type, XIcon as Icons, Map, Bell, Globe } from 'lucide-react';

const drawerWidth = 260;

const StyledListItem = styled(ListItem)(({ theme }) => ({
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  marginBottom: theme.spacing(1),
  cursor: 'pointer',
}));

const menuItems = [
  { text: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { text: 'User Profile', icon: <User2 size={20} /> },
  { text: 'Table List', icon: <FileText size={20} /> },
  { text: 'Typography', icon: <Type size={20} /> },
  { text: 'Icons', icon: <Icons size={20} /> },
  { text: 'Maps', icon: <Map size={20} /> },
  { text: 'Notifications', icon: <Bell size={20} /> },
  { text: 'RTL Support', icon: <Globe size={20} /> },
];

function Sidebar() {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: '#1a1a1a',
          color: 'white',
          borderRight: 'none',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <LayoutDashboard size={24} color="#00acc1" />
        <Typography variant="h6" sx={{ color: '#fff' }}>
          CREATIVE TIM
        </Typography>
      </Box>
      
      <List>
        {menuItems.map((item) => (
          <StyledListItem key={item.text}>
            <ListItemIcon sx={{ color: 'grey.500', minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              sx={{
                '& .MuiTypography-root': {
                  color: item.text === 'Dashboard' ? 'white' : 'grey.500',
                },
              }}
            />
          </StyledListItem>
        ))}
      </List>
    </Drawer>
  );
}

export default Sidebar;
