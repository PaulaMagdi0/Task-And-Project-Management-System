import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import useCustomScripts from "./Hooks/useCustomScripts";
import Navbar from "./Components/Navbar/Navbar";
import Footer from "./Components/Footer/Footer";
import ScrollToTop from "./Components/ScrollToTop";
import NotFound from "./Components/NotFound/NotFound";
import Home from "./pages/Home/Home";
import About from "./pages/About/About";
import Services from "./pages/Services/Services";
import Contact from "./pages/Contact/Contact";
import TermsOfService from "./pages/TermsOfService/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy/PrivacyPolicy";
import Chatting, { dummyUsers } from "./pages/Chat/Chatting";

import "./assets/css/main.css";
import "aos/dist/aos.css";
import "./App.css";

const App = () => {
  useCustomScripts();

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

          <Route path="/chat" element={<Chatting users={dummyUsers} />} />

          <Route path="/*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
};

export default App;
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

function App() {
  // Retrieve userType and role from Redux store
  const { userType, role } = useSelector((state) => state.auth);

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
