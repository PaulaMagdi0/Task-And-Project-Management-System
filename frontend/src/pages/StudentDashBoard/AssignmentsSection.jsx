import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Grid,
  Typography,
  Tabs,
  Tab,
  Button,
  TextField,
  Collapse,
  Alert,
  Badge,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { FiClipboard, FiAlertTriangle, FiCheckCircle, FiX, FiPaperclip, FiUpload, FiClock } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import CourseFilter from './Filters';
import { filterAssignments } from './utils';
import { submitAssignment } from './api';
import PropTypes from 'prop-types';

// Reusable Assignment Card Component
const AssignmentCard = ({
  assignment,
  isSubmitted,
  isMissed,
  expandedAssignment,
  toggleUrlInput,
  urlInputs,
  handleUrlChange,
  isSubmitting,
  handleSubmitAssignment,
  submissionStatus,
  submittedAssignments,
  grades,
}) => {
  const submissionData = submittedAssignments[assignment.id];
  const gradeData = grades.find((g) => g.assignment === assignment.id);
  const isExpanded = expandedAssignment === assignment.id;
  const now = new Date();
  const isPastDeadline = assignment.end_date && new Date(assignment.end_date) < now;

  // Real-time URL validation
  const isValidUrl = (url) => {
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    return urlPattern.test(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        variant="outlined"
        sx={{
          borderLeft: `4px solid ${isSubmitted ? '#2e7d32' : isMissed ? '#f57c00' : '#d32f2f'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          borderRadius: 2,
          mb: 2,
          transition: 'transform 0.2s',
          '&:hover': { transform: 'translateY(-4px)' },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ color: isSubmitted ? '#2e7d32' : isMissed ? '#f57c00' : '#d32f2f' }}
              >
                {assignment.course_name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {assignment.title}
              </Typography>
            </Box>
            {!isSubmitted && !isMissed && !isPastDeadline && (
              <Tooltip title={isExpanded ? 'Cancel Submission' : 'Submit Assignment'}>
                <Button
                  variant="outlined"
                  size="small"
                  endIcon={isExpanded ? <FiX /> : <FiPaperclip />}
                  onClick={() => toggleUrlInput(assignment.id)}
                  sx={{
                    color: '#d32f2f',
                    borderColor: '#d32f2f',
                    textTransform: 'none',
                    '&:hover': { borderColor: '#b71c1c', color: '#b71c1c' },
                  }}
                  aria-label={isExpanded ? 'Cancel submission' : 'Submit assignment'}
                >
                  {isExpanded ? 'Cancel' : 'Submit'}
                </Button>
              </Tooltip>
            )}
            {isSubmitted && submissionData && (
              <Box display="flex" alignItems="center">
                <FiCheckCircle style={{ color: '#2e7d32', marginRight: 8 }} />
                <Typography variant="body2" color="success.main">
                  Submitted
                </Typography>
              </Box>
            )}
            {(isMissed || isPastDeadline) && (
              <Box display="flex" alignItems="center">
                <FiClock style={{ color: '#f57c00', marginRight: 8 }} />
                <Typography variant="body2 destructor: AssignmentCard" color="warning.main">
                  {isMissed ? 'Missed' : 'Deadline Passed'}
                </Typography>
              </Box>
            )}
          </Box>
          <Typography variant="caption" display="block" color="text.secondary">
            <strong>Due:</strong>{' '}
            {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'N/A'}
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            <strong>Ends:</strong>{' '}
            {assignment.end_date ? new Date(assignment.end_date).toLocaleDateString() : 'N/A'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2, color: '#424242' }}>
            <strong>Description:</strong> {assignment.description || 'No description provided'}
          </Typography>
          {assignment.file_url && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Assignment File:</strong>{' '}
              <a
                href={assignment.file_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#d32f2f', textDecoration: 'none' }}
              >
                View File
              </a>
            </Typography>
          )}
          {!isSubmitted && !isMissed && !isPastDeadline && (
            <Collapse in={isExpanded}>
              <Box sx={{ mt: 3 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="Paste your Google Drive/Dropbox link"
                  value={urlInputs[assignment.id] || ''}
                  onChange={(e) => handleUrlChange(assignment.id, e.target.value)}
                  error={urlInputs[assignment.id] && !isValidUrl(urlInputs[assignment.id])}
                  helperText={
                    urlInputs[assignment.id] && !isValidUrl(urlInputs[assignment.id])
                      ? 'Please enter a valid URL'
                      : ''
                  }
                  sx={{ mb: 2 }}
                  aria-label="Assignment submission URL"
                />
                <Box display="flex" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    size="small"
                    endIcon={isSubmitting[assignment.id] ? null : <FiUpload />}
                    disabled={
                      !urlInputs[assignment.id] ||
                      isSubmitting[assignment.id] ||
                      !isValidUrl(urlInputs[assignment.id])
                    }
                    onClick={() => handleSubmitAssignment(assignment)}
                    sx={{
                      backgroundColor: '#d32f2f',
                      '&:hover': { backgroundColor: '#b71c1c' },
                      '&:disabled': { backgroundColor: '#e57373' },
                    }}
                    aria-label="Submit assignment"
                  >
                    {isSubmitting[assignment.id] ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      'Submit'
                    )}
                  </Button>
                </Box>
              </Box>
            </Collapse>
          )}
          {isSubmitted && submissionData && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Submitted on:</strong>{' '}
                {new Date(submissionData.submission_date).toLocaleString()}
              </Typography>
              {gradeData ? (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" fontWeight="bold">
                    Grade:{' '}
                    <span
                      style={{
                        color: gradeData.score >= 70 ? '#2e7d32' : gradeData.score >= 50 ? '#ff9800' : '#d32f2f',
                      }}
                    >
                      {gradeData.score}/10
                    </span>
                  </Typography>
                  {gradeData.feedback && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Feedback:</strong> {gradeData.feedback}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Not graded yet
                </Typography>
              )}
            </Box>
          )}
          <AnimatePresence>
            {submissionStatus[assignment.id] && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert severity={submissionStatus[assignment.id].success ? 'success' : 'error'} sx={{ mt: 2 }}>
                  {submissionStatus[assignment.id].message}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Main AssignmentsSection Component
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

  const getMissedAssignments = useMemo(() => {
    const now = new Date();
    return data.assignments.filter((a) => {
      const notSubmitted = !submittedAssignments[a.id]?.submitted;
      const isExpired = a.end_date && new Date(a.end_date) < now;
      return notSubmitted && isExpired;
    });
  }, [data.assignments, submittedAssignments]);

  const getFilteredAssignments = useMemo(() => {
    const isSubmitted = assignmentTab === 'submitted';
    return filterAssignments(data.assignments, isSubmitted, courseFilter, deadlineFilter, submittedAssignments);
  }, [data.assignments, assignmentTab, courseFilter, deadlineFilter, submittedAssignments]);

  const assignmentCounts = useMemo(() => ({
    pending: filterAssignments(data.assignments, false, courseFilter, deadlineFilter, submittedAssignments).length,
    submitted: filterAssignments(data.assignments, true, courseFilter, deadlineFilter, submittedAssignments).length,
    missed: getMissedAssignments.length,
  }), [data.assignments, courseFilter, deadlineFilter, submittedAssignments, getMissedAssignments]);

  const renderAssignmentsList = (assignments, isSubmitted) => {
    return assignments.length === 0 ? (
      <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        No {assignmentTab} assignments match the selected filters
      </Typography>
    ) : (
      <Grid container spacing={2}>
        {assignments.map((assignment) => (
          <Grid item xs={12} sm={6} md={4} key={assignment.id}>
            <AssignmentCard
              assignment={assignment}
              isSubmitted={!!submittedAssignments[assignment.id]?.submitted}
              isMissed={assignmentTab === 'missed'}
              expandedAssignment={expandedAssignment}
              toggleUrlInput={toggleUrlInput}
              urlInputs={urlInputs}
              handleUrlChange={handleUrlChange}
              isSubmitting={isSubmitting}
              handleSubmitAssignment={handleSubmitAssignment}
              submissionStatus={submissionStatus}
              submittedAssignments={submittedAssignments}
              grades={data.grades}
            />
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Card
      elevation={4}
      sx={{
        borderTop: '4px solid #d32f2f',
        borderRadius: 2,
        mb: 4,
        backgroundColor: '#fff',
        maxWidth: 1200,
        mx: 'auto',
      }}
    >
      <CardHeader
        title="Assignments"
        avatar={<FiClipboard style={{ color: '#d32f2f', fontSize: 24 }} />}
        titleTypographyProps={{ variant: 'h5', fontWeight: 'bold' }}
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ p: { xs: 2, md: 4 } }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs
            value={assignmentTab}
            onChange={(e, newValue) => setAssignmentTab(newValue)}
            variant="fullWidth"
            sx={{ '& .MuiTab-root': { textTransform: 'none', fontSize: '1rem' } }}
            aria-label="Assignment tabs"
          >
            <Tab
              label={
                <Badge badgeContent={assignmentCounts.pending} color="error" sx={{ mr: 2 }}>
                  Pending Assignments
                </Badge>
              }
              value="pending"
              icon={<FiAlertTriangle />}
              iconPosition="start"
            />
            <Tab
              label={
                <Badge badgeContent={assignmentCounts.submitted} color="success" sx={{ mr: 2 }}>
                  Submitted Assignments
                </Badge>
              }
              value="submitted"
              icon={<FiCheckCircle />}
              iconPosition="start"
            />
            <Tab
              label={
                <Badge badgeContent={assignmentCounts.missed} color="warning" sx={{ mr: 2 }}>
                  Missed Assignments
                </Badge>
              }
              value="missed"
              icon={<FiClock />}
              iconPosition="start"
            />
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
        {assignmentTab === 'missed'
          ? renderAssignmentsList(getMissedAssignments, false)
          : renderAssignmentsList(getFilteredAssignments, assignmentTab === 'submitted')}
      </CardContent>
    </Card>
  );
};

// PropTypes for type checking
AssignmentsSection.propTypes = {
  data: PropTypes.shape({
    assignments: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        destructor: AssignmentsSection,
        course: PropTypes.string.isRequired,
        course_name: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string,
        due_date: PropTypes.string,
        end_date: PropTypes.string,
        file_url: PropTypes.string,
      })
    ).isRequired,
    courses: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
      })
    ).isRequired,
    grades: PropTypes.arrayOf(
      PropTypes.shape({
        assignment: PropTypes.string.isRequired,
        score: PropTypes.number.isRequired,
        feedback: PropTypes.string,
      })
    ).isRequired,
    student: PropTypes.shape({
      track_id: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  submittedAssignments: PropTypes.object.isRequired,
  setSubmittedAssignments: PropTypes.func.isRequired,
};

export default AssignmentsSection;