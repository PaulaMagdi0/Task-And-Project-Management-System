// File: src/components/AddSupervisor.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSupervisor, clearSupervisorState } from '../redux/supervisorsSlice';

const AddSupervisor = () => {
  const dispatch = useDispatch();
  const { loading, error, message } = useSelector((state) => state.supervisors);
  const { branch } = useSelector((state) => state.auth); // Get branch info from auth slice

  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!branch || !branch.id) {
      alert("No branch information available. Please log in again.");
      return;
    }
    // Remove the "role" field since the view will set it automatically.
    const supervisorData = {
      ...form,
      branch_id: branch.id,
      password: "password1345", // Default password
    };
    dispatch(createSupervisor(supervisorData));
  };

  useEffect(() => {
    return () => {
      dispatch(clearSupervisorState());
    };
  }, [dispatch]);

  // Helper to safely render errors/messages
  const renderValue = (value) =>
    typeof value === 'object' && value !== null ? JSON.stringify(value) : value;

  return (
    <div>
      <h2>Add Supervisor</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <p>Default password: <strong>password1345</strong></p>
        </div>
        <div>
          <input
            type="text"
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
          />
        </div>
        <button type="submit" disabled={loading}>Create Supervisor</button>
      </form>
      {loading && <p>Loading...</p>}
      {message && <p>{renderValue(message)}</p>}
      {error && <p style={{ color: 'red' }}>{renderValue(error)}</p>}
    </div>
  );
};

export default AddSupervisor;
