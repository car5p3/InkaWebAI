"use client";

import React, { useState, useRef, FormEvent } from 'react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now(),
      text: input.trim(),
      sender: 'user',
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // simulate bot response or call API
    const botMsg: Message = {
      id: Date.now() + 1,
      text: 'This is a placeholder response. Integrate your chat API here.',
      sender: 'bot',
    };
    setTimeout(() => {
      setMessages((prev) => [...prev, botMsg]);
      scrollToBottom();
    }, 500);
  };

  return (
    <div className="flex flex-col h-screen max-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <header className="text-xl font-semibold mb-4">Chat</header>
      <main className="flex-1 overflow-y-auto mb-4 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-xs px-4 py-2 rounded-lg break-words ${
              msg.sender === 'user'
                ? 'bg-blue-500 text-white self-end'
                : 'bg-gray-200 text-gray-800 self-start'
            }`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      <form onSubmit={handleSend} className="flex">
        <input
          type="text"
          className="flex-1 border rounded-l-lg px-3 py-2 focus:outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatPage;