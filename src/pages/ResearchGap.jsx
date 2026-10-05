import ArtifactGenerator from "../components/research/ArtifactGenerator";

export default function ResearchGap() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <header>
        <p className="text-sm font-medium text-primary-600">AI research analysis</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Research Gaps</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Analyze limitations, open questions, and future-work statements in your selected papers to identify candidate research directions.
        </p>
      </header>
      <ArtifactGenerator
        kinds={["research_gap"]}
        multiPaper
        maxPapers={10}
        heading="Find evidence-backed candidate gaps"
      />
      <p className="text-xs text-slate-500">These are candidate gaps inferred from the selected documents, not proof that no other research has addressed them. Review the cited evidence and search the wider literature.</p>
    </div>
  );
}
