import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createAssignment } from '../../redux/assignmentsSlice'; // Redux action to create an assignment
import apiClient from '../../services/api'; // Assuming your API client is set up
import "./CreateAssignment.css"
const CreateAssignment = () => {
  const dispatch = useDispatch();
  const { user_id } = useSelector((state) => state.auth); // Getting user_id from auth slice
  const [courses, setCourses] = useState([]); // Store available courses
  const [students, setStudents] = useState([]); // Store available students
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assignmentType, setAssignmentType] = useState('project');
  const [description, setDescription] = useState('');
  const [course, setCourse] = useState(''); // For selected course
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [isFile, setIsFile] = useState(true); // Flag to toggle between file or URL
  const [assignToAll, setAssignToAll] = useState(true); // Flag to toggle between all students or individual student
  const [selectedStudent, setSelectedStudent] = useState(null); // For selected student if assignToAll is false
  const [loadingStudents, setLoadingStudents] = useState(false); // State for loading students
  const [error, setError] = useState(null); // State for any API errors

  // Fetch courses for the instructor
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await apiClient.get('/courses/');
        const assignedCourses = response.data.filter(course => course.instructor === user_id);
        setCourses(assignedCourses);
      } catch (error) {
        console.error("Failed to fetch courses", error);
      }
    };

    fetchCourses();
  }, [user_id]);

  // Fetch students when the instructor selects a course
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoadingStudents(true);
        const response = await apiClient.get('students/');
        if (response.data.students) {
          setStudents(response.data.students); // Assuming the API response contains a `students` array
          setError(null); // Reset error if students are fetched successfully
        } else {
          setError('No students found.');
        }
      } catch (error) {
        setError('Failed to fetch students.');
        console.error("Failed to fetch students", error);
      } finally {
        setLoadingStudents(false);
      }
    };

    if (course) {
      fetchStudents();
    }
  }, [course]);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    console.log("Form Data:", { title, dueDate, endDate, assignmentType, description, course, selectedStudent, assignToAll, file, fileUrl });
  
    // Create an empty FormData object
    const formData = new FormData();
  
    // Append basic assignment data to formData
    formData.append('title', title);
    formData.append('due_date', dueDate);
    formData.append('end_date', endDate);
    formData.append('assignment_type', assignmentType);
    formData.append('description', description);
    formData.append('course', course);
  
    // Handle file or URL input
    if (isFile && file) {
      formData.append('file', file);
    } else if (!isFile && fileUrl) {
      formData.append('file_url', fileUrl);
    }
  
    if (assignToAll) {
      // Loop over all students and send requests
      for (const student of students) {
        const studentFormData = new FormData(); // Create a new FormData instance for each student
  
        // Append all the same data to the new FormData instance
        studentFormData.append('title', title);
        studentFormData.append('due_date', dueDate);
        studentFormData.append('end_date', endDate);
        studentFormData.append('assignment_type', assignmentType);
        studentFormData.append('description', description);
        studentFormData.append('course', course);
  
        // Append the student-specific data
        studentFormData.append('assigned_to', student.id); // Assign to current student
  
        // Handle file or URL input for each student
        if (isFile && file) {
          studentFormData.append('file', file);
        } else if (!isFile && fileUrl) {
          studentFormData.append('file_url', fileUrl);
        }
  
        try {
          await apiClient.post('assignments/', studentFormData);
          console.log(`Assigned to student ${student.username}`);
        } catch (error) {
          console.error(`Error assigning to student ${student.username}:`, error);
        }
      }
    } else {
      // Assign to selected student
      formData.append('assigned_to', selectedStudent);
  
      try {
        await apiClient.post('assignments/', formData);
        console.log(`Assigned to student ${selectedStudent}`);
      } catch (error) {
        console.error('Error assigning:', error);
      }
    }
  };
  

  return (
    <div className="create-assignment">
      <h2>Create Assignment</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Due Date</label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label>End Date</label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Assignment Type</label>
          <select
            value={assignmentType}
            onChange={(e) => setAssignmentType(e.target.value)}
          >
            <option value="task">Task</option>
            <option value="project">Project</option>
            <option value="exam">Exam</option>
          </select>
        </div>
        <div>
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        
        {/* Course selection dropdown */}
        <div>
          <label>Select Course</label>
          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            required
          >
            <option value="">Select a course...</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        {/* Choose between all students or individual student */}
        <div>
          <label>Assign to</label>
          <div>
            <label>
              <input
                type="radio"
                value="all"
                checked={assignToAll}
                onChange={() => setAssignToAll(true)}
              />
              All Students
            </label>
            <label>
              <input
                type="radio"
                value="individual"
                checked={!assignToAll}
                onChange={() => setAssignToAll(false)}
              />
              Individual Student
            </label>
          </div>
        </div>

        {/* Conditional rendering for individual student selection */}
        {!assignToAll && (
          <div>
            <label>Select Student</label>
            {loadingStudents ? (
              <p>Loading students...</p> // Loading message
            ) : error ? (
              <p style={{ color: 'red' }}>{error}</p> // Error message
            ) : (
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                required
              >
                <option value="">Select a student...</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.first_name} {student.last_name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Radio buttons to choose between file upload and URL */}
        <div>
          <label>Upload File or Provide URL</label>
          <div>
            <label>
              <input
                type="radio"
                value="file"
                checked={isFile}
                onChange={() => setIsFile(true)}
              />
              Upload File
            </label>
            <label>
              <input
                type="radio"
                value="url"
                checked={!isFile}
                onChange={() => setIsFile(false)}
              />
              Provide URL
            </label>
          </div>
        </div>

        {/* Conditional rendering for file upload or URL input */}
        {isFile ? (
          <div>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>
        ) : (
          <div>
            <input
              type="text"
              placeholder="Or provide a URL"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
            />
          </div>
        )}

        <button type="submit">Create Assignment</button>
      </form>
    </div>
  );
};

export default CreateAssignment;
