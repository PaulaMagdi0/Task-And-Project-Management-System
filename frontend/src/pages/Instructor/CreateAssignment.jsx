import { useState } from "react";
import assignmentsData from "../../data/assignments.json";
import studentsData from "../../data/students.json";

export default function CreateAssignment() {
  const [assignments, setAssignments] = useState(assignmentsData.assignments); // Using the dummy data from assignments.json
  const [assignment, setAssignment] = useState({
    title: "",
    description: "",
    due_date: "",
    end_date: "",
    assignTo: "all",
    assigned_students: [],
  });

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setAssignment({ ...assignment, [name]: value });
  };

  // Handle the "Assign To" selection
  const handleAssignTo = (e) => {
    setAssignment({ ...assignment, assignTo: e.target.value, assigned_students: [] });
  };

  // Handle form submission to create a new assignment
  const handleSubmit = (e) => {
    e.preventDefault();

    // Create a new ID for the assignment (based on existing data)
    const newId = assignments.length ? Math.max(...assignments.map(a => a.id)) + 1 : 1;

    // Create a new assignment object
    const newAssignment = {
      ...assignment,
      id: newId,
      created_at: new Date().toISOString(),
      assignment_type: "Task", // You can modify this based on the input
      file: "", // For file uploads (you can extend this part later)
      file_url: "", // Same as above
      course_id: 101, // You can adjust this if needed
    };

    // Update the assignments state (adding the new assignment)
    setAssignments([...assignments, newAssignment]);

    // Optionally reset the form fields
    setAssignment({
      title: "",
      description: "",
      due_date: "",
      end_date: "",
      assignTo: "all",
      assigned_students: [],
    });
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Create Assignment</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="title"
          placeholder="Title"
          onChange={handleChange}
          className="border p-2 w-full"
        />
        <textarea
          name="description"
          placeholder="Description"
          onChange={handleChange}
          className="border p-2 w-full"
        ></textarea>
        <input
          type="date"
          name="due_date"
          onChange={handleChange}
          className="border p-2 w-full"
        />
        <input
          type="date"
          name="end_date"
          onChange={handleChange}
          className="border p-2 w-full"
        />

        <label>Assign To:</label>
        <select onChange={handleAssignTo} className="border p-2 w-full">
          <option value="all">All Students</option>
          <option value="individual">Individual Student</option>
          <option value="group">Group</option>
        </select>

        {assignment.assignTo === "individual" && (
          <select
            onChange={(e) => setAssignment({ ...assignment, assigned_students: [e.target.value] })}
            className="border p-2 w-full"
          >
            {studentsData.students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        )}

        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Create
        </button>
      </form>
    </div>
  );
}
