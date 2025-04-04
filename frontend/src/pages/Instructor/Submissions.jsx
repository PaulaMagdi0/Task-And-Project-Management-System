import { useState } from "react";
import submissionsData from "../../data/submissions.json";
import gradesData from "../../data/grades.json";

export default function Submissions() {
  const [submissions, setSubmissions] = useState(submissionsData.submissions);
  const [grades, setGrades] = useState(gradesData.grades);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleGradeSubmission = (submissionId) => {
    // Find the selected submission from the submissions list
    const submission = submissions.find((s) => s.id === submissionId);

    // Check if a submission was selected
    if (submission) {
      // Create a new grade entry
      const newGrade = {
        student_id: submission.student.id,
        score: score,
        feedback: feedback,
        graded_date: new Date().toISOString(),
      };

      // Update the grades list (you can use localStorage or any state management here)
      setGrades([...grades, newGrade]);

      // Reset score and feedback after grading
      setScore("");
      setFeedback("");

      // Optionally, you can update the submission to show that it's graded.
      setSelectedSubmission(null); // Deselect submission
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Student Submissions</h2>
      <ul className="space-y-4">
        {submissions.map((submission) => (
          <li key={submission.id} className="p-4 border rounded-lg shadow-md">
            <h3 className="text-lg font-semibold">{submission.student.name}</h3>
            <p>Assignment ID: {submission.assignment}</p>
            <p>Submitted on: {submission.submission_date}</p>
            <a href={submission.file_url} className="text-blue-600">View Submission</a>

            {/* Grade section */}
            <div className="mt-4">
              <button
                onClick={() => setSelectedSubmission(submission)}
                className="bg-blue-500 text-white p-2 rounded"
              >
                Grade Submission
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Show grading form when a submission is selected */}
      {selectedSubmission && (
        <div className="mt-6 p-4 border rounded-lg shadow-md">
          <h3 className="text-xl font-semibold">Grade Submission</h3>
          <p>Student: {selectedSubmission.student.name}</p>
          <p>Assignment ID: {selectedSubmission.assignment}</p>

          <div className="mt-4">
            <input
              type="number"
              placeholder="Score"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="border p-2 w-full mb-4"
            />
            <textarea
              placeholder="Feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="border p-2 w-full mb-4"
            ></textarea>

            <button
              onClick={() => handleGradeSubmission(selectedSubmission.id)}
              className="bg-green-500 text-white p-2 rounded"
            >
              Submit Grade
            </button>
          </div>
        </div>
      )}

      {/* Grades List */}
      <div className="mt-6">
        <h3 className="text-2xl font-semibold">Graded Submissions</h3>
        <ul className="space-y-4">
          {grades.map((grade) => (
            <li key={grade.student_id} className="p-4 border rounded-lg shadow-md">
              <p>Student ID: {grade.student_id}</p>
              <p>Score: {grade.score}</p>
              <p>Feedback: {grade.feedback}</p>
              <p className="text-sm text-gray-500">Graded on: {grade.graded_date}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
