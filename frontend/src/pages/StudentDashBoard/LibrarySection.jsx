import React from 'react';
import { Box } from '@mui/material';
import MovieSearch from './MovieSearch';

const LibrarySection = () => {
  console.log('LibrarySection Rendered'); // Debug log
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 2 }}>
      <MovieSearch />
    </Box>
  );
};

export default LibrarySection;