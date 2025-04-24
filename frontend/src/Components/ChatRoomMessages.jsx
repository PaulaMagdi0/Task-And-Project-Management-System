import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMessages, sendMessage } from '../redux/chatSlice';
import {
  Box,
  Button,
  TextField,
  Paper,
  List,
  Typography,
  CircularProgress
} from '@mui/material';

const ChatRoomMessages = () => {
  const { roomId } = useParams();
  const { state } = useLocation();
  const other = state?.otherUser;
  const dispatch = useDispatch();
  const rawUserId = useSelector(s => s.auth.user_id);
  const currentUserId = React.useMemo(() => Number(rawUserId), [rawUserId]);
  const {
    messages,
    messagesLoading,
    sendLoading,
    messagesError,
    sendError
  } = useSelector(s => s.chat);

  const roomMessages = messages[roomId] || [];
  const [text, setText] = useState('');
  const listRef = useRef(null);

  // Load history
  useEffect(() => {
    dispatch(fetchMessages(roomId));
  }, [dispatch, roomId]);

  // Auto-scroll
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [roomMessages]);

  // Send handler
  const handleSend = async e => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    await dispatch(sendMessage({ roomId, text: trimmed })).unwrap();
    setText('');
  };

  // Time & Date formatting
  const fmtTime = ts =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fmtDate = ts =>
    new Date(ts).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

  return (
    <Paper sx={{ p: 2, height: '80vh', display: 'flex', flexDirection: 'column' }}>
      {messagesLoading ? (
        <Box sx={{ textAlign: 'center', flex: 1, py: 4 }}>
          <CircularProgress />
        </Box>
      ) : messagesError ? (
        <Typography color="error">{messagesError}</Typography>
      ) : (
        <Box ref={listRef} sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
          <List disablePadding>
            {roomMessages.map((msg, idx) => {
              const senderId =
                typeof msg.sender === 'object' ? msg.sender.id : Number(msg.sender);
              const isMe = senderId === currentUserId;
              const username = isMe ? 'You' : other?.username || 'Them';

              const thisDate = fmtDate(msg.timestamp);
              const prevDate = idx > 0 ? fmtDate(roomMessages[idx - 1].timestamp) : null;
              const showSep = thisDate !== prevDate;

              return (
                <React.Fragment key={msg.id}>
                  {showSep && (
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', my: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {thisDate}
                      </Typography>
                    </Box>
                  )}

                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                      mb: 1,
                      pr: isMe ? 2 : 0
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ mb: 0.5, color: 'text.secondary' }}>
                      {username}
                    </Typography>
                    <Paper
                      elevation={0}
                      sx={{
                        px: 2,
                        py: 1,
                        maxWidth: '75%',
                        bgcolor: isMe ? 'primary.main' : 'grey.200',
                        color: isMe ? 'primary.contrastText' : 'text.primary',
                        borderRadius: '20px'
                      }}
                    >
                      <Typography variant="body1" sx={{ mb: 0.5 }}>
                        {msg.text}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          textAlign: 'right',
                          color: isMe ? 'common.white' : 'text.secondary'
                        }}
                      >
                        {fmtTime(msg.timestamp)}
                      </Typography>
                    </Paper>
                  </Box>
                </React.Fragment>
              );
            })}
          </List>
        </Box>
      )}

      {sendError && (
        <Typography color="error" sx={{ mb: 1 }}>
          {sendError}
        </Typography>
      )}
      <Box component="form" onSubmit={handleSend} sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          placeholder={other ? `Message ${other.username}…` : 'Type your message…'}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !sendLoading && handleSend(e)}
        />
        <Button variant="contained" type="submit" disabled={sendLoading || !text.trim()}>
          {sendLoading ? 'Sending…' : 'Send'}
        </Button>
      </Box>
    </Paper>
  );
};

export default ChatRoomMessages;
