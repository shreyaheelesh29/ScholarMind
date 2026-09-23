import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api";

const date = (value) => value ? new Date(value).toLocaleString() : "—";

export default function MyData() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const refresh = () => apiFetch("/me/data").then(setData).catch((e) => setError(e.message));
  useEffect(() => { refresh(); }, []);

  const remove = async (id) => {
    try { await apiFetch(`/artifacts/${id}`, { method: "DELETE" }); refresh(); }
    catch (e) { setError(e.message); }
  };
  const downloadPaper = async (id, filename) => {
    try {
      const response = await fetch(`/api/papers/${id}/file`, { headers: { Authorization: `Bearer ${localStorage.getItem("scholarmind_token") || ""}` } });
      if (!response.ok) throw new Error("Could not download this PDF");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
    } catch (e) { setError(e.message); }
  };

  if (error && !data) return <p className="rounded-xl bg-red-50 p-5 text-red-700">{error}</p>;
  if (!data) return <p className="text-slate-500">Loading your library and history…</p>;

  return <div className="space-y-7">
    <header><p className="text-sm font-medium text-indigo-600">Your workspace</p><h1 className="mt-1 text-3xl font-bold text-slate-900">My Data & History</h1><p className="mt-2 text-slate-500">Your uploaded papers, saved study materials, and recent activity.</p></header>
    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold">My papers ({data.papers.length})</h2>
      {data.papers.length ? <ul className="mt-4 divide-y divide-slate-100">{data.papers.map((paper) => <li key={paper.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium text-slate-800">{paper.filename}</p><p className="text-sm text-slate-500">{paper.page_count} pages · {paper.chunk_count} indexed passages · {date(paper.created_at)}</p></div><button className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700" onClick={() => downloadPaper(paper.id, paper.filename)}>Download PDF</button></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No uploaded papers yet. Use Upload Papers to add one.</p>}
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold">Chat history ({data.chats.length})</h2>
      {data.chats.length ? <ul className="mt-4 divide-y divide-slate-100">{data.chats.map((chat) => <li key={chat.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium text-slate-800">{chat.title}</p><p className="text-sm text-slate-500">Last updated {date(chat.updated_at)}</p></div><Link to="/chat" className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">Open chats</Link></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">Your saved conversations will appear here.</p>}
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold">Saved work ({data.artifacts.length})</h2>
      {data.artifacts.length ? <div className="mt-4 grid gap-3">{data.artifacts.map((item) => <details key={item.id} className="rounded-xl border border-slate-100 p-4"><summary className="cursor-pointer font-semibold text-slate-800">{item.title}<span className="ml-2 rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">{item.kind}</span><span className="ml-2 text-xs font-normal text-slate-400">{date(item.created_at)}</span></summary><pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-xs text-slate-700">{JSON.stringify(item.payload, null, 2)}</pre><button className="mt-3 text-sm font-semibold text-red-600" onClick={() => remove(item.id)}>Delete saved item</button></details>)}</div> : <p className="mt-3 text-sm text-slate-500">Chats and generated learning materials will appear here.</p>}
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold">Recent activity</h2>
      {data.history.length ? <ul className="mt-4 divide-y divide-slate-100">{data.history.map((entry) => <li key={entry.id} className="flex justify-between gap-3 py-3"><span className="font-medium text-slate-700">{entry.action.replaceAll("_", " ")}</span><time className="text-sm text-slate-500">{date(entry.created_at)}</time></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No activity recorded yet.</p>}
    </section>
  </div>;
}
