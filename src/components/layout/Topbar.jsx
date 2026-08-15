import { Link } from "react-router-dom";
import { useState } from "react";

export default function Topbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);

  const notifications = [
    { id: 1, type: "success", title: "Paper analyzed", desc: "Deep Learning Survey is ready", time: "2m ago" },
    { id: 2, type: "info", title: "New research idea", desc: "3 new ideas generated", time: "15m ago" },
    { id: 3, type: "warning", title: "PPT export done", desc: "Your presentation is ready", time: "1h ago" },
  ];

  return (
    <header className="fixed top-0 left-64 right-0 z-30 h-16 bg-white/80 backdrop-blur-lg border-b border-slate-200 flex items-center px-6 gap-4">
      <div className="flex-1 max-w-xl relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search papers, chat history, research ideas..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 border border-transparent focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20 outline-none transition text-sm text-slate-900 placeholder:text-slate-400"
        />
        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
          <kbd className="px-2 py-1 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded">⌘K</kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>

        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error-500 rounded-full ring-2 ring-white"></span>
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 overflow-hidden animate-fade-in">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Notifications</h3>
                <button className="text-xs font-medium text-primary-600 hover:text-primary-700">Mark all read</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 cursor-pointer transition">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        n.type === "success" ? "bg-success-100 text-success-600" :
                        n.type === "info" ? "bg-primary-100 text-primary-600" :
                        "bg-warning-100 text-warning-600"
                      }`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{n.desc}</p>
                        <p className="text-xs text-slate-400 mt-1">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
                <button className="w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700">View all notifications</button>
              </div>
            </div>
          )}
        </div>

        <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        <div className="w-px h-6 bg-slate-200 mx-1"></div>

        <Link to="/settings" className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-100 transition">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-slate-900 leading-tight">Profile</p>
            <p className="text-xs text-slate-500">Settings</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
