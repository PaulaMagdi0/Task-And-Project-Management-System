import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FiMenu, FiX, FiBook, FiCalendar, FiAward, FiAlertTriangle, FiClipboard, FiUsers, FiUpload, FiPaperclip, FiCheckCircle } from 'react-icons/fi';
import {
  Box, Card, CardHeader, CardContent, LinearProgress, Grid, Typography, List, ListItem, ListItemIcon, ListItemText, Divider, CircularProgress, Alert, Input, Button, IconButton, InputAdornment, TextField, Collapse, Tabs, Tab, Select, MenuItem, FormControl, InputLabel, Chip
} from '@mui/material';
import axios from 'axios';
import './StudentDashboard.css';
import { useNavigate } from 'react-router-dom';

const menuItems = [
  {
    id: 'courses',
    icon: <FiBook style={{ color: 'inherit' }} />,
    label: 'My Courses'
  },
  {
    id: 'assignments',
    icon: <FiClipboard style={{ color: 'inherit' }} />,
    label: 'Assignments'
  },
  {
    id: 'deadlines',
    icon: <FiAlertTriangle style={{ color: 'inherit' }} />,
    label: 'Upcoming Deadlines'
  },
  {
    id: 'averageGrade',
    icon: <FiAward style={{ color: 'inherit' }} />,
    label: 'Average Grade'
  },
];

const StudentDashboard = () => {
  const [expandedAssignment, setExpandedAssignment] = useState(null);
  const [urlInputs, setUrlInputs] = useState({});
  const [isSubmitting, setIsSubmitting] = useState({});
  const [submissionStatus, setSubmissionStatus] = useState({});
  const [submittedAssignments, setSubmittedAssignments] = useState({});
  const [assignmentTab, setAssignmentTab] = useState('pending');
  const [courseFilter, setCourseFilter] = useState('all');
  const [deadlineFilter, setDeadlineFilter] = useState('');
  const [gradeCourseFilter, setGradeCourseFilter] = useState('all');
  const [gradeSubmissionDateFilter, setGradeSubmissionDateFilter] = useState('');
  const navigate = useNavigate();

  const { username } = useSelector((state) => state.auth);
  const [selectedSection, setSelectedSection] = useState('courses');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [data, setData] = useState({
    student: null,
    courses: [],
    assignments: [],
    grades: [],
    averageGrade: null,
    loading: true,
    error: null,
  });

  // Get unique deadline dates for assignment filter
  const getUniqueDeadlines = () => {
    const deadlines = new Set(data.assignments
      .filter(assignment => 
        assignment.end_date && 
        !submittedAssignments[assignment.id]?.submitted && 
        new Date(assignment.end_date) >= new Date()
      )
      .map(assignment => new Date(assignment.end_date).toISOString().slice(0, 10))
    );
    return Array.from(deadlines).sort();
  };

  // Get unique submission dates for grade filter
  const getUniqueSubmissionDates = () => {
    const submissionDates = new Set(data.grades
      .filter(grade => grade.submitted_at)
      .map(grade => new Date(grade.submitted_at).toISOString().slice(0, 10))
    );
    return Array.from(submissionDates).sort();
  };

  useEffect(() => {
    const savedSubmissions = JSON.parse(localStorage.getItem('submittedAssignments')) || {};
    setSubmittedAssignments(savedSubmissions);

    const fetchData = async () => {
      try {
        setData((prevState) => ({
          ...prevState,
          loading: true,
          error: null,
        }));

        const studentId = localStorage.getItem('user_id');
        const authToken = localStorage.getItem('authToken');

        if (!authToken || !studentId) {
          throw new Error('Missing authentication token or student ID');
        }

        const response = await axios.get(
          `http://127.0.0.1:8000/api/student/${studentId}/courses/`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
            timeout: 5000,
          }
        );

        const [gradesResponse, ...submissionResponses] = await Promise.all([
          axios.get(`http://127.0.0.1:8000/api/grades/student/${studentId}/`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
          }),
          ...(response.data.assignments || []).map((assignment) =>
            axios
              .get(`http://127.0.0.1:8000/api/submission/assignment/${assignment.id}/`, {
                headers: { 'Authorization': `Bearer ${authToken}` },
              })
              .catch((error) => ({
                error,
                data: { exists: false },
              }))
          ),
        ]);

        const grades = gradesResponse.data;
        const averageGrade = grades.length
          ? (grades.reduce((sum, grade) => sum + grade.score, 0) / grades.length).toFixed(1)
          : null;

        const submissions = {};
        (response.data.assignments || []).forEach((assignment, index) => {
          const submission = submissionResponses[index];
          if (submission.data.exists && !submission.error) {
            submissions[assignment.id] = {
              submission_date: submission.data.submission_date,
              submitted: true,
            };
          }
        });

        setData({
          student: response.data.student,
          courses: response.data.courses || [],
          assignments: response.data.assignments || [],
          grades: grades || [],
          averageGrade,
          loading: false,
          error: null,
        });

        setSubmittedAssignments((prev) => {
          const updatedSubmissions = { ...prev, ...submissions };
          localStorage.setItem('submittedAssignments', JSON.stringify(updatedSubmissions));
          return updatedSubmissions;
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        setData((prevState) => ({
          ...prevState,
          loading: false,
          error: error.response?.data?.error || error.message,
        }));
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          navigate('/login');
        }
      }
    };

    fetchData();
  }, [navigate]);

  useEffect(() => {
    const timers = Object.keys(submissionStatus).map((assignmentId) => {
      return setTimeout(() => {
        setSubmissionStatus((prev) => ({ ...prev, [assignmentId]: null }));
      }, 5000);
    });
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [submissionStatus]);

  const handleUrlChange = (assignmentId, value) => {
    setUrlInputs((prev) => ({ ...prev, [assignmentId]: value }));
  };

  const toggleUrlInput = (assignmentId) => {
    setExpandedAssignment((prev) => (prev === assignmentId ? null : assignmentId));
    setUrlInputs((prev) => ({ ...prev, [assignmentId]: '' }));
    setSubmissionStatus((prev) => ({ ...prev, [assignmentId]: null }));
  };

  const handleSubmitAssignment = async (assignment) => {
    const { id: assignmentId, course: courseId } = assignment;
    let fileUrl = urlInputs[assignmentId]?.trim();
    const userRole = localStorage.getItem('role');

    if (userRole !== 'student') {
      setSubmissionStatus({
        success: false,
        message: 'Only students can submit assignments',
      });
      return;
    }

    if (!fileUrl) {
      setSubmissionStatus((prev) => ({
        ...prev,
        [assignmentId]: { success: false, message: 'Please enter a valid URL' },
      }));
      return;
    }

    // Automatically prepend "https://" if the URL doesn't start with a protocol
    if (!fileUrl.match(/^https?:\/\//)) {
      fileUrl = `https://${fileUrl}`;
    }

    // Validate the URL
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    if (!urlPattern.test(fileUrl)) {
      setSubmissionStatus((prev) => ({
        ...prev,
        [assignmentId]: { success: false, message: 'Please enter a valid URL' },
      }));
      return;
    }

    setIsSubmitting((prev) => ({ ...prev, [assignmentId]: true }));

    const authToken = localStorage.getItem('authToken');
    const studentId = localStorage.getItem('user_id');

    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/api/submission/submit/',
        {
          student: studentId,
          course: courseId,
          assignment: assignmentId,
          track: data.student.track_id,
          file_url: fileUrl,
        },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setSubmittedAssignments((prev) => {
        const updated = {
          ...prev,
          [assignmentId]: { submitted: true, submission_date: new Date().toISOString() },
        };
        localStorage.setItem('submittedAssignments', JSON.stringify(updated));
        return updated;
      });

      setSubmissionStatus((prev) => ({
        ...prev,
        [assignmentId]: { success: true, message: 'Assignment submitted successfully!' },
      }));

      setUrlInputs((prev) => ({ ...prev, [assignmentId]: '' }));
      setExpandedAssignment(null);
    } catch (error) {
      console.error('Error submitting assignment:', error);
      setSubmissionStatus((prev) => ({
        ...prev,
        [assignmentId]: {
          success: false,
          message: error.response?.data?.message || 'Submission failed. Please try again.',
        },
      }));
    } finally {
      setIsSubmitting((prev) => ({ ...prev, [assignmentId]: false }));
    }
  };

  const filterAssignments = (assignments, isSubmitted) => {
    return assignments.filter(assignment => {
      const matchesSubmissionStatus = isSubmitted 
        ? submittedAssignments[assignment.id]?.submitted
        : !submittedAssignments[assignment.id]?.submitted;
      
      const matchesCourse = courseFilter === 'all' || assignment.course_name === courseFilter;
      
      const matchesDeadline = !deadlineFilter || (
        new Date(assignment.end_date).toISOString().slice(0, 10) === deadlineFilter
      );

      const isFutureDeadline = !isSubmitted ? new Date(assignment.end_date) >= new Date() : true;

      return matchesSubmissionStatus && matchesCourse && matchesDeadline && isFutureDeadline;
    });
  };

  const filterGrades = (grades) => {
    return grades.filter(grade => {
      const matchingAssignment = data.assignments.find(
        assignment => assignment.id === grade.assignment
      );
      const courseName = matchingAssignment?.course_name || '';
      
      const matchesCourse = gradeCourseFilter === 'all' || courseName === gradeCourseFilter;
      
      const matchesSubmissionDate = !gradeSubmissionDateFilter || (
        grade.submitted_at && 
        new Date(grade.submitted_at).toISOString().slice(0, 10) === gradeSubmissionDateFilter
      );

      return matchesCourse && matchesSubmissionDate;
    });
  };

  const filterCourses = () => {
    // Show all courses assigned to the student
    return data.courses;
  };

  const getCourseProgress = (courseId) => {
    const courseAssignments = data.assignments.filter(a => a.course === courseId);
    if (courseAssignments.length === 0) return 0;
    const completed = courseAssignments.filter(a => submittedAssignments[a.id]?.submitted).length;
    return Math.round((completed / courseAssignments.length) * 100);
  };

  const renderSection = () => {
    if (data.loading) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress sx={{ color: '#e53935' }} />
        </Box>
      );
    }

    if (data.error) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          Error loading data: {data.error}
        </Alert>
      );
    }

    switch (selectedSection) {
      case 'deadlines':
        return (
          <Card elevation={3} sx={{ borderTop: '4px solid #e53935' }}>
            <CardHeader
              title="Upcoming Deadlines"
              avatar={<FiAlertTriangle style={{ color: '#e53935' }} />}
              subheader={`${data.assignments.filter((a) => {
                const endDate = new Date(a.end_date);
                const now = new Date();
                const diffInDays = Math.floor((endDate - now) / (1000 * 60 * 60 * 24));
                return diffInDays >= 0 && diffInDays <= 3 && !submittedAssignments[a.id]?.submitted;
              }).length} urgent items`}
            />
            <CardContent>
              <LinearProgress
                variant="determinate"
                value={Math.min(
                  data.assignments.filter((a) => {
                    const endDate = new Date(a.end_date);
                    const now = new Date();
                    const diffInDays = Math.floor((endDate - now) / (1000 * 60 * 60 * 24));
                    return diffInDays >= 0 && diffInDays <= 3 && !submittedAssignments[a.id]?.submitted;
                  }).length * 10,
                  100
                )}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: '#ffcdd2',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#e53935',
                  },
                }}
              />
              <List sx={{ mt: 2 }}>
                {data.assignments
                  .filter((assignment) => {
                    const endDate = new Date(assignment.end_date);
                    const now = new Date();
                    const diffInDays = Math.floor((endDate - now) / (1000 * 60 * 60 * 24));
                    return (
                      diffInDays >= 0 &&
                      diffInDays <= 3 &&
                      !submittedAssignments[assignment.id]?.submitted
                    );
                  })
                  .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
                  ?.map((assignment, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <FiAlertTriangle style={{ color: '#e53935' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={assignment.title}
                        secondary={`Ends: ${new Date(assignment.end_date).toLocaleDateString()} (${assignment.course_name})`}
                      />
                    </ListItem>
                  ))}
              </List>
            </CardContent>
          </Card>
        );

      case 'averageGrade':
        return (
          <Card elevation={3} sx={{ borderTop: '4px solid #43a047' }}>
            <CardHeader
              title="Grades & Feedback"
              avatar={<FiAward style={{ color: '#43a047' }} />}
              subheader={`Average Grade: ${data.averageGrade ? (data.averageGrade) : 'N/A'}/100`}
            />
            <CardContent>
              <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Filter by Course</InputLabel>
                  <Select
                    value={gradeCourseFilter}
                    label="Filter by Course"
                    onChange={(e) => setGradeCourseFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Courses</MenuItem>
                    {data.courses.map((course) => (
                      <MenuItem key={course.course_id} value={course.name}>
                        {course.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Filter by Submission Date</InputLabel>
                  <Select
                    value={gradeSubmissionDateFilter}
                    label="Filter by Submission Date"
                    onChange={(e) => setGradeSubmissionDateFilter(e.target.value)}
                  >
                    <MenuItem value="">All Dates</MenuItem>
                    {getUniqueSubmissionDates().map((date) => (
                      <MenuItem key={date} value={date}>
                        {new Date(date).toLocaleDateString()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {(gradeCourseFilter !== 'all' || gradeSubmissionDateFilter) && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setGradeCourseFilter('all');
                      setGradeSubmissionDateFilter('');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </Box>

              {filterGrades(data.grades).length > 0 ? (
                <Grid container spacing={2}>
                  {filterGrades(data.grades).map((grade, index) => {
                    const matchingAssignment = data.assignments.find(
                      assignment => assignment.id === grade.assignment
                    );

                    const courseName = matchingAssignment?.course_name || 'No Course Name';
                    const assignmentTitle = matchingAssignment?.title || 'No Assignment Name';
                    const gradeOutOf10 = grade.score;

                    return (
                      <Grid item xs={12} md={6} key={index}>
                        <Card variant="outlined" sx={{
                          borderLeft: '4px solid #43a047',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column'
                        }}>
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="h6" sx={{ color: '#43a047' }}>
                                {courseName}
                              </Typography>
                              <Typography
                                variant="h6"
                                fontWeight="bold"
                                color={
                                  grade.score >= 70 ? '#43a047' :
                                    grade.score >= 50 ? '#ff9800' : '#e53935'
                                }
                              >
                                {gradeOutOf10}/10
                              </Typography>
                            </Box>

                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              {assignmentTitle}
                            </Typography>

                            {grade.feedback && (
                              <Box sx={{
                                mt: 2,
                                p: 2,
                                backgroundColor: '#f5f5f5',
                                borderRadius: 1,
                                borderLeft: '3px solid #43a047'
                              }}>
                                <Typography variant="body2" component="div">
                                  <Box component="span" fontWeight="bold" color="#43a047">
                                    Feedback:
                                  </Box>{' '}
                                  {grade.feedback}
                                </Typography>

                                <Box sx={{ mt: 1 }}>
                                  {grade.submitted_at && (
                                    <Typography variant="caption" display="block" color="text.secondary">
                                      Submitted: {new Date(grade.submitted_at).toLocaleDateString()}
                                    </Typography>
                                  )}
                                  {grade.graded_at && (
                                    <Typography variant="caption" display="block" color="text.secondary">
                                      Graded: {new Date(grade.graded_at).toLocaleDateString()}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              ) : (
                <Box textAlign="center" py={4}>
                  <FiAward size={48} style={{ color: '#bdbdbd', marginBottom: 16 }} />
                  <Typography variant="body1" color="text.secondary">
                    No grades available for the selected filters
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Try adjusting the course or submission date filters
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        );

      case 'courses':
        return (
          <Card className="modern-card">
            <CardHeader
              title="My Courses"
              avatar={<FiBook className="icon" />}
              subheader={`Track: ${data?.assignments[0]?.track_name || 'Not assigned'}`}
            />
            <CardContent>
              {filterCourses().length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No courses assigned
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {filterCourses().map((course) => (
                    <Grid item xs={12} sm={6} key={course.course_id}>
                      <Card className="sub-card">
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6" className="course-title">
                              {course.name}
                            </Typography>
                            <Chip
                              label={`${getCourseProgress(course.course_id)}%`}
                              size="small"
                              className="progress-chip"
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {course.description}
                          </Typography>
                          <Typography variant="caption" display="block" mt={1}>
                            Started: {new Date(course.created_at).toLocaleDateString()}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={getCourseProgress(course.course_id)}
                            sx={{
                              mt: 2,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: '#e0e0e0',
                              '& .MuiLinearProgress-bar': { backgroundColor: '#e53935' },
                            }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        );

      case 'assignments':
        return (
          <Card elevation={3} sx={{ borderTop: '4px solid #e53935', mb: 4 }}>
            <CardHeader
              title="Assignments"
              avatar={<FiClipboard style={{ color: '#e53935' }} />}
            />
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs 
                  value={assignmentTab} 
                  onChange={(e, newValue) => setAssignmentTab(newValue)}
                  indicatorColor="secondary"
                  textColor="inherit"
                >
                  <Tab 
                    label="Pending Assignments" 
                    value="pending" 
                    icon={<FiAlertTriangle />}
                    iconPosition="start"
                  />
                  <Tab 
                    label="Submitted Assignments" 
                    value="submitted" 
                    icon={<FiCheckCircle />}
                    iconPosition="start"
                  />
                </Tabs>
              </Box>

              <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Filter by Course</InputLabel>
                  <Select
                    value={courseFilter}
                    label="Filter by Course"
                    onChange={(e) => setCourseFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Courses</MenuItem>
                    {data.courses.map((course) => (
                      <MenuItem key={course.course_id} value={course.name}>
                        {course.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Filter by Deadline</InputLabel>
                  <Select
                    value={deadlineFilter}
                    label="Filter by Deadline"
                    onChange={(e) => setDeadlineFilter(e.target.value)}
                  >
                    <MenuItem value="">All Deadlines</MenuItem>
                    {getUniqueDeadlines().map((deadline) => (
                      <MenuItem key={deadline} value={deadline}>
                        {new Date(deadline).toLocaleDateString()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {(courseFilter !== 'all' || deadlineFilter) && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setCourseFilter('all');
                      setDeadlineFilter('');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </Box>

              {assignmentTab === 'pending' ? (
                filterAssignments(data.assignments, false).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No pending assignments match the selected filters
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {filterAssignments(data.assignments, false)
                      ?.map((assignment) => (
                        <Grid item xs={12} key={assignment.id}>
                          <Card variant="outlined" sx={{ borderLeft: '4px solid #e53935' }}>
                            <CardContent>
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                  <Typography
                                    variant="subtitle1"
                                    fontWeight="bold"
                                    sx={{ color: '#e53935' }}
                                  >
                                    {assignment.course_name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {assignment.title}
                                  </Typography>
                                </Box>
                                <Button
                                  variant="text"
                                  size="small"
                                  endIcon={expandedAssignment === assignment.id ? <FiX /> : <FiPaperclip />}
                                  onClick={() => toggleUrlInput(assignment.id)}
                                  aria-label="Submit assignment"
                                  sx={{
                                    color: '#e53935',
                                    textTransform: 'none',
                                    '&:hover': {
                                      color: '#c62828',
                                      backgroundColor: 'transparent',
                                    },
                                  }}
                                >
                                  Submit Lab
                                </Button>
                              </Box>

                              <Typography variant="caption" display="block">
                                Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'N/A'}
                              </Typography>
                              <Typography variant="caption" display="block">
                                Ends: {assignment.end_date ? new Date(assignment.end_date).toLocaleDateString() : 'N/A'}
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                <strong>Description:</strong> {assignment.description || 'No description provided'}
                              </Typography>
                              {assignment.file_url && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  <strong>Assignment File:</strong>{' '}
                                  <a
                                    href={assignment.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#e53935', textDecoration: 'underline' }}
                                  >
                                    View File
                                  </a>
                                </Typography>
                              )}

                              <Collapse in={expandedAssignment === assignment.id}>
                                <Box sx={{ mt: 2 }}>
                                  <TextField
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    placeholder="Paste your Google Drive/Dropbox link"
                                    value={urlInputs[assignment.id] || ''}
                                    onChange={(e) => handleUrlChange(assignment.id, e.target.value)}
                                    sx={{ mb: 1 }}
                                  />
                                  <Box display="flex" justifyContent="flex-end">
                                    <Button
                                      variant="contained"
                                      size="small"
                                      endIcon={<FiUpload />}
                                      disabled={!urlInputs[assignment.id] || isSubmitting[assignment.id]}
                                      onClick={() => handleSubmitAssignment(assignment)}
                                      sx={{
                                        backgroundColor: '#e53935',
                                        '&:hover': { backgroundColor: '#c62828' },
                                      }}
                                    >
                                      {isSubmitting[assignment.id] ? 'Submitting...' : 'Submit'}
                                    </Button>
                                  </Box>
                                </Box>
                              </Collapse>

                              {submissionStatus[assignment.id] && (
                                <Alert
                                  severity={submissionStatus[assignment.id].success ? 'success' : 'error'}
                                  sx={{ mt: 2 }}
                                >
                                  {submissionStatus[assignment.id].message}
                                </Alert>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                  </Grid>
                )
              ) : (
                filterAssignments(data.assignments, true).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No submitted assignments match the selected filters
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {filterAssignments(data.assignments, true)
                      ?.map((assignment) => {
                        const submissionData = submittedAssignments[assignment.id];
                        const gradeData = data.grades.find(g => g.assignment === assignment.id);

                        return (
                          <Grid item xs={12} key={assignment.id}>
                            <Card variant="outlined" sx={{ borderLeft: '4px solid #43a047' }}>
                              <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                  <Box>
                                    <Typography
                                      variant="subtitle1"
                                      fontWeight="bold"
                                      sx={{ color: '#43a047' }}
                                    >
                                      {assignment.course_name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      {assignment.title}
                                    </Typography>
                                  </Box>
                                  <Box display="flex" alignItems="center">
                                    <FiCheckCircle style={{ color: '#43a047', marginRight: 8 }} />
                                    <Typography variant="body2" color="success.main">
                                      Submitted
                                    </Typography>
                                  </Box>
                                </Box>

                                <Typography variant="caption" display="block">
                                  Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'N/A'}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  Ends: {assignment.end_date ? new Date(assignment.end_date).toLocaleDateString() : 'N/A'}
                                </Typography>

                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="body2">
                                    <Box component="span" fontWeight="bold">Submitted on:</Box>{' '}
                                    {new Date(submissionData.submission_date).toLocaleString()}
                                  </Typography>
                                  {assignment.file_url && (
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                      <strong>Assignment File:</strong>{' '}
                                      <a
                                        href={assignment.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: '#e53935', textDecoration: 'underline' }}
                                      >
                                        View File
                                      </a>
                                    </Typography>
                                  )}
                                  {gradeData ? (
                                    <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                                      <Typography variant="body1" fontWeight="bold">
                                        Grade: <span style={{ 
                                          color: gradeData.score >= 70 ? '#43a047' :
                                            gradeData.score >= 50 ? '#ff9800' : '#e53935'
                                        }}>
                                          {gradeData.score}/10
                                        </span>
                                      </Typography>
                                      {gradeData.feedback && (
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                          <Box component="span" fontWeight="bold">Feedback:</Box>{' '}
                                          {gradeData.feedback}
                                        </Typography>
                                      )}
                                    </Box>
                                  ) : (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                      Not graded yet
                                    </Typography>
                                  )}
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                  </Grid>
                )
              )}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  const displayName = username ? username.split('@')[0] : 'User';

  return (
    <div className="dashboard-container">
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          {sidebarOpen && (
            <>
              <div className="welcome-message">
                <h3>Welcome back,</h3>
                <h3>
                  <b>{displayName}</b>
                </h3>
              </div>
              <button className="toggle-btn" onClick={() => setSidebarOpen(false)}>
                <FiX size={24} />
              </button>
            </>
          )}
          {!sidebarOpen && (
            <button className="toggle-btn" onClick={() => setSidebarOpen(true)}>
              <FiMenu size={24} />
            </button>
          )}
        </div>

        <div className="menu-items">
          {menuItems?.map((item) => (
            <button
              key={item.id}
              className={`menu-item ${selectedSection === item.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedSection(item.id);
                if (!sidebarOpen) setSidebarOpen(true);
              }}
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="main-content">
        <div className="content-card">{renderSection()}</div>
      </div>
    </div>
  );
};

export default StudentDashboard;