import React, { useState } from "react";
import "./ChatWithAI.css"; // Make sure to add any styling

const ChatWithAI = () => {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/chatAI/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      console.error("Error:", error);
      setResponse("❌ Error occurred.");
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  return (
    <div className="chat-container">
      <h2>💬 AI Chat Assistant</h2>

      <div className="chat-box">
        {response && (
          <div className="msg ai">
            <strong>AI:</strong>
            <p>{response}</p>
          </div>
        )}
        {loading && <div className="msg ai"><p>Typing...</p></div>}
      </div>

      <div className="input-area">
        <input
          type="text"
          placeholder="Ask anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} disabled={loading}>Send</button>
      </div>
    </div>
  );
};

export default ChatWithAI;
