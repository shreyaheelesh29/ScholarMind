import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ResearchIdeaCard from "../components/research/ResearchIdeaCard";

const allIdeas = [
  {
    id: 1,
    title: "FlashAttention-3: Fused Attention with State-Space Backbone for Long Context",
    field: ["ML Systems", "Long Context"],
    noveltyScore: 9,
    feasibilityScore: 68,
    description:
      "Combine FlashAttention's IO-aware tiling with a parallel state-space (Mamba) layer as a cheap global routing mechanism. This aims to match full attention quality at O(n) cost.",
    methodologySketch: [
      "Retain FlashAttention's block-sparse forward/backward kernels",
      "Inject a small Mamba/S4 layer in parallel to produce K/V routing signals",
      "Gated fusion network combining sparse attention output with SSM global context",
      "Fine-tune on LongBench, SCROLLS, and 128K-document QA",
    ],
    estimatedImpact: "Top-tier ML conference — NeurIPS/ICML/MLSys",
    requiredResources: "8x A100-80GB; access to FlashAttention CUDA codebase",
    targetVenue: "NeurIPS / MLSys",
    novelty: 94,
    feasibility: 68,
    methods: [
      "Retain FlashAttention's block-sparse forward/backward kernels",
      "Inject a small Mamba/S4 layer in parallel to produce K/V routing signals",
      "Gated fusion network combining sparse attention output with SSM global context",
      "Fine-tune on LongBench, SCROLLS, and 128K-document QA",
    ],
    resources: "8x A100-80GB; access to FlashAttention CUDA codebase",
  },
  {
    id: 2,
    title: "TruthSeeker Bench: Open Multi-Lingual Honesty Evaluation",
    field: ["Evaluation", "NLP", "Safety"],
    noveltyScore: 8,
    feasibilityScore: 90,
    description:
      "Curate an open, 10-language benchmark with ~50K controlled factuality and harmlessness probes, plus an automatic red-teaming harness.",
    methodologySketch: [
      "Crowd-source fact-checkable claims in 10 languages",
      "Design contrast-consistent evaluation: paraphrased probes must yield same truth label",
      "Automated red-team attack surface (jailbreaks, prefix injections, role-play)",
      "Human vs. automated judge correlation study across 30+ models",
    ],
    estimatedImpact: "Strong NLP / Ethics venue — ACL/EMNLP",
    requiredResources: "$2K crowdsourcing budget; modest GPU for eval harness",
    targetVenue: "ACL / EMNLP",
    novelty: 80,
    feasibility: 90,
    methods: [
      "Crowd-source fact-checkable claims in 10 languages",
      "Design contrast-consistent evaluation",
      "Automated red-team attack surface",
      "Human vs. automated judge correlation study",
    ],
    resources: "$2K crowdsourcing budget; modest GPU for eval harness",
  },
  {
    id: 3,
    title: "DataShapley-175B: Scalable Training Data Attribution",
    field: ["ML Theory", "Data", "Systems"],
    noveltyScore: 9,
    feasibilityScore: 62,
    description:
      "Adapt Shapley-value data attribution to billion-parameter models via low-rank delta estimators and influence function approximations.",
    methodologySketch: [
      "Parameter-efficient fine-tuning (LoRA) on checkpoints for delta comparison",
      "Sub-sampled influence functions via randomized SVD on Hessian",
      "Retrieval-augmented attribution: retrieve nearest training neighbors for each output token",
      "Ablate: remove top-K attributed documents, re-measure downstream delta",
    ],
    estimatedImpact: "Top-tier ML / Systems venue — ICML/NeurIPS",
    requiredResources: "32-64 A100s for ablations; access to 70B model checkpoints",
    targetVenue: "ICML / NeurIPS",
    novelty: 88,
    feasibility: 62,
    methods: [
      "Parameter-efficient fine-tuning (LoRA) on checkpoints for delta comparison",
      "Sub-sampled influence functions via randomized SVD on Hessian",
      "Retrieval-augmented attribution",
      "Ablate: remove top-K attributed documents",
    ],
    resources: "32-64 A100s for ablations; access to 70B model checkpoints",
  },
  {
    id: 4,
    title: "CALM: Confidence-Aware Layered Model Merging",
    field: ["Efficiency", "LLM", "Systems"],
    noveltyScore: 8,
    feasibilityScore: 82,
    description:
      "Merge small/medium/large checkpoints into a single network with layer-wise confidence gates that dispatch queries to appropriate depths dynamically.",
    methodologySketch: [
      "Pre-trained tiers: 1B, 7B, 70B",
      "Lightweight per-layer confidence classifier → continue or 'jump' to larger layers",
      "Joint distillation objective preserving all tiers",
      "Simulate real-world query difficulty distributions",
    ],
    estimatedImpact: "Strong ML / Systems venue — ICLR/MLSys",
    requiredResources: "Access to 70B + 7B checkpoints; 8-16 GPUs for profiling",
    targetVenue: "ICLR / MLSys",
    novelty: 76,
    feasibility: 82,
    methods: [
      "Pre-trained tiers: 1B, 7B, 70B",
      "Lightweight per-layer confidence classifier",
      "Joint distillation objective preserving all tiers",
      "Simulate real-world query difficulty distributions",
    ],
    resources: "Access to 70B + 7B checkpoints; 8-16 GPUs for profiling",
  },
];

const fields = ["All Fields", "ML Systems", "Long Context", "Evaluation", "NLP", "Safety", "ML Theory", "Data", "Efficiency", "LLM"];

export default function ResearchIdeas() {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [savedIdeas, setSavedIdeas] = useState([2]);
  const [showSaved, setShowSaved] = useState(false);
  const [seedIdea, setSeedIdea] = useState("Long-context attention efficiency for 128K+ token documents");
  const [novelty, setNovelty] = useState(75);
  const [difficulty, setDifficulty] = useState("medium");
  const [filterField, setFilterField] = useState("All Fields");
  const [filterFeasibility, setFilterFeasibility] = useState("all");
  const [filterNovelty, setFilterNovelty] = useState("all");

  const filteredIdeas = allIdeas.filter((idea) => {
    if (showSaved && !savedIdeas.includes(idea.id)) return false;
    if (filterField !== "All Fields" && !idea.field.includes(filterField)) return false;
    if (filterFeasibility !== "all") {
      if (filterFeasibility === "high" && idea.feasibilityScore < 80) return false;
      if (filterFeasibility === "medium" && (idea.feasibilityScore < 60 || idea.feasibilityScore >= 80)) return false;
      if (filterFeasibility === "low" && idea.feasibilityScore >= 60) return false;
    }
    if (filterNovelty !== "all") {
      if (filterNovelty === "high" && idea.noveltyScore < 9) return false;
      if (filterNovelty === "medium" && (idea.noveltyScore < 7 || idea.noveltyScore >= 9)) return false;
      if (filterNovelty === "low" && idea.noveltyScore >= 7) return false;
    }
    return true;
  });

  const handleSave = (idea) => {
    setSavedIdeas((prev) =>
      prev.includes(idea.id) ? prev.filter((id) => id !== idea.id) : [...prev, idea.id]
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-medium text-primary-600">AI Research Analysis</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Research Ideas Generator</h1>
          <p className="mt-2 text-slate-500">
            Concrete, actionable research proposals with methods, baselines, datasets, and target venues.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-primary-50/30 to-accent-50/30 p-6">
        <h3 className="font-black text-lg text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center text-sm">
            ✨
          </span>
          Idea Generation Settings
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
              Seed Idea / Paper(s)
            </label>
            <textarea
              value={seedIdea}
              onChange={(e) => setSeedIdea(e.target.value)}
              rows={5}
              placeholder="Describe your starting point, research gap, or paste paper titles..."
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20 outline-none transition resize-none text-sm text-slate-900"
            />
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Desired Novelty Level
                </label>
                <span className="text-sm font-black text-accent-600">{novelty}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={novelty}
                onChange={(e) => setNovelty(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                style={{
                  background: 'linear-gradient(to right, #6366f1 0%, #d946ef ' + novelty + '%, #e2e8f0 ' + novelty + '%)',
                }}
              />
              <div className="flex justify-between mt-1 text-[10px] font-bold text-slate-400 uppercase">
                <span>Safe / Incremental</span>
                <span>High Risk / High Reward</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                Desired Difficulty
              </label>
              <div className="flex gap-2">
                {[
                  { id: "easy", label: "Quick Win", sub: "1-3 mo." },
                  { id: "medium", label: "Standard", sub: "3-9 mo." },
                  { id: "hard", label: "Ambitions", sub: "9-18 mo." },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id)}
                    className={'flex-1 p-3 rounded-xl border-2 transition text-left ' + (
                      difficulty === d.id
                        ? "border-primary-500 bg-primary-50 shadow-md shadow-primary-500/10"
                        : "border-slate-200 bg-white hover:border-primary-300"
                    )}
                  >
                    <p className={'text-xs font-black ' + (difficulty === d.id ? "text-primary-700" : "text-slate-600")}>
                      {d.label}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{d.sub}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 justify-end">
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
              {[
                { label: "Seed Paper", value: "8 papers in scope", icon: "📄" },
                { label: "Target Venues", value: "Top 4 ML/NLP", icon: "🎯" },
                { label: "Compute Budget", value: "Pro Tier", icon: "💻" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-500">
                    <span>{item.icon}</span>
                    <span className="font-semibold">{item.label}</span>
                  </span>
                  <span className="font-black text-slate-800">{item.value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setGenerating(true);
                setTimeout(() => setGenerating(false), 2500);
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 text-white font-black shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all flex items-center justify-center gap-2"
            >
              <svg className={'w-5 h-5 ' + (generating ? "animate-spin" : "")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {generating ? "Generating New Ideas..." : "🔄 Generate More Ideas"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 p-1.5 rounded-2xl bg-slate-100">
          <button
            onClick={() => setShowSaved(false)}
            className={'px-5 py-2 rounded-xl text-sm font-bold transition ' + (
              !showSaved ? "bg-white text-primary-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            🔬 All Ideas ({allIdeas.length})
          </button>
          <button
            onClick={() => setShowSaved(true)}
            className={'px-5 py-2 rounded-xl text-sm font-bold transition ' + (
              showSaved ? "bg-white text-primary-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            ⭐ Saved ({savedIdeas.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500">Field</label>
            <select
              value={filterField}
              onChange={(e) => setFilterField(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20"
            >
              {fields.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500">Feasibility</label>
            <select
              value={filterFeasibility}
              onChange={(e) => setFilterFeasibility(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="all">All Levels</option>
              <option value="high">High (≥80)</option>
              <option value="medium">Medium (60-79)</option>
              <option value="low">Low ({'<60'})</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500">Novelty</label>
            <select
              value={filterNovelty}
              onChange={(e) => setFilterNovelty(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="all">All Levels</option>
              <option value="high">★★★★★ (9-10)</option>
              <option value="medium">★★★★ (7-8)</option>
              <option value="low">★★★ ({'<7'})</option>
            </select>
          </div>
        </div>
      </div>

      {showSaved && savedIdeas.length > 0 && (
        <div className="rounded-2xl border-2 border-accent-200 bg-gradient-to-br from-accent-50/50 via-white to-primary-50/30 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">⭐</span>
            <h3 className="font-black text-xl text-slate-900">Your Saved Research Ideas</h3>
            <span className="px-3 py-1 rounded-full bg-accent-500 text-white text-xs font-black ml-auto">
              {savedIdeas.length} bookmarked
            </span>
          </div>
        </div>
      )}

      {filteredIdeas.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredIdeas.map((idea) => (
            <ResearchIdeaCard key={idea.id} idea={idea} onSave={handleSave} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white p-12 text-center">
          <div className="text-5xl mb-4">{showSaved ? "⭐" : "💡"}</div>
          <h3 className="text-xl font-black text-slate-900">
            {showSaved ? "No saved ideas yet" : "No ideas match your filters"}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {showSaved ? "Bookmark ideas to access them here quickly" : "Try adjusting filters or generate more ideas"}
          </p>
        </div>
      )}

      <div className="rounded-2xl border-2 border-dashed border-primary-300 bg-gradient-to-br from-primary-50/50 to-white p-8 text-center">
        <div className="text-4xl mb-3">✨</div>
        <h3 className="text-xl font-black text-slate-900">Ready to pitch your idea?</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-lg mx-auto">
          Turn the research plan above into a ready-to-present slide deck with one click — including title slide, motivation, methods, experiments, and timeline.
        </p>
        <button
          onClick={() => navigate("/ppt")}
          className="mt-5 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition inline-flex items-center gap-2"
        >
          🎨 Turn Idea Into PPT
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
