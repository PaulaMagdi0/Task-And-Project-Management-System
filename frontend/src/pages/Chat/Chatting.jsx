import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import AOS from "aos";
import "./Chatting.css"; // Import your CSS file for styling
import useCustomScripts from "../../Hooks/useCustomScripts";
import debounce from "lodash/debounce"; // Import debounce from lodash

const Chatting = ({ users: initialUsers }) => {
  useCustomScripts();

  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [users, setUsers] = useState(initialUsers);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false); // State for detecting mobile view
  const fallbackAvatar =
    "https://www.aurubis.com/.resources/aurubis-light-module/webresources/assets/img/image-avatar-avatar-fallback.svg";

  // Memoized filtered users to avoid unnecessary re-renders
  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        user.name.toLowerCase().includes(search.toLowerCase())
      ),
    [search, users]
  );

  const selectedUser = users.find((u) => u.id === selectedUserId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedUser?.messages]);

  useEffect(() => {
    AOS.init({
      duration: 1000, // Animation duration
    });
  }, []);

  // Debounced resize handler for better performance
  const handleResize = useCallback(
    debounce(() => {
      setIsMobile(window.innerWidth <= 768); // Adjust breakpoint as needed
    }, 200),
    []
  );

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    handleResize(); // Set initial state based on current window width

    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !selectedUser) {
      setIsTyping(false);
      return;
    }

    const updatedUsers = users.map((user) => {
      if (user.id === selectedUser.id) {
        return {
          ...user,
          messages: [
            ...user.messages,
            {
              text: newMessage,
              timestamp: new Date().toISOString(),
              sender: "me",
            },
          ],
        };
      }
      return user;
    });

    setUsers(updatedUsers);
    setNewMessage("");
    setIsTyping(false);

    // Smooth scroll to the top after sending a message
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [newMessage, selectedUser, users]);

  useEffect(() => {
    if (selectedUserId) {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [selectedUserId]);

  const toggleChatView = () => {
    setSelectedUserId(null);
  };

  // Handle typing status
  useEffect(() => {
    if (newMessage.trim() === "") {
      setIsTyping(false); // No text means stop typing indicator
    } else {
      setIsTyping(true); // Text entered means show typing indicator
    }
  }, [newMessage]);

  // Scroll to top when a user is selected
  const handleUserClick = (userId) => {
    setSelectedUserId(userId);
    window.scrollTo(0, 0); // Scroll to top when a user is clicked
  };

  return (
    <div
      className={`d-flex bg-light ${
        isMobile ? "mt-4rem" : "mt-6rem"
      } border rounded-4 shadow-lg`}
      style={{ height: "90vh" }}
    >
      {/* Sidebar (People List) */}
      <div
        className={`bg-white border-end d-flex flex-column p-3 overflow-auto ${
          selectedUserId ? "d-none d-md-block" : "d-block"
        }`}
        style={{
          width: isMobile ? "100%" : "300px",
          boxShadow: "2px 0 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div className="p-3 border-bottom">
          <input
            type="text"
            placeholder="Search people..."
            className="w-100 p-2 border rounded-3 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex-grow-1 overflow-auto">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => handleUserClick(user.id)} // Trigger scroll to top and set selected user
              className={`p-3 d-flex align-items-center cursor-pointer hover-bg-light rounded-3 mb-2 transition-all duration-200 ${
                selectedUserId === user.id ? "bg-light" : ""
              }`}
              style={{ minHeight: "80px" }}
              data-aos="fade-up"
            >
              <img
                src={user.image || fallbackAvatar}
                alt={user.name}
                className="rounded-circle me-3"
                style={{ width: "50px", height: "50px", objectFit: "cover" }}
              />
              <div className="w-100">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-semibold text-truncate">{user.name}</span>
                </div>
                <div className="text-muted small text-truncate">
                  {user.messages.length > 0 &&
                    user.messages[user.messages.length - 1].text}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div
        className={`flex-grow-1 d-flex flex-column bg-white ${
          selectedUserId ? "" : "d-none"
        }`}
      >
        {selectedUser ? (
          <>
            {/* Back Arrow - Only visible on mobile */}
            <div
              className="border-bottom p-3 d-flex align-items-center cursor-pointer d-md-none"
              onClick={toggleChatView}
              style={{ fontSize: "20px" }}
              data-aos="fade-down"
            >
              <span className="me-2">
                <i className="bi bi-arrow-left-circle-fill"></i>
              </span>
              <span>Back to Chats</span>
            </div>

            {/* Chat Header */}
            <div
              className="border-bottom p-3 d-flex align-items-center"
              data-aos="fade-down"
            >
              <img
                src={selectedUser.image || "path/to/fallback-avatar.png"}
                alt={selectedUser.name}
                className="rounded-circle me-3"
                style={{ width: "50px", height: "50px", objectFit: "cover" }}
              />
              <h2 className="h5 mb-0">{selectedUser.name}</h2>
            </div>

            {/* Messages */}
            <div className="flex-grow-1 overflow-auto p-3 d-flex flex-column gap-2">
              {selectedUser.messages.map((msg, index) => (
                <div
                  key={index}
                  className={`d-flex ${
                    msg.sender === "me"
                      ? "chat-message-right"
                      : "chat-message-left"
                  }`}
                  data-aos="fade-up"
                >
                  <div
                    className={`p-3 rounded-4 shadow-sm ${
                      msg.sender === "me"
                        ? "bg-primary text-white"
                        : "bg-light text-dark"
                    }`}
                    style={{
                      maxWidth: "100%",
                      borderRadius: "20px",
                      boxShadow:
                        msg.sender === "me"
                          ? "0 4px 8px rgba(0, 123, 255, 0.3)"
                          : "none",
                    }}
                  >
                    <div className="mb-1">{msg.text}</div>
                    <div
                      className={`text-small ${
                        msg.sender === "me" ? "text-white-50" : "text-muted"
                      } text-end`}
                      style={{ fontSize: "0.75rem" }}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="text-muted small ms-1">
                  <span className="typing-indicator mx-3">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-top p-3">
              <div className="d-flex gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-grow-1 border-0 p-2 rounded-4 bg-light shadow-sm"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <button
                  className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "40px", height: "40px" }}
                  onClick={handleSendMessage}
                  aria-label="Send message"
                >
                  ↑
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="d-flex justify-content-center align-items-center h-100">
            <h4>Select a user to chat</h4>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chatting;

// ✅ Dummy user data
export const dummyUsers = [
  {
    id: 1,
    name: "Alice Johnson",
    image: "https://randomuser.me/api/portraits/women/1.jpg",
    messages: [
      {
        text: "Hey there! 👋",
        timestamp: "2025-04-03T12:00:00Z",
        sender: "Alice",
      },
      {
        text: "Are you free later today?",
        timestamp: "2025-04-03T12:05:00Z",
        sender: "Alice",
      },
    ],
  },
  {
    id: 2,
    name: "Bob Smith",
    image: "https://randomuser.me/api/portraits/men/2.jpg",
    messages: [
      {
        text: "What's up?",
        timestamp: "2025-04-02T14:20:00Z",
        sender: "Bob",
      },
    ],
  },
  {
    id: 3,
    name: "Carol Lee",
    image: "https://randomuser.me/api/portraits/women/3.jpg",
    messages: [
      {
        text: "Good morning!",
        timestamp: "2025-04-01T09:15:00Z",
        sender: "Carol",
      },
    ],
  },
];
