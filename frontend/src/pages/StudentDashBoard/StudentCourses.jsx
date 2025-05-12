// src/pages/StudentCourses.jsx
import React, { useEffect, useState } from 'react';
import apiClient from '../../services/api';

const StudentCourses = () => {
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // Fetch student's courses and assignments
        const response = await apiClient.get('/api/student/9/courses/');
        setCourses(response.data.courses);
        setAssignments(response.data.assignments);
      } catch (err) {
        console.error(err);
        setError('Failed to load courses or assignments');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  if (loading) return <p>Loading courses and assignments...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>My Courses</h2>
      {courses.length > 0 ? (
        <ul>
          {courses.map((course) => (
            <li key={course.course_id} style={{ marginBottom: '1rem' }}>
              <strong>{course.name}</strong>
              <p>{course.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>You have no courses for your intake.</p>
      )}

      <h2>My Assignments</h2>
      {assignments.length > 0 ? (
        <ul>
          {assignments.map((assignment) => (
            <li key={assignment.id} style={{ marginBottom: '1rem' }}>
              <strong>{assignment.title}</strong>
              <p>{assignment.description}</p>
              <small>Due: {new Date(assignment.due_date).toLocaleString()}</small>
              {assignment.file_url && (
                <p>
                  <a href={assignment.file_url} target="_blank" rel="noopener noreferrer">
                    Download Assignment File
                  </a>
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No assignments found for your intake.</p>
      )}
    </div>
  );
};

export default StudentCourses;