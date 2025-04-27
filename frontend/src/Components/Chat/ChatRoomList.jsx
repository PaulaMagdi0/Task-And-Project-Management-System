// File: src/components/ChatRoomList.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  TextField,
  CircularProgress,
  IconButton,
  InputAdornment,
  Avatar,
  Badge,
  Divider,
  alpha
} from '@mui/material';
import { Search, Chat as ChatIcon, FiberManualRecord } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyRooms, createRoom, searchUsers, clearSearchResults } from '../../redux/chatSlice';
import debounce from 'lodash/debounce';
import { useNavigate } from 'react-router-dom';

const ChatRoomList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // **STATE & SELECTORS**
  const rawUserId       = useSelector(s => s.auth.user_id);
  const currentUserId   = React.useMemo(() => Number(rawUserId), [rawUserId]);
  const currentUserRole = useSelector(s => s.auth.role);
  const { rooms, roomsLoading, roomsError, createRoomLoading } = useSelector(s => s.chat);
  const { searchResults, searchLoading, searchError }         = useSelector(s => s.chat);

  // **LOCAL STATE**
  const [query, setQuery] = useState('');

  // load rooms once
  useEffect(() => {
    dispatch(fetchMyRooms());
  }, [dispatch]);

  // debounced user search
  const debouncedSearch = useCallback(
    debounce(q => {
      if (q) dispatch(searchUsers(q));
      else dispatch(clearSearchResults());
    }, 300),
    [dispatch]
  );
  useEffect(() => {
    debouncedSearch(query.trim());
  }, [query, debouncedSearch]);

  // filter out yourself & admins
  const filteredResults = searchResults
    .filter(u => u.id !== currentUserId)
    .filter(u => u.role !== 'admin' || currentUserRole === 'branchmanager');

  // create or open chat
  const handleCreateRoom = async user => {
    const action = await dispatch(createRoom(user.id));
    if (createRoom.fulfilled.match(action)) {
      const room = action.payload;
      navigate(`/chat/rooms/${room.id}`, { state: { otherUser: user } });
      setQuery('');
      dispatch(clearSearchResults());
      dispatch(fetchMyRooms());
    }
  };

  // pick “other” and navigate
  const handleSelectRoom = room => {
    const other = room.other ?? room.participants.find(p => p.id !== currentUserId);
    navigate(`/chat/rooms/${room.id}`, { state: { otherUser: other } });
  };

  // format hh:mm
  const fmtTime = ts => {
    try {
      return new Date(ts).toLocaleString([], {
        hour:   '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <Box sx={{
      p: 3,
      maxWidth: 500,
      mx: 'auto',
      height: '90vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.paper'
    }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
          Messages
        </Typography>
        <Paper elevation={0} sx={{ borderRadius: 3, bgcolor: theme => alpha(theme.palette.primary.main, 0.05) }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search Users..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            InputProps={{
              sx: { borderRadius: 3 },
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: searchLoading && (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              )
            }}
          />
        </Paper>
      </Box>

      {/* Search Results */}
      {filteredResults.length > 0 && (
        <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
          <List dense>
            {filteredResults.map(user => (
              <ListItem key={user.id} disablePadding sx={{ '&:hover': { bgcolor: 'action.hover' }, transition: '0.3s' }}>
              <ListItem
  secondaryAction={
    <IconButton
      edge="end"
      onClick={() => handleCreateRoom(user)}
      disabled={createRoomLoading}
      sx={{ color: 'primary.main' }}
    >
      <ChatIcon />
    </IconButton>
  }
>
  <ListItemButton>
    <ListItemAvatar>
      <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        {user.username.slice(0, 2).toUpperCase()}
      </Avatar>
    </ListItemAvatar>
    <ListItemText
      primary={
        <Typography variant="body1" fontWeight={500}>
          {user.username}
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({user.role})
          </Typography>
        </Typography>
      }
      secondary={
        <Typography variant="body2" color="text.secondary" noWrap>
          {user.email}
        </Typography>
      }
    />
  </ListItemButton>
</ListItem>

              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Chat List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {roomsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : roomsError ? (
          <Typography color="error">{roomsError}</Typography>
        ) : rooms.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'text.secondary' }}>
            No conversations found
          </Box>
        ) : (
          <List disablePadding>
            {rooms.map(room => {
              const other = room.other ?? room.participants.find(p => p.id !== currentUserId);
              const label = other?.username || other?.email || `#${room.id}`;
              const last = room.last_message;
              const snippet = last?.text.length > 30 ? last.text.slice(0, 30) + '…' : last?.text || 'No messages yet';
              const time = last ? fmtTime(last.timestamp) : '';
              const unread = room.unread_count || 0;

              return (
                <React.Fragment key={room.id}>
                  <ListItem disablePadding>
                    <ListItemButton onClick={() => handleSelectRoom(room)} sx={{
                      px: 2,
                      py: 1.5,
                      '&:hover': { bgcolor: 'action.hover' },
                      transition: '0.3s'
                    }}>
                      <ListItemAvatar>
                        <Badge
                          badgeContent={unread}
                          color="primary"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        >
                          <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                            {label.slice(0, 2).toUpperCase()}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>

                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" fontWeight={500}>
                              {label}
                            </Typography>
                            {time && (
                              <Typography variant="caption" color="text.secondary">
                                {time}
                              </Typography>
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                              sx={{ pr: 2, fontWeight: unread > 0 ? 600 : 400 }}
                            >
                              {snippet}
                            </Typography>
                            {unread > 0 && (
                              <FiberManualRecord sx={{ fontSize: '0.5rem', color: 'primary.main' }} />
                            )}
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                  <Divider variant="inset" sx={{ mx: 0 }} />
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default ChatRoomList;
