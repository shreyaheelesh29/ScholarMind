import { useState } from "react";
import ArtifactGenerator from "../components/research/ArtifactGenerator";

export default function ResearchIdeas() {
  const [seed, setSeed] = useState("");
  const [novelty, setNovelty] = useState(50);
  const [difficulty, setDifficulty] = useState("medium");
  const promptContext = `Desired novelty: ${novelty} out of 100. Desired project difficulty: ${difficulty}.${seed.trim() ? ` Starting idea: ${seed.trim()}` : " Develop ideas from the selected papers' evidence-backed gaps."}`;

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <header>
        <p className="text-sm font-medium text-primary-600">AI research analysis</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Research Ideas</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Generate project proposals grounded in limitations and open questions from papers in your library. Ideas are generated when requested and saved to My Data &amp; History.
        </p>
      </header>

      <section className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-2">
        <div>
          <label htmlFor="idea-seed" className="mb-2 block text-sm font-semibold text-slate-700">Optional starting idea</label>
          <textarea id="idea-seed" value={seed} onChange={(event) => setSeed(event.target.value)} maxLength={500} rows={4} placeholder="Describe a topic or question you want to explore" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div className="space-y-5">
          <div>
            <div className="mb-2 flex justify-between"><label htmlFor="idea-novelty" className="text-sm font-semibold text-slate-700">Desired novelty</label><span className="text-sm font-semibold text-indigo-700">{novelty}%</span></div>
            <input id="idea-novelty" type="range" min="0" max="100" value={novelty} onChange={(event) => setNovelty(Number(event.target.value))} className="w-full accent-indigo-600" />
          </div>
          <div>
            <label htmlFor="idea-difficulty" className="mb-2 block text-sm font-semibold text-slate-700">Project difficulty</label>
            <select id="idea-difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
              <option value="easy">Quick project (1–3 months)</option>
              <option value="medium">Standard project (3–9 months)</option>
              <option value="hard">Ambitious project (9–18 months)</option>
            </select>
          </div>
        </div>
      </section>

      <ArtifactGenerator
        kinds={["research_ideas"]}
        multiPaper
        maxPapers={10}
        promptContext={promptContext}
        promptPlaceholder="Optional field, application area, or constraint"
        heading="Generate candidate proposals from your papers"
      />
      <p className="text-xs text-slate-500">Generated ideas are starting points, not verified claims of originality. Review the source pages and search current literature before presenting an idea as novel.</p>
    </div>
  );
}
