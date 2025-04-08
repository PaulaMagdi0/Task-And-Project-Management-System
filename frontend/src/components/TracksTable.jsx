// File: src/components/TracksTable.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

const styles = {
  container: {
    margin: '2rem auto',
    padding: '1.5rem',
    maxWidth: '900px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  header: {
    marginBottom: '1rem',
    fontSize: '1.75rem',
    color: '#333'
  },
  messageSuccess: {
    color: '#28a745',
    marginBottom: '1rem'
  },
  messageError: {
    color: '#dc3545',
    marginBottom: '1rem'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '1rem'
  },
  th: {
    border: '1px solid #e0e0e0',
    padding: '0.75rem',
    backgroundColor: '#f4f4f4',
    textAlign: 'left'
  },
  td: {
    border: '1px solid #e0e0e0',
    padding: '0.75rem'
  },
  button: {
    padding: '0.375rem 0.75rem',
    fontSize: '0.875rem',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    marginRight: '0.5rem',
    marginTop: '0.5rem'
  },
  btnPrimary: {
    backgroundColor: '#007bff',
    color: '#fff'
  },
  btnOutlinePrimary: {
    backgroundColor: '#fff',
    color: '#007bff',
    border: '1px solid #007bff'
  },
  btnSecondary: {
    backgroundColor: '#6c757d',
    color: '#fff'
  },
  btnDanger: {
    backgroundColor: '#dc3545',
    color: '#fff'
  },
  select: {
    width: '100%',
    padding: '0.375rem 0.75rem',
    fontSize: '0.875rem',
    border: '1px solid #ccc',
    borderRadius: '4px'
  },
  loadingText: {
    fontStyle: 'italic'
  }
};

const TracksTable = () => {
  const [tracks, setTracks] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [editingTrackId, setEditingTrackId] = useState(null);
  const [newSupervisorId, setNewSupervisorId] = useState('');

  // Fetch tracks and sort them by track ID
  const fetchTracks = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/tracks/');
      const sortedTracks = response.data.sort((a, b) => a.id - b.id);
      setTracks(sortedTracks);
      setError('');
    } catch (err) {
      console.error('Error fetching tracks:', err);
      setError('Error fetching tracks.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch supervisors from all staff members
  const fetchSupervisors = async () => {
    try {
      const response = await apiClient.get('/staff/');
      const filtered = response.data.filter(member => member.role === 'supervisor');
      setSupervisors(filtered);
    } catch (err) {
      console.error('Error fetching supervisors:', err);
    }
  };

  useEffect(() => {
    fetchTracks();
    fetchSupervisors();
  }, []);

  const toggleEditMode = (track) => {
    setEditingTrackId(track.id);
    setNewSupervisorId(track.supervisor || '');
  };

  const cancelEdit = () => {
    setEditingTrackId(null);
    setNewSupervisorId('');
  };

  const saveSupervisor = async (trackId) => {
    try {
      await apiClient.patch(`/tracks/${trackId}/`, { supervisor: newSupervisorId || null });
      setMsg('Supervisor updated successfully.');
      setEditingTrackId(null);
      fetchTracks();
    } catch (err) {
      console.error('Error updating supervisor:', err);
      setMsg('Error updating supervisor.');
    }
  };

  const handleDelete = async (trackId) => {
    if (!window.confirm('Are you sure you want to delete this track?')) return;
    try {
      await apiClient.delete(`/tracks/${trackId}/`);
      setMsg('Track deleted successfully.');
      fetchTracks();
    } catch (err) {
      console.error('Error deleting track:', err);
      setMsg('Error deleting track.');
    }
  };

  const getSupervisorName = (supervisorId) => {
    const supervisor = supervisors.find(s => s.id === supervisorId);
    return supervisor ? supervisor.username : supervisorId;
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Tracks</h2>
      {loading && <p style={styles.loadingText}>Loading tracks...</p>}
      {msg && <p style={styles.messageSuccess}>{msg}</p>}
      {error && <p style={styles.messageError}>{error}</p>}
      {tracks.length === 0 ? (
        <p>No tracks found.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Track Name</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Supervisor</th>
              <th style={styles.th}>Delete</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((track) => (
              <tr key={track.id}>
                <td style={styles.td}>{track.id}</td>
                <td style={styles.td}>{track.name}</td>
                <td style={styles.td}>{track.description}</td>
                <td style={styles.td}>
                  {editingTrackId === track.id ? (
                    <>
                      <select
                        style={styles.select}
                        value={newSupervisorId}
                        onChange={(e) => setNewSupervisorId(e.target.value)}
                      >
                        <option value="">-- Select Supervisor --</option>
                        {supervisors.map(sup => (
                          <option key={sup.id} value={sup.id}>
                            {sup.username}
                          </option>
                        ))}
                      </select>
                      <div>
                        <button 
                          style={{ ...styles.button, ...styles.btnPrimary }}
                          onClick={() => saveSupervisor(track.id)}
                        >
                          Save
                        </button>
                        <button 
                          style={{ ...styles.button, ...styles.btnSecondary }}
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {track.supervisor ? getSupervisorName(track.supervisor) : 'None'}
                      <button 
                        style={{ ...styles.button, ...styles.btnOutlinePrimary, marginLeft: '0.5rem' }}
                        onClick={() => toggleEditMode(track)}
                      >
                        {track.supervisor ? 'Change' : 'Assign'}
                      </button>
                    </>
                  )}
                </td>
                <td style={styles.td}>
                  <button 
                    style={{ ...styles.button, ...styles.btnDanger }}
                    onClick={() => handleDelete(track.id)}
                  >
                    Delete
                  </button>
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
