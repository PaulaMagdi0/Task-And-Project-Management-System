import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSelector } from "react-redux"; // <-- to access authSlice state
import AOS from "aos";
import "./Chatting.css";
import useCustomScripts from "../../Hooks/useCustomScripts";
import debounce from "lodash/debounce";

// Custom hook for WebSocket connection
const useWebSocket = (url, onMessage) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    if (!url) return;
    let ws;
    const connectWebSocket = () => {
      ws = new WebSocket(url);
      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        console.log("WebSocket connected");
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };
      ws.onclose = (event) => {
        setIsConnected(false);
        console.log(
          `WebSocket disconnected. Code: ${event.code}, Reason: ${event.reason}`
        );
        if (event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        }
      };
      ws.onerror = (err) => {
        setError(err);
        console.error("WebSocket error:", err);
      };
      setSocket(ws);
    };
    connectWebSocket();
    return () => {
      if (ws) ws.close(1000, "Component unmounted");
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
    };
  }, [url, onMessage]);

  const sendMessage = useCallback(
    (data) => {
      if (socket && isConnected) {
        socket.send(JSON.stringify(data));
        return true;
      }
      return false;
    },
    [socket, isConnected]
  );

  return { socket, isConnected, error, sendMessage };
};

// Virtualized message list for large chat histories
const VirtualizedMessages = ({ messages, currentUser, formatTime }) => {
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const updateVisibleRange = () => {
      if (!messageContainerRef.current) return;
      const container = messageContainerRef.current;
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const estimatedMessageHeight = 80;
      const bufferCount = 10;
      const start = Math.max(
        0,
        Math.floor(scrollTop / estimatedMessageHeight) - bufferCount
      );
      const end = Math.min(
        messages.length,
        Math.ceil((scrollTop + containerHeight) / estimatedMessageHeight) +
          bufferCount
      );
      setVisibleRange({ start, end });
    };
    const container = messageContainerRef.current;
    if (container) {
      container.addEventListener("scroll", updateVisibleRange);
      updateVisibleRange();
    }
    return () => {
      if (container)
        container.removeEventListener("scroll", updateVisibleRange);
    };
  }, [messages.length]);

  useEffect(() => {
    if (messages.length > 0) {
      setVisibleRange({
        start: Math.max(0, messages.length - 50),
        end: messages.length,
      });
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  if (!messages || messages.length === 0) {
    return (
      <div className="no-messages">
        No messages yet. Start the conversation!
      </div>
    );
  }

  const topSpacerHeight = visibleRange.start * 80;
  const bottomSpacerHeight = (messages.length - visibleRange.end) * 80;

  return (
    <div ref={messageContainerRef} className="chat-messages">
      {topSpacerHeight > 0 && (
        <div style={{ height: `${topSpacerHeight}px` }} />
      )}
      {messages
        .slice(visibleRange.start, visibleRange.end)
        .map((msg, index) => {
          const isMe = currentUser && msg.sender.id === currentUser.id;
          const actualIndex = visibleRange.start + index;
          return (
            <div
              key={`${actualIndex}-${msg.timestamp}`}
              className={`chat-message ${isMe ? "right" : "left"}`}
              data-aos="fade-up"
              data-aos-once="true"
            >
              <div
                className={`message-bubble ${isMe ? "message-sent" : "message-received"}`}
              >
                <div className="message-content">{msg.content}</div>
                <div className="message-time">{formatTime(msg.timestamp)}</div>
              </div>
            </div>
          );
        })}
      {bottomSpacerHeight > 0 && (
        <div style={{ height: `${bottomSpacerHeight}px` }} />
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

const Chatting = ({ initialRoomId = null }) => {
  useCustomScripts();

  // Retrieve token and decoded user info from Redux (authSlice)
  const auth = useSelector((state) => state.auth);
  const { token, user_id, username, role, userType, branch } = auth;

  // Build the current user object from the token data
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    if (token) {
      setCurrentUser({
        id: user_id,
        username,
        role,
        userType,
        branch,
      });
    }
  }, [token, user_id, username, role, userType, branch]);

  const [search, setSearch] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState(initialRoomId);
  const [chatRooms, setChatRooms] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef(null);
  const fallbackAvatar = "/assets/avatar-fallback.svg";

  // Build the WebSocket URL including the token in the Authorization (query param approach)
  const wsUrl = useMemo(() => {
    if (!selectedRoomId || !currentUser) return null;
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProtocol}//${window.location.host}/ws/chat/${selectedRoomId}/?token=${token}`;
  }, [selectedRoomId, currentUser, token]);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback(
    (data) => {
      if (data.error) {
        console.error("WebSocket error:", data.error);
        return;
      }
      setChatRooms((prevRooms) =>
        prevRooms.map((room) => {
          if (room.id === selectedRoomId) {
            const messageExists = room.messages.some(
              (msg) =>
                msg.content === data.message &&
                msg.timestamp === data.timestamp &&
                msg.sender.username === data.sender_username
            );
            if (messageExists) return room;
            return {
              ...room,
              messages: [
                ...room.messages,
                {
                  content: data.message,
                  sender: {
                    id: data.sender_id,
                    username: data.sender_username,
                  },
                  timestamp: data.timestamp,
                },
              ],
            };
          }
          return room;
        })
      );
    },
    [selectedRoomId]
  );
  const { sendMessage, isConnected } = useWebSocket(
    wsUrl,
    handleWebSocketMessage
  );

  // API helper with Authorization header
  const apiRequest = useCallback(
    async (url, options = {}) => {
      try {
        const csrftoken = document.cookie
          .split("; ")
          .find((row) => row.startsWith("csrftoken="))
          ?.split("=")[1];
        const headers = {
          "Content-Type": "application/json",
          ...(csrftoken && { "X-CSRFToken": csrftoken }),
          ...(token && { Authorization: `Bearer ${token}` }), // Always use "Authorization" header
          ...options.headers,
        };
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
          throw new Error(
            `API request failed: ${response.status} ${response.statusText}`
          );
        }
        return await response.json();
      } catch (error) {
        console.error(`Error in API request to ${url}:`, error);
        throw error;
      }
    },
    [token]
  );

  // Fetch chat rooms from the API (you may substitute dummy data here if needed)
  useEffect(() => {
    const fetchChatRooms = async () => {
      setIsLoading(true);
      try {
        const data = await apiRequest("/api/chat/my_chats/");
        setChatRooms(data);
      } catch (error) {
        console.error("Failed to load chat rooms, using dummy data:", error);
        // Optionally, set dummy data so you can test the UI
        const dummyChatRooms = [
          {
            id: 101,
            instructor: "Instructor Alice",
            student: "Student Bob",
            messages: [
              {
                sender: { id: 2, username: "Student Bob" },
                content: "Hello, I am Bob!",
                timestamp: new Date().toISOString(),
              },
            ],
          },
          {
            id: 202,
            instructor: "Instructor Carol",
            student: "Student Dave",
            messages: [
              {
                sender: { id: 4, username: "Student Dave" },
                content: "Hey, Carol. Testing dummy data!",
                timestamp: new Date().toISOString(),
              },
              {
                sender: { id: 3, username: "Instructor Carol" },
                content: "Hi Dave, welcome to our mock chat!",
                timestamp: new Date().toISOString(),
              },
            ],
          },
        ];
        setChatRooms(dummyChatRooms);
      } finally {
        setIsLoading(false);
      }
    };
    if (currentUser) fetchChatRooms();
  }, [currentUser, apiRequest]);

  // Focus input when room changes
  useEffect(() => {
    if (selectedRoomId) {
      inputRef.current?.focus();
    }
  }, [selectedRoomId]);

  // Initialize AOS animations
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      offset: 50,
      easing: "ease-out",
    });
  }, []);

  // Handle responsive adjustments
  const handleResize = debounce(
    () => setIsMobile(window.innerWidth <= 768),
    250
  );
  useEffect(() => {
    window.addEventListener("resize", handleResize);
    setIsMobile(window.innerWidth <= 768);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  // Filter chat rooms based on search query
  const filteredRooms = useMemo(() => {
    if (!chatRooms.length) return [];
    if (!search.trim()) return chatRooms;
    return chatRooms.filter((room) => {
      const otherUser = currentUser?.is_student
        ? room.instructor
        : room.student;
      return otherUser.toLowerCase().includes(search.toLowerCase());
    });
  }, [search, chatRooms, currentUser]);

  // Determine the currently selected chat room
  const selectedRoom = useMemo(
    () => chatRooms.find((room) => room.id === selectedRoomId),
    [chatRooms, selectedRoomId]
  );

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !selectedRoom) {
      setIsTyping(false);
      return;
    }
    const messageSent = sendMessage({
      sender: currentUser?.id,
      content: newMessage,
      room: selectedRoomId,
    });
    if (messageSent) {
      setNewMessage("");
      setIsTyping(false);
      inputRef.current?.focus();
    } else {
      console.error("Failed to send message: WebSocket not connected");
    }
  }, [newMessage, selectedRoom, currentUser, selectedRoomId, sendMessage]);

  const toggleChatView = useCallback(() => setSelectedRoomId(null), []);
  const debouncedTypingUpdate = useCallback((value) => {
    debounce(() => setIsTyping(value.trim() !== ""), 300)();
  }, []);
  const handleMessageChange = useCallback(
    (e) => {
      const value = e.target.value;
      setNewMessage(value);
      debouncedTypingUpdate(value);
    },
    [debouncedTypingUpdate]
  );
  const handleRoomClick = useCallback(
    (roomId) => setSelectedRoomId(roomId),
    []
  );
  const getOtherUserName = useCallback(
    (room) => {
      if (!currentUser || !room) return "";
      return currentUser.is_student ? room.instructor : room.student;
    },
    [currentUser]
  );
  const getLastMessage = useCallback((room) => {
    if (!room.messages || room.messages.length === 0) return "No messages yet";
    return room.messages[room.messages.length - 1].content;
  }, []);
  const formatTime = useCallback((timestamp) => {
    if (!timestamp) return "";
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${messageDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
    return (
      messageDate.toLocaleDateString([], { month: "short", day: "numeric" }) +
      ", " +
      messageDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (document.activeElement === inputRef.current) handleSendMessage();
      }
      if (e.key === "Escape" && isMobile && selectedRoomId) toggleChatView();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSendMessage, toggleChatView, isMobile, selectedRoomId]);

  // if (isLoading) {
  //   return (
  //     <div className="loading-screen">
  //       <div className="loader">Loading...</div>
  //     </div>
  //   );
  // }
  // if (loadingError) {
  //   return (
  //     <div className="error-alert">
  //       <h4>Error!</h4>
  //       <p>{loadingError}</p>
  //       <button onClick={() => window.location.reload()}>Reload Page</button>
  //     </div>
  //   );
  // }

  return (
    <div className={`chat-container ${isMobile ? "mobile" : ""}`}>
      {wsUrl && !isConnected && selectedRoomId && (
        <div className="connection-status">Reconnecting...</div>
      )}
      <aside
        className={`chat-sidebar ${selectedRoomId && isMobile ? "hidden" : ""}`}
      >
        <div className="search-box">
          <input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search chats"
          />
        </div>
        <div className="rooms-list">
          {filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => handleRoomClick(room.id)}
                className={`room-item ${selectedRoomId === room.id ? "active" : ""}`}
                tabIndex="0"
                role="button"
                aria-pressed={selectedRoomId === room.id}
              >
                <img
                  src={fallbackAvatar}
                  alt={getOtherUserName(room)}
                  className="room-avatar"
                  loading="lazy"
                />
                <div className="room-details">
                  <div className="room-title">{getOtherUserName(room)}</div>
                  <div className="room-last-message">
                    {getLastMessage(room)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-rooms">
              {search ? "No matching chats found" : "No chat rooms available"}
            </div>
          )}
        </div>
      </aside>
      <section
        className={`chat-window ${selectedRoomId || !isMobile ? "" : "hidden mt-4rem"}`}
      >
        {selectedRoom ? (
          <>
            {isMobile && (
              <header
                className="chat-header mobile-header"
                onClick={toggleChatView}
                role="button"
                aria-label="Back to chat list"
              >
                <span className="back-icon">&#8592;</span>
                <span>Back to Chats</span>
              </header>
            )}
            <header className="chat-header">
              <img
                src={fallbackAvatar}
                alt={getOtherUserName(selectedRoom)}
                className="room-avatar"
                loading="lazy"
              />
              <div>
                <h2 className="room-title">{getOtherUserName(selectedRoom)}</h2>
                <small>{isConnected ? "Online" : "Connecting..."}</small>
              </div>
            </header>
            <VirtualizedMessages
              messages={selectedRoom.messages || []}
              currentUser={currentUser}
              formatTime={formatTime}
            />
            <footer className="chat-input-area">
              <div className="input-group">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={handleMessageChange}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && handleSendMessage()
                  }
                  disabled={!isConnected}
                  aria-label="Message input"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!isConnected || !newMessage.trim()}
                  aria-label="Send message"
                >
                  &#x27A4;
                </button>
              </div>
              <small className="input-hint">
                {isConnected
                  ? "Press Enter to send, Shift+Enter for new line"
                  : "Connecting to chat service..."}
              </small>
            </footer>
          </>
        ) : (
          <div className="no-chat-selected">
            <h4>Select a conversation</h4>
            <p>Choose a chat from the list to start messaging</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Chatting;
