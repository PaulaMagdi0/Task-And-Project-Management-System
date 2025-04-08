// src/pages/Courses.jsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCourses } from '../redux/coursesSlice';

const Courses = () => {
  const dispatch = useDispatch();
  const { data: courses, loading, error } = useSelector((state) => state.courses);

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  if (loading) return <p>Loading courses...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>Courses</h2>
      <ul>
        {courses.map((course) => (
          <li key={course.id}>
            {course.name} - {course.description}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Courses;
