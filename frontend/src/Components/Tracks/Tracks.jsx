import React from 'react';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useDispatch, useSelector } from "react-redux";
import { fetchCourses } from "../../redux/coursesSlice";
import{ useEffect } from "react";

// Styled components for enhanced UI
const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[5],
  overflow: 'hidden',
  margin: theme.spacing(3),
  backgroundColor: '#ffffff',
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  backgroundColor: theme.palette.grey[200],
  color: theme.palette.text.primary,
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
}));

const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return isNaN(date) ? 'Invalid Date' : date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return 'Invalid Date';
  }
};


const Tracks = () => {
    const dispatch = useDispatch();
    const user_id = useSelector((state) => state.auth.user_id);
    const {tracks:tracksData} = useSelector((state) => state.courses.userCourses);
  useEffect(() => {
    if (user_id) {
      dispatch(fetchCourses(user_id));
    }
  }, [dispatch, user_id]);

  const columns = [
    { id: 'name', label: 'Track Name', minWidth: 150 },
    { id: 'description', label: 'Description', minWidth: 200 },
    { id: 'track_type', label: 'Track Type', minWidth: 100 },
    { id: 'supervisor', label: 'Supervisor', minWidth: 150 },
    { id: 'supervisor_role', label: 'Supervisor Role', minWidth: 150 },
    { id: 'created_at', label: 'Created At', minWidth: 180 },
  ];

  return (
    <Box sx={{ padding: 3, backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontWeight: 700,
          color: '#1a237e',
          marginBottom: 2,
          textAlign: 'center',
        }}
      >
        Tracks Information
      </Typography>
      <StyledPaper>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 200px)' }}>
          <Table stickyHeader aria-label="tracks table">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <StyledTableCell
                    key={column.id}
                    sx={{ minWidth: column.minWidth }}
                  >
                    {column.label}
                  </StyledTableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tracksData?.length > 0 ? (
                tracksData?.map((track) => (
                  <StyledTableRow key={track.id}>
                    <TableCell sx={{ padding: 2 }}>{track.name}</TableCell>
                    <TableCell sx={{ padding: 2 }}>
                      <Box
                        sx={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 200,
                          '&:hover': {
                            whiteSpace: 'normal',
                            overflow: 'visible',
                          },
                        }}
                      >
                        {track.description}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ padding: 2 }}>{track.track_type}</TableCell>
                    <TableCell sx={{ padding: 2 }}>{track.supervisor}</TableCell>
                    <TableCell sx={{ padding: 2 }}>{track.supervisor_role}</TableCell>
                    <TableCell sx={{ padding: 2 }}>{formatDate(track.created_at)}</TableCell>
                  </StyledTableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No tracks found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </StyledPaper>
    </Box>
  );
};

export default Tracks;