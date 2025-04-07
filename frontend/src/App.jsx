import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux'; // Import useSelector
import Navbar from './components/Navbar';
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
import UploadStudentPage from './components/AddStudent';

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
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/upload-student" element={<UploadStudentPage />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />
          <Route path="/branchmanager/dashboard" element={<BranchManagerDashboard />} />

          {/* Instructor Dashboard Routes */}
          {userType === 'staff' && role === 'instructor' && (
            <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
          )}
          <Route path="/instructor/assignments" element={<Assignments />} />
          <Route path="/instructor/submissions" element={<Submissions />} />
          <Route path="/instructor/grades" element={<Grades />} />
          <Route path="/instructor/createTask" element={<CreateTask />} />
          <Route path="/chat" element={<Chatting users={dummyUsers} />} />

          <Route path="/*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
};

export default App;