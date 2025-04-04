import { useState } from "react";
import gradesData from "../../data/grades.json";

export default function Grades() {
  const [grades, setGrades] = useState(gradesData.grades);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Student Grades</h2>
      <ul className="space-y-4">
        {grades.map((grade) => (
          <li key={grade.id} className="p-4 border rounded-lg shadow-md">
            <p>Student ID: {grade.student_id}</p>
            <p>Score: {grade.score}</p>
            <p>Feedback: {grade.feedback}</p>
            <p className="text-sm text-gray-500">Graded on: {grade.graded_date}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
