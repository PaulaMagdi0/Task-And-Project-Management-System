import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await apiClient.get('/courses/');
        setCourses(response.data);
      } catch (err) {
        setError('Failed to fetch courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) return <p>Loading courses...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Courses</h2>
      <ul className="space-y-4">
        {courses.map((course) => (
          <li key={course.id} className="p-4 border rounded-lg shadow-md">
            <h3 className="text-lg font-semibold">{course.name}</h3>
            <p>{course.description}</p>
            <p>Instructor ID: {course.instructor}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Courses;
