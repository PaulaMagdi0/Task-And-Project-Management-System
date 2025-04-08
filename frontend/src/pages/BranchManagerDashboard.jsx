// File: src/components/BranchManagerDashboard.jsx
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { FiMenu, FiX, FiMap, FiUserPlus, FiUserMinus, FiLink, FiList } from 'react-icons/fi';
import AddTrack from '../components/AddTrack';
import AddSupervisor from '../components/AddSupervisor';
import AssignSupervisorToTrack from '../components/AssignSupervisorToTrack';
import TracksTable from '../components/TracksTable';
import DeleteSupervisor from '../components/DeleteSupervisor';
import './BranchManagerDashboard.css';

const BranchManagerDashboard = () => {
  const { username } = useSelector((state) => state.auth);
  const [selectedOption, setSelectedOption] = useState('addTrack');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'addTrack', icon: <FiMap />, label: 'Add Track' },
    { id: 'addSupervisors', icon: <FiUserPlus />, label: 'Add Supervisor' },
    { id: 'deleteSupervisor', icon: <FiUserMinus />, label: 'Delete Supervisor' },
    { id: 'assignSupervisor', icon: <FiLink />, label: 'Assign Supervisor' },
    { id: 'viewTracks', icon: <FiList />, label: 'View Tracks' },
  ];

  return (
    <div className="dashboard-container">
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          {sidebarOpen && (
            <>
              <div className="welcome-message">
                <h3>Welcome back,</h3>
                <h2>{username || 'User'}</h2>
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
              className={`menu-item ${selectedOption === item.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedOption(item.id);
                if (!sidebarOpen) setSidebarOpen(true);
              }}
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="main-content">
        <div className="content-card">
          {selectedOption === 'addTrack' && (
            <>
              <h1 className="section-title"><FiMap /> Track Management</h1>
              <AddTrack />
            </>
          )}

          {selectedOption === 'addSupervisors' && (
            <>
              <h1 className="section-title"><FiUserPlus /> Supervisor Management</h1>
              <AddSupervisor />
            </>
          )}

          {selectedOption === 'deleteSupervisor' && (
            <>
              <h1 className="section-title"><FiUserMinus /> Remove Supervisor</h1>
              <DeleteSupervisor />
            </>
          )}

          {selectedOption === 'assignSupervisor' && (
            <>
              <h1 className="section-title"><FiLink /> Assign Supervisor</h1>
              <AssignSupervisorToTrack />
            </>
          )}

          {selectedOption === 'viewTracks' && (
            <>
              <h1 className="section-title"><FiList /> Current Tracks</h1>
              <TracksTable />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BranchManagerDashboard;