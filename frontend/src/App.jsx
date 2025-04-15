// File: src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Components
import Navbar from './components/Navbar';
import Footer from './Components/Footer/Footer';
import ScrollToTop from './Components/ScrollToTop';
import useCustomScripts from './Hooks/useCustomScripts';

// Public Pages
import Home from './pages/Home/Home';
import About from './Components/About/About';
import Services from './Components/Services/Services';
import Contact from './Components/Contact/Contact';
import TermsOfService from './Components/TermsOfService/TermsOfService';
import Team from './Components/Team/Team';
import SignIn from './pages/Signin';
import NotFound from './pages/NotFound';
import AccessDenied from "./Components/Denied/Denied";
import Chatting, { dummyUsers } from './pages/Chat/Chatting';
import RecommendationForm from './Components/Recommendation/Recommendation';
import UploadStudentPage from './components/AddStudent';
import ProfilePage from './pages/ProfilePage';

// Dashboard Components
import Dashboard from "./pages/DashBoard/Dashboard";
import StudentDashboard from './pages/StudentDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import BranchManagerDashboard from './pages/BranchManagerDashboard';
import InstructorDashboard from './pages/Instructor/Dashboard';
import Course from "./pages/DashBoard/Courses";
import Assignments from './Components/Assignments/Assignments';
import Submissions from './pages/DashBoard/Submissions';
import Grades from './pages/DashBoard/Grades';
import CreateAssignment from './pages/DashBoard/CreateAssignment';
import Hello from './pages/DashBoard/hello';

// **Admin Dashboard:**
import AdminDashboard from './pages/AdminDashboard/Admin';

// Styles
import "./assets/css/main.css";
import "aos/dist/aos.css";
import "./App.css";

const App = () => {
  useCustomScripts();
  const { userType, role } = useSelector((state) => state.auth);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar />
      <main className="main">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/team" element={<Team />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/chat" element={<Chatting users={dummyUsers} />} />
          <Route path="/upload-student" element={<UploadStudentPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/assignment" element={<Assignments />} />
          <Route path="/recommendation" element={<RecommendationForm />} />

          {/* Dashboard Routes */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/branchmanager/dashboard" element={<BranchManagerDashboard />} />
          <Route path="/dashboard" element={<Dashboard />}>
            <Route path="courses" element={<Course />} />
            <Route path="hello" element={<Hello />} />
          </Route>

          {/* Supervisor Dashboard */}
          <Route path="/supervisor/dashboard/*" element={<SupervisorDashboard />} />

          {/* Instructor Dashboard */}
          {userType === 'staff' && role === 'instructor' && (
            <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
          )}

          {/* Admin Dashboard */}
          {userType === 'staff' && role === 'admin' && (
            <Route path="/admin/dashboard/*" element={<AdminDashboard />} />
          )}

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
};

export default App;
