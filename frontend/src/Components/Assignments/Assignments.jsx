import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAssignments } from '../../redux/viewassignmentSlice';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const Assignments = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch();
  const { assignments, loading, error } = useSelector((state) => state.listassignments);
  const { user_id } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user_id) {
      dispatch(fetchAssignments(user_id));
    }
  }, [dispatch, user_id]);

  const getAssignmentTypeColor = (type) => {
    switch (type) {
      case 'task':
        return 'primary';
      case 'project':
        return 'secondary';
      case 'exam':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error" sx={{ mb: 1 }}>
          {error}
          <IconButton 
            size="small" 
            onClick={() => dispatch(fetchAssignments(user_id))} 
            sx={{ ml: 1 }}
            aria-label="Retry fetching assignments"
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
          Assignments
        </Typography>
        <Tooltip title="Refresh data">
          <IconButton 
            onClick={() => dispatch(fetchAssignments(user_id))} 
            color="primary"
            aria-label="Refresh assignments"
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {assignments.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No assignments available. Create your first assignment to get started.
        </Alert>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <TableContainer component={Paper} sx={{ borderRadius: 2, minWidth: 650 }}>
            <Table aria-label="assignments table">
              <TableHead sx={{ bgcolor: theme.palette.primary.main }}>
                <TableRow>
                  <TableCell sx={{ color: 'white' }}>Title</TableCell>
                  <TableCell sx={{ color: 'white' }}>Type</TableCell>
                  <TableCell sx={{ color: 'white' }}>Track & Course</TableCell>
                  <TableCell sx={{ color: 'white' }}>Due Date</TableCell>
                  <TableCell sx={{ color: 'white' }}>End Date</TableCell>
                  <TableCell sx={{ color: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Description
                      <Tooltip title="Assignment details">
                        <InfoIcon fontSize="small" sx={{ ml: 1 }} />
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow
                    key={assignment.id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AssignmentIcon color="action" sx={{ mr: 1 }} />
                        {assignment.title}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={assignment.assignment_type}
                        color={getAssignmentTypeColor(assignment.assignment_type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <SchoolIcon color="primary" sx={{ fontSize: 16, mr: 1 }} />
                          <Typography variant="body2">
                            {assignment.track_name || 'N/A'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <DescriptionIcon color="secondary" sx={{ fontSize: 16, mr: 1 }} />
                          <Typography variant="body2">
                            {assignment.course_name || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarIcon color="action" sx={{ fontSize: 16, mr: 1 }} />
                        {formatDate(assignment.due_date)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarIcon color="action" sx={{ fontSize: 16, mr: 1 }} />
                        {formatDate(assignment.end_date)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={assignment.description}>
                        <Typography
                          variant="body2"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: 200,
                          }}
                        >
                          {assignment.description}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
};

export default Assignments;
