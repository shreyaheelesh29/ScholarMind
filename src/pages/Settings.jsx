import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearSession } from "../api";

export default function Settings() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    institution: "",
    bio: "",
    field: "Natural Language Processing",
    keywords: "",
    scholar: "",
    github: "",
    linkedin: "",
  });
  const [notify, setNotify] = useState({ papers: true, ideas: true, viva: false, newsletter: true, marketing: false });
  const [apiKey, setApiKey] = useState("sk-live-••••••••••••••••••••••••4u8a");
  const [plan] = useState("Pro");

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm font-medium text-primary-600">Account</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">⚙️ Settings & Profile</h1>
          <p className="mt-2 text-slate-500">Manage your profile, preferences, API keys, and subscription.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={save} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold text-sm shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition flex items-center gap-1.5">
            {saved ? (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Saved!</>
            ) : (
              <>💾 Save Changes</>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-4 min-h-0">
        <div className="w-56 rounded-2xl border border-slate-200 bg-white p-2 flex-shrink-0 h-fit">
          {[
            { id: "profile", l: "👤 Profile", d: "Edit personal info" },
            { id: "research", l: "🔬 Research", d: "Fields & interests" },
            { id: "account", l: "🔐 Account", d: "Security & password" },
            { id: "notifications", l: "🔔 Notifications", d: "Email preferences" },
            { id: "billing", l: "💳 Billing & Plan", d: "Subscription" },
            { id: "api", l: "🔑 API Keys", d: "Integrations" },
            { id: "appearance", l: "🎨 Appearance", d: "Theme preferences" },
          ].map(nav => (
            <button key={nav.id} onClick={() => setTab(nav.id)} className={`w-full p-3 rounded-xl text-left transition ${tab === nav.id ? "bg-primary-50 shadow-sm ring-2 ring-primary-200" : "hover:bg-slate-50"}`}>
              <p className={`font-bold text-sm ${tab === nav.id ? "text-primary-700" : "text-slate-800"}`}>{nav.l}</p>
              <p className="text-xs text-slate-500 mt-0.5">{nav.d}</p>
            </button>
          ))}
          <div className="mt-3 p-2">
            <button onClick={() => { clearSession(); navigate("/login"); }} className="w-full p-3 rounded-xl border-2 border-error-100 text-error-600 font-bold text-sm hover:bg-error-50 transition flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sign Out
            </button>
          </div>
        </div>

        <div className="flex-1 rounded-2xl border border-slate-200 bg-white overflow-hidden">
          {tab === "profile" && (
            <div>
              <div className="h-48 bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500 relative">
                <div className="absolute -bottom-14 left-8">
                  <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary-400 to-accent-400 border-4 border-white shadow-xl flex items-center justify-center text-white text-4xl font-black shadow-slate-300">
                    JD
                  </div>
                </div>
                <button className="absolute bottom-4 right-4 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white text-xs font-bold transition flex items-center gap-1">
                  📷 Change Cover
                </button>
              </div>
              <div className="pt-20 p-7 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2 flex items-center justify-end gap-2">
                  <button className="px-4 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600">📷 Avatar</button>
                </div>
                {[
                  { l: "Full Name", k: "name", p: "e.g. Jane Doe" },
                  { l: "Email Address", k: "email", p: "you@example.com" },
                  { l: "Role", k: "role", p: "Student / Researcher / Professor" },
                  { l: "Institution", k: "institution", p: "University / Company" },
                ].map(f => (
                  <div key={f.k}>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">{f.l}</label>
                    <input type="text" value={form[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })} placeholder={f.p} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20 outline-none transition text-slate-900" />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Short Bio</label>
                  <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={4} placeholder="Tell the community about your research..." className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20 outline-none transition resize-none text-slate-900" />
                </div>
              </div>
            </div>
          )}

          {tab === "research" && (
            <div className="p-7 space-y-5">
              <h3 className="font-black text-xl text-slate-900">🔬 Research Profile</h3>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Primary Research Field</label>
                  <select value={form.field} onChange={e => setForm({ ...form, field: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20 outline-none transition text-slate-900">
                    <option>Natural Language Processing</option>
                    <option>Computer Vision</option>
                    <option>Machine Learning</option>
                    <option>Reinforcement Learning</option>
                    <option>Systems & ML Infra</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Keywords (comma-separated)</label>
                  <input type="text" value={form.keywords} onChange={e => setForm({ ...form, keywords: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20 outline-none transition text-slate-900" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">Your Research Links</label>
                <div className="space-y-3">
                  {[
                    { i: "🎓", k: "scholar", l: "Google Scholar URL" },
                    { i: "🐙", k: "github", l: "GitHub Profile" },
                    { i: "💼", k: "linkedin", l: "LinkedIn Profile" },
                  ].map(s => (
                    <div key={s.k} className="flex items-center gap-3">
                      <span className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-lg flex-shrink-0">{s.i}</span>
                      <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-slate-400 text-sm">🔗</span>
                        </div>
                        <input type="text" value={form[s.k]} onChange={e => setForm({ ...form, [s.k]: e.target.value })} className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20 outline-none transition text-sm" />
                      </div>
                      <label className="text-xs font-bold text-slate-500 w-28 text-right">{s.l}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "account" && (
            <div className="p-7 space-y-6">
              <h3 className="font-black text-xl text-slate-900">🔐 Account Security</h3>
              <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-4">
                {[
                  { l: "Current Password", p: "••••••••••••••" },
                  { l: "New Password", p: "At least 12 characters" },
                  { l: "Confirm New Password", p: "Re-enter new password" },
                ].map((p, i) => (
                  <div key={i}>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">{p.l}</label>
                    <input type="password" placeholder={p.p} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20 outline-none transition text-slate-900" />
                  </div>
                ))}
                <button onClick={save} className="px-5 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 transition">Update Password</button>
              </div>
              <div className="grid grid-cols-2 gap-5">
                {[
                  { l: "Two-Factor Auth", s: "Enabled", c: "success" },
                  { l: "Login Sessions", s: "2 Active", c: "primary" },
                  { l: "Recovery Email", s: "Verified", c: "success" },
                  { l: "Last Password Change", s: "47 days ago", c: "warning" },
                ].map((i, k) => (
                  <div key={k} className="p-5 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-slate-800">{i.l}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${i.c === "success" ? "bg-success-50 text-success-700" : i.c === "primary" ? "bg-primary-50 text-primary-700" : "bg-warning-50 text-warning-700"}`}>{i.s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "notifications" && (
            <div className="p-7 space-y-3">
              <h3 className="font-black text-xl text-slate-900 mb-1">🔔 Email & Notifications</h3>
              <p className="text-sm text-slate-500 mb-6">Choose what ScholarMind notifies you about.</p>
              {[
                { k: "papers", l: "📄 Paper Processing Complete", d: "Get an email when your uploaded papers are analyzed and ready." },
                { k: "ideas", l: "💡 New Research Ideas Ready", d: "Weekly digest of new AI-generated ideas based on your library." },
                { k: "viva", l: "🎤 Viva/Defense Reminders", d: "Calendar-based review session reminders and practice prompts." },
                { k: "newsletter", l: "📬 Product Newsletter", d: "Monthly updates about new features, research tips, blog posts." },
                { k: "marketing", l: "📣 Promotional Offers", d: "Discounts, conference bundles, partnership announcements." },
              ].map(n => (
                <div key={n.k} className="p-4 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 transition flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-800">{n.l}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{n.d}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                    <input type="checkbox" checked={notify[n.k]} onChange={e => setNotify({ ...notify, [n.k]: e.target.checked })} className="sr-only peer" />
                    <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-md peer-checked:bg-gradient-to-r peer-checked:from-primary-500 peer-checked:to-accent-500" />
                  </label>
                </div>
              ))}
            </div>
          )}

          {tab === "billing" && (
            <div className="p-7 space-y-6">
              <div className="rounded-2xl bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 p-7 text-white relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
                <div className="absolute -bottom-16 -left-8 w-56 h-56 rounded-full bg-white/10" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase backdrop-blur-sm">Current Plan</span>
                      <h3 className="text-4xl font-black mt-3">ScholarMind {plan}</h3>
                      <p className="text-white/80 mt-1">All features, unlimited everything, priority support.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black uppercase opacity-75">Monthly</p>
                      <p className="text-5xl font-black">$29</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm font-bold transition">Manage Subscription</button>
                    <button className="px-5 py-2.5 rounded-xl bg-white text-primary-700 font-bold hover:bg-white/90 transition">Upgrade →</button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-black text-lg text-slate-900 mb-3">📝 Recent Invoices</h3>
                <div className="rounded-2xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        {["Date", "Description", "Amount", "Status", ""].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Aug 1, 2024", "ScholarMind Pro (Monthly)", "$29.00", "Paid"],
                        ["Jul 1, 2024", "ScholarMind Pro (Monthly)", "$29.00", "Paid"],
                        ["Jun 1, 2024", "ScholarMind Pro (Monthly)", "$29.00", "Paid"],
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition">
                          {row.map((c, j) => (
                            <td key={j} className="px-5 py-3.5 text-slate-700 font-medium">
                              {j === 3 ? <span className="px-2.5 py-1 rounded-full bg-success-50 text-success-700 text-xs font-black">{c}</span> : c}
                            </td>
                          ))}
                          <td className="px-5 py-3.5 text-right">
                            <button className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition">PDF ↓</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === "api" && (
            <div className="p-7 space-y-5">
              <h3 className="font-black text-xl text-slate-900">🔑 API Keys & Integrations</h3>
              <p className="text-sm text-slate-500 -mt-3">Use this key to access ScholarMind APIs from your own scripts and apps.</p>
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-primary-600">Primary API Key</p>
                    <p className="text-sm text-slate-500 mt-1">Created: Jan 15, 2024 • Never expires</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-success-50 text-success-700 text-xs font-black uppercase">Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 rounded-xl bg-white border-2 border-slate-200 font-mono text-sm tracking-wide text-slate-800">{apiKey}</div>
                  <button onClick={() => navigator.clipboard?.writeText(apiKey)} className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-primary-50 hover:text-primary-700 font-bold text-sm transition flex items-center gap-1">
                    📋 Copy
                  </button>
                  <button className="px-4 py-3 rounded-xl bg-error-50 hover:bg-error-100 text-error-700 font-bold text-sm transition flex items-center gap-1">
                    🔄 Rotate
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { l: "Monthly Usage", v: "84%", s: "84K / 100K tokens", c: "from-warning-400 to-warning-600" },
                  { l: "Quota Limit", v: "∞", s: "Unlimited PPT exports", c: "from-success-400 to-success-600" },
                  { l: "Requests Today", v: "1,247", s: "Last 24h", c: "from-primary-400 to-primary-600" },
                ].map((s, i) => (
                  <div key={i} className="p-5 rounded-2xl border border-slate-100 bg-white hover:shadow-md transition">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">{s.l}</p>
                    <p className={`mt-2 text-3xl font-black bg-gradient-to-r ${s.c} bg-clip-text text-transparent`}>{s.v}</p>
                    <p className="mt-1 text-xs text-slate-500">{s.s}</p>
                  </div>
                ))}
              </div>
              <button className="px-5 py-2.5 rounded-xl border-2 border-dashed border-primary-300 text-primary-700 font-bold hover:bg-primary-50 transition w-full">
                ➕ Create New API Key
              </button>
            </div>
          )}

          {tab === "appearance" && (
            <div className="p-7 space-y-5">
              <h3 className="font-black text-xl text-slate-900">🎨 Appearance Preferences</h3>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Theme Mode</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: "light", l: "☀️ Light", c: "bg-white border-slate-800" },
                    { id: "dark", l: "🌙 Dark", c: "bg-slate-900 border-primary-500" },
                    { id: "system", l: "💻 System", c: "bg-gradient-to-br from-white to-slate-900 border-slate-300" },
                  ].map(t => (
                    <button key={t.id} className={`p-4 rounded-2xl border-2 hover:border-primary-500 transition flex flex-col items-center gap-2 ${t.c} ${t.id === "light" ? "ring-2 ring-primary-500" : ""}`}>
                      <div className={`w-14 h-10 rounded-lg ${t.id === "dark" ? "bg-slate-700" : t.id === "system" ? "bg-gradient-to-r from-white to-slate-800 border" : "bg-slate-100 border"}`} />
                      <span className={`font-black text-sm ${t.id === "dark" ? "text-white" : "text-slate-800"}`}>{t.l}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Accent Color</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    ["Indigo", "from-primary-500 to-primary-700", true],
                    ["Purple", "from-violet-500 to-violet-700", false],
                    ["Pink", "from-pink-500 to-pink-700", false],
                    ["Emerald", "from-emerald-500 to-emerald-700", false],
                    ["Amber", "from-amber-500 to-amber-700", false],
                    ["Rose", "from-rose-500 to-rose-700", false],
                  ].map(([l, g, active]) => (
                    <button key={String(l)} className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${String(g)} shadow-lg hover:scale-105 transition relative ${active ? "ring-4 ring-offset-2 ring-primary-400" : ""}`}>
                      {Boolean(active) && <span className="absolute inset-0 flex items-center justify-center text-white text-2xl">✓</span>}
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-700 whitespace-nowrap">{l}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-12 space-y-3">
                {[
                  { l: "Reduce Motion (animations)", d: "Minimize parallax, slide-in, and hover animations.", t: false },
                  { l: "High Density Mode", d: "Reduce whitespace to show more content per screen.", t: true },
                  { l: "Colorblind-friendly palette", d: "Use patterns in addition to color coding.", t: false },
                ].map((o, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 transition flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-800">{o.l}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{o.d}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                      <input type="checkbox" defaultChecked={o.t} className="sr-only peer" />
                      <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-md peer-checked:bg-gradient-to-r peer-checked:from-primary-500 peer-checked:to-accent-500" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
