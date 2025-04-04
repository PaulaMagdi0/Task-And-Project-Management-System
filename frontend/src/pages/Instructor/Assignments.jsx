import { useState } from "react";
import assignmentsData from "../../data/assignments.json"; // Using dummy data

export default function Assignments() {
  const [assignments, setAssignments] = useState(assignmentsData.assignments);

  // Simulating the deletion of an assignment
  const deleteAssignment = (id) => {
    setAssignments(assignments.filter((assignment) => assignment.id !== id));
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Assignments</h2>
      <ul className="space-y-4">
        {assignments.map((assignment) => (
          <li key={assignment.id} className="p-4 border rounded-lg shadow-md">
            <h3 className="text-lg font-semibold">{assignment.title}</h3>
            <p>{assignment.description}</p>
            <p className="text-sm text-gray-500">
              Due: {assignment.due_date} | Ends: {assignment.end_date}
            </p>
            <button
              onClick={() => deleteAssignment(assignment.id)}
              className="bg-red-500 text-white p-2 rounded"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
