import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { useSelector } from 'react-redux';

// Pages
import Home from './pages/Home';
import SignIn from './pages/Signin';
import NotFound from './pages/NotFound';
import StudentDashboard from './pages/StudentDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import BranchManagerDashboard from './pages/BranchManagerDashboard';
import InstructorDashboard from './pages/Instructor/Dashboard';
import Assignments from './pages/Instructor/Assignments';
import Submissions from './pages/Instructor/Submissions';
import Grades from './pages/Instructor/Grades';
import CreateTask from './pages/Instructor/CreateAssignment';

// Components
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';

const theme = createTheme({
  palette: {
    primary: {
      main: '#00acc1', // Custom primary color
    },
    background: {
      default: '#f5f5f5', // Light grey background
    },
  },
  components: {
    MuiPaper: {
      defaultProps: {
        elevation: 1, // Default Paper elevation
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Disable background image
        },
      },
    },
  },
});

function App() {
  // Retrieve userType and role from Redux store
  const { userType, role } = useSelector((state) => state.auth);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Navbar /> {/* Navbar rendered on all pages */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />
          <Route path="/branchmanager/dashboard" element={<BranchManagerDashboard />} />

          {/* Conditional routes for Instructor role */}
          {userType === 'staff' && role === 'instructor' && (
            <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
          )}
          <Route path="/instructor/assignments" element={<Assignments />} />
          <Route path="/instructor/submissions" element={<Submissions />} />
          <Route path="/instructor/grades" element={<Grades />} />
          <Route path="/instructor/createTask" element={<CreateTask />} />

          {/* Dashboard route */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Catch-all route for 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
