// File: src/pages/SignIn.jsx
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

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

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
  const { loading } = useSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    dispatch(logout());
  }, [dispatch]);

  const mapErrorMsg = (err) => {
    if (!err) return '';
    const msg = err.toString().toLowerCase();
    if (msg.includes('given credentials') || msg.includes('no active account') || msg.includes('invalid token')) {
      return 'Invalid email or password.';
    }
    if (msg.includes('not found') && msg.includes('email')) {
      return 'Email does not exist.';
    }
    if (msg.includes('password')) {
      return 'Password is incorrect.';
    }
    return err;
  };

  const handleLogin = async (e) => {
    // prevent default only if a form event
    if (e && e.preventDefault) e.preventDefault();
    setLoginError('');
    const resultAction = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(resultAction)) {
      const { userType, role } = resultAction.payload;
      if (userType === 'student') {
        navigate('/student/dashboard');
      } else if (userType === 'staff') {
        if (role === 'instructor') navigate('/instructor/dashboard');
        else if (role === 'supervisor') navigate('/supervisor/dashboard');
        else if (role === 'branch_manager') navigate('/branchmanager/dashboard');
        else if (role === 'admin') navigate('/admin/dashboard');
        else navigate('/');
      } else {
        navigate('/');
      }
    } else {
      const err = resultAction.payload?.error || resultAction.error?.message || 'Login failed';
      setLoginError(mapErrorMsg(err));
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.57), rgba(0, 0, 0, 0.64)), url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        p: 2,
      }}
    >
      <Slide in direction="up" timeout={500}>
        <AnimatedPaper elevation={6}>
          <Fade in timeout={800}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Lock sx={{ fontSize: 50, color: 'rgba(211, 47, 47, 0.9)' }} />
              <Typography variant="h4" component="h1" gutterBottom>
                Sign In
              </Typography>
              <Box sx={{ width: '100%', mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  InputProps={{ startAdornment: <Email sx={{ color: 'rgba(211, 47, 47, 0.7)', mr: 1 }} /> }}
                  sx={{
                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(211, 47, 47, 0.9)' },
                    '& .MuiInputLabel-root.Mui-focused': { color: 'rgba(211, 47, 47, 0.9)' }
                  }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  InputProps={{ startAdornment: <Lock sx={{ color: 'rgba(211, 47, 47, 0.7)', mr: 1 }} /> }}
                  sx={{
                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(211, 47, 47, 0.9)' },
                    '& .MuiInputLabel-root.Mui-focused': { color: 'rgba(211, 47, 47, 0.9)' }
                  }}
                />
                <Zoom in timeout={1000}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleLogin}
                    disabled={loading}
                    sx={{
                      mt: 2,
                      py: 1.5,
                      fontSize: '1rem',
                      transition: 'all 0.3s',
                      backgroundColor: 'rgba(211, 47, 47, 0.9)',
                      '&:hover': { transform: 'translateY(-2px)', backgroundColor: 'rgba(211, 47, 47, 1)' },
                      '&.Mui-disabled': { backgroundColor: 'rgba(211, 47, 47, 0.5)' }
                    }}
                  >
                    {loading ? 'Logging in...' : 'Log In'}
                  </Button>
                </Zoom>
                {loginError && (
                  <Fade in timeout={500}>
                    <Typography color="error" align="center" sx={{ mt: 2 }}>
                      {loginError}
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
