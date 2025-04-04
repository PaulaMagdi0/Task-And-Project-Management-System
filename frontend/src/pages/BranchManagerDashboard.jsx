// File: src/components/BranchManagerDashboard.jsx
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import AddTrack from '../components/AddTrack';
import AddSupervisor from '../components/AddSupervisor';
import AssignSupervisorToTrack from '../components/AssignSupervisorToTrack';
import TracksTable from '../components/TracksTable';
import DeleteSupervisor from '../components/DeleteSupervisor';
import './BranchManagerDashboard.css';

const BranchManagerDashboard = () => {
  // Retrieve username from Redux auth slice
  const { username } = useSelector((state) => state.auth);
  
  // Options: "addTrack", "addSupervisors", "deleteSupervisor", "assignSupervisor", "viewTracks"
  const [selectedOption, setSelectedOption] = useState('addTrack');
  // Sidebar state (closed by default)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-container">
      {/* Collapsible Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <button 
          className="sidebar-toggle" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? '<' : '>'}
        </button>
        {sidebarOpen && (
          <>
            <h2>Welcome, {username || 'User'}</h2>
            <hr />
            <button 
              className={`sidebar-button ${selectedOption === 'addTrack' ? 'active' : ''}`}
              onClick={() => setSelectedOption('addTrack')}
            >
              Add Track
            </button>
            <button 
              className={`sidebar-button ${selectedOption === 'addSupervisors' ? 'active' : ''}`}
              onClick={() => setSelectedOption('addSupervisors')}
            >
              Add Supervisor
            </button>
            <button 
              className={`sidebar-button ${selectedOption === 'deleteSupervisor' ? 'active' : ''}`}
              onClick={() => setSelectedOption('deleteSupervisor')}
            >
              Delete Supervisor
            </button>
            <button 
              className={`sidebar-button ${selectedOption === 'assignSupervisor' ? 'active' : ''}`}
              onClick={() => setSelectedOption('assignSupervisor')}
            >
              Assign Supervisor
            </button>
            <button 
              className={`sidebar-button ${selectedOption === 'viewTracks' ? 'active' : ''}`}
              onClick={() => setSelectedOption('viewTracks')}
            >
              View Tracks
            </button>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="main-content">
        {selectedOption === 'addTrack' && (
          <div>
            <h1>Add Track</h1>
            <AddTrack />
          </div>
        )}

        {selectedOption === 'addSupervisors' && (
          <div>
            <h1>Add Supervisor</h1>
            <AddSupervisor />
          </div>
        )}

        {selectedOption === 'deleteSupervisor' && (
          <div>
            <h1>Delete Supervisor</h1>
            <DeleteSupervisor />
          </div>
        )}

        {selectedOption === 'assignSupervisor' && (
          <div>
            <h1>Assign Supervisor to Track</h1>
            <AssignSupervisorToTrack />
          </div>
        )}

        {selectedOption === 'viewTracks' && (
          <div>
            <h1>Current Tracks</h1>
            <TracksTable />
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchManagerDashboard;
