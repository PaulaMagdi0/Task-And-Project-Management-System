import React from 'react';
import { Box } from '@mui/material';
import BookSearch from './BookSearch';

const BookHubSection = () => {
  console.log('BookHubSection Rendered'); // Debug log
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 2 }}>
      <BookSearch />
    </Box>
  );
};

export default BookHubSection;