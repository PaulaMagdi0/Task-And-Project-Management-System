import { Link } from "react-router-dom";

export default function InstructorDashboard() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Instructor Dashboard</h2>
      <ul className="space-y-3">
        <li>
          <Link to="/instructor/assignments" className="text-blue-600">
            View Assignments
          </Link>
        </li>
        <li>
          <Link to="/instructor/submissions" className="text-blue-600">
            View Student Submissions
          </Link>
        </li>
        <li>
          <Link to="/instructor/grades" className="text-blue-600">
            Manage Grades & Feedback
          </Link>
        </li>
      </ul>
    </div>
  );
}
