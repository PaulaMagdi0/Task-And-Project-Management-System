// File: src/pages/SignIn.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loginUser, logout } from '../redux/authSlice';
import { useNavigate } from 'react-router-dom';
import heroBg from '/src/assets/img/newCapital.png';
import {
  Box, Button, TextField, Typography,
  Paper, Fade, Slide, Zoom, Link,
  styled, keyframes
} from '@mui/material';
import { Lock, Email } from '@mui/icons-material';
import apiClient from '../services/api';

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
  '&:hover': { boxShadow: theme.shadows[10] },
}));

export default function SignIn() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Sign‑in state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginFailed, setLoginFailed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset‑password state
  const [resetMode, setResetMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    dispatch(logout());
  }, [dispatch]);

  const backToSignIn = () => {
    setResetMode(false);
    setLoginFailed(false);
    setLoginError('');
    setEmail('');
    setPassword('');
    setOtpSent(false);
    setOtpVerified(false);
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setResetMsg('');
    setResetError('');
  };

  const handleLogin = async e => {
    e.preventDefault();
    setLoginError('');
    setLoginFailed(false);
    setLoading(true);
    const result = await dispatch(loginUser({ email, password }));
    setLoading(false);
    if (loginUser.fulfilled.match(result)) {
      const { userType, role } = result.payload;
      if      (userType==='student')    navigate('/student/dashboard');
      else if (role==='instructor')     navigate('/instructor/dashboard');
      else if (role==='supervisor')     navigate('/supervisor/dashboard');
      else if (role==='branch_manager') navigate('/branchmanager/dashboard');
      else if (role==='admin')          navigate('/admin/dashboard');
      else                              navigate('/');
    } else {
      const err = result.payload?.error || result.error?.message || 'Login failed';
      setLoginError(err);
      setLoginFailed(true);
    }
  };

  const sendOtp = async () => {
    setResetError(''); setResetMsg('');
    try {
      await apiClient.post('/auth/password-reset-request/', { email });
      setOtpSent(true);
      setResetMsg('OTP sent—check your email.');
    } catch (e) {
      setResetError(e.response?.data?.detail || 'Failed to send OTP.');
    }
  };

  const verifyOtp = async () => {
    setResetError(''); setResetMsg('');
    try {
      await apiClient.post('/auth/password-reset-verify/', { email, otp });
      setOtpVerified(true);
      setResetMsg('OTP verified—enter your new password.');
    } catch (e) {
      setResetError(e.response?.data?.detail || 'Invalid or expired OTP.');
    }
  };

  const confirmReset = async () => {
    setResetError('');
    if (newPassword !== confirmPassword) {
      setResetError("Passwords don't match.");
      return;
    }
    try {
      await apiClient.post('/auth/password-reset-confirm/', {
        email, otp, new_password: newPassword
      });
      alert('Password reset successful! Please sign in.');
      backToSignIn();
    } catch (e) {
      const data = e.response?.data || {};
      // Prefer field‐specific messages
      let msg =
        data.detail ||
        (Array.isArray(data.new_password) ? data.new_password.join(', ') :
         typeof data.new_password === 'string' ? data.new_password :
         JSON.stringify(data));
      setResetError(msg);
    }
  };

  const SignInPanel = (
    <Slide in direction="up" timeout={500}>
      <AnimatedPaper elevation={6}>
        <Fade in timeout={800}>
          <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
            <Lock sx={{ fontSize:50, color:'rgba(211,47,47,0.9)' }}/>
            <Typography variant="h4" gutterBottom>Sign In</Typography>
            <Box component="form" onSubmit={handleLogin}
                 sx={{ width:'100%', mt:3, display:'flex', flexDirection:'column', gap:2 }}>
              <TextField
                fullWidth label="Email" type="email" required
                value={email} onChange={e=>setEmail(e.target.value)}
                InputProps={{ startAdornment:<Email sx={{mr:1,color:'rgba(211,47,47,0.7)'}}/> }}
              />
              <TextField
                fullWidth label="Password" type="password" required
                value={password} onChange={e=>setPassword(e.target.value)}
                InputProps={{ startAdornment:<Lock sx={{mr:1,color:'rgba(211,47,47,0.7)'}}/> }}
              />
              <Zoom in timeout={300}>
                <Button fullWidth variant="contained" type="submit" disabled={loading}
                  sx={{
                    py:1.5, fontSize:'1rem',
                    backgroundColor:'rgba(211,47,47,0.9)',
                    '&:hover':{transform:'translateY(-2px)',backgroundColor:'rgba(211,47,47,1)'}
                  }}
                >
                  {loading ? 'Logging in…' : 'Log In'}
                </Button>
              </Zoom>
              {loginError && <Typography color="error" align="center">{loginError}</Typography>}
              {loginFailed && (
                <Box textAlign="right">
                  <Link component="button" variant="body2"
                        onClick={()=>{setResetMode(true); setLoginFailed(false);}}>
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
          <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
            <Lock sx={{ fontSize:50, color:'rgba(211,47,47,0.9)' }}/>
            <Typography variant="h4" gutterBottom>Reset Password</Typography>
            <Box sx={{ width:'100%', mt:1, display:'flex', flexDirection:'column', gap:2 }}>
              <TextField label="Email" value={email} disabled fullWidth />
              {!otpSent && <Button variant="outlined" onClick={sendOtp}>Send 4‑digit OTP</Button>}
              {resetMsg && <Typography color="success.main">{resetMsg}</Typography>}
              {resetError && <Typography color="error">{resetError}</Typography>}
              {otpSent && !otpVerified && (
                <>
                  <TextField
                    label="Enter OTP"
                    value={otp}
                    onChange={e=>setOtp(e.target.value.replace(/\D/g,''))}
                    inputProps={{ maxLength:4 }}
                    fullWidth
                  />
                  <Button variant="contained" onClick={verifyOtp} disabled={!otp}>
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
                    onChange={e=>setNewPassword(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={e=>setConfirmPassword(e.target.value)}
                    fullWidth
                  />
                  <Button variant="contained" onClick={confirmReset}>
                    Set New Password
                  </Button>
                </>
              )}
              <Box textAlign="right" mt={1}>
                <Link component="button" variant="body2" onClick={backToSignIn}>
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
      display:'flex', justifyContent:'center', alignItems:'center',
      minHeight:'100vh',
      backgroundImage:`linear-gradient(rgba(0,0,0,0.57),rgba(0,0,0,0.64)),url(${heroBg})`,
      backgroundSize:'cover', backgroundPosition:'center', p:2
    }}>
      {resetMode ? ResetPanel : SignInPanel}
    </Box>
  );
}
