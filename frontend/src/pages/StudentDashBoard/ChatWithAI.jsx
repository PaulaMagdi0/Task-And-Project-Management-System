import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Card, CardHeader, CardContent, TextField, Button, Typography, CircularProgress, Alert, Avatar } from '@mui/material';
import { FiSend } from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';
import './ChatWithAI.css';

const ChatWithAI = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const chatBoxRef = useRef(null);

  console.log('ChatWithAI Component Rendered'); // Debug log

  const sendMessage = async () => {
    console.log('sendMessage called, input:', input); // Debug log
    if (!input.trim()) {
      setError('Please enter a message');
      console.log('Empty input detected'); // Debug log
      return;
    }
    if (retryCount >= maxRetries) {
      setError('Maximum retry attempts reached');
      console.log('Max retries reached'); // Debug log
      return;
    }

    // Add user message to history
    setMessages((prev) => [...prev, { role: 'user', content: input, id: Date.now() }]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      console.log('Sending API request:', input); // Debug log
      const res = await fetch('http://localhost:8000/api/chatAI/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

      const data = await res.json();
      console.log('AI Response:', data); // Debug log

      // Clean response: remove markdown symbols
      const cleanResponse = data.response
        .replace(/#{1,6}\s*/g, '') // Remove headers
        .replace(/\*\*\*/g, '') // Remove bold/italics
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/[-*+]\s/g, '• ') // Convert list markers to bullets
        .replace(/\n/g, '<br />'); // Convert newlines to HTML breaks

      setMessages((prev) => [...prev, { role: 'ai', content: cleanResponse, id: Date.now() + 1 }]);
      setRetryCount(0);
    } catch (err) {
      console.error('Chat Error:', err); // Debug log
      setError('Failed to get response: ' + err.message);
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          console.log('Retrying API call, attempt:', retryCount + 1); // Debug log
          sendMessage();
        }, 1000 * (retryCount + 1));
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    console.log('ChatWithAI Mounted'); // Debug log
    return () => console.log('ChatWithAI Unmounted'); // Debug log
  }, []);

  return (
    <Box className="chat-container">
      <Card elevation={3} sx={{ borderTop: '4px solid #00897b', height: '100%' }}>
        <CardHeader
          title="Chat With AI"
          avatar={<FaRobot style={{ color: '#00897b' }} />}
          subheader="Your intelligent assistant"
        />
        <CardContent sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 64px)' }}>
          <Box
            className="chat-box"
            ref={chatBoxRef}
            sx={{ flex: 1, overflowY: 'auto', mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}
            role="log"
            aria-live="polite"
          >
            {messages.length === 0 && !loading && (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 4 }}>
                Start a conversation by typing a message below.
              </Typography>
            )}
            {messages.map((msg) => (
              <Box
                key={msg.id}
                className={`message ${msg.role}`}
                sx={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    maxWidth: '70%',
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: msg.role === 'user' ? '#00897b' : '#ffffff',
                    color: msg.role === 'user' ? '#ffffff' : '#000000',
                    boxShadow: 1,
                  }}
                >
                  {msg.role === 'ai' && (
                    <Avatar sx={{ bgcolor: '#00897b', mr: 1, float: 'left' }}>
                      <FaRobot />
                    </Avatar>
                  )}
                  <Typography
                    variant="body1"
                    dangerouslySetInnerHTML={{ __html: msg.content }}
                    sx={{ display: 'inline', wordBreak: 'break-word' }}
                  />
                </Box>
              </Box>
            ))}
            {loading && (
              <Box className="message ai" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#00897b', mr: 1 }}>
                  <FaRobot />
                </Avatar>
                <Typography variant="body2" color="text.secondary">
                  Typing...
                </Typography>
              </Box>
            )}
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box className="input-area" sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Ask anything..."
              variant="outlined"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                console.log('Input changed:', e.target.value); // Debug log
              }}
              onKeyDown={(e) => {
                console.log('Key pressed:', e.key); // Debug log
                if (e.key === 'Enter') sendMessage();
              }}
              sx={{ flex: 1, minWidth: 200 }}
              aria-label="Type your message"
              disabled={loading}
            />
            <Button
              variant="contained"
              startIcon={<FiSend />}
              onClick={() => {
                console.log('Send button clicked'); // Debug log
                sendMessage();
              }}
              disabled={loading || !input.trim()}
              sx={{ backgroundColor: '#00897b', '&:hover': { backgroundColor: '#00796b' } }}
              aria-label="Send message"
            >
              Send
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChatWithAI;