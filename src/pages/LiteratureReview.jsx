import ArtifactGenerator from "../components/research/ArtifactGenerator";

export default function LiteratureReview() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <header>
        <p className="text-sm font-medium text-primary-600">AI research analysis</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Literature Review</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Generate a thematic synthesis from selected papers in your library. Each review is created on demand from retrieved PDF passages, with source filenames and page references.
        </p>
      </header>
      <ArtifactGenerator
        kinds={["literature_review"]}
        multiPaper
        maxPapers={10}
        heading="Synthesize selected papers into a literature review"
      />
      <p className="text-xs text-slate-500">The review covers only the papers selected above. Check the cited passages and full papers before using it in academic work.</p>
    </div>
  );
}
