// File: src/components/AssignSupervisorToTrack.jsx
import React, { useState, useEffect } from 'react';
import { FiUserCheck } from 'react-icons/fi';
import apiClient from '../services/api';

const styles = {
  container: {
    margin: '2rem auto',
    padding: '1.5rem',
    maxWidth: '600px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  title: {
    fontSize: '1.5rem',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#333'
  },
  formGroup: {
    marginBottom: '1rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '600',
    color: '#555'
  },
  select: {
    width: '100%',
    padding: '0.5rem',
    fontSize: '1rem',
    borderRadius: '4px',
    border: '1px solid #ccc'
  },
  button: {
    marginTop: '1rem',
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#007bff',
    color: '#fff',
    cursor: 'pointer'
  },
  message: {
    marginTop: '1rem',
    fontSize: '1rem',
    color: '#333'
  }
};

const AssignSupervisorToTrack = () => {
  const [tracks, setTracks] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState('');
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch available tracks
    apiClient.get('/tracks/')
      .then((res) => {
        setTracks(res.data); // Expects an array of track objects
      })
      .catch((err) => console.error('Error fetching tracks:', err));

    // Fetch staff members then filter for supervisors
    apiClient.get('/staff/')
      .then((res) => {
        const staff = res.data; // Expects an array of staff objects
        const filteredSupervisors = staff.filter(member => member.role === 'supervisor');
        setSupervisors(filteredSupervisors);
      })
      .catch((err) => console.error('Error fetching staff members:', err));
  }, []);

  const handleAssign = () => {
    if (!selectedTrack || !selectedSupervisor) {
      setMessage('Please select both a track and a supervisor.');
      return;
    }
    setLoading(true);

    // Send a PATCH request to assign the supervisor to the selected track
    apiClient.patch(`/tracks/${selectedTrack}/`, { supervisor: selectedSupervisor })
      .then(() => {
        setMessage('Supervisor assigned successfully!');
      })
      .catch((err) => {
        console.error('Error assigning supervisor:', err);
        setMessage('Error assigning supervisor.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>
        <FiUserCheck /> Assign Supervisor to Track
      </h2>
      
      <div style={styles.formGroup}>
        <label style={styles.label}>
          Track:
        </label>
        <select
          style={styles.select}
          value={selectedTrack}
          onChange={(e) => setSelectedTrack(e.target.value)}
        >
          <option value="">Select a track</option>
          {tracks.map((track) => (
            <option key={track.id} value={track.id}>
              {track.name}
            </option>
          ))}
        </select>
      </div>
      
      <div style={styles.formGroup}>
        <label style={styles.label}>
          Supervisor:
        </label>
        <select
          style={styles.select}
          value={selectedSupervisor}
          onChange={(e) => setSelectedSupervisor(e.target.value)}
        >
          <option value="">Select a supervisor</option>
          {supervisors.map((sup) => (
            <option key={sup.id} value={sup.id}>
              {sup.username}
            </option>
          ))}
        </select>
      </div>
      
      <button
        style={styles.button}
        onClick={handleAssign}
        disabled={loading}
      >
        {loading ? 'Assigning...' : 'Assign Supervisor'}
      </button>
      
      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
};

export default AssignSupervisorToTrack;
