import React, { useState, useRef, useEffect } from "react";
import axiosClient from "./axiousclient.js";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

// Icons for the UI
const SendIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="white" />
  </svg>
);

const ResetIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const Chatbot = () => {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [typing, setTyping] = useState({ id: null, index: 0 });
  const chatEndRef = useRef(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, typing]);

  // Typing effect for bot messages
  useEffect(() => {
    if (typing.id === null) return;

    const msg = history.find((m) => m.id === typing.id);
    if (!msg || typing.index >= msg.fullText.length) {
      setTyping({ id: null, index: 0 });
      return;
    }

    const interval = setInterval(() => {
      setHistory((prev) =>
        prev.map((m) =>
          m.id === typing.id
            ? { ...m, text: m.fullText.slice(0, typing.index + 1) }
            : m
        )
      );
      setTyping((t) => ({ ...t, index: t.index + 1 }));
    }, 10);

    return () => clearInterval(interval);
  }, [typing, history]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { type: "user", text: input, id: Date.now() };
    setHistory((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await axiosClient.post("/", {
        message: input,
      });
      const reply = res.data.reply || "Sorry, I couldn't get a response.";

      const botMessageId = Date.now() + 1;
      setHistory((prev) => [
        ...prev,
        {
          type: "bot",
          text: "",
          fullText: reply,
          id: botMessageId,
        },
      ]);
      setTyping({ id: botMessageId, index: 0 });
    } catch (err) {
      console.error(err);
      setError("⚠️ Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setError("");
    try {
      await axiosClient.post("/reset");
      setHistory([]);
      setTyping({ id: null, index: 0 });
    } catch (err) {
      console.error("Reset failed:", err);
      setError("Server reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Component to render message content with syntax highlighting and copy functionality
  const MessageContent = ({ content }) => {
    const [copied, setCopied] = useState(false);
    const parts = content.split(/(```[\s\S]*?```)/g);

    const handleCopy = (code) => {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
      });
    };

    return parts.map((part, i) => {
      const match = /```(\w+)?\n([\s\S]+)```/.exec(part);
      if (match) {
        const language = match[1] || "plaintext";
        const code = match[2];
        return (
          <div key={i} className="my-2 rounded-lg overflow-hidden bg-gray-900 relative">
            <div className="flex justify-between items-center text-white p-2 text-xs rounded-t-lg bg-gray-700">
              <span>{language}</span>
              <button
                onClick={() => handleCopy(code)}
                className="text-xs font-sans bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-2 rounded"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <SyntaxHighlighter
              language={language}
              style={vscDarkPlus}
              customStyle={{ margin: 0, borderRadius: "0 0 0.5rem 0.5rem" }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        );
      }
      return (
        <span key={i} className="whitespace-pre-wrap">
          {part}
        </span>
      );
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-4xl flex flex-col h-[90vh] bg-gray-800 shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="bg-gray-700 p-4 rounded-t-2xl flex items-center justify-between border-b border-gray-600">
          <h1 className="text-2xl font-bold text-gray-100">DSA Chatbot (Gemini)</h1>
          <button
            onClick={handleReset}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            title="Reset Chat"
          >
            <ResetIcon />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-800">
          <div className="flex flex-col space-y-5">
            {history.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-3 ${msg.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-xl px-5 py-3 rounded-2xl shadow-lg ${msg.type === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-gray-700 text-gray-200 rounded-bl-none"}`}>
                  <MessageContent content={msg.text} />
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl bg-gray-700 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></span>
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-300"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-700 bg-gray-800 rounded-b-2xl">
          {error && <div className="text-red-400 font-medium text-center mb-2">{error}</div>}
          <div className="flex items-center bg-gray-700 rounded-xl p-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none focus:outline-none text-gray-200 placeholder-gray-400 resize-none px-2"
              rows={1}
              placeholder="Ask your DSA question here…"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-blue-600 p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;