// File: src/components/AddSupervisor.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiUserPlus, FiLock, FiSmartphone, FiMail } from 'react-icons/fi';
import { createSupervisor, clearSupervisorState } from '../redux/supervisorsSlice';
import './AddSupervisor.css'; // Assuming you have a CSS file for styling
const AddSupervisor = () => {
  const dispatch = useDispatch();
  const { loading, error, message } = useSelector((state) => state.supervisors);
  const { branch } = useSelector((state) => state.auth);

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
      alert('No branch information available. Please log in again.');
      return;
    }
    const supervisorData = {
      ...form,
      branch_id: branch.id,
      password: 'password1345',
    };
    dispatch(createSupervisor(supervisorData));
  };

  useEffect(() => {
    return () => {
      dispatch(clearSupervisorState());
    };
  }, [dispatch]);

  const renderValue = (value) =>
    typeof value === 'object' && value !== null ? JSON.stringify(value) : value;

  return (
    <div className="supervisor-form">
      <h1 className="section-title"><FiUserPlus /> Add Supervisor</h1>
      
      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-group">
          <label className="input-label">
            <FiUserPlus className="input-icon" />
            Username
          </label>
          <input
            type="text"
            name="username"
            className="form-input"
            value={form.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="input-label">
            <FiMail className="input-icon" />
            Email
          </label>
          <input
            type="email"
            name="email"
            className="form-input"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="input-label">
            <FiSmartphone className="input-icon" />
            Phone (Optional)
          </label>
          <input
            type="text"
            name="phone"
            className="form-input"
            value={form.phone}
            onChange={handleChange}
          />
        </div>

        <div className="info-box">
          <FiLock className="icon" />
          <div>
            <p className="info-title">Default Credentials</p>
            <p className="info-text">Password: <strong>password1345</strong></p>
          </div>
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Supervisor'}
        </button>

        {message && (
          <div className="alert-box success">
            {renderValue(message)}
          </div>
        )}

        {error && (
          <div className="alert-box error">
            {renderValue(error)}
          </div>
        )}
      </form>
    </div>
  );
};

export default AddSupervisor;