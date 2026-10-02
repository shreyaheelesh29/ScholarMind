import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../api";

const labels = {
  summary: "Paper summary", report: "Research report", quiz: "Quiz",
  literature_review: "Literature review", viva: "Viva questions",
  visualization: "Visualization outline", comparison: "Paper comparison",
  research_gap: "Research gap analysis", research_ideas: "Research ideas",
};

function QuizQuestion({ value }) {
  const [selected, setSelected] = useState(null);
  const questionId = useId();
  const answered = selected !== null;
  const correct = Number(value.answer);

  return <article className="space-y-3 rounded-xl border border-indigo-100 bg-white p-4">
    <div className="flex items-start justify-between gap-3"><h4 className="font-semibold leading-relaxed text-slate-900">{value.question}</h4>{value.page && <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700">p. {value.page}</span>}</div>
    <fieldset disabled={answered}>
      <legend className="sr-only">Choose an answer</legend>
      <ol className="space-y-2">{value.options.map((option, index) => {
        const isSelected = selected === index;
        const isCorrect = correct === index;
        const optionStyle = !answered
          ? "border-slate-100 bg-slate-50 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
          : isCorrect
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : isSelected
              ? "border-red-200 bg-red-50 text-red-900"
              : "border-slate-100 bg-slate-50 text-slate-500";
        return <li key={index}>
          <label htmlFor={`${questionId}-${index}`} className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${answered ? "cursor-default" : ""} ${optionStyle}`}>
            <input
              id={`${questionId}-${index}`}
              type="radio"
              name={questionId}
              value={index}
              checked={isSelected}
              onChange={() => setSelected(index)}
              className="mt-0.5 accent-indigo-600"
            />
            <span><span className="mr-2 font-semibold">{String.fromCharCode(65 + index)}.</span>{option}
              {answered && isCorrect && <span className="ml-2 text-xs font-semibold text-emerald-800">Correct answer</span>}
              {answered && isSelected && !isCorrect && <span className="ml-2 text-xs font-semibold text-red-800">Your answer</span>}
            </span>
          </label>
        </li>;
      })}</ol>
    </fieldset>
    {answered && <div role="status" aria-live="polite" className={`rounded-lg p-3 ${selected === correct ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`}>
      <p className="font-semibold">{selected === correct ? "Correct!" : "Not quite. The highlighted option is correct."}</p>
    </div>}
    {answered && value.explanation && <div className="rounded-lg bg-blue-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Explanation</p><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{value.explanation}</p></div>}
  </article>;
}

function OutputValue({ value }) {
  if (value == null || typeof value === "boolean") return null;
  if (typeof value === "string" || typeof value === "number") return <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{String(value)}</p>;
  if (Array.isArray(value)) return value.length
    ? <div className="space-y-3">{value.map((item, index) => <div key={index} className="rounded-lg border border-slate-100 bg-slate-50 p-3"><OutputValue value={item} /></div>)}</div>
    : <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">No evidence-backed items were identified in the retrieved passages for this request.</p>;
  if (typeof value.question === "string" && Array.isArray(value.options)) return <QuizQuestion value={value} />;
  const entries = Object.entries(value).filter(([key, item]) => item != null && !["citations", "source_paper_ids", "speaker_notes", "_generation_mode", "_generation_notice"].includes(key));
  return <div className="space-y-2">{entries.map(([key, item]) => <div key={key}><p className="mb-0.5 text-xs font-bold uppercase tracking-wide text-slate-500">{key.replaceAll("_", " ")}</p><OutputValue value={item} /></div>)}{value.speaker_notes && <div className="border-l-2 border-primary-300 pl-3"><p className="text-xs font-bold uppercase tracking-wide text-primary-700">Presenter notes</p><p className="mt-1 text-sm text-slate-700">{value.speaker_notes}</p></div>}</div>;
}

export default function ArtifactGenerator({ kinds, heading = "Generate from your paper", multiPaper = false, id, initialPaperId = "", maxPapers = 10, minPapers = 1, promptContext = "", promptPlaceholder = "Optional focus or topic", renderPayload, onQuizGenerated }) {
  const [papers, setPapers] = useState([]);
  const [paperIds, setPaperIds] = useState([]);
  const [kind, setKind] = useState(kinds[0]);
  const [count, setCount] = useState(8);
  const [prompt, setPrompt] = useState("");
  const [artifact, setArtifact] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPapers, setLoadingPapers] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/papers").then(({ papers: items }) => {
      setPapers(items);
      if (items.length) {
        setPaperIds(multiPaper
          ? items.slice(0, maxPapers).map((item) => item.id)
          : [items.find((item) => item.id === initialPaperId)?.id || items[0].id]);
      }
    }).catch((err) => setError(err.message))
      .finally(() => setLoadingPapers(false));
  }, [initialPaperId, maxPapers, multiPaper]);

  const generate = async (event) => {
    event.preventDefault();
    if (paperIds.length < minPapers) { setError(`Select at least ${minPapers} uploaded papers before generating this material.`); return; }
    setLoading(true); setError(""); setArtifact(null);
    try {
      const result = await apiFetch("/learning/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, paper_id: paperIds[0], paper_ids: paperIds, prompt: [promptContext, prompt].filter(Boolean).join("\n\n"), count: kind === "quiz" ? count : 6 }),
      });
      setArtifact(kind === "quiz" && onQuizGenerated ? null : result.artifact);
      if (kind === "quiz" && onQuizGenerated) onQuizGenerated(result.artifact);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return <section id={id} className="space-y-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-white p-5 shadow-sm">
    <div><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Paper-grounded AI</p><h2 className="mt-1 text-lg font-bold text-slate-900">{heading}</h2><p className="mt-1 text-sm text-slate-500">Generated material is saved to your My Data & History.</p></div>
    <form onSubmit={generate} className="grid gap-3 md:grid-cols-[minmax(180px,1fr)_minmax(150px,0.8fr)_auto]">
      {multiPaper ? <fieldset disabled={!papers.length || loading || loadingPapers} className="flex max-h-48 flex-col gap-1 overflow-auto rounded-lg border border-slate-200 bg-white p-3 md:col-span-3"><legend className="px-1 text-xs font-bold text-slate-500">Select {minPapers > 1 ? `at least ${minPapers}, ` : ""}up to ${maxPapers} source papers</legend>{papers.map((paper) => <label key={paper.id} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={paperIds.includes(paper.id)} disabled={!paperIds.includes(paper.id) && paperIds.length >= maxPapers} onChange={(e) => { setArtifact(null); setError(""); setPaperIds((ids) => e.target.checked ? [...ids, paper.id] : ids.filter((id) => id !== paper.id)); }} />{paper.filename}</label>)}</fieldset> : <select aria-label="Source paper" value={paperIds[0] || ""} onChange={(e) => { setArtifact(null); setError(""); setPaperIds(e.target.value ? [e.target.value] : []); }} disabled={!papers.length || loading || loadingPapers} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700">{loadingPapers ? <option value="">Loading your papers…</option> : papers.length ? papers.map((paper) => <option key={paper.id} value={paper.id}>{paper.filename}</option>) : <option value="">No uploaded papers</option>}</select>}
      <select aria-label="Material type" value={kind} onChange={(e) => setKind(e.target.value)} disabled={loading} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700">
        {kinds.map((value) => <option key={value} value={value}>{labels[value] || value}</option>)}
      </select>
      {kind === "quiz" && <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700">Questions<select aria-label="Number of quiz questions" value={count} onChange={(e) => setCount(Number(e.target.value))} disabled={loading} className="rounded-md border border-slate-200 px-2 py-1">{[5, 8, 10, 15, 20].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>}
      <button disabled={paperIds.length < minPapers || loading || loadingPapers} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Generating…" : `Generate ${labels[kind] || "material"}`}</button>
      <input value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={1000} placeholder={promptPlaceholder} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm md:col-span-3" />
    </form>
    {multiPaper && papers.length > 0 && <p className="text-xs text-slate-500">{paperIds.length} of {maxPapers} allowed papers selected{paperIds.length < minPapers ? ` · select at least ${minPapers}` : ""}.</p>}
    {!loadingPapers && papers.length === 0 && !error && <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">Upload and process PDFs before generating this analysis. <Link to="/upload" className="font-semibold text-indigo-700 hover:underline">Go to Upload Papers</Link></div>}
    {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    {artifact && <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-slate-900">{artifact.title}</h3><Link to="/my-data" className="text-sm font-semibold text-indigo-700 hover:underline">View saved work</Link></div>
      {artifact.payload?._generation_mode === "source_fallback" && <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{artifact.payload._generation_notice || "Showing retrieved PDF passages because AI generation was unavailable."}</p>}
      {artifact.payload?._generation_mode === "ai" && <p className="text-xs font-medium text-emerald-700">AI-generated from the selected uploaded paper passages</p>}
      <div className="max-h-[42rem] space-y-3 overflow-auto">{renderPayload ? renderPayload(artifact.payload, { papers, paperIds }) : <OutputValue value={artifact.payload} />}</div>
      {artifact.payload?.citations?.length > 0 && <div className="border-t border-slate-100 pt-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Sources</p><div className="mt-1 flex flex-wrap gap-2">{artifact.payload.citations.map((citation) => <span key={`${citation.number}-${citation.paper_id}-${citation.page}`} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-800">{citation.paperTitle} · p. {citation.page}</span>)}</div></div>}
    </div>}
  </section>;
}
