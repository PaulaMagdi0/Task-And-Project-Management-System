import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubmissions } from '../../redux/submissionsSlice';  // Assuming you already have fetchSubmissions action
import apiClient from '../../services/api';

const Submissions = () => {
  const dispatch = useDispatch();
  const { submissions, loading, error } = useSelector((state) => state.submissions);
  const instructorId = useSelector((state) => state.auth.user_id);  // Ensure this is correctly set from your auth state
  const [feedback, setFeedback] = useState("");  // For instructor feedback
  const [selectedSubmission, setSelectedSubmission] = useState(null);  // For selected submission

  useEffect(() => {
    if (instructorId) {
      dispatch(fetchSubmissions(instructorId));  // Fetch submissions for this instructor
    }
  }, [instructorId, dispatch]);

  const handleFeedbackChange = (e) => {
    setFeedback(e.target.value);
  };

  const handleFeedbackSubmit = async (submissionId) => {
    try {
      await apiClient.put(`/submissions/${submissionId}/`, { feedback });
      alert("Feedback submitted successfully.");
      setSelectedSubmission(null);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  if (loading) return <p>Loading submissions...</p>;
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
              <td className="px-4 py-2">{submission.student.username}</td>
              <td className="px-4 py-2">{submission.assignment.title}</td>
              <td className="px-4 py-2">{submission.course.name}</td>
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
