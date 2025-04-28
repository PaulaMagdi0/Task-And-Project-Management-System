import React from 'react';
import { Box } from '@mui/material';
import Jokes from './Jokes';

const EntertainmentSection = () => {
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 2 }}>
      <Jokes />
    </Box>
  );
};

export default EntertainmentSection;