import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import ArtifactGenerator from "../components/research/ArtifactGenerator";

function SourcePage({ page, filename, papers, paperIds }) {
  const normalize = (value = "") => value.split("/").pop().toLowerCase().replace(/[^a-z0-9]/g, "");
  const paper = papers.find((item) => normalize(item.filename) === normalize(filename)) || papers.find((item) => item.id === paperIds?.[0]);
  if (!page || !paper) return null;
  return <Link className="mt-2 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100" to={`/viewer?paperId=${encodeURIComponent(paper.id)}&page=${page}`}>Open page {page} ↗</Link>;
}

function SummaryOutput(payload, { papers, paperIds }) {
  if (payload?.sections && Array.isArray(payload.sections)) return <div className="space-y-3">{payload.sections.map((item, index) => <article key={`${item.title}-${index}`} className="rounded-xl border border-slate-200 p-4"><h4 className="font-semibold text-slate-900">{item.title || `Section ${index + 1}`}</h4><p className="mt-2 text-sm leading-relaxed text-slate-700">{item.what_to_read_for || item.content}</p>{item.key_points?.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">{item.key_points.map((point, pointIndex) => <li key={pointIndex}>{point}</li>)}</ul>}<SourcePage page={item.page} filename={item.paper} papers={papers} paperIds={paperIds} /></article>)}</div>;
  if (payload?.items && Array.isArray(payload.items)) return <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-3">Study detail</th><th className="p-3">What the paper reports</th><th className="p-3">Source</th></tr></thead><tbody>{payload.items.map((item, index) => <tr key={index} className="border-t border-slate-100 align-top"><td className="p-3 font-semibold text-slate-800">{item.category || "Detail"}</td><td className="p-3 leading-relaxed text-slate-700">{item.finding || item.content}</td><td className="p-3"><SourcePage page={item.page} filename={item.paper} papers={papers} paperIds={paperIds} /></td></tr>)}</tbody></table></div>;
  return <div className="space-y-4">{payload?.summary && <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{payload.summary}</p>}{payload?.key_points?.length > 0 && <div className="space-y-3">{payload.key_points.map((item, index) => <article key={index} className="rounded-xl border border-slate-200 p-4"><h4 className="font-semibold text-slate-900">{item.title}</h4><p className="mt-1 text-sm leading-relaxed text-slate-700">{item.content}</p><SourcePage page={item.page} filename={item.paper} papers={papers} paperIds={paperIds} /></article>)}</div>}</div>;
}

export default function PaperSummary() {
  const [searchParams] = useSearchParams();
  const paperId = searchParams.get("paperId") || "";

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <header>
        <p className="text-sm font-semibold text-indigo-600">AI research analysis</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Paper Summary</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Summarize a paper, extract its reported methods and datasets, or generate a page-linked reading guide. Outputs use retrieved passages and point back to the source PDF.
        </p>
      </header>

      <ArtifactGenerator
        kinds={["summary", "report", "reading_guide", "method_extraction"]}
        heading="Generate from an uploaded paper"
        initialPaperId={paperId}
        renderPayload={SummaryOutput}
      />

      <aside className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
        <h2 className="font-semibold text-slate-900">How it works</h2>
        <p className="mt-1">Choose a processed paper, optionally enter a topic to focus on, then generate. Your saved result is available in My Data &amp; History.</p>
      </aside>
    </div>
  );
}
