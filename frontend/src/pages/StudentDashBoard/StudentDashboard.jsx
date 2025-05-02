import React, { useState, useEffect, Component } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import Sidebar from "./Sidebar";
import CoursesSection from "./CoursesSection";
import AssignmentsSection from "./AssignmentsSection";
import DeadlinesSection from "./DeadlinesSection";
import GradesSection from "./GradesSection";
import EntertainmentSection from "./EntertainmentSection";
import LibrarySection from "./LibrarySection";
import BookHubSection from "./BookHubSection";
import ChatWithAISection from "./ChatWithAISection";
import { fetchStudentData } from "./api";
import "./StudentDashboard.css";

// Error Boundary for the entire dashboard
class DashboardErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="error">
            An error occurred in the dashboard.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Error: {this.state.error?.message || "Unknown error"}
          </Typography>
        </Box>
      );
    }
    return this.props.children;
  }
}

const StudentDashboard = () => {
  const [selectedSection, setSelectedSection] = useState("courses");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [data, setData] = useState({
    student: null,
    courses: [],
    assignments: [],
    grades: [],
    averageGrade: null,
    loading: true,
    error: null,
  });
  const [submittedAssignments, setSubmittedAssignments] = useState({});
  const navigate = useNavigate();
  const { username, token } = useSelector((state) => state.auth);
  const location = useLocation();

  useEffect(() => {
    // Reset state when username changes (new student logs in)
    setData({
      student: null,
      courses: [],
      assignments: [],
      grades: [],
      averageGrade: null,
      loading: true,
      error: null,
    });
    setSubmittedAssignments({});
    setSelectedSection("courses");
    localStorage.removeItem("submittedAssignments"); // Clear previous user's submissions

    // Parse query parameters
    const queryParams = new URLSearchParams(location.search);
    const section = queryParams.get("section");

    // Set selectedSection based on query parameter
    if (section === "assignments") {
      setSelectedSection("assignments");
    } else if (section === "courses") {
      setSelectedSection("courses");
    }

    const fetchData = async () => {
      try {
        setData((prev) => ({ ...prev, loading: true, error: null }));
        console.log('StudentDashboard fetching data with token:', token ? 'Present' : 'Missing');
        const response = await fetchStudentData();
        console.log("Fetched Data:", JSON.stringify(response, null, 2));
        setData({
          student: response.student,
          courses: response.courses || [],
          assignments: response.assignments || [],
          grades: response.grades || [],
          averageGrade: response.averageGrade,
          loading: false,
          error: null,
        });
        setSubmittedAssignments((prev) => {
          const updatedSubmissions = { ...response.submissions };
          localStorage.setItem(
            "submittedAssignments",
            JSON.stringify(updatedSubmissions)
          );
          return updatedSubmissions;
        });
      } catch (error) {
        console.error("Fetch Error:", JSON.stringify(error, null, 2));
        setData((prev) => ({ ...prev, loading: false, error: error.message }));
        if (error.response?.status === 401) {
          console.warn('Unauthorized access, redirecting to login');
          navigate("/login");
        }
      }
    };

    if (username && token) {
      fetchData();
    } else {
      console.warn('No username or token, redirecting to login');
      navigate("/login");
    }
  }, [username, token, navigate, location.search]);

  useEffect(() => {
    // Update selectedSection based on query parameter changes
    const queryParams = new URLSearchParams(location.search);
    const section = queryParams.get("section");
    if (section && section !== selectedSection) {
      if (section === "assignments" || section === "courses") {
        setSelectedSection(section);
      }
    }
  }, [location.search, selectedSection]);

  const renderSection = () => {
    console.log("Rendering Section:", selectedSection, "Grades:", data.grades);
    if (data.loading) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress sx={{ color: "#e53935" }} />
        </Box>
      );
    }

    if (data.error) {
      return (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="error">
            Error loading data: {data.error}
          </Typography>
        </Box>
      );
    }

    switch (selectedSection) {
      case "courses":
        return (
          <CoursesSection
            courses={data.courses}
            assignments={data.assignments}
            submittedAssignments={submittedAssignments}
          />
        );
      case "assignments":
        return (
          <AssignmentsSection
            data={data}
            submittedAssignments={submittedAssignments}
            setSubmittedAssignments={setSubmittedAssignments}
          />
        );
      case "deadlines":
        return (
          <DeadlinesSection
            assignments={data.assignments}
            submittedAssignments={submittedAssignments}
          />
        );
      case "averageGrade":
        return (
          <GradesSection
            grades={data.grades}
            assignments={data.assignments}
            courses={data.courses}
          />
        );
      case "entertainment":
        return <EntertainmentSection />;
      case "library":
        return <LibrarySection />;
      case "bookHub":
        return <BookHubSection />;
      case "chatWithAI":
        return <ChatWithAISection />;
      default:
        return null;
    }
  };

  return (
    <DashboardErrorBoundary>
      <div className="dashboard-container">
        <Sidebar
          selectedSection={selectedSection}
          setSelectedSection={setSelectedSection}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          username={username}
        />
        <div className="main-content">
          <div className="content-card">{renderSection()}</div>
        </div>
      </div>
    </DashboardErrorBoundary>
  );
};

export default StudentDashboard;