// File: src/components/DeleteSupervisor.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

const DeleteSupervisor = () => {
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // Fetch staff members and filter only those with role "supervisor"
  const fetchSupervisors = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/staff/');
      const filtered = response.data.filter((member) => member.role === 'supervisor');
      setSupervisors(filtered);
      setError('');
    } catch (err) {
      console.error("Error fetching supervisors:", err);
      setError("Error fetching supervisors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this supervisor?")) return;
    try {
      await apiClient.delete(`/staff/${id}/`);
      setMsg("Supervisor deleted successfully.");
      fetchSupervisors();
    } catch (err) {
      console.error("Error deleting supervisor:", err);
      setMsg("Error deleting supervisor.");
    }
  };

  return (
    <div>
      <h2>Delete Supervisor</h2>
      {loading && <p>Loading supervisors...</p>}
      {msg && <p style={{ color: 'green' }}>{msg}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {supervisors.length === 0 ? (
        <p>No supervisors found.</p>
      ) : (
        <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', marginTop: '1rem' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {supervisors.map((sup) => (
              <tr key={sup.id}>
                <td>{sup.id}</td>
                <td>{sup.username}</td>
                <td>{sup.email}</td>
                <td>
                  <button onClick={() => handleDelete(sup.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DeleteSupervisor;
