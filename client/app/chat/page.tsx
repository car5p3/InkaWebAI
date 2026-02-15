"use client";

import React, { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
}

interface ChatInstance {
  id: string;
  title?: string;
  messages?: Message[];
  updatedAt?: string;
  messageCount?: number;
}

export default function ChatPage() {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [instances, setInstances] = useState<ChatInstance[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [user, setUser] = useState<any>(null);

  const initialBotMessage: Message = {
    id: Date.now(),
    text: "Hello! I'm your AI assistant. How can I help you today?",
    sender: "bot",
  };

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  // INITIAL LOAD
  useEffect(() => {
    (async () => {
      setLoadingInstances(true);
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1000";
      try {
        // Auth check
        try {
          const meResp = await axios.get(`${apiBase}/api/auth/me`, { withCredentials: true });
          console.log("User authenticated:", meResp.data.user);
          setUser(meResp.data.user);
          setRequiresLogin(false);
        } catch (meErr: any) {
          console.log("Auth check failed:", meErr?.response?.status);
          if (meErr?.response?.status === 401) {
            setRequiresLogin(true);
            setMessages([initialBotMessage]);
            return;
          }
        }

        // Load chat instances
        await reloadInstances();
      } catch (err) {
        console.error("Failed to initialize chat:", err);
      } finally {
        setLoadingInstances(false);
      }
    })();
  }, []);

  const reloadInstances = async () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1000";
    try {
      console.log("Reloading instances...");
      const res = await axios.get(`${apiBase}/api/chat/instances`, { withCredentials: true });
      console.log("Instances loaded:", res.data?.instances?.length || 0);
      setInstances(res.data?.instances || []);
      // Auto-load first instance if none selected
      if (res.data?.instances?.length && !selectedInstanceId) {
        await loadInstance(res.data.instances[0].id);
      }
    } catch (err: any) {
      console.error("Failed to reload instances:", err?.response?.data || err);
    }
  };

  const loadInstance = async (id: string) => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1000";
    try {
      console.log("Loading instance:", id);
      const res = await axios.get(`${apiBase}/api/chat/instances/${id}`, { withCredentials: true });
      const inst = res.data?.instance;
      if (inst) {
        console.log("Instance loaded with", inst.messages?.length || 0, "messages");
        setMessages(inst.messages?.length ? inst.messages : [initialBotMessage]);
        setSelectedInstanceId(inst.id);
      }
    } catch (err: any) {
      console.error("Failed to load instance:", err?.response?.data || err);
    }
  };

  const createNewInstance = async () => {
    if (requiresLogin) {
      setMessages((prev) => [...prev, { id: Date.now(), text: "Please log in to create persistent chats.", sender: "bot" }]);
      return;
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1000";
    try {
      console.log("Creating new instance...");
      const res = await axios.post(`${apiBase}/api/chat/instances`, {}, { withCredentials: true });
      const instanceId = res.data?.instanceId;
      console.log("New instance created:", instanceId);
      if (instanceId) {
        setMessages([initialBotMessage]);
        setSelectedInstanceId(instanceId);
        await reloadInstances();
      }
    } catch (err: any) {
      console.error("Failed to create instance:", err?.response?.data || err);
    }
  };

  const deleteInstance = async (id: string) => {
    if (!confirm("Delete this chat? This cannot be undone.")) return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1000";
    try {
      console.log("Deleting instance:", id);
      await axios.delete(`${apiBase}/api/chat/instances/${id}`, { withCredentials: true });
      console.log("Instance deleted");
      await reloadInstances();
      if (selectedInstanceId === id) {
        setSelectedInstanceId(null);
        setMessages([initialBotMessage]);
      }
    } catch (err: any) {
      console.error("Failed to delete instance:", err?.response?.data || err);
    }
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (requiresLogin) {
      setMessages((prev) => [...prev, { id: Date.now(), text: "Please log in to use chat.", sender: "bot" }]);
      setInput("");
      return;
    }

    const newUserMsg: Message = { id: Date.now(), text: input.trim(), sender: "user" };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1000";
    
    console.log("Sending message...", {
      messageCount: updatedMessages.length,
      instanceId: selectedInstanceId
    });

    try {
      const res = await axios.post(
        `${apiBase}/api/chat`, 
        { messages: updatedMessages, instanceId: selectedInstanceId }, 
        { withCredentials: true }
      );
      
      console.log("Response received:", res.data);
      
      const botMsg: Message = { 
        id: Date.now() + 1, 
        text: res.data?.message || "No response.", 
        sender: "bot" 
      };
      setMessages((prev) => [...prev, botMsg]);
      
      if (res.data?.instanceId) {
        console.log("Updated instance ID:", res.data.instanceId);
        setSelectedInstanceId(res.data.instanceId);
      }
      
      await reloadInstances();
    } catch (err: any) {
      console.error("Chat API error:", err);
      console.error("Error response:", err?.response?.data);
      console.error("Error status:", err?.response?.status);
      
      const errorMessage = err?.response?.data?.error 
        || err?.message 
        || "Error sending message. Please try again.";
      
      setMessages((prev) => [
        ...prev, 
        { 
          id: Date.now() + 2, 
          text: `❌ ${errorMessage}`, 
          sender: "bot" 
        }
      ]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-72 border-r bg-white dark:bg-gray-800 flex flex-col">
        <div className="p-4 flex justify-between items-center border-b">
          <button 
            onClick={createNewInstance} 
            className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            disabled={requiresLogin}
          >
            New chat
          </button>
          <button 
            onClick={reloadInstances} 
            className="px-2 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {loadingInstances ? (
            <div className="text-sm text-gray-500 p-2">Loading chats...</div>
          ) : null}
          
          {requiresLogin ? (
            <div className="text-sm text-yellow-600 dark:text-yellow-400 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded m-2">
              Please log in to save chat history
            </div>
          ) : null}
          
          {instances.length ? (
            <ul>
              {instances.map((inst) => (
                <li key={inst.id} className="mb-1 flex justify-between items-center">
                  <button
                    className={`flex-1 text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      selectedInstanceId === inst.id ? "bg-gray-200 dark:bg-gray-600" : ""
                    }`}
                    onClick={() => loadInstance(inst.id)}
                  >
                    <div className="font-medium truncate">
                      {inst.title || `Chat • ${inst.messageCount || 0} msgs`}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-300">
                      {inst.updatedAt ? new Date(inst.updatedAt).toLocaleString() : ""}
                    </div>
                  </button>
                  <button 
                    onClick={() => deleteInstance(inst.id)} 
                    className="ml-2 text-xs text-red-600 hover:text-red-800 px-2 py-1"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          ) : !loadingInstances ? (
            <div className="text-sm text-gray-500 mt-2 p-2">No chats yet</div>
          ) : null}
        </div>
      </aside>

      {/* Main chat */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="flex flex-col gap-4 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`px-4 py-2 rounded-2xl max-w-[70%] shadow whitespace-pre-wrap ${
                    msg.sender === "user" 
                      ? "bg-indigo-600 text-white" 
                      : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="px-4 py-2 rounded-2xl max-w-[70%] shadow bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse">●</div>
                    <div className="animate-pulse delay-100">●</div>
                    <div className="animate-pulse delay-200">●</div>
                    <span className="ml-2">AI is typing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </main>

        {/* Composer */}
        <form onSubmit={handleSend} className="flex p-4 border-t bg-white dark:bg-gray-800">
          <input
            type="text"
            className="flex-1 rounded-full border px-4 py-2 focus:outline-none dark:bg-gray-700 dark:text-white"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={requiresLogin ? "Please log in to chat..." : "Type a message..."}
            disabled={isLoading || requiresLogin}
          />
          <button 
            type="submit" 
            className="ml-2 px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !input.trim() || requiresLogin}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}