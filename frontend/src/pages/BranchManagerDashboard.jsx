// File: src/pages/BranchManagerDashboard.jsx
import React, { useState, useEffect } from 'react';
import AddTrack from '../components/AddTrack';
import AddSupervisor from '../components/AddSupervisor';
import BulkUploadSupervisors from '../components/BulkUploadSupervisors';

const BranchManagerDashboard = () => {
  const token = localStorage.getItem('authToken');
  const [username, setUsername] = useState('User');
  const [selectedOption, setSelectedOption] = useState('addTrack');
  const [supervisorOption, setSupervisorOption] = useState('manual');

  useEffect(() => {
    if (token) {
      // Dynamically import jwt-decode without any extra path
      import('jwt-decode')
        .then((module) => {
          const jwt_decode = module.default;
          if (typeof jwt_decode !== 'function') {
            console.error("jwt_decode is not a function");
            return;
          }
          const decoded = jwt_decode(token);
          setUsername(decoded.username || decoded.email || 'User');
        })
        .catch((error) => {
          console.error("Failed to decode token:", error);
        });
    }
  }, [token]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', backgroundColor: '#f0f0f0', padding: '1rem' }}>
        <h2>Welcome, {username}</h2>
        <hr />
        <button
          style={{
            width: '100%',
            padding: '0.5rem',
            marginBottom: '0.5rem',
            backgroundColor: selectedOption === 'addTrack' ? '#ccc' : '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={() => setSelectedOption('addTrack')}
        >
          Add Track
        </button>
        <button
          style={{
            width: '100%',
            padding: '0.5rem',
            backgroundColor: selectedOption === 'addSupervisors' ? '#ccc' : '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={() => setSelectedOption('addSupervisors')}
        >
          Add Supervisors
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem' }}>
        {selectedOption === 'addTrack' && (
          <div>
            <h1>Add Track</h1>
            <AddTrack />
          </div>
        )}

        {selectedOption === 'addSupervisors' && (
          <div>
            <h1>Add Supervisors</h1>
            <div style={{ marginBottom: '1rem' }}>
              <button
                style={{
                  marginRight: '1rem',
                  padding: '0.5rem',
                  backgroundColor: supervisorOption === 'manual' ? '#ccc' : '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onClick={() => setSupervisorOption('manual')}
              >
                Add Single Supervisor
              </button>
              <button
                style={{
                  padding: '0.5rem',
                  backgroundColor: supervisorOption === 'bulk' ? '#ccc' : '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onClick={() => setSupervisorOption('bulk')}
              >
                Upload Excel
              </button>
            </div>
            {supervisorOption === 'manual' ? <AddSupervisor /> : <BulkUploadSupervisors />}
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchManagerDashboard;
