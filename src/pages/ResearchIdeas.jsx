import { useState } from "react";
import { Link } from "react-router-dom";
import ArtifactGenerator from "../components/research/ArtifactGenerator";

const noveltyLabels = {
  grounded: "Build on established work",
  balanced: "Balance novelty and feasibility",
  exploratory: "Explore a less-established direction",
};

const sections = [
  ["Research question", "research_question"],
  ["Why it matters", "motivation"],
  ["Proposed approach", "methodology"],
  ["How to evaluate it", "evaluation"],
  ["Risks and limitations", "risks"],
];

function normalizeFilename(value = "") {
  return value.split("/").pop().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function IdeaSources({ sources, papers }) {
  if (!Array.isArray(sources) || sources.length === 0) return null;

  return <div className="mt-5 border-t border-slate-100 pt-4">
    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Evidence to review</p>
    <div className="flex flex-wrap gap-2">
      {sources.map((source, index) => {
        const name = typeof source === "string" ? source : source.paper || source.filename || source.title || "Source paper";
        const page = typeof source === "object" ? source.page : null;
        const paper = papers.find((item) => normalizeFilename(item.filename) === normalizeFilename(name));
        const label = `${name}${page ? ` · p. ${page}` : ""}`;
        return paper && page
          ? <Link key={`${name}-${page}-${index}`} to={`/viewer?paperId=${encodeURIComponent(paper.id)}&page=${encodeURIComponent(page)}`} className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-800 transition hover:border-indigo-300 hover:bg-indigo-100">{label} ↗</Link>
          : <span key={`${name}-${index}`} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600">{label}</span>;
      })}
    </div>
  </div>;
}

function IdeaCard({ idea, index, papers }) {
  const [copyState, setCopyState] = useState("idle");
  const title = idea.title || `Research direction ${index + 1}`;
  const copyIdea = async () => {
    const text = [title, ...sections.map(([label, key]) => idea[key] ? `${label}: ${idea[key]}` : "")].filter(Boolean).join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("unavailable");
      window.setTimeout(() => setCopyState("idle"), 2200);
    }
  };

  return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-start gap-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 to-white p-5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">{String(index + 1).padStart(2, "0")}</span>
      <div className="min-w-0 flex-1"><h3 className="text-lg font-bold leading-snug text-slate-900">{title}</h3>
        {idea.area && <p className="mt-1 text-sm text-indigo-700">{idea.area}</p>}
      </div>
      <button type="button" onClick={copyIdea} className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700" aria-label={`Copy ${title}`}>
        {copyState === "copied" ? "Copied" : copyState === "unavailable" ? "Copy unavailable" : "Copy idea"}
      </button>
    </div>
    <div className="grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
      {sections.map(([label, key]) => idea[key] && <section key={key} className={key === "research_question" ? "sm:col-span-2" : ""}>
        <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</h4>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{idea[key]}</p>
      </section>)}
      {idea.feasibility && <section><h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Feasibility</h4><p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{idea.feasibility}</p></section>}
    </div>
    <div className="px-5 pb-5"><IdeaSources sources={idea.sources || idea.citations} papers={papers} /></div>
  </article>;
}

function ResearchIdeasOutput(payload, { papers }) {
  const ideas = Array.isArray(payload?.ideas) ? payload.ideas : Array.isArray(payload) ? payload : null;
  if (!ideas) return <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">The response did not contain proposals in the expected format. You can still review the generated material below.</div>;
  if (ideas.length === 0) return <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No complete proposals came back for this request. Try narrowing the topic or selecting different papers.</p>;
  return <div className="space-y-4">{ideas.map((idea, index) => typeof idea === "object" && idea !== null
    ? <IdeaCard key={`${idea.title || "idea"}-${index}`} idea={idea} index={index} papers={papers} />
    : <div key={index} className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">{String(idea)}</div>)}
    <p className="px-1 text-xs leading-relaxed text-slate-500">These are candidate directions synthesized from the selected papers. Source links show where to verify the supporting evidence; originality still needs a literature search.</p>
  </div>;
}

export default function ResearchIdeas() {
  const [topic, setTopic] = useState("");
  const [constraints, setConstraints] = useState("");
  const [novelty, setNovelty] = useState("balanced");
  const [difficulty, setDifficulty] = useState("medium");
  const promptContext = [
    `Novelty preference: ${noveltyLabels[novelty]}.`,
    `Project scope: ${difficulty}.`,
    topic.trim() ? `Research area or question: ${topic.trim()}` : "Identify a promising direction from evidence-backed gaps in the selected papers.",
    constraints.trim() ? `Practical constraints: ${constraints.trim()}` : "",
    "For each proposal, provide a concise title, a specific research question, motivation grounded in the selected papers, a feasible methodology, an evaluation plan, risks or limitations, and source filenames with page numbers. Do not claim novelty is verified.",
  ].filter(Boolean).join("\n");

  return <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
    <header className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-white p-6 sm:p-8">
      <p className="text-sm font-semibold text-indigo-700">Turn paper gaps into next steps</p>
      <h1 className="mt-1 text-3xl font-bold text-slate-900">Research Ideas</h1>
      <p className="mt-2 max-w-3xl text-slate-600">Build focused, practical proposal drafts from the evidence in your library. Choose a few related papers, set your constraints, then follow each source link back to the relevant PDF page.</p>
    </header>

    <section aria-labelledby="idea-settings-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5"><h2 id="idea-settings-title" className="font-bold text-slate-900">Shape the ideas</h2><p className="mt-1 text-sm text-slate-500">Specific topics and real-world limits make the proposals more useful.</p></div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="idea-topic" className="mb-2 block text-sm font-semibold text-slate-700">Topic or question <span className="font-normal text-slate-400">(optional)</span></label>
          <input id="idea-topic" value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={300} placeholder="e.g., making attention models more efficient for long documents" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div>
          <label htmlFor="idea-novelty" className="mb-2 block text-sm font-semibold text-slate-700">Direction</label>
          <select id="idea-novelty" value={novelty} onChange={(event) => setNovelty(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700">
            {Object.entries(noveltyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="idea-difficulty" className="mb-2 block text-sm font-semibold text-slate-700">Project scope</label>
          <select id="idea-difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700">
            <option value="easy">Small and feasible · 1–3 months</option>
            <option value="medium">Standard project · 3–9 months</option>
            <option value="hard">Ambitious project · 9–18 months</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="idea-constraints" className="mb-2 block text-sm font-semibold text-slate-700">Constraints <span className="font-normal text-slate-400">(optional)</span></label>
          <textarea id="idea-constraints" value={constraints} onChange={(event) => setConstraints(event.target.value)} maxLength={500} rows={2} placeholder="Available datasets, hardware, methods, population, or course requirements" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
        </div>
      </div>
    </section>

    <ArtifactGenerator
      kinds={["research_ideas"]}
      multiPaper
      maxPapers={4}
      minPapers={1}
      promptContext={promptContext}
      promptPlaceholder="Add a method, population, or other detail to focus on"
      heading="Select papers and generate proposals"
      renderPayload={ResearchIdeasOutput}
    />
  </div>;
}
