import React from 'react';
import { Box, Container, Grid } from '@mui/material';
import { FileText, Store, AlertCircle } from 'lucide-react';
import Sidebar from '../../Components/Sidebar/Sidebar';
import Navbar from '../../Components/NavBar/Navbar';
import StatCard from '../../Components/StatCard/StatCard';
import ChartCard from '../../Components/ChartCard/ChartCard';

const dailySalesData = {
  labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  datasets: [
    {
      data: [10, 15, 8, 15, 20, 15, 32],
      borderColor: '#4caf50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      tension: 0.4,
      fill: true,
    },
  ],
};

const emailSubsData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    {
      data: [400, 380, 300, 500, 400, 300, 200, 300, 400, 500, 550, 600],
      borderColor: '#ff9800',
      backgroundColor: 'rgba(255, 152, 0, 0.1)',
      tension: 0.4,
      fill: true,
    },
  ],
};

const completedTasksData = {
  labels: ['12am', '3pm', '6pm', '9pm', '12pm', '3am', '6am', '9am'],
  datasets: [
    {
      data: [200, 450, 300, 600, 400, 550, 350, 200],
      borderColor: '#2196f3',
      backgroundColor: 'rgba(33, 150, 243, 0.1)',
      tension: 0.4,
      fill: true,
    },
  ],
};

function Dashboard() {
  return (
    <Box sx={{ display: 'flex' }}>
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
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <StatCard
                icon={FileText}
                title="Used Space"
                value="49/50 GB"
                subtitle="Get more space"
                color="#ff9800"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                icon={Store}
                title="Revenue"
                value="$34,245"
                subtitle="Last 24 Hours"
                color="#4caf50"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                icon={AlertCircle}
                title="Fixed Issues"
                value="75"
                subtitle="Tracked from Github"
                color="#f44336"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <ChartCard
                title="Daily Sales"
                subtitle="55% increase in today sales"
                data={dailySalesData}
                color="#4caf50"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <ChartCard
                title="Email Subscriptions"
                subtitle="Last Campaign Performance"
                data={emailSubsData}
                color="#ff9800"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <ChartCard
                title="Completed Tasks"
                subtitle="Last Campaign Performance"
                data={completedTasksData}
                color="#2196f3"
              />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

export default Dashboard;
