import React, { useState } from 'react';

function Chat() {
    const [message, setMessage] = useState('');
    const [conversation, setConversation] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = async () => {
        setIsLoading(true);
        const response = await fetch('http://localhost:8000/api/chat/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
        });

        const data = await response.json();
        setConversation([...conversation, { role: 'user', content: message }, { role: 'bot', content: data.reply }]);
        setMessage('');
        setIsLoading(false);
    };

    return (
        <div>
            <div style={{ height: '300px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px' }}>
                {conversation.map((msg, index) => (
                    <div key={index} style={{ marginBottom: '10px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                        <strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {msg.content}
                    </div>
                ))}
                {isLoading && <div>Loading...</div>}
            </div>
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                style={{ width: '80%', padding: '10px' }}
                disabled={isLoading}
            />
            <button onClick={sendMessage} style={{ padding: '10px' }} disabled={isLoading}>
                Send
            </button>
        </div>
    );
}

export default Chat;