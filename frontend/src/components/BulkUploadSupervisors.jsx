// File: src/components/BulkUploadSupervisors.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bulkUploadSupervisors, clearSupervisorState } from '../redux/supervisorsSlice';

const BulkUploadSupervisors = () => {
  const dispatch = useDispatch();
  const { loading, error, message } = useSelector((state) => state.supervisors);
  
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = (e) => {
    e.preventDefault();
    if (!file) return;
    dispatch(bulkUploadSupervisors(file));
  };

  useEffect(() => {
    return () => {
      dispatch(clearSupervisorState());
    };
  }, [dispatch]);

  return (
    <div>
      <h2>Bulk Upload Supervisors</h2>
      <form onSubmit={handleUpload}>
        <div>
          <input type="file" accept=".xlsx" onChange={handleFileChange} />
        </div>
        <button type="submit" disabled={loading}>Upload Excel</button>
      </form>
      {loading && <p>Loading...</p>}
      {message && <p>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default BulkUploadSupervisors;
