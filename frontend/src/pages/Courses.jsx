import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCourses } from '../redux/coursesSlice';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Grid,
  Chip,
  Box,
  CircularProgress,
  TextField
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled components for better UI
const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[3],
  overflow: 'hidden',
  marginBottom: theme.spacing(3),
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  backgroundColor: theme.palette.grey[100],
}));

const TrackChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.contrastText,
}));

// Helper function for safe date handling
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return isNaN(date) ? 'Invalid Date' : date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

const Courses = () => {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.courses);
  const { user_id, username, role } = useSelector((state) => state.auth);

  // Extract courses based on role
  const courses = role === "supervisor" 
    ? data?.track_courses || []
    : data?.taught_courses || [];

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedTrack, setSelectedTrack] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [createdAtFilter, setCreatedAtFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user_id) {
      dispatch(fetchCourses(user_id));
    }
  }, [dispatch, user_id]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTrackFilterChange = (event) => {
    setSelectedTrack(event.target.value);
    setPage(0);
  };

  const handleCourseFilterChange = (event) => {
    setSelectedCourse(event.target.value);
    setPage(0);
  };

  const handleDateFilterChange = (event) => {
    setCreatedAtFilter(event.target.value);
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
      <CircularProgress size={60} />
    </Box>
  );
  
  if (error) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
      <Typography color="error" variant="h6">
        Error loading courses: {error}
      </Typography>
    </Box>
  );

  const columns = [
    { id: 'name', label: 'Course Name', minWidth: 170 },
    { id: 'description', label: 'Description', minWidth: 200 },
    { id: 'instructor', label: 'Instructor', minWidth: 150 },
    { id: 'tracks', label: 'Tracks', minWidth: 200 },
    { id: 'created_at', label: 'Created Date', minWidth: 120 },
  ];

  // Prepare filter options with safe data handling
  const allTracks = courses.flatMap(course => {
    if (!course.tracks) return [];
    return Array.isArray(course.tracks) 
      ? course.tracks.map(t => typeof t === 'object' ? t.name || t.id : t)
      : [];
  });

  // Get unique track names (exact matches)
  const trackNames = [...new Set(allTracks)]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const courseNames = [...new Set(courses.map(course => course.name))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  
  const createdDates = [...new Set(
    courses.map(course => {
      try {
        const date = new Date(course.created_at);
        return isNaN(date) ? null : date.toISOString().split('T')[0];
      } catch (e) {
        return null;
      }
    })
  )].filter(date => date !== null).sort().reverse();

  // Filter courses based on selections
  const filteredCourses = courses.filter(course => {
    const courseTracks = course.tracks 
      ? Array.isArray(course.tracks)
        ? course.tracks.map(t => typeof t === 'object' ? t.name || t.id : t)
        : []
      : [];
    
    const courseDate = new Date(course.created_at).toISOString().split('T')[0];
    const matchesSearch = searchTerm 
      ? course.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    
    return (
      matchesSearch &&
      (!selectedTrack || courseTracks.some(track => track === selectedTrack)) &&
      (!selectedCourse || course.name === selectedCourse) &&
      (!createdAtFilter || courseDate === createdAtFilter)
    );
  });

  // Prepare table rows
  const rows = filteredCourses.map(course => {
    const courseTracks = course.tracks
      ? Array.isArray(course.tracks)
        ? course.tracks.map(t => typeof t === 'object' ? t.name || t.id : t)
        : []
      : [];
    
    const instructorName = course.instructor 
      ? typeof course.instructor === 'object'
        ? course.instructor.name || course.instructor.username || `ID: ${course.instructor.id}`
        : `ID: ${course.instructor}`
      : 'Not assigned';
    
    const instructorId = course.instructor 
      ? typeof course.instructor === 'object' 
        ? course.instructor.id 
        : course.instructor
      : null;

    return {
      id: course.id,
      name: course.name,
      description: course.description,
      instructor: instructorName,
      instructor_id: instructorId,
      tracks: courseTracks,
      created_at: formatDate(course.created_at),
    };
  });

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
        Courses Management
      </Typography>
      <Typography variant="subtitle1" gutterBottom sx={{ mb: 3, color: 'text.secondary' }}>
        Viewing courses for: <Box component="span" sx={{ fontWeight: 600 }}>{username}</Box> ({role})
      </Typography>

      {/* Search and Filters */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Search Field */}
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            variant="outlined"
            label="Search courses"
            placeholder="Search by name or description"
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              sx: { borderRadius: 2 }
            }}
          />
        </Grid>

        {/* Course Filter */}
        <Grid item xs={12} md={2}>
          <FormControl variant="outlined" fullWidth>
            <InputLabel>Course</InputLabel>
            <Select
              value={selectedCourse}
              onChange={handleCourseFilterChange}
              label="Course"
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value=""><em>All Courses</em></MenuItem>
              {courseNames.map(name => (
                <MenuItem key={name} value={name}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Track Filter */}
        <Grid item xs={12} md={2}>
          <FormControl variant="outlined" fullWidth>
            <InputLabel>Track</InputLabel>
            <Select
              value={selectedTrack}
              onChange={handleTrackFilterChange}
              label="Track"
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value=""><em>All Tracks</em></MenuItem>
              {trackNames.map(name => (
                <MenuItem key={name} value={name}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Date Filter */}
        <Grid item xs={12} md={2}>
          <FormControl variant="outlined" fullWidth>
            <InputLabel>Date</InputLabel>
            <Select
              value={createdAtFilter}
              onChange={handleDateFilterChange}
              label="Date"
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value=""><em>All Dates</em></MenuItem>
              {createdDates.map(date => (
                <MenuItem key={date} value={date}>{date}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Reset Filters */}
        <Grid item xs={12} md={2}>
          <Box
            component="button"
            onClick={() => {
              setSelectedTrack('');
              setSelectedCourse('');
              setCreatedAtFilter('');
              setSearchTerm('');
            }}
            sx={{
              width: '100%',
              height: '56px',
              backgroundColor: 'primary.main',
              color: 'white',
              border: 'none',
              borderRadius: 2,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }}
          >
            Reset Filters
          </Box>
        </Grid>
      </Grid>

      {/* Table */}
      <StyledPaper>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Table stickyHeader aria-label="courses table" size="medium">
            <TableHead>
              <TableRow>
                {columns.map(column => (
                  <StyledTableCell
                    key={column.id}
                    align={column.align || 'left'}
                    sx={{ minWidth: column.minWidth }}
                  >
                    {column.label}
                  </StyledTableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length > 0 ? (
                rows
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, rowIndex) => (
                    <TableRow 
                      hover 
                      key={row.id} 
                      sx={{ '&:last-child td': { borderBottom: 0 } }}
                    >
                      <TableCell>{row.name}</TableCell>
                      <TableCell sx={{ maxWidth: 300 }}>
                        <Box sx={{ 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          '&:hover': {
                            whiteSpace: 'normal',
                            overflow: 'visible'
                          }
                        }}>
                          {row.description}
                        </Box>
                      </TableCell>
                      <TableCell>{row.instructor}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                          {row.tracks.map((track, i) => (
                            <TrackChip 
                              key={`${row.id}-${i}`} 
                              label={track} 
                              size="small"
                              onClick={() => setSelectedTrack(track)}
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>{row.created_at}</TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      No courses found matching your criteria
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}
        />
      </StyledPaper>
    </Box>
  );
};

export default Courses;