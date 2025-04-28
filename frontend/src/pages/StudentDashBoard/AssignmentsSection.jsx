import React, { useState } from 'react';
import { Box, Card, CardHeader, CardContent, Grid, Typography, Tabs, Tab, Button, TextField, Collapse, Alert } from '@mui/material';
import { FiClipboard, FiAlertTriangle, FiCheckCircle, FiX, FiPaperclip, FiUpload } from 'react-icons/fi';
import CourseFilter from './Filters';
import { filterAssignments } from './utils';
import { submitAssignment } from './api';

const AssignmentsSection = ({ data, submittedAssignments, setSubmittedAssignments }) => {
  const [assignmentTab, setAssignmentTab] = useState('pending');
  const [courseFilter, setCourseFilter] = useState('all');
  const [deadlineFilter, setDeadlineFilter] = useState('');
  const [expandedAssignment, setExpandedAssignment] = useState(null);
  const [urlInputs, setUrlInputs] = useState({});
  const [isSubmitting, setIsSubmitting] = useState({});
  const [submissionStatus, setSubmissionStatus] = useState({});

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
    const studentId = localStorage.getItem('user_id');

    if (!fileUrl) {
      setSubmissionStatus((prev) => ({
        ...prev,
        [assignmentId]: { success: false, message: 'Please enter a valid URL' },
      }));
      return;
    }

    if (!fileUrl.match(/^https?:\/\//)) {
      fileUrl = `https://${fileUrl}`;
    }

    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    if (!urlPattern.test(fileUrl)) {
      setSubmissionStatus((prev) => ({
        ...prev,
        [assignmentId]: { success: false, message: 'Please enter a valid URL' },
      }));
      return;
    }

    setIsSubmitting((prev) => ({ ...prev, [assignmentId]: true }));

    try {
      await submitAssignment({
        student: studentId,
        course: courseId,
        assignment: assignmentId,
        track: data.student.track_id,
        file_url: fileUrl,
      });

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

  return (
    <Card elevation={3} sx={{ borderTop: '4px solid #e53935', mb: 4 }}>
      <CardHeader title="Assignments" avatar={<FiClipboard style={{ color: '#e53935' }} />} />
      <CardContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={assignmentTab}
            onChange={(e, newValue) => setAssignmentTab(newValue)}
            indicatorColor="secondary"
            textColor="inherit"
          >
            <Tab label="Pending Assignments" value="pending" icon={<FiAlertTriangle />} iconPosition="start" />
            <Tab label="Submitted Assignments" value="submitted" icon={<FiCheckCircle />} iconPosition="start" />
          </Tabs>
        </Box>
        <CourseFilter
          courses={data.courses}
          courseFilter={courseFilter}
          setCourseFilter={setCourseFilter}
          deadlineFilter={deadlineFilter}
          setDeadlineFilter={setDeadlineFilter}
          assignments={data.assignments}
          submittedAssignments={submittedAssignments}
        />
        {assignmentTab === 'pending' ? (
          filterAssignments(data.assignments, false, courseFilter, deadlineFilter, submittedAssignments).length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No pending assignments match the selected filters
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {filterAssignments(data.assignments, false, courseFilter, deadlineFilter, submittedAssignments).map((assignment) => (
                <Grid item xs={12} key={assignment.id}>
                  <Card variant="outlined" sx={{ borderLeft: '4px solid #e53935' }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#e53935' }}>
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
                          sx={{ color: '#e53935', textTransform: 'none' }}
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
                          <a href={assignment.file_url} target="_blank" rel="noopener noreferrer" style={{ color: '#e53935' }}>
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
                              sx={{ backgroundColor: '#e53935', '&:hover': { backgroundColor: '#c62828' } }}
                            >
                              {isSubmitting[assignment.id] ? 'Submitting...' : 'Submit'}
                            </Button>
                          </Box>
                        </Box>
                      </Collapse>
                      {submissionStatus[assignment.id] && (
                        <Alert severity={submissionStatus[assignment.id].success ? 'success' : 'error'} sx={{ mt: 2 }}>
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
          filterAssignments(data.assignments, true, courseFilter, deadlineFilter, submittedAssignments).length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No submitted assignments match the selected filters
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {filterAssignments(data.assignments, true, courseFilter, deadlineFilter, submittedAssignments).map((assignment) => {
                const submissionData = submittedAssignments[assignment.id];
                const gradeData = data.grades.find((g) => g.assignment === assignment.id);
                return (
                  <Grid item xs={12} key={assignment.id}>
                    <Card variant="outlined" sx={{ borderLeft: '4px solid #43a047' }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#43a047' }}>
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
                              <a href={assignment.file_url} target="_blank" rel="noopener noreferrer" style={{ color: '#e53935' }}>
                                View File
                              </a>
                            </Typography>
                          )}
                          {gradeData ? (
                            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                              <Typography variant="body1" fontWeight="bold">
                                Grade:{' '}
                                <span
                                  style={{
                                    color:
                                      gradeData.score >= 70 ? '#43a047' : gradeData.score >= 50 ? '#ff9800' : '#e53935',
                                  }}
                                >
                                  {gradeData.score}/10
                                </span>
                              </Typography>
                              {gradeData.feedback && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  <Box component="span" fontWeight="bold">Feedback:</Box> {gradeData.feedback}
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
};

export default AssignmentsSection;