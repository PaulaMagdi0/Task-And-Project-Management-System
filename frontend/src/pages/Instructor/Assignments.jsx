import React, { useEffect, useState } from 'react';
import apiClient from '../../services/api'; // Assuming apiClient is set up
import './Assignments.css';

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [errorAssignments, setErrorAssignments] = useState(null);
  const [errorStudents, setErrorStudents] = useState(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoadingAssignments(true);
      try {
        const response = await apiClient.get('/assignments');
        setAssignments(response.data); // Assuming the API returns a list of assignments
        setErrorAssignments(null);
      } catch (error) {
        setErrorAssignments('Failed to fetch assignments.');
        console.error("Failed to fetch assignments", error);
      } finally {
        setLoadingAssignments(false);
      }
    };

    fetchAssignments();
  }, []); // Run once when component mounts

  useEffect(() => {
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const response = await apiClient.get('/students');
        if (response.data.students) {
          setStudents(response.data.students); // Store students in state
          setErrorStudents(null);
        } else {
          setErrorStudents('No students found.');
        }
      } catch (error) {
        setErrorStudents('Failed to fetch students.');
        console.error("Failed to fetch students", error);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
  }, []); // Run once when component mounts

  if (loadingAssignments || loadingStudents) return <div className="loading">Loading...</div>;
  if (errorAssignments) return <div className="error">Error: {errorAssignments}</div>;
  if (errorStudents) return <div className="error">Error fetching students: {errorStudents}</div>;

  const getStudentName = (studentId) => {
    const student = students.find((student) => student.id === studentId);
    return student ? `${student.first_name} ${student.last_name}` : "Not Assigned";
  };

  return (
    <div className="assignments-container">
      <h2>Assignments</h2>
      {assignments.length === 0 ? <p>No assignments available.</p> : (
        <table className="assignments-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Due Date</th>
              <th>End Date</th>
              <th>Assignment Type</th>
              <th>Description</th>
              <th>Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map(assignment => (
              <tr key={assignment.id}>
                <td>{assignment.title}</td>
                <td>{new Date(assignment.due_date).toLocaleString()}</td>
                <td>{new Date(assignment.end_date).toLocaleString()}</td>
                <td>{assignment.assignment_type}</td>
                <td>{assignment.description}</td>
                <td>{getStudentName(assignment.assigned_to)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Assignments;
