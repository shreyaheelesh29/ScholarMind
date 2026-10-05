import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, clearSession, getSessionUser, saveSessionUser } from "../api";
import { applyTheme, getTheme } from "../theme";

const emptyProfile = { name: "", email: "", role: "", institution: "", bio: "", field: "", keywords: "", scholar: "", github: "", linkedin: "" };
const defaultNotifications = { papers: true, ideas: true, viva: false, newsletter: true, marketing: false };

export default function Settings() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("profile");
  const [profile, setProfile] = useState(emptyProfile);
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [theme, setTheme] = useState(getTheme);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let alive = true;
    apiFetch("/settings").then((settings) => {
      if (!alive) return;
      const user = getSessionUser() || {};
      setProfile({ ...emptyProfile, ...settings.profile, name: settings.profile?.name || user.name || "", email: settings.profile?.email || user.email || "", role: settings.profile?.role || user.role || "" });
      setNotifications({ ...defaultNotifications, ...settings.notifications });
      setTheme(settings.theme || "system");
      applyTheme(settings.theme || "system");
    }).catch((loadError) => { if (alive) setError(loadError.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true); setError(""); setMessage("");
    try {
      const result = await apiFetch("/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile: Object.fromEntries(Object.entries(profile).filter(([key]) => key !== "email" && key !== "role")) }) });
      setProfile((current) => ({ ...current, ...result.profile }));
      const user = getSessionUser();
      if (user) saveSessionUser({ ...user, name: result.profile.name });
      setMessage("Profile saved to your account.");
    } catch (saveError) { setError(saveError.message); }
    finally { setSaving(false); }
  };

  const updateNotification = async (key, checked) => {
    const next = { ...notifications, [key]: checked };
    setNotifications(next); setError(""); setMessage("");
    try {
      const result = await apiFetch("/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notifications: { [key]: checked } }) });
      setNotifications({ ...defaultNotifications, ...result.notifications });
      setMessage("Notification preference saved.");
    } catch (saveError) { setNotifications(notifications); setError(saveError.message); }
  };

  const updateTheme = async (nextTheme) => {
    const previous = theme;
    setTheme(nextTheme); applyTheme(nextTheme); setError(""); setMessage("");
    try {
      const result = await apiFetch("/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme: nextTheme }) });
      setTheme(result.theme); applyTheme(result.theme); setMessage("Theme preference saved.");
    } catch (saveError) { setTheme(previous); applyTheme(previous); setError(saveError.message); }
  };

  const updateProfileField = (key, value) => setProfile((current) => ({ ...current, [key]: value }));
  const tabs = [{ id: "profile", label: "Profile" }, { id: "notifications", label: "Notifications" }, { id: "appearance", label: "Appearance" }, { id: "account", label: "Account" }];
  const notificationOptions = [
    { key: "papers", title: "Paper activity", description: "Show paper uploads and processing activity in the notification menu." },
    { key: "ideas", title: "Research ideas", description: "Show when research idea materials are generated." },
    { key: "viva", title: "Viva practice", description: "Show when viva question sets are generated." },
    { key: "newsletter", title: "Product updates", description: "Preference for product update notices." },
    { key: "marketing", title: "Promotional messages", description: "Preference for promotional notices." },
  ];

  return <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
    <header><p className="text-sm font-medium text-primary-600">Account</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Profile &amp; Settings</h1><p className="mt-2 text-slate-500">These preferences are attached to your ScholarMind account.</p></header>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
    {loading ? <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading your account settings…</div> : <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
      <nav aria-label="Settings sections" className="h-fit rounded-2xl border border-slate-200 bg-white p-2">{tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`mb-1 w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${tab === item.id ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}>{item.label}</button>)}<button onClick={() => { clearSession(); navigate("/login"); }} className="mt-3 w-full rounded-xl border border-red-200 px-4 py-3 text-left text-sm font-semibold text-red-700 hover:bg-red-50">Sign out</button></nav>

      <main className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        {tab === "profile" && <form onSubmit={saveProfile} className="space-y-5">
          <div><h2 className="text-xl font-bold text-slate-900">Your profile</h2><p className="mt-1 text-sm text-slate-500">Update your research profile. Email and account role are read-only.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Full name<input required minLength={2} maxLength={120} value={profile.name} onChange={(e) => updateProfileField("name", e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5" /></label>
            <label className="text-sm font-medium text-slate-700">Email<input value={profile.email} readOnly className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-slate-500" /></label>
            <label className="text-sm font-medium text-slate-700">Role<input value={profile.role} readOnly className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 capitalize text-slate-500" /></label>
            <label className="text-sm font-medium text-slate-700">Institution<input maxLength={200} value={profile.institution} onChange={(e) => updateProfileField("institution", e.target.value)} placeholder="School, university, or organization" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5" /></label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Research field<input maxLength={120} value={profile.field} onChange={(e) => updateProfileField("field", e.target.value)} placeholder="e.g. Computer Science" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5" /></label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Research interests<input maxLength={500} value={profile.keywords} onChange={(e) => updateProfileField("keywords", e.target.value)} placeholder="Keywords separated by commas" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5" /></label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Short bio<textarea maxLength={1000} rows={4} value={profile.bio} onChange={(e) => updateProfileField("bio", e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5" /></label>
            {[["scholar", "Google Scholar URL"], ["github", "GitHub profile URL"], ["linkedin", "LinkedIn profile URL"]].map(([key, label]) => <label key={key} className="text-sm font-medium text-slate-700">{label}<input maxLength={500} type="url" value={profile[key]} onChange={(e) => updateProfileField(key, e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5" /></label>)}
          </div>
          <button disabled={saving} className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? "Saving…" : "Save profile"}</button>
        </form>}

        {tab === "notifications" && <section className="space-y-4"><div><h2 className="text-xl font-bold text-slate-900">Notifications</h2><p className="mt-1 text-sm text-slate-500">In-app alerts are built from your activity history and refresh every few seconds.</p></div>{notificationOptions.map((item) => <label key={item.key} className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-100 p-4 hover:bg-slate-50"><span><span className="block text-sm font-semibold text-slate-800">{item.title}</span><span className="mt-1 block text-xs text-slate-500">{item.description}</span></span><input type="checkbox" checked={Boolean(notifications[item.key])} onChange={(e) => updateNotification(item.key, e.target.checked)} className="mt-1 h-4 w-4 accent-indigo-600" /></label>)}</section>}

        {tab === "appearance" && <section className="space-y-4"><div><h2 className="text-xl font-bold text-slate-900">Appearance</h2><p className="mt-1 text-sm text-slate-500">Theme changes apply immediately and sync to your account.</p></div><div className="grid gap-3 sm:grid-cols-3">{[["light", "Light", "☀️"], ["dark", "Dark", "🌙"], ["system", "Use device setting", "💻"]].map(([value, label, icon]) => <button key={value} aria-pressed={theme === value} onClick={() => updateTheme(value)} className={`rounded-xl border-2 p-4 text-left transition ${theme === value ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-200"}`}><span className="text-2xl">{icon}</span><span className="mt-2 block text-sm font-semibold text-slate-800">{label}</span></button>)}</div></section>}

        {tab === "account" && <section className="space-y-4"><div><h2 className="text-xl font-bold text-slate-900">Account information</h2><p className="mt-1 text-sm text-slate-500">Account details from your ScholarMind login.</p></div><dl className="divide-y divide-slate-100 rounded-xl border border-slate-100 px-4">{[["Name", profile.name], ["Email", profile.email], ["Role", profile.role], ["Member since", profile.created_at ? new Date(profile.created_at).toLocaleString() : "—"], ["Last login", profile.last_login_at ? new Date(profile.last_login_at).toLocaleString() : "Not available"]].map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-2 py-3"><dt className="text-sm text-slate-500">{label}</dt><dd className="text-sm font-medium text-slate-800">{value || "—"}</dd></div>)}</dl></section>}
      </main>
    </div>}
  </div>;
}
