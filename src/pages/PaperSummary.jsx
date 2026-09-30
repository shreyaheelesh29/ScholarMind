import { useSearchParams } from "react-router-dom";
import ArtifactGenerator from "../components/research/ArtifactGenerator";

export default function PaperSummary() {
  const [searchParams] = useSearchParams();
  const paperId = searchParams.get("paperId") || "";

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <header>
        <p className="text-sm font-semibold text-indigo-600">AI research analysis</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Paper Summary</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Generate a summary or research report from a PDF in your library. The result is based on the selected paper and includes page citations when available.
        </p>
      </header>

      <ArtifactGenerator
        kinds={["summary", "report"]}
        heading="Generate from an uploaded paper"
        initialPaperId={paperId}
      />

      <aside className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
        <h2 className="font-semibold text-slate-900">How it works</h2>
        <p className="mt-1">Choose a processed paper, optionally enter a topic to focus on, then generate. Your saved result is available in My Data &amp; History.</p>
      </aside>
    </div>
  );
}
