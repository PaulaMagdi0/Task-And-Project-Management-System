import React from "react";
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  IconButton,
  Badge,
  styled,
} from "@mui/material";
import {
  Home,
  FileText,
  LogOut,
  User,
  Settings,
  Bell,
  Plus,
  Grid,
  Users as UsersIcon,
  BookOpen,
  BarChart2,
  ClipboardList,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";

const NavButton = styled(Button)(({ theme }) => ({
  color: theme.palette.common.white,
  textTransform: "none",
  fontWeight: 500,
  fontSize: "0.875rem",
  margin: theme.spacing(0, 0.5),
  padding: theme.spacing(1, 1.5),
  borderRadius: theme.shape.borderRadius,
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  "&.active": {
    backgroundColor: "#d32f2f", // Blood red for active state
    color: theme.palette.getContrastText("#d32f2f"),
  },
}));

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token, username, role } = useSelector((state) => state.auth);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleClose();
    navigate("/signin");
  };

  // Role-specific navigation items
  const renderRoleSpecificLinks = () => {
    switch (role) {
      case "instructor":
        return (
          <>
            <NavButton
              component={Link}
              to="/instructor/dashboard"
              startIcon={<ClipboardList size={18} />}
            >
              My Dashboard
            </NavButton>
          </>
        );
      case "supervisor":
        return (
          <>
            <NavButton
              component={Link}
              to="/supervisor/dashboard"
              startIcon={<BarChart2 size={18} />}
            >
              Supervisor Dashboard
            </NavButton>
            <NavButton
              component={Link}
              to="/supervisor/reports"
              startIcon={<FileText size={18} />}
            >
              Reports
            </NavButton>
          </>
        );
      case "student":
        return (
          <>
          <NavButton
            component={Link}
            to="/student/dashboard?section=courses" // Add query parameter
            startIcon={<BookOpen size={18} />}
          >
            My Courses
          </NavButton>
          <NavButton
            component={Link}
            to="/student/dashboard?section=assignments"
            startIcon={<FileText size={18} />}
          >
            Assignments
          </NavButton>
        </>
        );
      case "branchmanager":
        return (
          <>
            <NavButton
              component={Link}
              to="/branchmanager/dashboard"
              startIcon={<Grid size={18} />}
            >
              Branch Overview
            </NavButton>
            <NavButton
              component={Link}
              to="/branchmanager/staff"
              startIcon={<UsersIcon size={18} />}
            >
              Staff Management
            </NavButton>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        bgcolor: "rgba(18, 18, 18, 0.95)",
        background:
          "linear-gradient(135deg, rgba(18, 18, 18, 0.95) 0%, rgba(30, 30, 30, 0.95) 100%)",
        boxShadow: "none",
        borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
        top: 0,
        zIndex: 1200,
        "@supports (backdrop-filter: blur(8px))": {
          backdropFilter: "blur(8px)",
          bgcolor: "rgba(18, 18, 18, 0.8)",
        },
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        {/* Left side - Logo and Navigation buttons */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              mr: 2,
              fontWeight: 700,
              color: "#d32f2f",
              textDecoration: "none",
              "&:hover": {
                color: "#b71c1c",
              },
            }}
          >
            TaskManager
          </Typography>

          <NavButton component={Link} to="/" startIcon={<Home size={18} />}>
            Home
          </NavButton>

          {token && renderRoleSpecificLinks()}
        </Box>

        {/* Right side - Icons and user dropdown */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {token && (
            <>
              <IconButton
                component={Link}
                to={
                  role === "instructor"
                    ? "/instructor/tasks/new"
                    : role === "student"
                    ? "/student/assignments/new"
                    : "/tasks/new"
                }
                sx={{
                  backgroundColor: "#d32f2f", // Blood red
                  color: "white",
                  "&:hover": {
                    backgroundColor: "#b71c1c", // Darker blood red on hover
                  },
                }}
              >
                <Plus size={20} />
              </IconButton>

              <IconButton size="medium" sx={{ color: "common.white" }}>
                <Badge badgeContent={4} color="error">
                  <Bell size={20} />
                </Badge>
              </IconButton>

              {/* User profile dropdown */}
              <IconButton
                onClick={handleClick}
                size="small"
                sx={{ ml: 1 }}
                aria-controls={open ? "account-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: "#d32f2f", // Blood red
                    color: "white",
                  }}
                >
                  {username?.charAt(0)?.toUpperCase()}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    overflow: "visible",
                    filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                    mt: 1.5,
                    bgcolor: "#2d2d2d",
                    color: "white",
                    "& .MuiAvatar-root": {
                      width: 32,
                      height: 32,
                      ml: -0.5,
                      mr: 1,
                    },
                    "& .MuiListItemIcon-root": {
                      color: "inherit",
                    },
                    "&:before": {
                      content: '""',
                      display: "block",
                      position: "absolute",
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: "#2d2d2d",
                      transform: "translateY(-50%) rotate(45deg)",
                      zIndex: 0,
                    },
                  },
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >
                <MenuItem
                  onClick={() => navigate("/profile")}
                  sx={{
                    "&:hover": {
                      backgroundColor: "rgba(211, 47, 47, 0.1)", // Semi-transparent blood red
                    },
                  }}
                >
                  <ListItemIcon>
                    <User size={20} />
                  </ListItemIcon>
                  <ListItemText>Profile</ListItemText>
                </MenuItem>
                <Divider sx={{ bgcolor: "rgba(255, 255, 255, 0.12)" }} />
                <MenuItem
                  onClick={handleLogout}
                  sx={{
                    "&:hover": {
                      backgroundColor: "rgba(211, 47, 47, 0.1)", // Semi-transparent blood red
                    },
                  }}
                >
                  <ListItemIcon>
                    <LogOut size={20} />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Menu>
            </>
          )}

          {!token && (
            <>
              <Button
                component={Link}
                to="/signin"
                variant="text"
                sx={{ color: "white" }}
              >
                Sign In
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
