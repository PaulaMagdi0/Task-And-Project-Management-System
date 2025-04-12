import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubmissions } from '../../redux/submissionsSlice';
import { fetchCourses } from '../../redux/coursesSlice';
import { fetchAssignments } from '../../redux/assignmentsSlice';
import { fetchStudents } from '../../redux/studentsSlice';
import apiClient from '../../services/api';

const Submissions = () => {
  const dispatch = useDispatch();
  const { submissions, loading, error } = useSelector((state) => state.submissions);
  const { data: courses } = useSelector((state) => state.courses);
  const { assignments } = useSelector((state) => state.assignments);
  const { data: students, loading: studentsLoading, error: studentsError } = useSelector((state) => state.students);
  const instructorId = useSelector((state) => state.auth.user_id);
  const [feedback, setFeedback] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    dispatch(fetchSubmissions());
    dispatch(fetchCourses());
    dispatch(fetchAssignments(instructorId));
    dispatch(fetchStudents());
  }, [dispatch, instructorId]);

  const handleFeedbackChange = (e) => {
    setFeedback(e.target.value);
  };

  const handleFeedbackSubmit = async (submissionId) => {
    try {
      await apiClient.put(`/submissions/${submissionId}/`, { feedback });
      alert('Feedback submitted successfully.');
      setSelectedSubmission(null);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const getCourseName = (courseId) => {
    const course = courses.find((course) => course.id === courseId);
    return course ? course.name : 'Unknown Course';
  };

  const getAssignmentTitle = (assignmentId) => {
    const assignment = assignments.find((assignment) => assignment.id === assignmentId);
    return assignment ? assignment.title : 'Unknown Assignment';
  };

  // Add a check to ensure students is always an array
  const getStudentName = (studentId) => {
    if (Array.isArray(students)) {
      const student = students.find((student) => student.id === studentId);
      return student ? `${student.first_name} ${student.last_name}` : 'Unknown Student';
    }
    return 'Unknown Student';  // Fallback if students is not an array
  };

  if (loading || studentsLoading) return <p>Loading submissions...</p>;
  if (studentsError) return <p>Error fetching students: {studentsError}</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Submissions</h2>
      <table className="table-auto w-full text-left">
        <thead>
          <tr>
            <th className="px-4 py-2">Student</th>
            <th className="px-4 py-2">Assignment</th>
            <th className="px-4 py-2">Course</th>
            <th className="px-4 py-2">Submission Date</th>
            <th className="px-4 py-2">Submitted File/URL</th>
            <th className="px-4 py-2">Feedback</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => (
            <tr key={submission.id} className="border-b">
              <td className="px-4 py-2">{getStudentName(submission.student)}</td>
              <td className="px-4 py-2">{getAssignmentTitle(submission.assignment)}</td>
              <td className="px-4 py-2">{getCourseName(submission.course)}</td>
              <td className="px-4 py-2">{new Date(submission.submission_date).toLocaleString()}</td>
              <td className="px-4 py-2">
                {submission.file ? (
                  <a href={submission.file} target="_blank" rel="noopener noreferrer">View File</a>
                ) : submission.file_url ? (
                  <a href={submission.file_url} target="_blank" rel="noopener noreferrer">View URL</a>
                ) : (
                  'No file submitted'
                )}
              </td>
              <td className="px-4 py-2">
                {selectedSubmission?.id === submission.id ? (
                  <div className="mt-4">
                    <textarea
                      value={feedback}
                      onChange={handleFeedbackChange}
                      className="p-2 border rounded"
                      placeholder="Provide feedback..."
                    />
                    <button
                      onClick={() => handleFeedbackSubmit(submission.id)}
                      className="bg-green-500 text-white p-2 rounded mt-2"
                    >
                      Submit Feedback
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedSubmission(submission)}
                    className="bg-blue-500 text-white p-2 rounded mt-2"
                  >
                    Provide Feedback
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Submissions;
