// File: src/components/SignIn.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, logout } from '../redux/authSlice';
import { useNavigate } from 'react-router-dom';
import heroBg from '/src/assets/img/newCapital.png';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Fade,
  Slide,
  Zoom,
  styled,
  keyframes
} from '@mui/material';
import { Lock, Email } from '@mui/icons-material';

// Define animation keyframes outside the component
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// Define styled component for the Paper outside the component
const AnimatedPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  width: '100%',
  maxWidth: 400,
  animation: `${pulse} 3s ease-in-out infinite`,
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: theme.shadows[10]
  }
}));

const SignIn = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // When the SignIn page mounts, force logout to clear any token.
  useEffect(() => {
    dispatch(logout());
  }, [dispatch]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const resultAction = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(resultAction)) {
      const { userType, role } = resultAction.payload;
      if (userType === 'student') {
        navigate('/student/dashboard');
      } else if (userType === 'staff') {
        if (role === 'instructor') {
          navigate('/instructor/dashboard');
        } else if (role === 'supervisor') {
          navigate('/supervisor/dashboard');
        } else if (role === 'branch_manager') {
          navigate('/branchmanager/dashboard');
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundImage: `linear-gradient(rgba(0, 91, 170, 0.7), rgba(0, 91, 170, 0.7)), url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        p: 2
      }}
    >
      <Slide in direction="up" timeout={500}>
        <AnimatedPaper elevation={6}>
          <Fade in timeout={800}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
              }}
            >
              <Lock sx={{ fontSize: 50, color: 'primary.main' }} />
              <Typography variant="h4" component="h1" gutterBottom>
                Sign In
              </Typography>
              <Box
                component="form"
                onSubmit={handleLogin}
                sx={{
                  width: '100%',
                  mt: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}
              >
                <TextField
                  fullWidth
                  label="Email"
                  variant="outlined"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <Email sx={{ color: 'action.active', mr: 1 }} />
                    )
                  }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  variant="outlined"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <Lock sx={{ color: 'action.active', mr: 1 }} />
                    )
                  }}
                />
                <Zoom in timeout={1000}>
                  <Button
                    fullWidth
                    variant="contained"
                    type="submit"
                    disabled={loading}
                    sx={{
                      mt: 2,
                      py: 1.5,
                      fontSize: '1rem',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    {loading ? 'Logging in...' : 'Log In'}
                  </Button>
                </Zoom>
                {error && (
                  <Fade in timeout={500}>
                    <Typography color="error" align="center" sx={{ mt: 2 }}>
                      {error}
                    </Typography>
                  </Fade>
                )}
              </Box>
            </Box>
          </Fade>
        </AnimatedPaper>
      </Slide>
    </Box>
  );
};

export default SignIn;
