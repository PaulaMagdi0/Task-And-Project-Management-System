// File: src/components/AddSupervisor.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSupervisor, clearSupervisorState } from '../redux/supervisorsSlice';

const AddSupervisor = () => {
  const dispatch = useDispatch();
  const { loading, error, message } = useSelector((state) => state.supervisors);

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createSupervisor(form));
  };

  useEffect(() => {
    return () => {
      dispatch(clearSupervisorState());
    };
  }, [dispatch]);

  return (
    <div>
      <h2>Add Supervisor</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input type="text" name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
        </div>
        <div>
          <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        </div>
        <div>
          <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        </div>
        <div>
          <input type="text" name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
        </div>
        <button type="submit" disabled={loading}>Create Supervisor</button>
      </form>
      {loading && <p>Loading...</p>}
      {message && <p>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default AddSupervisor;
