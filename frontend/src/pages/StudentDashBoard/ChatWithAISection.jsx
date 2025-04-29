import React from 'react';
import { Box } from '@mui/material';
import ChatWithAI from './ChatWithAI';

const ChatWithAISection = () => {
  console.log('ChatWithAISection Rendered'); // Debug log
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 2, height: '100%' }}>
      <ChatWithAI />
    </Box>
  );
};

export default ChatWithAISection;