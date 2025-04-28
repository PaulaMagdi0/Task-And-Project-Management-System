import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCourses } from '../../redux/coursesSlice';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Grid,
  Chip,
  Box,
  CircularProgress,
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Skeleton,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled components for enhanced UI
const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
  margin: theme.spacing(3),
  backgroundColor: '#ffffff',
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  backgroundColor: theme.palette.grey[100],
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StyledTableRow = styled(TableRow)(() => ({
  '&:nth-of-type(odd)': {
    backgroundColor: '#f8fafc',
  },
  '&:hover': {
    backgroundColor: '#f1f5f9',
    transition: 'background-color 0.2s ease-in-out',
  },
}));

const TrackChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

// Helper function for safe date handling
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return isNaN(date) ? 'Invalid Date' : date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

// Sorting function
const sortRows = (rows, sortBy, sortOrder) => {
  return [...rows].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    if (sortBy === 'created_at') {
      aValue = new Date(a[sortBy]).getTime();
      bValue = new Date(b[sortBy]).getTime();
    }
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
};

const Courses = () => {
  const dispatch = useDispatch();
  const {
    userCourses: { tracks, track_courses },
    status: { fetchCoursesLoading, fetchCoursesError },
  } = useSelector((state) => state.courses);
  const { user_id, username, role } = useSelector((state) => state.auth);

  // State management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedTrack, setSelectedTrack] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [createdAtFilter, setCreatedAtFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [openResetDialog, setOpenResetDialog] = useState(false);

  // Fetch courses on mount
  useEffect(() => {
    if (user_id) {
      dispatch(fetchCourses(user_id));
    }
  }, [dispatch, user_id]);

  // Event handlers
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

  const handleSort = (columnId) => {
    const isAsc = sortBy === columnId && sortOrder === 'asc';
    setSortBy(columnId);
    setSortOrder(isAsc ? 'desc' : 'asc');
  };

  const handleResetFilters = () => {
    setOpenResetDialog(true);
  };

  const confirmResetFilters = () => {
    setSelectedTrack('');
    setSelectedCourse('');
    setCreatedAtFilter('');
    setSearchTerm('');
    setPage(0);
    setOpenResetDialog(false);
  };

  // Deduplicate courses by ID
  const uniqueCourses = useMemo(() => {
    const courseMap = new Map();
    const courses = role === 'supervisor' ? track_courses || [] : track_courses?.filter((course) => course.instructor?.id === user_id) || [];

    courses.forEach((course) => {
      if (!courseMap.has(course.id)) {
        courseMap.set(course.id, {
          ...course,
          tracks: Array.isArray(course.tracks) ? course.tracks : [],
        });
      } else {
        // Merge tracks for the same course
        const existing = courseMap.get(course.id);
        const existingTrackIds = new Set(existing.tracks.map((t) => t.id));
        course.tracks?.forEach((track) => {
          if (!existingTrackIds.has(track.id)) {
            existing.tracks.push(track);
            existingTrackIds.add(track.id);
          }
        });
      }
    });

    return Array.from(courseMap.values());
  }, [track_courses, role, user_id]);

  // Table columns
  const columns = [
    { id: 'name', label: 'Course Name', minWidth: 170 },
    { id: 'description', label: 'Description', minWidth: 200 },
    { id: 'instructor', label: 'Instructor', minWidth: 150 },
    { id: 'tracks', label: 'Tracks', minWidth: 200 },
    { id: 'created_at', label: 'Created Date', minWidth: 120 },
  ];

  // Memoized filter options
  const allTracks = useMemo(() => {
    const trackSet = new Set();
    uniqueCourses.forEach((course) => {
      if (course.tracks) {
        course.tracks.forEach((track) => {
          const trackName = typeof track === 'object' ? track.name || track.id : track;
          if (trackName) trackSet.add(trackName);
        });
      }
    });
    return Array.from(trackSet).sort((a, b) => a.localeCompare(b));
  }, [uniqueCourses]);

  const trackNames = useMemo(() => allTracks, [allTracks]);

  const courseNames = useMemo(
    () => [...new Set(uniqueCourses.map((course) => course.name))].filter(Boolean).sort((a, b) => a.localeCompare(b)),
    [uniqueCourses]
  );

  const createdDates = useMemo(
    () =>
      [...new Set(
        uniqueCourses.map((course) => {
          try {
            const date = new Date(course.created_at);
            return isNaN(date) ? null : date.toISOString().split('T')[0];
          } catch (e) {
            return null;
          }
        })
      )].filter((date) => date !== null).sort().reverse(),
    [uniqueCourses]
  );

  // Memoized filtered courses
  const filteredCourses = useMemo(() => {
    const result = uniqueCourses.filter((course) => {
      const courseTracks = course.tracks
        ? course.tracks.map((t) => (typeof t === 'object' ? t.name || t.id : t))
        : [];
      const courseDate = new Date(course.created_at).toISOString().split('T')[0];
      const matchesSearch = searchTerm
        ? (course.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (course.description || '').toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      return (
        matchesSearch &&
        (!selectedTrack || courseTracks.includes(selectedTrack)) &&
        (!selectedCourse || course.name === selectedCourse) &&
        (!createdAtFilter || courseDate === createdAtFilter)
      );
    });
    console.log('Filtered courses:', result);
    return result;
  }, [uniqueCourses, searchTerm, selectedTrack, selectedCourse, createdAtFilter]);

  // Prepare table rows
  const rows = useMemo(
    () =>
      filteredCourses.map((course) => {
        const courseTracks = course.tracks
          ? course.tracks.map((t) => (typeof t === 'object' ? t.name || t.id : t))
          : [];
        const instructorName = course.instructor
          ? typeof course.instructor === 'object'
            ? course.instructor.name || course.instructor.username || `ID: ${course.instructor.id}`
            : `ID: ${course.instructor}`
          : 'Not assigned';
        return {
          id: course.id,
          name: course.name,
          description: course.description,
          instructor: instructorName,
          tracks: courseTracks,
          created_at: formatDate(course.created_at),
        };
      }),
    [filteredCourses]
  );

  // Sorted rows
  const sortedRows = useMemo(() => sortRows(rows, sortBy, sortOrder), [rows, sortBy, sortOrder]);

  // Loading state
  if (fetchCoursesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', bgcolor: '#f4f6f8' }}>
        <Box sx={{ width: '100%', maxWidth: '1200px' }}>
          <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12} md={2}>
              <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12} md={2}>
              <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12} md={2}>
              <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12} md={2}>
              <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 2 }} />
            </Grid>
          </Grid>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={40} sx={{ mb: 1, borderRadius: 2 }} />
          ))}
        </Box>
      </Box>
    );
  }

  // Error state
  if (fetchCoursesError) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '200px', bgcolor: '#f4f6f8' }}>
        <Typography color="error" variant="h6" sx={{ mb: 2 }}>
          Error loading courses: {fetchCoursesError}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => dispatch(fetchCourses(user_id))}
          sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, borderRadius: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  // Empty data state
  if (!uniqueCourses.length) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '200px', bgcolor: '#f4f6f8' }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#64748b' }}>
          No courses available
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => dispatch(fetchCourses(user_id))}
          sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, borderRadius: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
      <Typography
        variant="h4"
        sx={{ fontWeight: 700, color: '#1e3a8a', mb: 2, textAlign: 'center' }}
      >
        Courses Management
      </Typography>
      <Typography
        variant="subtitle1"
        sx={{ color: '#64748b', mb: 3, textAlign: 'center' }}
      >
        Viewing courses for: <Box component="span" sx={{ fontWeight: 600 }}>{username}</Box> ({role})
      </Typography>

      {/* Search and Filters */}
      <Grid container spacing={3} sx={{ mb: 3, maxWidth: '1200px', mx: 'auto' }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            variant="outlined"
            label="Search courses"
            placeholder="Search by name or description"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </Grid>
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
              {courseNames.map((name) => (
                <MenuItem key={name} value={name}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
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
              {trackNames.map((name) => (
                <MenuItem key={name} value={name}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
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
              {createdDates.map((date) => (
                <MenuItem key={date} value={date}>{date}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleResetFilters}
            sx={{
              height: '56px',
              bgcolor: '#3b82f6',
              '&:hover': { bgcolor: '#2563eb' },
              borderRadius: 2,
            }}
          >
            Reset Filters
          </Button>
        </Grid>
      </Grid>

      {/* Table */}
      <StyledPaper sx={{ maxWidth: '1200px', mx: 'auto' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Table stickyHeader aria-label="courses table">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <StyledTableCell
                    key={column.id}
                    sx={{ minWidth: column.minWidth, cursor: 'pointer' }}
                    onClick={() => handleSort(column.id)}
                  >
                    {column.label}
                    {sortBy === column.id && (
                      <Box component="span" sx={{ ml: 1 }}>
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </Box>
                    )}
                  </StyledTableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedRows.length > 0 ? (
                sortedRows
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => (
                    <StyledTableRow key={row.id}>
                      <TableCell sx={{ p: 2 }}>{row.name}</TableCell>
                      <TableCell sx={{ p: 2, maxWidth: 300 }}>
                        <Box
                          sx={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            '&:hover': {
                              whiteSpace: 'normal',
                              overflow: 'visible',
                            },
                          }}
                        >
                          {row.description}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ p: 2 }}>{row.instructor}</TableCell>
                      <TableCell sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                          {row.tracks.map((track, i) => (
                            <TrackChip
                              key={`${row.id}-${track}-${i}`}
                              label={track}
                              size="small"
                              onClick={() => setSelectedTrack(track)}
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ p: 2 }}>{row.created_at}</TableCell>
                    </StyledTableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" sx={{ color: '#64748b' }}>
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
          count={sortedRows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}
        />
      </StyledPaper>

      {/* Reset Filters Dialog */}
      <Dialog
        open={openResetDialog}
        onClose={() => setOpenResetDialog(false)}
      >
        <DialogTitle>Reset Filters</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to reset all filters? This will clear all your current selections.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResetDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={confirmResetFilters}
            color="primary"
            variant="contained"
            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Courses;