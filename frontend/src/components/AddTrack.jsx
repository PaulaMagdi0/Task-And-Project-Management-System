// File: src/components/AddTrack.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createTrack, clearTrackState } from '../redux/tracksSlice';

const AddTrack = () => {
  const dispatch = useDispatch();
  const { loading, error, message } = useSelector((state) => state.tracks);
  const { branch } = useSelector((state) => state.auth); // Retrieve logged-in branch info

  const [form, setForm] = useState({
    name: '',
    description: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Automatically include the branch id from the logged-in branch manager
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
    <div>
      <h2>Add Track</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            name="name"
            placeholder="Track Name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <textarea
            name="description"
            placeholder="Track Description"
            value={form.description}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          Create Track
        </button>
      </form>
      {loading && <p>Loading...</p>}
      {message && <p>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default AddTrack;
