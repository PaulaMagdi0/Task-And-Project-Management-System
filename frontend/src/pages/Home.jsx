import React from 'react'
import '../styles/style.css';
import { Container, Typography, Paper } from '@mui/material';
import Chat from '../components/Chat';
export default function Home() {
    return (
        <>
            <Container maxWidth="md" sx={{ marginTop: 4 }}>
                <Paper elevation={3} sx={{ padding: 4 }}>
                    <Typography variant="h4" align="center" gutterBottom>
                        Task & Project Management System!
                    </Typography>
                    <Typography variant="body1" align="center">
                        This is the starting point of your application.
                    </Typography>
                </Paper>
            </Container>
            <div cla>

                <Chat />
            </div>
        </>
    )
}
