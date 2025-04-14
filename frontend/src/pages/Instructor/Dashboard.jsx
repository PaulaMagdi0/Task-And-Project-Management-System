import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Courses from './Courses';
import Assignments from './Assignments';
import Submissions from './Submissions';
import Grades from './Grades'; // Import the Grades component
import CreateAssignment from './CreateAssignment'; // Import CreateAssignment component
import './InstructorDashboard.css';

const InstructorDashboard = () => {
  const { username } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedOption, setSelectedOption] = useState('courses'); // Default to courses

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? '<' : '>'}
        </button>

        {sidebarOpen && (
          <>
            <h2 className='titlecolor'>Welcome, {username || 'Instructor'}</h2>
            <hr />
            <button
              className={`sidebar-button ${selectedOption === 'courses' ? 'active' : ''}`}
              onClick={() => setSelectedOption('courses')}
            >
              My Courses
            </button>
            <button
              className={`sidebar-button ${selectedOption === 'assignments' ? 'active' : ''}`}
              onClick={() => setSelectedOption('assignments')}
            >
              Assignments
            </button>
            <button
              className={`sidebar-button ${selectedOption === 'create-assignment' ? 'active' : ''}`}
              onClick={() => setSelectedOption('create-assignment')}
            >
              Create Assignment
            </button>
            <button
              className={`sidebar-button ${selectedOption === 'submissions' ? 'active' : ''}`}
              onClick={() => setSelectedOption('submissions')}
            >
              Submissions
            </button>
            <button
              className={`sidebar-button ${selectedOption === 'grades' ? 'active' : ''}`}
              onClick={() => setSelectedOption('grades')}
            >
              Grades
            </button>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="main-content">
        {selectedOption === 'courses' && (
          <>
            <h1>You Assigend To</h1>
            <Courses />
          </>
        )}

        {selectedOption === 'assignments' && (
          <>
            <h1>Your Created Assignments</h1>
            <Assignments />
          </>
        )}

        {selectedOption === 'create-assignment' && (
          <>
            <h1>Create Assignment</h1>
            <CreateAssignment />
          </>
        )}

        {selectedOption === 'submissions' && (
          <>
            <h1>Submissions from students</h1>
            <Submissions />
          </>
        )}

        {selectedOption === 'grades' && (
          <>
            <h1>Grades</h1>
            <Grades />
          </>
        )}
      </div>
    </div>
  );
};

export default InstructorDashboard;