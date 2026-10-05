import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, getSessionUser } from "../../api";
import { applyTheme, getTheme } from "../../theme";

function timeLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return date.toLocaleDateString();
}

export default function Topbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [theme, setTheme] = useState(getTheme);
  const [user, setUser] = useState(getSessionUser);
  const [noticeError, setNoticeError] = useState("");

  useEffect(() => {
    let alive = true;
    const refresh = () => apiFetch("/notifications").then((data) => {
      if (alive) { setNotifications(data.notifications || []); setUnread(data.unread_count || 0); setNoticeError(""); }
    }).catch((error) => { if (alive) setNoticeError(error.message); });
    refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") refresh(); }, 15000);
    const syncUser = () => setUser(getSessionUser());
    window.addEventListener("scholarmind-user-updated", syncUser);
    apiFetch("/settings").then((settings) => { if (alive) { setTheme(settings.theme || "system"); applyTheme(settings.theme || "system"); } }).catch(() => {});
    return () => { alive = false; window.clearInterval(timer); window.removeEventListener("scholarmind-user-updated", syncUser); };
  }, []);

  const toggleTheme = async () => {
    const darkNow = document.documentElement.classList.contains("dark");
    const nextTheme = darkNow ? "light" : "dark";
    setTheme(nextTheme); applyTheme(nextTheme);
    try {
      const result = await apiFetch("/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme: nextTheme }) });
      setTheme(result.theme); applyTheme(result.theme);
    } catch (error) {
      setNoticeError(`Theme was applied for this session but not saved: ${error.message}`);
    }
  };

  const markAllRead = async () => {
    try {
      await apiFetch("/notifications/read", { method: "POST" });
      setNotifications((items) => items.map((item) => ({ ...item, read: true })));
      setUnread(0);
    } catch (error) { setNoticeError(error.message); }
  };

  const initials = (user?.name || user?.email || "U").trim().slice(0, 1).toUpperCase();

  return <header className="fixed top-0 left-64 right-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-6 backdrop-blur-lg">
    <div className="relative max-w-xl flex-1">
      <svg className="pointer-events-none absolute inset-y-0 left-3 my-auto h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search papers, chat history, research ideas…" className="w-full rounded-lg border border-transparent bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:bg-white" />
    </div>

    <div className="flex items-center gap-2">
      <button type="button" onClick={toggleTheme} aria-label={`Switch to ${document.documentElement.classList.contains("dark") ? "light" : "dark"} mode`} title={`Theme: ${theme}. Click to toggle.`} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
        {document.documentElement.classList.contains("dark") ? <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" strokeWidth="2"/><path strokeLinecap="round" strokeWidth="2" d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg> : <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9 9 0 0012 21a9 9 0 008.354-5.646z" /></svg>}
      </button>

      <div className="relative">
        <button type="button" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-expanded={notifOpen} onClick={() => setNotifOpen((open) => !open)} className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          {unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
        </button>
        {notifOpen && <section aria-label="Notifications" className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><h2 className="font-semibold text-slate-900">Notifications</h2><p className="text-xs text-slate-500">Recent account activity</p></div><button type="button" onClick={markAllRead} disabled={!unread} className="text-xs font-semibold text-indigo-600 disabled:opacity-40">Mark all read</button></div>
          {noticeError && <p role="alert" className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">{noticeError}</p>}
          <div className="max-h-80 overflow-y-auto">{notifications.length ? notifications.map((item) => <article key={item.id} className={`border-b border-slate-50 px-4 py-3 ${item.read ? "" : "bg-indigo-50/70"}`}><div className="flex items-start gap-3"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.read ? "bg-slate-300" : "bg-indigo-600"}`} /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-900">{item.title}</p><p className="mt-0.5 break-words text-xs text-slate-500">{item.description}</p><time className="mt-1 block text-[11px] text-slate-400" dateTime={item.created_at}>{timeLabel(item.created_at)}</time></div></div></article>) : <p className="p-6 text-center text-sm text-slate-500">No account activity yet.</p>}</div>
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-3"><Link to="/my-data" onClick={() => setNotifOpen(false)} className="block text-center text-sm font-medium text-indigo-600 hover:text-indigo-700">View activity history</Link></div>
        </section>}
      </div>

      <Link to="/settings" className="flex items-center gap-3 rounded-lg py-1 pl-2 pr-1 transition hover:bg-slate-100">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 text-sm font-bold text-white shadow-sm">{initials}</span>
        <span className="hidden lg:block"><span className="block max-w-36 truncate text-sm font-semibold leading-tight text-slate-900">{user?.name || "Profile"}</span><span className="block text-xs text-slate-500">Profile &amp; Settings</span></span>
      </Link>
    </div>
  </header>;
}
