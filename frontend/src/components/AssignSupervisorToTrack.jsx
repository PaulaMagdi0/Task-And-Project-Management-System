// File: src/components/AssignSupervisorToTrack.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

const AssignSupervisorToTrack = () => {
  const [tracks, setTracks] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState('');
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch tracks
    apiClient.get('/tracks/')
      .then((res) => {
        setTracks(res.data); // Assuming res.data is an array of track objects
      })
      .catch((err) => console.error("Error fetching tracks:", err));

    // Fetch staff members and then filter for supervisors
    apiClient.get('/staff/')
      .then((res) => {
        const staff = res.data; // Assuming res.data is an array of staff objects
        const filteredSupervisors = staff.filter(member => member.role === 'supervisor');
        setSupervisors(filteredSupervisors);
      })
      .catch((err) => console.error("Error fetching staff members:", err));
  }, []);

  const handleAssign = () => {
    if (!selectedTrack || !selectedSupervisor) {
      setMessage("Please select both a track and a supervisor.");
      return;
    }
    setLoading(true);
    // Update track to assign the supervisor (PATCH request)
    apiClient.patch(`/tracks/${selectedTrack}/`, { supervisor: selectedSupervisor })
      .then((res) => {
        setMessage("Supervisor assigned successfully!");
      })
      .catch((err) => {
        console.error("Error assigning supervisor:", err);
        setMessage("Error assigning supervisor.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <h2>Assign Supervisor to Track</h2>
      <div style={{ marginBottom: '1rem' }}>
        <label>
          Track:&nbsp;
          <select value={selectedTrack} onChange={(e) => setSelectedTrack(e.target.value)}>
            <option value="">Select a track</option>
            {tracks.map((track) => (
              <option key={track.id} value={track.id}>{track.name}</option>
            ))}
          </select>
        </label>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label>
          Supervisor:&nbsp;
          <select value={selectedSupervisor} onChange={(e) => setSelectedSupervisor(e.target.value)}>
            <option value="">Select a supervisor</option>
            {supervisors.map((sup) => (
              <option key={sup.id} value={sup.id}>{sup.username}</option>
            ))}
          </select>
        </label>
      </div>
      <button onClick={handleAssign} disabled={loading}>
        {loading ? "Assigning..." : "Assign Supervisor"}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default AssignSupervisorToTrack;
