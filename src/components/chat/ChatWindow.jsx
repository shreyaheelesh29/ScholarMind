import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../api";
import Citation from "./Citation";

const renderContentWithCitations = (content, citations) => {
  if (!citations || citations.length === 0) {
    return content.split("**").map((seg, i) => i % 2 === 1 ? <strong key={i} className="font-bold">{seg}</strong> : seg);
  }

  const segments = [];
  const placeholderPattern = /\[(\d+)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = placeholderPattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const plainText = content.slice(lastIndex, match.index);
      plainText.split("**").forEach((seg, i, arr) => {
        if (seg) segments.push(i % 2 === 1 ? <strong key={`t-${lastIndex}-${i}`} className="font-bold">{seg}</strong> : seg);
      });
    }

    const citationNumber = parseInt(match[1]);
    const citation = citations.find((c) => c.number === citationNumber);
    if (citation) {
      segments.push(
        <Citation
          key={`c-${lastIndex}`}
          number={citation.number}
          paperId={citation.paper_id}
          paperTitle={citation.paperTitle}
          authors={citation.authors}
          page={citation.page}
          section={citation.section}
          year={citation.year}
          excerpt={citation.excerpt}
        />
      );
    } else {
      segments.push(
        <span key={`c-${lastIndex}`} className="inline-flex items-center justify-center min-w-[22px] h-[18px] px-1.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[11px] align-top leading-none border border-slate-200">
          [{citationNumber}]
        </span>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex);
    remaining.split("**").forEach((seg, i) => {
      if (seg) segments.push(i % 2 === 1 ? <strong key={`r-${lastIndex}-${i}`} className="font-bold">{seg}</strong> : seg);
    });
  }

  return segments.length > 0 ? segments : content;
};

export default function ChatWindow() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [availablePapers, setAvailablePapers] = useState([]);
  const [selectedPaperId, setSelectedPaperId] = useState("");
  const selectedPaper = availablePapers.find((paper) => paper.id === selectedPaperId)?.filename || "All your papers";
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [historyError, setHistoryError] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState("ScholarMind Pro");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const modelDropdownRef = useRef(null);

  const refreshChats = async () => {
    try { const result = await apiFetch("/chats"); setSessions(result.chats); }
    catch (error) { setHistoryError(error.message); }
  };

  useEffect(() => {
    apiFetch("/papers").then(({ papers }) => setAvailablePapers(papers)).catch((error) => setHistoryError(error.message));
    refreshChats();
  }, []);

  const openChat = async (session) => {
    try {
      const { chat } = await apiFetch(`/chats/${session.id}`);
      setActiveSession(chat.id);
      setSelectedPaperId(chat.paper_id || "");
      setMessages(chat.messages.map((message) => ({
        id: `m-${message.id}`, role: message.role, content: message.content,
        time: new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        citations: message.citations, sources: message.sources,
      })));
    } catch (error) { setHistoryError(error.message); }
  };

  const models = [
    { id: "sm-pro", name: "ScholarMind Pro", description: "Best for deep research analysis", badge: "Recommended" },
    { id: "sm-lite", name: "ScholarMind Lite", description: "Fast responses, concise answers", badge: "Fast" },
    { id: "sm-vision", name: "ScholarMind Vision", description: "PDF figure & diagram analysis", badge: "New" },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      content: input,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((current) => [...current, userMsg]);
    setInput("");
    setIsTyping(true);
    try {
      const result = await apiFetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg.content, session_id: activeSession, paper_ids: selectedPaperId ? [selectedPaperId] : null }),
      });
      setActiveSession(result.session_id);
      const aiMsg = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: result.answer,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        citations: result.citations,
        sources: result.sources,
      };
      setMessages((m) => [...m, aiMsg]);
      refreshChats();
    } catch (error) {
      setMessages((m) => [...m, {
        id: `e-${Date.now()}`, role: "assistant",
        content: `I couldn't reach the ScholarMind backend: ${error.message}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setActiveSession(null);
    setHistoryError("");
  };

  const activeTitle = sessions.find((session) => session.id === activeSession)?.title || "New Research Chat";

  return (
    <div className="h-full flex gap-0 animate-fade-in">
      <div className="w-72 rounded-l-xl border border-slate-200 border-r-0 bg-white flex flex-col overflow-hidden flex-shrink-0">
        <div className="p-4 border-b border-slate-200">
          <button
            onClick={handleNewChat}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold text-sm shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Chat
          </button>
        </div>

        <div className="px-3 py-2 border-b border-slate-100">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 px-1">
            Context Paper
          </label>
          <select
            value={selectedPaperId}
            onChange={(e) => setSelectedPaperId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20 text-slate-800"
          >
            <option value="">All your papers</option>
            {availablePapers.map((paper) => <option key={paper.id} value={paper.id}>{paper.filename}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 py-2">
            Recent Chats
          </p>
          {historyError && <p className="px-2 py-1 text-xs text-red-600">{historyError}</p>}
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => openChat(s)}
              className={`w-full p-3 rounded-lg text-left transition group ${
                activeSession === s.id
                  ? "bg-primary-50 border border-primary-100"
                  : "hover:bg-slate-50 border border-transparent"
              }`}
            >
              <p
                className={`text-sm font-semibold truncate ${
                  activeSession === s.id ? "text-primary-700" : "text-slate-800"
                }`}
              >
                {s.title}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{s.preview || "No messages yet"}</p>
              <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                <span className="truncate max-w-[60%]">📄 {availablePapers.find((paper) => paper.id === s.paper_id)?.filename || "All papers"}</span>
                <span>{new Date(s.updated_at).toLocaleDateString()}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 rounded-r-xl border border-slate-200 bg-white flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-slate-900 truncate">{activeTitle}</h2>
            <p className="text-xs text-slate-500 truncate">
              Chatting about:{" "}
              <span className="font-medium text-primary-600">{selectedPaper}</span>
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
              title="Share"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>
            <button
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 animate-fade-in ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-primary-500/20">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
              )}
              <div className={`max-w-2xl ${msg.role === "user" ? "order-1" : ""}`}>
                <div
                  className={`rounded-2xl px-5 py-4 ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/20 rounded-tr-md"
                      : "bg-white border border-slate-200 rounded-tl-md shadow-sm"
                  }`}
                >
                  <div
                    className={`text-sm whitespace-pre-line leading-relaxed ${
                      msg.role === "user" ? "" : "text-slate-800"
                    }`}
                  >
                    {renderContentWithCitations(msg.content, msg.citations)}
                  </div>
                </div>

                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
                      📚 Cited Sources ({msg.citations.length})
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {msg.citations.map((c) => (
                        <div
                          key={c.number}
                          className="flex items-start gap-2 p-3 rounded-lg border border-slate-200 bg-white hover:border-primary-300 hover:shadow-sm transition text-left group"
                        >
                          <span className="w-6 h-6 rounded-md bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0 group-hover:bg-primary-500 group-hover:text-white transition">
                            {c.number}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-800 truncate">{c.paperTitle}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              p.{c.page} • {c.section}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {msg.sources.map((s, i) => (
                      <Link
                        key={i}
                        to="/viewer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-primary-50 hover:text-primary-700 text-[11px] font-medium text-slate-600 transition"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        {s.label}
                      </Link>
                    ))}
                  </div>
                )}

                <div
                  className={`flex items-center gap-2 mt-2 ${
                    msg.role === "user" ? "justify-end" : ""
                  }`}
                >
                  <span className="text-[10px] text-slate-400">{msg.time}</span>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                      <button className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </button>
                      <button className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                      <button className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {msg.role === "user" && (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  JD
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-primary-500/20">
                <svg
                  className="w-5 h-5 text-white animate-pulse-soft"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md px-5 py-4 shadow-sm">
                <div className="flex gap-1">
                  <span
                    className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-slate-200 p-4 bg-white">
          <div className="flex items-end gap-3">
            <button
              className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50 transition flex-shrink-0"
              title="Attach file"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            </button>

            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder="Ask anything about the paper... (Shift+Enter for newline)"
                className="w-full px-4 py-3 pr-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20 outline-none transition resize-none text-sm text-slate-900 placeholder:text-slate-400 max-h-40"
              />
            </div>

            <div className="relative" ref={modelDropdownRef}>
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="h-12 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-primary-200 hover:bg-primary-50 transition flex items-center gap-2 flex-shrink-0"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">{selectedModel}</p>
                  <p className="text-[10px] text-slate-400">Select model</p>
                </div>
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showModelDropdown && (
                <div className="absolute bottom-full right-0 mb-2 w-72 rounded-xl bg-white border border-slate-200 shadow-xl shadow-slate-200/60 overflow-hidden animate-fade-in z-40">
                  <div className="p-3 border-b border-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      AI Model Selection
                    </p>
                  </div>
                  <div className="p-2 space-y-1">
                    {models.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedModel(m.name);
                          setShowModelDropdown(false);
                        }}
                        className={`w-full p-3 rounded-lg text-left transition ${
                          selectedModel === m.name
                            ? "bg-primary-50 border border-primary-100"
                            : "hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-sm font-semibold ${
                              selectedModel === m.name ? "text-primary-700" : "text-slate-800"
                            }`}
                          >
                            {m.name}
                          </p>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              m.badge === "Recommended"
                                ? "bg-accent-100 text-accent-700"
                                : m.badge === "New"
                                ? "bg-success-100 text-success-600"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {m.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{m.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
