// File: src/components/AddTrack.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiMapPin, FiAlignLeft, FiMap ,  FiPlus } from 'react-icons/fi';
import { createTrack, clearTrackState } from '../redux/tracksSlice';

const AddTrack = () => {
  const dispatch = useDispatch();
  const { loading, error, message } = useSelector((state) => state.tracks);
  const { branch } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    name: '',
    description: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trackData = {
      ...form,
      branch: branch ? branch.id : null,
    };
    dispatch(createTrack(trackData));
  };

  useEffect(() => {
    return () => {
      dispatch(clearTrackState());
    };
  }, [dispatch]);

  return (
    <div className="track-form">
   <h1 className="section-title"><FiPlus /> Add New Track</h1>
      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-group">
          <label className="input-label">
            <FiMap className="input-icon" />
            Track Name
          </label>
          <input
            type="text"
            name="name"
            className="form-input"
            placeholder="Enter track name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="input-label">
            <FiAlignLeft className="input-icon" />
            Description
          </label>
          <textarea
            name="description"
            className="form-input"
            placeholder="Enter track description"
            value={form.description}
            onChange={handleChange}
            required
            rows="4"
          />
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Track'}
        </button>

        {message && (
          <div className="alert-box success">
            {message}
          </div>
        )}

        {error && (
          <div className="alert-box error">
            {error}
          </div>
        )}
      </form>
    </div>
  );
};

export default AddTrack;