import React, { useState } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiMenu, FiX, FiMapPin, FiBookOpen, FiUsers, FiMessageCircle } from 'react-icons/fi';

// Import your admin dashboard sub-components.
import BranchManagement from './BranchManagment';
import TracksManagement from './TracksManagment';
import StaffManagement from './StaffManagment';
// ** Chat imports **
import ChatRoomList from '../../Components/Chat/ChatRoomList';
import ChatRoomView from '../../Components/Chat/ChatRoomView';

const AdminDashboard = () => {
  const { username } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const displayName = username ? username.split('@')[0] : 'Admin';

  const menuItems = [
    { text: 'Branch Management', icon: <FiMapPin />, path: '/admin/dashboard/branch' },
    { text: 'Tracks Management', icon: <FiBookOpen />, path: '/admin/dashboard/tracks' },
    { text: 'Staff Management', icon: <FiUsers />, path: '/admin/dashboard/staff' },
    { text: 'Chat', icon: <FiMessageCircle />, path: '/admin/dashboard/chat' },
  ];

  return (
    <div className="dashboard-container">
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          {sidebarOpen ? (
            <>
              <div className="welcome-message">
                <h3>Welcome,</h3>
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
          {menuItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path);
            return (
              <Link
                to={item.path}
                key={item.text}
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
            <Route path="branch" element={<BranchManagement />} />
            <Route path="tracks" element={<TracksManagement />} />
            <Route path="staff" element={<StaffManagement />} />
            {/* Chat routes */}
            <Route path="chat" element={<ChatRoomList />} />
            <Route path="chat/rooms/:roomId" element={<ChatRoomView />} />
            <Route index element={<BranchManagement />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
