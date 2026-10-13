import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ArtifactGenerator from "../components/research/ArtifactGenerator";

function ComparisonMatrix(payload, { papers, paperIds }) {
  const rows = Array.isArray(payload?.comparisons) ? payload.comparisons : [];
  const selected = paperIds.map((id) => papers.find((paper) => paper.id === id)).filter(Boolean).slice(0, 3);
  if (!rows.length) return <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">No comparable evidence was returned for these papers.</p>;
  const normalize = (value = "") => value.split("/").pop().toLowerCase().replace(/[^a-z0-9]/g, "");
  return <div className="space-y-4"><div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[760px] border-collapse text-left text-sm"><thead><tr className="bg-slate-50"><th className="sticky left-0 z-10 min-w-40 border-b border-slate-200 bg-slate-50 p-3 text-xs uppercase tracking-wide text-slate-500">Criterion</th>{selected.map((paper) => <th key={paper.id} className="min-w-56 border-b border-slate-200 p-3 font-semibold text-slate-800">{paper.filename}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.criterion}-${index}`} className="align-top"><th className="sticky left-0 border-t border-slate-100 bg-white p-3 text-left font-semibold text-slate-800">{row.criterion}</th>{selected.map((paper) => { const finding = (row.paper_findings || []).find((item) => normalize(item.paper) === normalize(paper.filename)); return <td key={paper.id} className="border-t border-slate-100 p-3 text-slate-700">{finding ? <><p className="leading-relaxed">{finding.finding}</p>{finding.page && <Link className="mt-2 inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700" to={`/viewer?paperId=${encodeURIComponent(paper.id)}&page=${finding.page}`}>p. {finding.page} · open source ↗</Link>}</> : <span className="text-slate-400">Not covered in retrieved evidence</span>}</td>; })}</tr>)}<tr className="bg-indigo-50/40 align-top"><th className="sticky left-0 border-t border-slate-200 bg-indigo-50 p-3 text-left font-semibold text-slate-800">Synthesis</th><td colSpan={selected.length} className="border-t border-slate-200 p-3 leading-relaxed text-slate-700">{rows.map((row) => row.synthesis).filter(Boolean).join("\n\n")}</td></tr></tbody></table></div><p className="text-xs leading-relaxed text-slate-500">Cells contain only retrieved evidence. “Not covered” means no passage was retrieved for that criterion; it does not prove the paper omits it.</p></div>;
}

export default function PaperComparison() {
  const [searchParams] = useSearchParams();
  const selectedIds = useMemo(() => (searchParams.get("paperIds") || "").split(",").filter(Boolean), [searchParams]);
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <header>
        <p className="text-sm font-medium text-primary-600">AI research analysis</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Compare Papers</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Select two or three PDFs from your library. ScholarMind retrieves passages from each selected paper and generates a cited comparison of their methods, evidence, findings, and limitations.
        </p>
      </header>
      <ArtifactGenerator
        kinds={["comparison"]}
        multiPaper
        minPapers={2}
        maxPapers={3}
        initialPaperIds={selectedIds}
        heading="Generate a source-grounded comparison"
        renderPayload={ComparisonMatrix}
      />
      <p className="text-xs text-slate-500">Analysis is generated when requested from the papers you select. Scores and rankings are not fabricated when the papers do not report comparable measurements.</p>
    </div>
  );
}
