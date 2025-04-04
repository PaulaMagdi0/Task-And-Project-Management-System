// File: src/components/TracksTable.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

const TracksTable = () => {
  const [tracks, setTracks] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  // Track which track is in edit mode for supervisor assignment.
  const [editingTrackId, setEditingTrackId] = useState(null);
  const [newSupervisorId, setNewSupervisorId] = useState('');

  // Fetch tracks from the backend and sort them by track id
  const fetchTracks = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/tracks/');
      // Sort tracks by track id (assuming track.id is numeric)
      const sortedTracks = response.data.sort((a, b) => a.id - b.id);
      setTracks(sortedTracks);
      setError('');
    } catch (err) {
      console.error("Error fetching tracks:", err);
      setError("Error fetching tracks.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all staff and filter only supervisors
  const fetchSupervisors = async () => {
    try {
      const response = await apiClient.get('/staff/');
      // Filter the data to only include staff with role "supervisor"
      const filtered = response.data.filter((member) => member.role === 'supervisor');
      setSupervisors(filtered);
    } catch (err) {
      console.error("Error fetching supervisors:", err);
    }
  };

  useEffect(() => {
    fetchTracks();
    fetchSupervisors();
  }, []);

  // Toggle edit mode for a track row
  const toggleEditMode = (track) => {
    setEditingTrackId(track.id);
    setNewSupervisorId(track.supervisor || '');
  };

  // Cancel edit mode
  const cancelEdit = () => {
    setEditingTrackId(null);
    setNewSupervisorId('');
  };

  // Save the updated supervisor for a track
  const saveSupervisor = async (trackId) => {
    try {
      await apiClient.patch(`/tracks/${trackId}/`, { supervisor: newSupervisorId || null });
      setMsg("Supervisor updated successfully.");
      setEditingTrackId(null);
      fetchTracks();
    } catch (err) {
      console.error("Error updating supervisor:", err);
      setMsg("Error updating supervisor.");
    }
  };

  // Delete track handler remains unchanged
  const handleDelete = async (trackId) => {
    if (!window.confirm("Are you sure you want to delete this track?")) return;
    try {
      await apiClient.delete(`/tracks/${trackId}/`);
      setMsg("Track deleted successfully.");
      fetchTracks();
    } catch (err) {
      console.error("Error deleting track:", err);
      setMsg("Error deleting track.");
    }
  };

  // Helper: Given a supervisor id, find and return its username.
  const getSupervisorName = (supervisorId) => {
    const supervisor = supervisors.find((s) => s.id === supervisorId);
    return supervisor ? supervisor.username : supervisorId;
  };

  return (
    <div>
      <h2>Tracks</h2>
      {loading && <p>Loading tracks...</p>}
      {msg && <p style={{ color: 'green' }}>{msg}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {tracks.length === 0 ? (
        <p>No tracks found.</p>
      ) : (
        <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', marginTop: '1rem' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Track Name</th>
              <th>Description</th>
              <th>Supervisor</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((track) => (
              <tr key={track.id}>
                <td>{track.id}</td>
                <td>{track.name}</td>
                <td>{track.description}</td>
                <td>
                  {editingTrackId === track.id ? (
                    <>
                      <select
                        value={newSupervisorId}
                        onChange={(e) => setNewSupervisorId(e.target.value)}
                      >
                        <option value="">-- Select Supervisor --</option>
                        {supervisors.map((sup) => (
                          <option key={sup.id} value={sup.id}>
                            {sup.username}
                          </option>
                        ))}
                      </select>
                      <button onClick={() => saveSupervisor(track.id)}>Save</button>
                      <button onClick={cancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      {track.supervisor ? getSupervisorName(track.supervisor) : 'None'}
                      <button onClick={() => toggleEditMode(track)} style={{ marginLeft: '8px' }}>
                        {track.supervisor ? 'Change' : 'Assign'}
                      </button>
                    </>
                  )}
                </td>
                <td>
                  <button onClick={() => handleDelete(track.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TracksTable;
