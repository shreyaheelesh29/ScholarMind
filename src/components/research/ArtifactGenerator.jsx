import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../api";

const labels = {
  summary: "Paper summary", report: "Research report", quiz: "Quiz",
  literature_review: "Literature review", viva: "Viva questions",
  visualization: "Visualization outline",
};

function OutputValue({ value }) {
  if (value == null || typeof value === "boolean") return null;
  if (typeof value === "string" || typeof value === "number") return <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{String(value)}</p>;
  if (Array.isArray(value)) return <div className="space-y-3">{value.map((item, index) => <div key={index} className="rounded-lg border border-slate-100 bg-slate-50 p-3"><OutputValue value={item} /></div>)}</div>;
  if (typeof value.question === "string" && Array.isArray(value.options)) {
    return <article className="space-y-3 rounded-xl border border-indigo-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3"><h4 className="font-semibold leading-relaxed text-slate-900">{value.question}</h4>{value.page && <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700">p. {value.page}</span>}</div>
      <ol className="space-y-2">{value.options.map((option, index) => <li key={index} className={`rounded-lg border px-3 py-2 text-sm ${Number(value.answer) === index ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-100 bg-slate-50 text-slate-700"}`}><span className="mr-2 font-semibold">{String.fromCharCode(65 + index)}.</span>{option}{Number(value.answer) === index && <span className="ml-2 text-xs font-semibold">Correct answer</span>}</li>)}</ol>
      {value.explanation && <div className="rounded-lg bg-blue-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Explanation</p><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{value.explanation}</p></div>}
    </article>;
  }
  const entries = Object.entries(value).filter(([key, item]) => item != null && !["citations", "speaker_notes", "_generation_mode", "_generation_notice"].includes(key));
  return <div className="space-y-2">{entries.map(([key, item]) => <div key={key}><p className="mb-0.5 text-xs font-bold uppercase tracking-wide text-slate-500">{key.replaceAll("_", " ")}</p><OutputValue value={item} /></div>)}{value.speaker_notes && <div className="border-l-2 border-primary-300 pl-3"><p className="text-xs font-bold uppercase tracking-wide text-primary-700">Presenter notes</p><p className="mt-1 text-sm text-slate-700">{value.speaker_notes}</p></div>}</div>;
}

export default function ArtifactGenerator({ kinds, heading = "Generate from your paper", multiPaper = false, id }) {
  const [papers, setPapers] = useState([]);
  const [paperIds, setPaperIds] = useState([]);
  const [kind, setKind] = useState(kinds[0]);
  const [prompt, setPrompt] = useState("");
  const [artifact, setArtifact] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/papers").then(({ papers: items }) => {
      setPapers(items);
      if (items.length) setPaperIds(multiPaper ? items.slice(0, 10).map((item) => item.id) : [items[0].id]);
    }).catch((err) => setError(err.message));
  }, []);

  const generate = async (event) => {
    event.preventDefault();
    if (!paperIds.length) { setError("Select at least one uploaded paper before generating this material."); return; }
    setLoading(true); setError(""); setArtifact(null);
    try {
      const result = await apiFetch("/learning/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, paper_id: paperIds[0], paper_ids: paperIds, prompt, count: 8 }),
      });
      setArtifact(result.artifact);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return <section id={id} className="space-y-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-white p-5 shadow-sm">
    <div><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Paper-grounded AI</p><h2 className="mt-1 text-lg font-bold text-slate-900">{heading}</h2><p className="mt-1 text-sm text-slate-500">Generated material is saved to your My Data & History.</p></div>
    <form onSubmit={generate} className="grid gap-3 md:grid-cols-[minmax(180px,1fr)_minmax(150px,0.8fr)_auto]">
      {multiPaper ? <fieldset disabled={!papers.length || loading} className="flex max-h-36 flex-col gap-1 overflow-auto rounded-lg border border-slate-200 bg-white p-3 md:col-span-3"><legend className="px-1 text-xs font-bold text-slate-500">Select up to 10 source papers</legend>{papers.map((paper) => <label key={paper.id} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={paperIds.includes(paper.id)} disabled={!paperIds.includes(paper.id) && paperIds.length >= 10} onChange={(e) => setPaperIds((ids) => e.target.checked ? [...ids, paper.id] : ids.filter((id) => id !== paper.id))} />{paper.filename}</label>)}</fieldset> : <select aria-label="Source paper" value={paperIds[0] || ""} onChange={(e) => setPaperIds(e.target.value ? [e.target.value] : [])} disabled={!papers.length || loading} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700">{papers.length ? papers.map((paper) => <option key={paper.id} value={paper.id}>{paper.filename}</option>) : <option value="">No uploaded papers</option>}</select>}
      <select aria-label="Material type" value={kind} onChange={(e) => setKind(e.target.value)} disabled={loading} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700">
        {kinds.map((value) => <option key={value} value={value}>{labels[value] || value}</option>)}
      </select>
      <button disabled={!paperIds.length || loading} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Generating…" : `Generate ${labels[kind] || "material"}`}</button>
      <input value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={1000} placeholder="Optional focus or topic" className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm md:col-span-3" />
    </form>
    {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    {artifact && <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-slate-900">{artifact.title}</h3><Link to="/my-data" className="text-sm font-semibold text-indigo-700 hover:underline">View saved work</Link></div>
      {artifact.payload?._generation_mode === "source_fallback" && <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{artifact.payload._generation_notice || "Showing retrieved PDF passages because AI generation was unavailable."}</p>}
      {artifact.payload?._generation_mode === "ai" && <p className="text-xs font-medium text-emerald-700">AI-generated from the selected paper</p>}
      <div className="max-h-[32rem] space-y-3 overflow-auto"><OutputValue value={artifact.payload} /></div>
      {artifact.payload?.citations?.length > 0 && <div className="border-t border-slate-100 pt-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Sources</p><div className="mt-1 flex flex-wrap gap-2">{artifact.payload.citations.map((citation) => <span key={`${citation.number}-${citation.paper_id}-${citation.page}`} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-800">{citation.paperTitle} · p. {citation.page}</span>)}</div></div>}
    </div>}
  </section>;
}
