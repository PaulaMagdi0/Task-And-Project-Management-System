// File: src/components/Grades.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGrades, createGrade } from '../../redux/gradesSlice'; 
import { useForm } from 'react-hook-form';
import apiClient from '../../services/api';

const Grades = () => {
  const dispatch = useDispatch();
  const { grades, loading, error } = useSelector((state) => state.grades);
  const instructorId = useSelector((state) => state.auth.user_id);
  const [formVisible, setFormVisible] = useState(false);
  const [students, setStudents] = useState([]);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (instructorId) {
      dispatch(fetchGrades(instructorId));
    }

    const fetchStudents = async () => {
      try {
        const response = await apiClient.get('students/');
        setStudents(response.data.students);
      } catch (error) {
        console.error("Failed to fetch students", error);
      }
    };

    fetchStudents();
  }, [instructorId, dispatch]);

  const onSubmit = async (data) => {
    const gradeData = {
      ...data,
      instructor: instructorId,
    };

    try {
      await dispatch(createGrade(gradeData)).unwrap();
      reset();
      setFormVisible(false);
    } catch (error) {
      console.error('Error creating grade:', error);
    }
  };

  if (loading) return <p>Loading grades...</p>;
  if (error) return <p>{error}</p>;

  const gradesArray = grades?.grades || [];

  if (gradesArray.length === 0) return <p>No grades available.</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Grades</h2>

      {formVisible && (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <label>Select Student:</label>
            <select {...register('student')} className="p-2 border rounded w-full" required>
              <option value="">Select a student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Score:</label>
            <input
              {...register('score')}
              type="number"
              min="0"
              max="100"
              className="p-2 border rounded w-full"
              required
            />
          </div>
          <div>
            <label>Feedback:</label>
            <textarea {...register('feedback')} className="p-2 border rounded w-full" />
          </div>
          <button type="submit" className="bg-green-500 text-white p-2 rounded mt-4">
            Submit Grade
          </button>
        </form>
      )}

      <ul className="space-y-4 mt-6">
        {gradesArray.map((grade) => (
          <li key={grade.id} className="p-4 border rounded-lg shadow-md">
            <h3 className="text-lg font-semibold">
              {grade.student_name} - {grade.assignment_title}
            </h3>
            <p>Score: {grade.score}</p>
            <p>Feedback: {grade.feedback || 'No feedback provided'}</p>
            <p>Graded Date: {new Date(grade.graded_date).toLocaleString()}</p>
            <p>Course: {grade.course_name}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Grades;
