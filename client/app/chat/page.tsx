"use client";

import React, { useState, useRef, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

const ChatPage: React.FC = () => {
  const initialBotMessage: Message = {
    id: Date.now(),
    text: "Hello! I'm InkaWebAI — which service would you like help with? (e.g., Web development, Mobile app, E-commerce)",
    sender: 'bot',
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [instances, setInstances] = useState<Array<any>>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [user, setUser] = useState<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };



  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    (async () => {
      try {
        setLoadingInstances(true);
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1000';

        // First check authentication status
        try {
          const meResp = await axios.get(`${apiBase}/api/auth/me`, { withCredentials: true });
          setRequiresLogin(false);
          setUser(meResp.data.user);
        } catch (meErr: any) {
          if (meErr?.response?.status === 401) {
            setRequiresLogin(true);
            setMessages([initialBotMessage]);
            setInstances([]);
            setSelectedInstanceId(null);
            return;
          }
          // other errors fall through to instances fetch attempt
          console.warn('Auth check failed:', meErr);
        }

        // Authenticated: fetch instances
        const res = await axios.get(`${apiBase}/api/chat/instances`, { withCredentials: true });
        const list = res?.data?.instances || [];
        setInstances(list);

        if (list.length > 0) {
          const firstId = list[0].id;
          await loadInstance(firstId);
        } else {
          await createNewInstance();
        }
      } catch (err) {
        console.error('Failed to load chat instances:', err);
      } finally {
        setLoadingInstances(false);
      }
    })();
  }, []);

  const loadInstance = async (id: string) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1000';
      const res = await axios.get(`${apiBase}/api/chat/instances/${id}`, { withCredentials: true });
      const inst = res?.data?.instance;
      if (inst) {
        const mapped = (inst.messages || []).map((m: any, idx: number) => ({ id: idx + Date.now(), text: m.text, sender: m.sender }));
        setMessages(mapped.length ? mapped : [initialBotMessage]);
        setSelectedInstanceId(inst._id || inst.id || id);
      }
    } catch (err) {
      console.error('Failed to load instance:', err);
    }
  };

  const createNewInstance = async () => {
    if (requiresLogin) {
      setMessages((prev) => [...prev, { id: Date.now(), text: 'Please log in to create persistent chats.', sender: 'bot' }]);
      return;
    }
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1000';
      const res = await axios.post(`${apiBase}/api/chat/instances`, {}, { withCredentials: true });
      const instanceId = res?.data?.instanceId;
      if (instanceId) {
        setMessages([initialBotMessage]);
        setSelectedInstanceId(instanceId);
        const listRes = await axios.get(`${apiBase}/api/chat/instances`, { withCredentials: true });
        setInstances(listRes?.data?.instances || []);
      }
    } catch (err) {
      console.error('Failed to create instance:', err);
    }
  };

  const reloadInstances = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1000';
      const res = await axios.get(`${apiBase}/api/chat/instances`, { withCredentials: true });
      setInstances(res?.data?.instances || []);
    } catch (err) {
      console.error('Failed to reload instances:', err);
    }
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (requiresLogin) {
      setMessages((prev) => [...prev, { id: Date.now(), text: 'Please log in to use the chat and save conversations.', sender: 'bot' }]);
      setInput('');
      return;
    }
    const userMsg: Message = {
      id: Date.now(),
      text: input.trim(),
      sender: 'user',
    };

    // add user message locally
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1000';
      const payload = { messages: [...messages, userMsg], instanceId: selectedInstanceId };

      const res = await axios.post(`${apiBase}/api/chat`, payload, { withCredentials: true });

      const aiText = res?.data?.message || 'Sorry, no response from assistant.';

      const botMsg: Message = {
        id: Date.now() + 1,
        text: aiText,
        sender: 'bot',
      };

      setMessages((prev) => [...prev, botMsg]);
      if (res?.data?.instanceId) setSelectedInstanceId(res.data.instanceId);
      scrollToBottom();

      // refresh instances list so updatedAt/message count are current
      try { await reloadInstances(); } catch (e) { /* ignore */ }

      if (res?.data?.shouldNavigate && res.data.navigateUrl) {
        // optional server-driven navigation
        router.push(res.data.navigateUrl);
      }
    } catch (err: any) {
      console.error('Chat API error:', err);
      const serverMessage = err?.response?.data?.error || err?.message || 'There was an error contacting the chat service. Try again later.';
      const errMsg: Message = {
        id: Date.now() + 2,
        text: serverMessage,
        sender: 'bot',
      };
      setMessages((prev) => [...prev, errMsg]);
      scrollToBottom();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      <div className="mx-auto w-full max-w-4xl flex flex-col h-full shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">AI</div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">InkaWebAI</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Minimal chat • AI assistant</p>
            </div>
          </div>
          {user?.isPremium && (
            <span className="ml-4 inline-block px-2 py-0.5 text-xs font-medium bg-yellow-200 text-yellow-800 rounded">Premium</span>
          )}
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500 dark:text-gray-400">online</div>
            <a href="/profile" className="text-sm text-indigo-600 hover:underline">Profile</a>
            <button
              onClick={async () => {
                if (logoutLoading) return;
                try {
                  setLogoutLoading(true);
                  await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1000'}/api/auth/logout`,
                    {},
                    { withCredentials: true }
                  );
                  router.push('/login');
                } catch (err) {
                  console.error('Logout error:', err);
                  setLogoutLoading(false);
                }
              }}
              className="ml-2 rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200"
            >
              {logoutLoading ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-72 bg-white dark:bg-gray-900 border-r overflow-y-auto">
            <div className="p-4 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={createNewInstance}
                  className="rounded-md bg-indigo-600 text-white px-3 py-1 text-sm hover:bg-indigo-700"
                >
                  New chat
                </button>
                <button onClick={reloadInstances} className="rounded-md border px-2 py-1 text-sm">Refresh</button>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Your chats</div>
              {requiresLogin && (
                <div className="mt-2 text-xs text-red-500">You must log in to create and persist chats.</div>
              )}
            </div>

            <div className="p-2">
              {loadingInstances ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : instances.length ? (
                <ul className="space-y-1">
                  {instances.map((inst) => (
                    <li key={inst.id} className="flex items-center justify-between">
                      <button
                        onClick={async () => { await loadInstance(inst.id); }}
                        className={`flex-1 text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${selectedInstanceId === inst.id ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                      >
                        <div className="text-sm font-medium">{inst.title || `Chat • ${inst.messageCount || 0} msgs`}</div>
                        <div className="text-xs text-gray-500">{new Date(inst.updatedAt).toLocaleString()}</div>
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm('Delete this chat? This cannot be undone.')) return;
                          try {
                            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1000';
                            await axios.delete(`${apiBase}/api/chat/instances/${inst.id}`, { withCredentials: true });
                            await reloadInstances();
                            // if deleted was selected, clear messages
                            if (selectedInstanceId === inst.id) {
                              setSelectedInstanceId(null);
                              setMessages([initialBotMessage]);
                            }
                          } catch (err) {
                            console.error('Failed to delete instance:', err);
                          }
                        }}
                        className="ml-2 text-xs text-red-600 hover:text-red-800 px-2 py-1"
                        title="Delete chat"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-500">No chats yet — start a new one.</div>
              )}
            </div>
          </aside>

          {/* Main chat column */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <main className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="flex flex-col gap-4 max-w-3xl mx-auto">
            {messages.length === 0 && (
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">Start the conversation — ask me anything.</div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-2xl px-4 py-2 max-w-[70%] break-words shadow-sm ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-2 max-w-[70%] break-words shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">AI is typing...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
            </main>

            {/* Composer */}
            <div className="px-6 py-4 border-t bg-white dark:bg-gray-800">
          <form onSubmit={handleSend} className="flex items-center gap-3 max-w-4xl mx-auto">
            <input
              type="text"
              className="flex-1 rounded-full border border-gray-200 bg-transparent px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:focus:ring-indigo-600"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message... (Shift+Enter for newline)"
            />

            <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7H5" />
              </svg>
              Send
            </button>
          </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;