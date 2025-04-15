// File: src/pages/AdminDashboard/AdminDashboard.jsx

import React, { useState } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiMenu, FiX, FiMapPin, FiBookOpen, FiUsers } from 'react-icons/fi';


// Import your admin dashboard sub-components.
// Make sure to create or adjust these components accordingly.
import BranchManagement from './BranchManagment';
import TracksManagement from './TracksManagment';
import StaffManagement from './StaffManagment';

const AdminDashboard = () => {
  // Get the logged-in username from Redux auth slice.
  const { username } = useSelector((state) => state.auth);
  // Sidebar state to toggle open and closed.
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Get current location from react-router.
  const location = useLocation();

  // Define menu items for Admin Dashboard.
  // Adjust the icons and paths as needed.
  const menuItems = [
    {
      text: 'Branch Management',
      icon: <FiMapPin />,
      path: '/admin/dashboard/branch',
    },
    {
      text: 'Tracks Management',
      icon: <FiBookOpen />,
      path: '/admin/dashboard/tracks',
    },
    {
      text: 'Staff Management',
      icon: <FiUsers />,
      path: '/admin/dashboard/staff',
    },
  ];

  // Create a display name (e.g. remove domain part if email).
  const displayName = username ? username.split('@')[0] : 'Admin';

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          {sidebarOpen ? (
            <>
              <div className="welcome-message">
                <h3>Welcome,</h3>
                <h3>
                  <b>{displayName}</b>
                </h3>
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
        {/* Menu Items */}
        <div className="menu-items">
          {menuItems.map((item) => {
            // Check if the current pathname matches or starts with the item path.
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path);
            return (
              <Link
                to={item.path}
                key={item.text}
                className={`menu-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (!sidebarOpen) {
                    setSidebarOpen(true);
                  }
                }}
              >
                {item.icon}
                {sidebarOpen && <span>{item.text}</span>}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-card">
          <Routes>
            <Route path="branch" element={<BranchManagement />} />
            <Route path="tracks" element={<TracksManagement />} />
            <Route path="staff" element={<StaffManagement />} />
            {/* Default route */}
            <Route index element={<BranchManagement />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
