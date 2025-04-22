import React from "react";
import { VerifiedUser } from "@mui/icons-material";
import { Button, Typography, Box, Paper } from "@mui/material";
import { Link } from "react-router-dom";

const NotVerifiedPage = () => {
    return (
        <Box
            sx={{
                minHeight: "100vh",
                background: "linear-gradient(to bottom right, #d1fae5, #6ee7b7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 2,
            }}
        >
            <Paper
                elevation={6}
                sx={{
                    p: 6,
                    textAlign: "center",
                    borderRadius: 4,
                    maxWidth: 400,
                    width: "100%",
                }}
            >
                <VerifiedUser sx={{ fontSize: 60, color: "green", mb: 2 }} />
                <Typography variant="h4" fontWeight="bold" color="success.main" gutterBottom>
                    Already Verified
                </Typography>
                <Typography variant="body1" color="text.secondary" mb={4}>
                    Your account has already been verified.<br />
                    You can now log in and enjoy the platform.
                </Typography>
                <Button
                    component={Link}
                    to="/signin"
                    variant="contained"
                    color="success"
                    size="large"
                    sx={{ borderRadius: "30px", textTransform: "none", fontWeight: "bold" }}
                >
                    Go to Login
                </Button>
            </Paper>
        </Box>
    );
};

export default NotVerifiedPage;
