import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAssignments, createAssignment } from '../../redux/assignmentsSlice';
import { useForm } from 'react-hook-form';
import apiClient from '../../services/api';

const Assignments = () => {
  const dispatch = useDispatch();
  const { assignments, loading, error } = useSelector((state) => state.assignments);
  const instructorId = useSelector((state) => state.auth.user_id);
  const [formVisible, setFormVisible] = useState(false);
  const [courses, setCourses] = useState([]); // To store courses assigned to the instructor
  const [students, setStudents] = useState([]); // Store students for the assignment
  const { register, handleSubmit, reset, watch } = useForm();

  useEffect(() => {
    if (instructorId) {
      dispatch(fetchAssignments(instructorId)); // Fetch assignments for this instructor
    }

    const fetchCourses = async () => {
      try {
        const response = await apiClient.get('/courses/');
        // Filter the courses to only show those assigned to the instructor
        const assignedCourses = response.data.filter(course => course.instructor === instructorId);
        setCourses(assignedCourses);
      } catch (error) {
        console.error("Failed to fetch courses", error);
      }
    };

    const fetchStudents = async () => {
      try {
        const response = await apiClient.get('/students/');
        console.log("Fetched students:", response.data.students); // Optional: confirm in console
        setStudents(response.data.students); // ✅ This sets it as an array
      } catch (error) {
        console.error("Failed to fetch students", error);
        setStudents([]); // fallback
      }
    };
    

    fetchCourses();
    fetchStudents();
  }, [instructorId, dispatch]);

  // Handle form submission
  const onSubmit = async (data) => {
    const assignmentData = {
      ...data,
      instructor: instructorId,
      students: data.students,
      file: null,  // Do not include the file in the request
    };

    try {
      const response = await apiClient.post('/assignments/', assignmentData);
      console.log('Assignment created:', response.data);
      reset();
      setFormVisible(false);
    } catch (error) {
      console.error('Error creating assignment:', error);
    }
  };

  if (loading) return <p>Loading assignments...</p>;
  if (error) return <p>{error}</p>;
  if (assignments.length === 0) return <p>No assignments available.</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Assignments</h2>
      <button
        className="bg-blue-500 text-white p-2 rounded"
        onClick={() => setFormVisible(!formVisible)}
      >
        {formVisible ? 'Cancel' : 'Create New Assignment'}
      </button>

      {/* Show form if formVisible is true */}
      {formVisible && (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
          <div>
            <label>Title:</label>
            <input {...register('title')} className="p-2 border rounded" required />
          </div>
          <div>
            <label>Assignment Type:</label>
            <select {...register('assignment_type')} className="p-2 border rounded" required>
              <option value="task">Task</option>
              <option value="project">Project</option>
              <option value="exam">Exam</option>
            </select>
          </div>
          <div>
            <label>Due Date:</label>
            <input
              {...register('due_date')}
              type="datetime-local"
              className="p-2 border rounded"
              required
            />
          </div>
          <div>
            <label>End Date:</label>
            <input
              {...register('end_date')}
              type="datetime-local"
              className="p-2 border rounded"
              required
            />
          </div>
          <div>
            <label>Description:</label>
            <textarea {...register('description')} className="p-2 border rounded" required />
          </div>

          {/* Course selection dropdown */}
          <div>
            <label>Select Course:</label>
            <select
              {...register('course')}
              className="p-2 border rounded"
              required
            >
              {courses.length === 0 ? (
                <option value="">Loading courses...</option>
              ) : (
                courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* New section for selecting students */}
          <div>
            <label>Assign to:</label>
            <select
              {...register('assignment_to')}
              className="p-2 border rounded"
            >
              <option value="all">All Students</option>
              <option value="specific">Specific Students</option>
            </select>
          </div>

          {/* Conditional rendering for specific students */}
          {watch("assignment_to") === "specific" && (
            <div>
              <label>Select Students:</label>
              <select
                {...register('students')}
                multiple
                className="p-2 border rounded"
              >
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" className="bg-green-500 text-white p-2 rounded mt-4">
            Create Assignment
          </button>
        </form>
      )}

      <ul className="space-y-4 mt-6">
        {assignments.map((assignment) => (
          <li key={assignment.id} className="p-4 border rounded-lg shadow-md">
            <h3 className="text-lg font-semibold">{assignment.title}</h3>
            <p>{assignment.description}</p>
            <p>Due Date: {assignment.due_date}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Assignments;
