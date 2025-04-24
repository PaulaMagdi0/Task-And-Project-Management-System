import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Paper,
  List,
  ListItem,
  TextField,
  IconButton,
  CircularProgress,
  Typography,
  Avatar,
  Divider,
  Badge
} from '@mui/material';
import { Send, ArrowBack } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  fetchMessages,
  sendMessage,
  clearChatError,
  clearMessages
} from '../redux/chatSlice';

const ChatRoomView = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const otherUser = state?.otherUser;
  const dispatch = useDispatch();

  const currentUserId   = useSelector(s => s.auth.user_id);
  const messagesMap     = useSelector(s => s.chat.messages);
  const messagesLoading = useSelector(s => s.chat.messagesLoading);
  const sendLoading     = useSelector(s => s.chat.sendLoading);
  const messagesError   = useSelector(s => s.chat.messagesError);
  const sendError       = useSelector(s => s.chat.sendError);

  const [text, setText] = useState('');
  const bottomRef       = useRef(null);

  const roomMessages = messagesMap[roomId] || [];

  // load & clear
  useEffect(() => {
    if (!roomId) return navigate(-1);
    dispatch(clearMessages());
    dispatch(clearChatError());
    dispatch(fetchMessages(roomId));
    return () => dispatch(clearMessages());
  }, [dispatch, roomId, navigate]);

  // scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages]);

  const handleSend = () => {
    const t = text.trim();
    if (!t) return;
    dispatch(sendMessage({ roomId, text: t }))
      .unwrap()
      .then(() => setText(''));
  };

  // helper to detect date changes
  const formatDate = ts => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month:   'short',
      day:     'numeric'
    });
  };

  return (
    <Box sx={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.default'
    }}>
      {/* header */}
      <Paper elevation={0} sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        borderRadius: 0,
        bgcolor: 'background.paper'
      }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant="dot"
          color="success"
        >
          <Avatar sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText'
          }}>
            {otherUser?.username?.slice(0,2).toUpperCase()}
          </Avatar>
        </Badge>
        <Box sx={{ ml: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {otherUser?.username || 'Unknown'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {otherUser?.status || 'online'}
          </Typography>
        </Box>
      </Paper>
      <Divider />

      {/* messages */}
      <Box sx={{
        flex: 1,
        overflow: 'auto',
        p: 2,
        bgcolor: 'background.paper'
      }}>
        {messagesLoading ? (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%'
          }}>
            <CircularProgress />
          </Box>
        ) : messagesError ? (
          <Typography color="error">{messagesError}</Typography>
        ) : (
          <List sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {roomMessages.map((msg, i) => {
              const isMe = msg.sender.id === currentUserId;
              // date separator?
              const prevDate = i > 0
                ? new Date(roomMessages[i-1].timestamp).toDateString()
                : null;
              const thisDate = new Date(msg.timestamp).toDateString();
              const showDate = prevDate !== thisDate;

              return (
                <React.Fragment key={msg.id}>
                  {showDate && (
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', my: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(msg.timestamp)}
                      </Typography>
                    </Box>
                  )}
                  <ListItem sx={{
                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                    px: 0,
                    py: 0.5
                  }}>
                    <Paper elevation={0} sx={{
                      p: 1.5,
                      maxWidth: '70%',
                      borderRadius: 4,
                      bgcolor: isMe ? 'primary.main' : 'background.paper',
                      color: isMe ? 'primary.contrastText' : 'text.primary',
                      border: theme => !isMe && `1px solid ${theme.palette.divider}`,
                      position: 'relative'
                    }}>
                      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                        {msg.text}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          textAlign: 'right',
                          mt: 0.5,
                          color: isMe ? 'common.white' : 'text.secondary'
                        }}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour:   '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </Paper>
                  </ListItem>
                </React.Fragment>
              );
            })}
            <div ref={bottomRef}/>
          </List>
        )}
      </Box>

      {/* input */}
      <Paper elevation={3} sx={{
        p: 2,
        borderRadius: 0,
        bgcolor: 'background.paper'
      }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 4,
                bgcolor: 'background.default'
              }
            }}
          />
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={sendLoading || !text.trim()}
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': { bgcolor: 'primary.dark' },
              '&:disabled': { bgcolor: 'action.disabledBackground' }
            }}
          >
            {sendLoading
              ? <CircularProgress size={24} sx={{ color:'inherit' }}/>
              : <Send />}
          </IconButton>
        </Box>
        {sendError && (
          <Typography variant="caption" color="error" sx={{ mt:1, display:'block' }}>
            {sendError}
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default ChatRoomView;
