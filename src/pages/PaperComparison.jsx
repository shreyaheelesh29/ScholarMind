import ArtifactGenerator from "../components/research/ArtifactGenerator";

export default function PaperComparison() {
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
        heading="Generate a source-grounded comparison"
      />
      <p className="text-xs text-slate-500">Analysis is generated when requested from the papers you select. Scores and rankings are not fabricated when the papers do not report comparable measurements.</p>
    </div>
  );
}
