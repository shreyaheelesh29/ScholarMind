import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api";

const date = (value) => value ? new Date(value).toLocaleString() : "—";

export default function MyData() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [collectionPaperIds, setCollectionPaperIds] = useState([]);
  const [collectionArtifactIds, setCollectionArtifactIds] = useState([]);
  const [editingCollectionId, setEditingCollectionId] = useState("");
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
  const saveCollection = async (event) => {
    event.preventDefault();
    if (!collectionPaperIds.length && !collectionArtifactIds.length) { setError("Choose at least one paper or saved item for this collection."); return; }
    try {
      const path = editingCollectionId ? `/collections/${editingCollectionId}` : "/collections";
      await apiFetch(path, { method: editingCollectionId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: collectionName, paper_ids: collectionPaperIds, artifact_ids: collectionArtifactIds }) });
      setCollectionName(""); setCollectionPaperIds([]); setCollectionArtifactIds([]); setEditingCollectionId(""); setError(""); refresh();
    } catch (e) { setError(e.message); }
  };
  const editCollection = (collection) => {
    setEditingCollectionId(collection.id); setCollectionName(collection.name);
    setCollectionPaperIds(collection.paper_ids || []); setCollectionArtifactIds(collection.artifact_ids || []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const removeCollection = async (id) => {
    try { await apiFetch(`/collections/${id}`, { method: "DELETE" }); refresh(); }
    catch (e) { setError(e.message); }
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
    <section className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
      <div><h2 className="text-xl font-semibold text-slate-900">Research collections ({data.collections?.length || 0})</h2><p className="mt-1 text-sm text-slate-500">Group papers and saved analyses into reusable projects. Collection contents are private to your account.</p></div>
      <form onSubmit={saveCollection} className="mt-5 space-y-4 rounded-xl bg-slate-50 p-4">
        <div className="flex flex-wrap gap-2"><input required maxLength={100} value={collectionName} onChange={(event) => setCollectionName(event.target.value)} placeholder="Collection name, e.g. Thesis literature review" className="min-w-64 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /><button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">{editingCollectionId ? "Update collection" : "Save collection"}</button>{editingCollectionId && <button type="button" onClick={() => { setEditingCollectionId(""); setCollectionName(""); setCollectionPaperIds([]); setCollectionArtifactIds([]); }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">Cancel</button>}</div>
        <fieldset className="space-y-2"><legend className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Papers</legend>{data.papers.length ? <div className="grid max-h-40 gap-2 overflow-auto sm:grid-cols-2">{data.papers.map((paper) => <label key={paper.id} className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={collectionPaperIds.includes(paper.id)} onChange={(event) => setCollectionPaperIds((ids) => event.target.checked ? [...ids, paper.id] : ids.filter((id) => id !== paper.id))} /><span className="break-all">{paper.filename}</span></label>)}</div> : <p className="text-sm text-slate-500">Upload papers to start a collection.</p>}</fieldset>
        {data.artifacts.length > 0 && <fieldset className="space-y-2"><legend className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Saved analyses and study materials</legend><div className="grid max-h-40 gap-2 overflow-auto sm:grid-cols-2">{data.artifacts.map((item) => <label key={item.id} className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={collectionArtifactIds.includes(item.id)} onChange={(event) => setCollectionArtifactIds((ids) => event.target.checked ? [...ids, item.id] : ids.filter((id) => id !== item.id))} /><span className="min-w-0"><span className="block truncate">{item.title}</span><span className="text-xs text-slate-400">{item.kind}</span></span></label>)}</div></fieldset>}
      </form>
      {(data.collections || []).length > 0 && <div className="mt-5 space-y-3">{data.collections.map((collection) => {
        const paperIds = collection.paper_ids || [];
        const papers = paperIds.map((id) => data.papers.find((paper) => paper.id === id)).filter(Boolean);
        const artifactCount = (collection.artifact_ids || []).length;
        const query = encodeURIComponent(paperIds.join(","));
        return <article key={collection.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-900">{collection.name}</h3><p className="mt-1 text-sm text-slate-500">{papers.length} paper(s) · {artifactCount} saved item(s)</p><p className="mt-2 text-xs text-slate-600">{papers.map((paper) => paper.filename).join(" · ") || "No papers selected"}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => editCollection(collection)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">Edit</button><button onClick={() => removeCollection(collection.id)} className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-700">Delete</button></div></div><div className="mt-3 flex flex-wrap gap-2"><Link to={`/literature-review?paperIds=${query}`} className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700">Use for literature review</Link>{papers.length >= 2 && <Link to={`/comparison?paperIds=${query}`} className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700">Compare papers</Link>}</div></article>;
      })}</div>}
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold">Recent activity</h2>
      {data.history.length ? <ul className="mt-4 divide-y divide-slate-100">{data.history.map((entry) => <li key={entry.id} className="flex justify-between gap-3 py-3"><span className="font-medium text-slate-700">{entry.action.replaceAll("_", " ")}</span><time className="text-sm text-slate-500">{date(entry.created_at)}</time></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No activity recorded yet.</p>}
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold">Answer evaluation history</h2><p className="mt-1 text-sm text-slate-500">Your relevance and evidence-fit ratings help you review where generated answers need attention.</p>
      {data.history.filter((entry) => entry.action === "research_feedback").length ? <ul className="mt-4 divide-y divide-slate-100">{data.history.filter((entry) => entry.action === "research_feedback").map((entry) => <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 py-3"><div><p className="font-medium capitalize text-slate-800">{String(entry.details?.category || "answer").replaceAll("_", " ")}: {String(entry.details?.rating || "reviewed").replaceAll("_", " ")}</p><p className="text-xs text-slate-500">{entry.details?.note || "No note added"}</p></div><time className="text-xs text-slate-400">{date(entry.created_at)}</time></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">In Chat Assistant, rate an answer’s usefulness and evidence fit to start a review history.</p>}
    </section>
  </div>;
}
