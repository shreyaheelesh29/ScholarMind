import { useEffect, useState } from "react";
import { apiFetch } from "../api";

const stamp = (value) => value ? new Date(value).toLocaleString() : "Never";

export default function Admin() {
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { apiFetch("/admin/overview").then(setOverview).catch((e) => setError(e.message)); }, []);
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700"><h1 className="text-xl font-bold">Admin records unavailable</h1><p className="mt-2">{error}</p></div>;
  if (!overview) return <p className="text-slate-500">Loading admin records…</p>;
  return <div className="space-y-7">
    <header><p className="text-sm font-medium text-indigo-600">Admin only</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Accounts & Login Activity</h1><p className="mt-2 text-slate-500">Account metadata and sign-in attempts. Passwords are never shown.</p></header>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b p-5"><h2 className="text-xl font-semibold">Accounts ({overview.users.length})</h2></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{["Name", "Email", "Role", "Joined", "Last login", "Papers", "Saved items"].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody>{overview.users.map((user) => <tr className="border-t" key={user.id}><td className="px-4 py-3 font-medium">{user.name}</td><td className="px-4 py-3">{user.email}</td><td className="px-4 py-3">{user.role}</td><td className="px-4 py-3">{stamp(user.created_at)}</td><td className="px-4 py-3">{stamp(user.last_login_at)}</td><td className="px-4 py-3">{user.paper_count}</td><td className="px-4 py-3">{user.artifact_count}</td></tr>)}</tbody></table></div></section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b p-5"><h2 className="text-xl font-semibold">Recent login attempts ({overview.login_activity.length})</h2></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{["Email", "Result", "IP address", "Browser", "Time"].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody>{overview.login_activity.map((event) => <tr className="border-t" key={event.id}><td className="px-4 py-3">{event.email}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${event.succeeded ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{event.succeeded ? "Success" : "Failed"}</span></td><td className="px-4 py-3">{event.ip_address || "—"}</td><td className="max-w-64 truncate px-4 py-3" title={event.user_agent}>{event.user_agent || "—"}</td><td className="px-4 py-3">{stamp(event.created_at)}</td></tr>)}</tbody></table></div></section>
  </div>;
}
