import React from 'react';
import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router-dom'; // Used to render child routes
import Sidebar from '../../Components/Sidebar/Sidebar'; // Import Sidebar
import Navbar from '../../Components/NavBar/Navbar'; // Import Navbar

function Dashboard() {
  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar */}
      <Sidebar />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: '100vh',
          pt: 8,
        }}
      >
        {/* Navbar */}
        <Navbar />
        
        {/* Container for content, rendering the child components */}
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Outlet /> {/* This is where the child components will be rendered */}
        </Container>
      </Box>
    </Box>
  );
}

export default Dashboard;
