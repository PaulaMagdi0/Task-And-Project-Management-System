import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loginUser, logout } from '../redux/authSlice';
import { useNavigate } from 'react-router-dom';
import heroBg from '/src/assets/img/newCapital.png';
import {
  Box, Button, TextField, Typography, Paper, Fade, Slide, Zoom, Link,
  styled, Tabs, Tab
} from '@mui/material';
import { Lock, Email, School, Work } from '@mui/icons-material';
import apiClient from '../services/api';

const AnimatedPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  width: '100%',
  maxWidth: 450,
  borderRadius: 16,
  background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,240,240,0.9))',
  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  transition: 'all 0.3s ease',
  '&:hover': { boxShadow: '0 12px 48px rgba(0,0,0,0.3)' },
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  mb: 2,
  '& .MuiTab-root': {
    fontWeight: 600,
    textTransform: 'none',
    fontSize: '1.1rem',
    padding: theme.spacing(1, 3),
    color: theme.palette.text.secondary,
  },
  '& .Mui-selected': {
    color: 'rgba(211,47,47,1)',
  },
  '& .MuiTabs-indicator': {
    backgroundColor: 'rgba(211,47,47,1)',
    height: 3,
  },
}));

export default function SignIn() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [tab, setTab] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [intakeId, setIntakeId] = useState('');
  const [intakeIdError, setIntakeIdError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginFailed, setLoginFailed] = useState(false);
  const [loading, setLoading] = useState(false);

  const [resetMode, setResetMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    // Clear any stale auth token
    localStorage.removeItem('authToken');
    dispatch(logout());
  }, [dispatch]);

  const backToSignIn = () => {
    setResetMode(false);
    setLoginFailed(false);
    setLoginError('');
    setIntakeIdError('');
    setEmail('');
    setPassword('');
    setIntakeId('');
    setOtpSent(false);
    setOtpVerified(false);
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setResetMsg('');
    setResetError('');
  };

  const validateIntakeId = (value) => {
    if (value === undefined || value === null || value === '') {
      return 'Intake ID is required';
    }
    const strValue = String(value);
    if (!/^[0-9]+$/.test(strValue)) {
      return 'Intake ID must be a number';
    }
    const num = parseInt(strValue, 10);
    if (isNaN(num) || num <= 0) {
      return 'Intake ID must be a positive number';
    }
    return '';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIntakeIdError('');
    setLoginFailed(false);
    setLoading(true);

    console.log('Form state:', { email, password, intakeId, tab });

    // Validate intakeId for student login
    if (tab === 'student') {
      const error = validateIntakeId(intakeId);
      if (error) {
        setIntakeIdError(error);
        setLoading(false);
        console.log('Client-side validation failed:', error);
        return;
      }
    }

    const intakeIdNum = intakeId ? parseInt(intakeId, 10) : null;
    const payload = {
      email,
      password,
      intake_id: tab === 'student' ? intakeIdNum : null,
    };

    console.log('Login payload:', JSON.stringify(payload, null, 2));
    console.log('Payload types:', {
      email: typeof email,
      password: typeof password,
      intake_id: typeof payload.intake_id,
    });

    try {
      // Ensure no auth token is sent
      localStorage.removeItem('authToken');

      // Call apiClient directly to avoid loginUser config issues
      const response = await apiClient.post('/auth/login/', payload);
      console.log('API response:', JSON.stringify(response.data, null, 2));

      // Simulate loginUser.fulfilled for consistency
      const result = { payload: response.data };

      setLoading(false);
      if (response.status === 200) {
        console.log('Login successful, navigating...');
        dispatch({ type: 'auth/loginUser/fulfilled', payload: response.data });
        const { userType, role } = result.payload;
        if (userType === 'student') navigate('/student/dashboard');
        else if (role === 'instructor') navigate('/instructor/dashboard');
        else if (role === 'supervisor') navigate('/supervisor/dashboard');
        else if (role === 'branch_manager') navigate('/branchmanager/dashboard');
        else if (role === 'admin') navigate('/admin/dashboard');
        else navigate('/');
      } else {
        const err = response.data?.error || 'Login failed';
        console.error('Login error:', err);
        setLoginError(err);
        setLoginFailed(true);
      }
    } catch (error) {
      console.error('Unexpected login error:', error.response?.data || error.message);
      const err = error.response?.data?.error || error.response?.data?.detail || 'An unexpected error occurred';
      setLoginError(err);
      setLoginFailed(true);
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    setResetError('');
    setResetMsg('');
    try {
      const payload = { email };
      if (tab === 'student' && intakeId) {
        const error = validateIntakeId(intakeId);
        if (error) {
          setResetError(error);
          return;
        }
        payload.intake_id = parseInt(intakeId, 10);
      }
      console.log('OTP request payload:', JSON.stringify(payload, null, 2));
      await apiClient.post('/auth/password-reset-request/', payload);
      setOtpSent(true);
      setResetMsg('OTP sent—check your email.');
    } catch (e) {
      const err = e.response?.data?.detail || 'Failed to send OTP.';
      console.error('OTP request error:', err);
      setResetError(err);
    }
  };

  const verifyOtp = async () => {
    setResetError('');
    setResetMsg('');
    try {
      const payload = { email, otp };
      console.log('OTP verify payload:', JSON.stringify(payload, null, 2));
      await apiClient.post('/auth/password-reset-verify/', payload);
      setOtpVerified(true);
      setResetMsg('OTP verified—enter your new password.');
    } catch (e) {
      const err = e.response?.data?.detail || 'Invalid or expired OTP.';
      console.error('OTP verify error:', err);
      setResetError(err);
    }
  };

  const confirmReset = async () => {
    setResetError('');
    if (newPassword !== confirmPassword) {
      setResetError("Passwords don't match.");
      return;
    }
    try {
      const payload = { email, otp, new_password: newPassword };
      console.log('Password reset confirm payload:', JSON.stringify(payload, null, 2));
      await apiClient.post('/auth/password-reset-confirm/', payload);
      alert('Password reset successful! Please sign in.');
      backToSignIn();
    } catch (e) {
      const data = e.response?.data || {};
      const msg =
        data.detail ||
        (Array.isArray(data.new_password) ? data.new_password.join(', ') :
         typeof data.new_password === 'string' ? data.new_password :
         JSON.stringify(data));
      console.error('Password reset confirm error:', msg);
      setResetError(msg);
    }
  };

  const SignInPanel = (
    <Slide in direction="up" timeout={500}>
      <AnimatedPaper elevation={6}>
        <Fade in timeout={800}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              {tab === 'student' ? (
                <School sx={{ fontSize: 50, color: 'rgba(211,47,47,0.9)', mr: 1 }} />
              ) : (
                <Work sx={{ fontSize: 50, color: 'rgba(211,47,47,0.9)', mr: 1 }} />
              )}
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {tab === 'student' ? 'Student Login' : 'Staff Login'}
              </Typography>
            </Box>
            <StyledTabs value={tab} onChange={(e, newValue) => setTab(newValue)} centered>
              <Tab label="Student" value="student" />
              <Tab label="Staff Member" value="staff" />
            </StyledTabs>
            <Box component="form" onSubmit={handleLogin}
                 sx={{ width: '100%', mt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: <Email sx={{ mr: 1, color: 'rgba(211,47,47,0.7)' }} />,
                }}
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: <Lock sx={{ mr: 1, color: 'rgba(211,47,47,0.7)' }} />,
                }}
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
              />
              {tab === 'student' && (
                <TextField
                  fullWidth
                  label="Intake ID"
                  type="text"
                  required
                  value={intakeId}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^[0-9]+$/.test(value)) {
                      setIntakeId(value);
                      setIntakeIdError(validateIntakeId(value));
                    }
                  }}
                  error={!!intakeIdError}
                  helperText={intakeIdError}
                  InputProps={{
                    startAdornment: <School sx={{ mr: 1, color: 'rgba(211,47,47,0.7)' }} />,
                  }}
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
                />
              )}
              <Zoom in timeout={300}>
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  disabled={loading || (tab === 'student' && (!intakeId || !!intakeIdError))}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    borderRadius: 8,
                    backgroundColor: 'rgba(211,47,47,0.9)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      backgroundColor: 'rgba(211,47,47,1)',
                    },
                    '&:disabled': {
                      backgroundColor: 'rgba(211,47,47,0.5)',
                    },
                  }}
                >
                  {loading ? 'Logging in…' : 'Log In'}
                </Button>
              </Zoom>
              {loginError && (
                <Typography color="error" align="center" sx={{ fontSize: '0.9rem' }}>
                  {loginError}
                </Typography>
              )}
              {loginFailed && (
                <Box textAlign="right">
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => {
                      setResetMode(true);
                      setLoginFailed(false);
                    }}
                    sx={{ color: 'rgba(211,47,47,0.9)', fontWeight: 500 }}
                  >
                    Forgot Password?
                  </Link>
                </Box>
              )}
            </Box>
          </Box>
        </Fade>
      </AnimatedPaper>
    </Slide>
  );

  const ResetPanel = (
    <Slide in direction="up" timeout={500}>
      <AnimatedPaper elevation={6}>
        <Fade in timeout={800}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Lock sx={{ fontSize: 50, color: 'rgba(211,47,47,0.9)' }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
              Reset Password
            </Typography>
            <Box sx={{ width: '100%', mt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                label="Email"
                value={email}
                disabled
                fullWidth
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
              />
              {tab === 'student' && (
                <TextField
                  label="Intake ID"
                  value={intakeId}
                  disabled
                  fullWidth
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
                />
              )}
              {!otpSent && (
                <Button
                  variant="outlined"
                  onClick={sendOtp}
                  disabled={tab === 'student' && (!intakeId || validateIntakeId(intakeId))}
                  sx={{
                    borderRadius: 8,
                    borderColor: 'rgba(211,47,47,0.9)',
                    color: 'rgba(211,47,47,0.9)',
                    '&:hover': { borderColor: 'rgba(211,47,47,1)', color: 'rgba(211,47,47,1)' },
                  }}
                >
                  Send 4-digit OTP
                </Button>
              )}
              {resetMsg && (
                <Typography color="success.main" sx={{ fontSize: '0.9rem' }}>
                  {resetMsg}
                </Typography>
              )}
              {resetError && (
                <Typography color="error" sx={{ fontSize: '0.9rem' }}>
                  {resetError}
                </Typography>
              )}
              {otpSent && !otpVerified && (
                <>
                  <TextField
                    label="Enter OTP"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    inputProps={{ maxLength: 4 }}
                    fullWidth
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
                  />
                  <Button
                    variant="contained"
                    onClick={verifyOtp}
                    disabled={!otp}
                    sx={{
                      borderRadius: 8,
                      backgroundColor: 'rgba(211,47,47,0.9)',
                      '&:hover': { backgroundColor: 'rgba(211,47,47,1)' },
                    }}
                  >
                    Verify OTP
                  </Button>
                </>
              )}
              {otpVerified && (
                <>
                  <TextField
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    fullWidth
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
                  />
                  <TextField
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    fullWidth
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
                  />
                  <Button
                    variant="contained"
                    onClick={confirmReset}
                    sx={{
                      borderRadius: 8,
                      backgroundColor: 'rgba(211,47,47,0.9)',
                      '&:hover': { backgroundColor: 'rgba(211,47,47,1)' },
                    }}
                  >
                    Set New Password
                  </Button>
                </>
              )}
              <Box textAlign="right" mt={1}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={backToSignIn}
                  sx={{ color: 'rgba(211,47,47,0.9)', fontWeight: 500 }}
                >
                  Cancel
                </Link>
              </Box>
            </Box>
          </Box>
        </Fade>
      </AnimatedPaper>
    </Slide>
  );

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${heroBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      p: 2,
    }}>
      {resetMode ? ResetPanel : SignInPanel}
    </Box>
  );
}