import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import {
  FiMenu,
  FiX,
  FiBook,
  FiCalendar,
  FiAward,
  FiAlertTriangle,
  FiClipboard
} from 'react-icons/fi';
import './SupervisorDashboard.css';

// Import your components
import Courses from './Courses';
// import Assignments from '../pages/Instructor/Assignments';
import Assignments from '../Components/Assignments/Assignments';
import Submissions from '../pages/Instructor/Submissions';
import Grades from '../pages/Instructor/Grades';
// import CreateAssignment from '../pages/Instructor/CreateAssignment';
import CreateAssignment from '../Components/CreateAssignments/CreateAssignments';

import UploadStudentPage from '../components/AddStudent';
import UploadInstructor from '../components/AddInstructor';

const SupervisorDashboard = () => {
  const { username } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    { text: 'My Courses', icon: <FiBook />, path: '/supervisor/dashboard/courses' },
    { text: 'Add Student', icon: <FiClipboard />, path: '/supervisor/dashboard/addstudent' },
    { text: 'Create Assignment', icon: <FiCalendar />, path: '/supervisor/dashboard/create-assignment' },
    { text: 'View My Assignment', icon: <FiCalendar />, path: '/supervisor/dashboard/view-assignment' },
    { text: 'Add Instructor', icon: <FiAward />, path: '/supervisor/dashboard/addinstructor' },
    // { text: 'Grades', icon: <FiAlertTriangle />, path: '/supervisor/dashboard/grades' },
  ];

  const displayName = username ? username.split('@')[0] : 'Supervisor';

  return (
    <div className="dashboard-container">
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          {sidebarOpen && (
            <>
              <div className="welcome-message">
                <h3>Welcome back,</h3>
                <h3><b>{displayName}</b></h3>
              </div>
              <button className="toggle-btn" onClick={() => setSidebarOpen(false)}>
                <FiX size={24} />
              </button>
            </>
          )}
          {!sidebarOpen && (
            <button className="toggle-btn" onClick={() => setSidebarOpen(true)}>
              <FiMenu size={24} />
            </button>
          )}
        </div>

        <div className="menu-items">
          {menuItems.map((item) => {
            const isActive = location.pathname.endsWith(item.path);
            return (
              <Link
                to={item.path}
                className={`menu-item ${isActive ? 'active' : ''}`}
                key={item.text}
                onClick={() => {
                  if (!sidebarOpen) setSidebarOpen(true);
                }}
              >
                {item.icon}
                {sidebarOpen && <span>{item.text}</span>}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="main-content">
        <div className="content-card">
          <Routes>
            <Route index element={<Courses />} />
            <Route path="courses" element={<Courses />} />
            <Route path="addstudent" element={<UploadStudentPage />} />
            <Route path="addinstructor" element={<UploadInstructor />} />
            <Route path="create-assignment" element={<CreateAssignment />} />
            <Route path="view-assignment" element={<Assignments />} />
            <Route path="submissions" element={<Submissions />} />
            {/* <Route path="grades" element={<Grades />} /> */}
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;