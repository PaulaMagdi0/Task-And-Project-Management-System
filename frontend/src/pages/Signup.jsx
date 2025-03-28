import React from 'react';
import { Container, Typography, Paper, TextField, Button } from '@mui/material';

function SignUp() {
    return (
        <Container maxWidth="sm" sx={{ marginTop: 4 }}>
            <Paper elevation={3} sx={{ padding: 4 }}>
                <Typography variant="h4" align="center" gutterBottom>
                    Sign Up
                </Typography>
                <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    margin="normal"
                />
                <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    margin="normal"
                />
                <Button
                    fullWidth
                    variant="contained"
                    sx={{ marginTop: 2 }}
                >
                    Sign Up
                </Button>
            </Paper>
        </Container>
    );
}

export default SignUp;