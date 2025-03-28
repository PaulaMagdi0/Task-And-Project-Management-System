import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Link } from 'react-router-dom'; // For navigation

function NotFound() {
    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    textAlign: 'center',
                }}
            >
                <Typography variant="h1" sx={{ fontSize: '6rem', fontWeight: 'bold', color: 'primary.main' }}>
                    404
                </Typography>

                <Typography variant="h4" sx={{ mt: 2, mb: 3 }}>
                    Oops! Page Not Found
                </Typography>

                <Typography variant="body1" sx={{ mb: 4 }}>
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </Typography>

                <Button
                    variant="contained"
                    color="primary"
                    component={Link}
                    to="/"
                >
                    Go to Home
                </Button>
            </Box>
        </Container>
    );
}

export default NotFound;