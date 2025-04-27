// src/pages/StudentCourses.jsx
import React, { useEffect, useState } from 'react';
import apiClient from '../../services/api';

const StudentCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudentCourses = async () => {
      try {
        // Adjust the endpoint URL to match your back-end API.
        const response = await apiClient.get('/student/courses/');
        setCourses(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch courses');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentCourses();
  }, []);

  if (loading) return <p>Loading courses...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>My Courses</h2>
      {courses.length > 0 ? (
        <ul>
          {courses.map((course) => (
            <li key={course.id} style={{ marginBottom: '1rem' }}>
              <strong>{course.name}</strong>
              <p>{course.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>You have no courses at the moment.</p>
      )}
    </div>
  );
};

export default StudentCourses;
