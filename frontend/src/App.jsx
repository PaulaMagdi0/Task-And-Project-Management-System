import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux'; // Import useSelector
import Navbar from './components/Navbar';
// import Home from './pages/Home';
import SignIn from './pages/Signin';
import NotFound from './pages/NotFound';
import StudentDashboard from './pages/StudentDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import BranchManagerDashboard from './pages/BranchManagerDashboard';
import InstructorDashboard from './pages/Instructor/Dashboard';
// Assignment Submission Greade Creat_Assignment Course
import Course from "./pages/DashBoard/Courses"
import Assignments from './pages/DashBoard/Assignments';
import Submissions from './pages/DashBoard/Submissions';
import Grades from './pages/DashBoard/Grades';
import CreateAssignment from './pages/DashBoard/CreateAssignment';
import UploadStudentPage from './components/AddStudent';
import "./assets/css/main.css";
import "aos/dist/aos.css";
import "./App.css";
import useCustomScripts from './Hooks/useCustomScripts';
import ScrollToTop from './Components/ScrollToTop';
import About from './Components/About/About';
import Services from './Components/Services/Services';
import Contact from './Components/Contact/Contact';
import TermsOfService from './Components/TermsOfService/TermsOfService';
// import PrivacyPolicy from './Components/PrivacyPolicy/PrivacyPolicy';
import Chatting, { dummyUsers } from './pages/Chat/Chatting';
import Footer from './Components/Footer/Footer';
import Home from './pages/Home/Home';
import Team from './Components/Team/Team';
import Dashboard from "./pages/DashBoard/Dashboard"
import Hello from './pages/DashBoard/hello';
import AccessDenied from "./Components/Denied/Denied"
const App = () => {
  useCustomScripts();
  const userType = 'staff';  // Dummy data
  const role = 'instructor'; // Dummy role (can be dynamic)

  // const { userType, role } = useSelector((state) => state.auth);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<TermsOfService />} />
          {/* <Route path="/privacy" element={<PrivacyPolicy />} /> */}
          {/* <Route path="/dashboard" element={<Dashboard />} /> */}

          <Route path="/signin" element={<SignIn />} />
          {/* <Route path="/home2" element={<Home />} /> */}
          <Route path="/upload-student" element={<UploadStudentPage />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />
          <Route path="/branchmanager/dashboard" element={<BranchManagerDashboard />} />
          <Route path="/Team" element={<Team />} />


          {/* Main Dashboard Layout */}
          <Route path="/dashboard" element={<Dashboard />}>

          {/* If an instructor tries to access "Hello", show AccessDenied */}
          <Route 
            path="/dashboard/hello" 
            element={userType === 'staff' && role === 'instructor' ? <AccessDenied /> : <Hello />} 
          />

          <Route path="/dashboard/courses" element={<Course />} />
          <Route path="student" element={<StudentDashboard />} />
          <Route path="supervisor" element={<SupervisorDashboard />} />
          <Route path="branchmanager" element={<BranchManagerDashboard />} />

          {/* Instructor-specific routes */}
          {userType === 'staff' && role === 'instructor' && (
            <>
              <Route path="instructor" element={<InstructorDashboard />} />
              <Route path="/dashboard/assignments" element={<Assignments />} />
              <Route path="/dashboard/submissions" element={<Submissions />} />
              <Route path="/dashboard/createassignment" element={<CreateAssignment />} />
              <Route path="instructor/grades" element={<Grades />} />
            </>
          )}

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Route>
          
          <Route path="/chat" element={<Chatting users={dummyUsers} />} />

          <Route path="/*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
};

export default App;