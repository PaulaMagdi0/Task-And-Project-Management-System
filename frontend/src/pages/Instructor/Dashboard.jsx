import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Routes, Route, useLocation, Link } from "react-router-dom";
import {
  FiMenu,
  FiX,
  FiBook,
  FiCalendar,
  FiAward,
  FiClipboard,
  FiUploadCloud,
} from "react-icons/fi";
import { styled } from "@mui/material/styles";
import {
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import MyCourses from "../../Components/MyCourses/MyCourses";
import Assignments from "./Assignments";
import Submissions from "./Submissions";
import Grades from "./Grades";
import CreateAssignment from "./CreateAssignment";
import OpeningPage from "./OpeningPage";

const DashboardContainer = styled(Box)({
  display: "flex",
  minHeight: "100vh",
  backgroundColor: (theme) => theme.palette.background.default,
});

const SidebarWrapper = styled(Box)(({ theme, open }) => ({
  width: open ? 340 : 74,
  height: "100vh",
  position: "sticky",
  top: 0,
  transition: theme.transitions.create("width"),
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[4],
  zIndex: theme.zIndex.appBar,
}));

const SidebarHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));

const MenuItem = styled(Link)(({ theme, active }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(1.5, 2),
  margin: theme.spacing(0.5, 1.5),
  borderRadius: theme.shape.borderRadius,
  color: active ? theme.palette.primary.main : theme.palette.text.secondary,
  backgroundColor: active ? theme.palette.action.selected : "transparent",
  textDecoration: "none",
  transition: theme.transitions.create(["background-color", "color"]),
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.primary.main,
  },
  "& svg": {
    marginRight: theme.spacing(1.5),
    flexShrink: 0,
  },
}));

const MainContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(4),
  maxWidth: 1440,
  margin: "0 auto",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

const ContentCard = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  padding: theme.spacing(3),
  minHeight: "calc(100vh - 96px)",
}));

class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error: error.message };
  }

  componentDidCatch(error, info) {
    console.error('Error in component:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <Box sx={{ p: 2, color: 'error.main' }}>
          <Typography variant="h6">Something went wrong</Typography>
          <Typography>{this.state.error}</Typography>
        </Box>
      );
    }
    return this.props.children;
  }
}

const InstructorDashboard = () => {
  const { username, userType, role } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    console.log('InstructorDashboard: Current path:', location.pathname);
    console.log('Auth state:', { username, userType, role });
    setSidebarOpen(true);
  }, [username, location.pathname, userType, role]);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const menuItems = [
    { text: "My Courses", icon: <FiBook size={20} />, path: "/instructor/dashboard/courses" },
    { text: "Assignments", icon: <FiCalendar size={20} />, path: "/instructor/dashboard/assignments" },
    { text: "Create Assignment", icon: <FiClipboard size={20} />, path: "/instructor/dashboard/create-assignment" },
    { text: "Submissions", icon: <FiUploadCloud size={20} />, path: "/instructor/dashboard/submissions" },
    { text: "Grades & Feedbacks", icon: <FiAward size={20} />, path: "/instructor/dashboard/grades" },
  ];
  const displayName = username ? username.split("@")[0] : "Instructor";

  return (
    <DashboardContainer>
      <SidebarWrapper open={sidebarOpen}>
        <SidebarHeader>
          {sidebarOpen ? (
            <>
              <Box>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  Welcome back,
                </Typography>
                <Typography variant="h6" color="primary">
                  {displayName}
                </Typography>
              </Box>
              <IconButton
                onClick={() => setSidebarOpen(false)}
                size="small"
                sx={{ color: "text.secondary" }}
              >
                <FiX size={18} />
              </IconButton>
            </>
          ) : (
            <IconButton
              onClick={() => setSidebarOpen(true)}
              size="small"
              sx={{ color: "text.secondary" }}
            >
              <FiMenu size={18} />
            </IconButton>
          )}
        </SidebarHeader>

        <Box py={1}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <MenuItem
                key={item.text}
                to={item.path}
                active={isActive ? 1 : 0}
                onClick={() => !sidebarOpen && setSidebarOpen(true)}
              >
                {item.icon}
                {sidebarOpen && (
                  <Typography variant="body2">{item.text}</Typography>
                )}
              </MenuItem>
            );
          })}
        </Box>
      </SidebarWrapper>

      <MainContent>
        <ContentCard>
          <ErrorBoundary>
            <Routes>
              <Route index element={<OpeningPage />} />
              <Route path="courses" element={<MyCourses />} />
              <Route path="assignments" element={<Assignments />} />
              <Route path="create-assignment" element={<CreateAssignment />} />
              <Route path="submissions" element={<Submissions />} />
              <Route path="grades" element={<Grades />} />
            </Routes>
          </ErrorBoundary>
        </ContentCard>
      </MainContent>
    </DashboardContainer>
  );
};

export default InstructorDashboard;