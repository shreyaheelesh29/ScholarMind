import { Link } from "react-router-dom";
import ArtifactGenerator from "../components/research/ArtifactGenerator";

function normalizeFilename(value = "") {
  return value.split("/").pop().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function GapSources({ sources, papers }) {
  if (!Array.isArray(sources) || sources.length === 0) return null;
  return <div className="mt-5 border-t border-slate-100 pt-4">
    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Check the source passages</p>
    <div className="flex flex-wrap gap-2">{sources.map((source, index) => {
      const name = typeof source === "string" ? source : source.paper || source.filename || "Source paper";
      const page = typeof source === "object" ? source.page : null;
      const paper = papers.find((item) => normalizeFilename(item.filename) === normalizeFilename(name));
      const label = `${name}${page ? ` · p. ${page}` : ""}`;
      return paper && page
        ? <Link key={`${name}-${page}-${index}`} to={`/viewer?paperId=${encodeURIComponent(paper.id)}&page=${encodeURIComponent(page)}`} className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-800 hover:border-indigo-300 hover:bg-indigo-100">{label} ↗</Link>
        : <span key={`${name}-${index}`} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600">{label}</span>;
    })}</div>
  </div>;
}

function ResearchGapOutput(payload, { papers }) {
  const gaps = Array.isArray(payload?.gaps) ? payload.gaps : Array.isArray(payload) ? payload : null;
  const extractedOnly = payload?._generation_mode === "source_extraction";
  const sourceOnly = extractedOnly || payload?._generation_mode === "source_review";
  if (!gaps) return <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">The response wasn’t in the expected gap-analysis format. Try again with fewer, more closely related papers.</div>;
  if (!gaps.length) return <div className="rounded-xl border border-slate-200 bg-slate-50 p-5"><h3 className="font-semibold text-slate-800">No well-supported candidate gaps found</h3><p className="mt-1 text-sm leading-relaxed text-slate-600">The retrieved passages did not contain enough direct evidence of a limitation, stated future work, or an unresolved question. This does not mean the papers have no limitations. Try selecting other papers or reviewing their limitations and conclusion sections.</p></div>;

  return <div className="space-y-4">{gaps.map((gap, index) => <article key={`${gap.title || "gap"}-${index}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-start gap-3 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-white p-5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-sm font-bold text-amber-900">{String(index + 1).padStart(2, "0")}</span>
      <div><p className="text-xs font-bold uppercase tracking-wide text-amber-800">{extractedOnly ? "Explicit signal in paper" : sourceOnly ? "Retrieved passage to review" : "Candidate gap"}</p><h3 className="mt-1 text-lg font-bold leading-snug text-slate-900">{gap.title || `${sourceOnly ? "Source passage" : "Candidate gap"} ${index + 1}`}</h3></div>
    </div>
    <div className="space-y-5 p-5">
      {gap.evidence && <section><h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{sourceOnly ? "Verbatim retrieved text" : "What the selected text supports"}</h4><blockquote className="border-l-2 border-amber-300 pl-4 text-sm leading-relaxed text-slate-700">“{gap.evidence}”</blockquote></section>}
      {!sourceOnly && gap.why_it_matters && <section><h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Why it may matter</h4><p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{gap.why_it_matters}</p></section>}
      {!sourceOnly && gap.proposed_direction && <section><h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Possible next step</h4><p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{gap.proposed_direction}</p></section>}
      <GapSources sources={gap.sources || gap.source_ids} papers={papers} />
    </div>
  </article>)}
    <p className="px-1 text-xs leading-relaxed text-slate-500">{sourceOnly ? "These are source excerpts only; Ollama’s synthesized gap claims were rejected. Review each page and decide whether the text supports a research gap." : "A citation confirms where the supporting passage came from; it does not prove the gap is new or broadly important. Read the cited pages and search related literature before adopting a gap."}</p>
  </div>;
}

export default function ResearchGap() {
  return <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
    <header className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-white p-6 sm:p-8">
      <p className="text-sm font-semibold text-amber-800">Find what the papers actually leave open</p>
      <h1 className="mt-1 text-3xl font-bold text-slate-900">Research Gaps</h1>
      <p className="mt-2 max-w-3xl text-slate-600">Look for limitations, explicit future-work statements, and unresolved questions in a small set of related papers. Each candidate needs a cited passage; silence in the retrieved text is not evidence that a topic is unexplored.</p>
    </header>
    <ArtifactGenerator
      kinds={["research_gap"]}
      multiPaper
      maxPapers={4}
      minPapers={1}
      promptContext="Identify only cautious candidate research gaps directly supported by the selected passages. Prioritize limitations, explicit future-work statements, and clearly stated unresolved questions. Do not infer that a topic is unexplored just because it is absent from these excerpts. For each gap, provide a concise title, a short verbatim evidence quote, why the issue may matter, a testable possible next step, and source IDs that point to the exact supporting passages. If no direct evidence supports a gap, return an empty gaps list."
      promptPlaceholder="Optional topic or question to narrow the gap search"
      heading="Select a few related papers and inspect their open questions"
      renderPayload={ResearchGapOutput}
    />
  </div>;
}
