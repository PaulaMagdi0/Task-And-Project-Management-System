import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import { DivideIcon as LucideIcon } from 'lucide-react';

function StatCard({ icon: Icon, title, value, subtitle, color }) {
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box 
          sx={{ 
            bgcolor: color,
            p: 1.5,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon size={24} color="white" />
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            {value}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ pt: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>
    </Paper>
  );
}

export default StatCard;
