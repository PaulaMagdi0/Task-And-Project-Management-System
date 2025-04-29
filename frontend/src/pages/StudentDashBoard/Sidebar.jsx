import React from 'react';
import { FiMenu, FiX, FiBook, FiClipboard, FiAlertTriangle, FiAward, FiSmile, FiFilm, FiBookOpen } from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';

const menuItems = [
  { id: 'courses', icon: <FiBook style={{ color: 'inherit' }} />, label: 'My Courses' },
  { id: 'assignments', icon: <FiClipboard style={{ color: 'inherit' }} />, label: 'Assignments' },
  { id: 'deadlines', icon: <FiAlertTriangle style={{ color: 'inherit' }} />, label: 'Upcoming Deadlines' },
  { id: 'averageGrade', icon: <FiAward style={{ color: 'inherit' }} />, label: 'Average Grade' },
  { id: 'bookHub', icon: <FiBookOpen style={{ color: 'inherit' }} />, label: 'Book Hub' },
  { id: 'entertainment', icon: <FiSmile style={{ color: 'inherit' }} />, label: 'Entertainment' },
  { id: 'library', icon: <FiFilm style={{ color: 'inherit' }} />, label: 'Media Hub' },
  { id: 'chatWithAI', icon: <FaRobot style={{ color: 'inherit' }} />, label: 'Chat With AI' },
];

const Sidebar = ({ selectedSection, setSelectedSection, sidebarOpen, setSidebarOpen, username }) => {
  const displayName = username ? username.split('@')[0] : 'User';

  return (
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
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`menu-item ${selectedSection === item.id ? 'active' : ''}`}
            onClick={() => {
              setSelectedSection(item.id);
              if (!sidebarOpen) setSidebarOpen(true);
            }}
          >
            {item.icon}
            {sidebarOpen && <span>{item.label}</span>}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;