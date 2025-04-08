import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import { useSelector } from 'react-redux';
import './Courses.css'; // Import the CSS file

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Access the logged-in user's ID from Redux
  const { user_id } = useSelector((state) => state.auth);

  // Log the user_id to ensure it's being correctly fetched from Redux
  console.log('Logged-in user_id:', user_id);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await apiClient.get('/courses/');
        console.log('Courses data:', response.data);

        // Filter courses to only show those assigned to the logged-in instructor
        const assignedCourses = response.data.filter(course => course.instructor === user_id);
        console.log('Assigned courses:', assignedCourses);
        setCourses(assignedCourses);
      } catch (err) {
        setError('Failed to fetch courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user_id]); // This runs whenever the user_id changes

  if (loading) return <p>Loading courses...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Courses</h2>
      {courses.length > 0 ? (
        <table className="courses-table">
          <thead>
            <tr>
              <th>Course Name</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td>{course.name}</td>
                <td>{course.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>You are not assigned to any courses yet.</p>
      )}
    </div>
  );
};

export default Courses;
