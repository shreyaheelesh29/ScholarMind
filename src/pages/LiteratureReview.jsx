import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ArtifactGenerator from "../components/research/ArtifactGenerator";
import { apiFetch } from "../api";

function ReviewWorkspace(payload, { papers, artifact }) {
  const sections = Array.isArray(payload?.sections) ? payload.sections : [];
  const initialDraft = useMemo(() => sections.map((section) => {
    const refs = (section.sources || []).map((source) => `[${source.paper || "Source"}, p. ${source.page || "?"}]`).join("; ");
    return `## ${section.title || "Theme"}\n\n${section.content || ""}${refs ? `\n\nSources: ${refs}` : ""}`;
  }).join("\n\n"), [artifact?.id]);
  const [draft, setDraft] = useState(initialDraft);
  const [saveMessage, setSaveMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setDraft(initialDraft); setSaveMessage(""); }, [initialDraft]);

  const saveDraft = async () => {
    if (!artifact?.id) return;
    setBusy(true); setSaveMessage("");
    try {
      await apiFetch(`/artifacts/${artifact.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ payload: { ...payload, draft_markdown: draft } }) });
      setSaveMessage("Draft saved to My Data & History.");
    } catch (error) { setSaveMessage(error.message); }
    finally { setBusy(false); }
  };
  const downloadDraft = () => {
    const blob = new Blob([draft], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "scholarmind-literature-review.md"; anchor.click();
    URL.revokeObjectURL(url);
  };

  return <div className="space-y-4">
    {sections.map((section, index) => <article key={`${section.title}-${index}`} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><h4 className="font-semibold text-slate-900">{section.title || `Theme ${index + 1}`}</h4><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">Cross-paper synthesis</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{section.content}</p><div className="mt-3 flex flex-wrap gap-2">{(section.sources || []).map((source, sourceIndex) => {
      const paper = papers.find((item) => item.filename.toLowerCase() === String(source.paper || "").toLowerCase());
      const label = `${source.paper || "Source"}${source.page ? ` · p. ${source.page}` : ""}`;
      return paper && source.page ? <Link key={`${label}-${sourceIndex}`} to={`/viewer?paperId=${encodeURIComponent(paper.id)}&page=${source.page}`} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100">{label} ↗</Link> : <span key={`${label}-${sourceIndex}`} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{label}</span>;
    })}</div></article>)}
    {sections.length > 0 && <section className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="font-semibold text-slate-900">Citation-aware writing workspace</h4><p className="mt-1 text-xs text-slate-600">Edit the draft, keep source/page references in place, then save or export Markdown.</p></div><div className="flex gap-2"><button type="button" onClick={saveDraft} disabled={busy} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save draft"}</button><button type="button" onClick={downloadDraft} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">Download .md</button></div></div><textarea aria-label="Edit literature review draft" value={draft} onChange={(event) => setDraft(event.target.value)} rows={12} className="mt-3 w-full rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs leading-relaxed text-slate-700" />{saveMessage && <p role="status" className="mt-2 text-xs text-slate-600">{saveMessage}</p>}</section>}
  </div>;
}

export default function LiteratureReview() {
  const [searchParams] = useSearchParams();
  const selectedIds = useMemo(() => (searchParams.get("paperIds") || "").split(",").filter(Boolean), [searchParams]);
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <header>
        <p className="text-sm font-medium text-primary-600">AI research analysis</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Literature Review</h1>
        <p className="mt-2 max-w-3xl text-slate-600">Compare themes across papers, surface supported agreements and disagreements, and turn the result into an editable cited draft.</p>
      </header>
      <ArtifactGenerator
        kinds={["literature_review"]}
        multiPaper
        maxPapers={10}
        initialPaperIds={selectedIds}
        promptContext="Synthesize themes across the selected papers. Explicitly separate shared findings from disagreements or differences in methods/results. Tie every factual statement to the supplied source passages and page references; state when papers cannot be directly compared."
        heading="Synthesize selected papers into a literature review"
        renderPayload={ReviewWorkspace}
      />
      <p className="text-xs text-slate-500">The review covers only the papers selected above. Check the cited passages and full papers before using it in academic work.</p>
    </div>
  );
}
