// File: src/pages/SupervisorDashboard.jsx
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import {
  FiMenu,
  FiX,
  FiBook,
  FiCalendar,
  FiAward,
  FiClipboard,
  FiMessageCircle,
  FiUploadCloud
} from 'react-icons/fi';
import './SupervisorDashboard.css';
import { NotebookText, ArchiveRestore } from 'lucide-react';

// Import your components
import Courses from './Courses';
import Assignments from '../../Components/Assignments/Assignments';
import Submissions from '../../Components/Submissions/Submissions';
import AddCourses from '../../Components/AddCourses/AddCourss';
import Grades from '../../Components/Grades/Grades';
import CreateAssignment from '../../Components/CreateAssignments/CreateAssignments';
import UploadStudentPage from '../../components/AddStudent';
import UploadInstructor from '../../Components/AddInstructor/AddInstructor';
// ** Chat imports **
import ChatRoomView from '../../Components/Chat/ChatRoomView';
import ChatRoomList from '../../Components/Chat/ChatRoomList';
import Tracks from '../../Components/Tracks/Tracks';
import ReassignInstructor from '../../Components/ReAssignCourse/ReAssignCourse';

const SupervisorDashboard = () => {
  const { username } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const displayName = username ? username.split('@')[0] : 'Supervisor';

  const menuItems = [
    { text: 'My Tracks', icon: <FiMessageCircle />, path: '/supervisor/dashboard/tracks' },
    { text: 'Tracks Courses', icon: <FiBook />, path: '/supervisor/dashboard/courses' },
    { text: 'Add Student', icon: <FiClipboard />, path: '/supervisor/dashboard/addstudent' },
    { text: 'Create Assignment', icon: <ArchiveRestore />, path: '/supervisor/dashboard/create-assignment' },
    { text: 'View Assignments', icon: <FiCalendar />, path: '/supervisor/dashboard/view-assignment' },
    { text: 'Add Instructor', icon: <FiAward />, path: '/supervisor/dashboard/addinstructor' },
    { text: 'Add Courses', icon: <NotebookText />, path: '/supervisor/dashboard/addcourses' },
    { text: 'ReassignCourse', icon: <FiBook />, path: '/supervisor/dashboard/ReassignCourse' },

    { text: 'Submissions', icon: <FiUploadCloud />, path: '/supervisor/dashboard/Submissions' },
    { text: "Grades",icon : <FiAward/>,path:"/supervisor/dashboard/Grades"},
    { text: 'Chat', icon: <FiMessageCircle />, path: '/supervisor/dashboard/chat' },

  ];

  return (
    <div className="dashboard-container">
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          {sidebarOpen ? (
            <>
              <div className="welcome-message">
                <h3>Welcome back,</h3>
                <h3><b>{displayName}</b></h3>
              </div>
              <button className="toggle-btn" onClick={() => setSidebarOpen(false)}>
                <FiX size={24} />
              </button>
            </>
          ) : (
            <button className="toggle-btn" onClick={() => setSidebarOpen(true)}>
              <FiMenu size={24} />
            </button>
          )}
        </div>
        <div className="menu-items">
          {menuItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.text}
                to={item.path}
                className={`menu-item ${isActive ? 'active' : ''}`}
                onClick={() => sidebarOpen || setSidebarOpen(true)}
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
            <Route path="tracks" element={<Tracks />} />
            <Route path="courses" element={<Courses />} />
            <Route path="addstudent" element={<UploadStudentPage />} />
            <Route path="addinstructor" element={<UploadInstructor />} />
            <Route path="create-assignment" element={<CreateAssignment />} />
            <Route path="view-assignment" element={<Assignments />} />
            <Route path="submissions" element={<Submissions />} />
            <Route path="addcourses" element={<AddCourses />} />
            <Route path="Grades" element={<Grades />} />
            <Route path="ReAssignCourse" element={<ReassignInstructor />} />

            {/* Chat routes */}
            <Route path="chat" element={<ChatRoomList />} />
            <Route path="chat/rooms/:roomId" element={<ChatRoomView />} />
            {/* <Route path="grades" element={<Grades />} /> */}
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;
