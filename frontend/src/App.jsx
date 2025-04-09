import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "./components/Navbar/Navbar";
import SignIn from "./pages/Signin";
import NotFound from "./Components/NotFound/NotFound";
import StudentDashboard from "./pages/StudentDashboard";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import BranchManagerDashboard from "./pages/BranchManagerDashboard";
import InstructorDashboard from "./pages/Instructor/Dashboard";
import Assignments from "./pages/Instructor/Assignments";
import Submissions from "./pages/Instructor/Submissions";
import Grades from "./pages/Instructor/Grades";
import CreateTask from "./pages/Instructor/CreateAssignment";
import UploadStudentPage from "./components/AddStudent";
import "./assets/css/main.css";
import "aos/dist/aos.css";
import "./App.css";
import useCustomScripts from "./Hooks/useCustomScripts";
import ScrollToTop from "./Components/ScrollToTop";
import About from "./Components/About/About";
import Services from "./Components/Services/Services";
import Contact from "./Components/Contact/Contact";
import TermsOfService from "./Components/TermsOfService/TermsOfService";
import Chatting from "./pages/Chat/Chatting";
import Footer from "./Components/Footer/Footer";
import Home from "./pages/Home/Home";
import Team from "./Components/Team/Team";
import Dashboard from "./pages/DashBoard/Dashboard";

const App = () => {
  useCustomScripts();
  const { userType, role } = useSelector((state) => state.auth);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/upload-student" element={<UploadStudentPage />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />
        <Route
          path="/branchmanager/dashboard"
          element={<BranchManagerDashboard />}
        />
        <Route path="/team" element={<Team />} />

        {/* Instructor Dashboard Routes */}
        {userType === "staff" && role === "instructor" && (
          <Route
            path="/instructor/dashboard"
            element={<InstructorDashboard />}
          />
        )}
        <Route path="/instructor/assignments" element={<Assignments />} />
        <Route path="/instructor/submissions" element={<Submissions />} />
        <Route path="/instructor/grades" element={<Grades />} />
        <Route path="/instructor/createTask" element={<CreateTask />} />
        <Route path="/chat" element={<Chatting />} />

        <Route path="/*" element={<NotFound />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
};

export default App;
