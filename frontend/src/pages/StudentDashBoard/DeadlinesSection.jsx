import React from 'react';
import { Box, Card, CardHeader, CardContent, LinearProgress, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { FiAlertTriangle } from 'react-icons/fi';

const DeadlinesSection = ({ assignments, submittedAssignments }) => {
  const urgentAssignments = assignments.filter((a) => {
    const endDate = new Date(a.end_date);
    const now = new Date();
    const diffInDays = Math.floor((endDate - now) / (1000 * 60 * 60 * 24));
    return diffInDays >= 0 && diffInDays <= 3 && !submittedAssignments[a.id]?.submitted;
  });

  return (
    <Card elevation={3} sx={{ borderTop: '4px solid #e53935' }}>
      <CardHeader
        title="Upcoming Deadlines"
        avatar={<FiAlertTriangle style={{ color: '#e53935' }} />}
        subheader={`${urgentAssignments.length} urgent items`}
      />
      <CardContent>
        <LinearProgress
          variant="determinate"
          value={Math.min(urgentAssignments.length * 10, 100)}
          sx={{
            height: 10,
            borderRadius: 5,
            backgroundColor: '#ffcdd2',
            '& .MuiLinearProgress-bar': { backgroundColor: '#e53935' },
          }}
        />
        <List sx={{ mt: 2 }}>
          {urgentAssignments
            .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
            .map((assignment, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <FiAlertTriangle style={{ color: '#e53935' }} />
                </ListItemIcon>
                <ListItemText
                  primary={assignment.title}
                  secondary={`Ends: ${new Date(assignment.end_date).toLocaleDateString()} (${assignment.course_name})`}
                />
              </ListItem>
            ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default DeadlinesSection;