import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ResearchGapCard from "../components/research/ResearchGapCard";

const tabConfig = [
  { id: "gaps", label: "Identified Gaps", icon: "🔍" },
  { id: "underexplored", label: "Under-explored Areas", icon: "🌱" },
  { id: "contradictions", label: "Contradictions in Literature", icon: "⚔️" },
];

const categoryData = [
  { name: "Methodology", count: 12, color: "from-primary-500 to-primary-600" },
  { name: "Evaluation", count: 8, color: "from-accent-500 to-accent-600" },
  { name: "Data", count: 6, color: "from-success-500 to-success-600" },
  { name: "Efficiency", count: 10, color: "from-warning-500 to-warning-600" },
  { name: "Scaling", count: 4, color: "from-primary-400 to-accent-500" },
  { name: "Safety", count: 5, color: "from-error-500 to-error-600" },
];

const gapsData = {
  gaps: [
    {
      id: 1,
      title: "Limited long-context attention efficiency",
      severity: "High",
      domain: "Methodology",
      description:
        "Standard self-attention has O(n²) complexity, making it prohibitively expensive for documents exceeding ~8k tokens. While sliding window and sparse attention variants exist, they often sacrifice global coherence.",
      whyItMatters:
        "Long document understanding is critical for legal, medical, and scientific domains where context spans hundreds of pages. Current approaches cap context at ~128K tokens at prohibitive cost.",
      potentialApproaches: [
        "Sub-quadratic attention with global context guarantees",
        "Hybrid sparse-dense attention routing mechanisms",
        "Length-extrapolating positional encodings with SSM backbone",
      ],
      relatedPapersCount: 47,
      recency: "Last 30 days",
      published: "Aug 2024",
    },
    {
      id: 2,
      title: "Lack of standardized safety & alignment benchmarks",
      severity: "Medium",
      domain: "Evaluation",
      description:
        "Most current alignment evaluations use proprietary test sets or ad-hoc human assessments. No widely accepted, reproducible benchmark measuring helpfulness, harmlessness, and honesty.",
      whyItMatters:
        "Without standard benchmarks, the field cannot compare safety claims across models, leading to marketing-driven progress rather than measurable advances in trustworthy AI.",
      potentialApproaches: [
        "Open multi-lingual safety benchmark suite",
        "Automated red-teaming pipelines with adversarial attacks",
        "Interpretability-based honesty detector metrics",
      ],
      relatedPapersCount: 32,
      recency: "Last 7 days",
      published: "Aug 2024",
    },
    {
      id: 3,
      title: "Training data attribution & provenance gaps",
      severity: "High",
      domain: "Data",
      description:
        "Large models train on petabytes of curated data with minimal tracking. It remains difficult to answer which training examples caused which output behavior.",
      whyItMatters:
        "Data attribution is essential for copyright compliance, content removal requests, bias auditing, and understanding model debugging at scale.",
      potentialApproaches: [
        "Data influence functions scaled via low-rank approximations",
        "Provenance-augmented data pipelines with watermarking",
        "Membership inference defenses and audits",
      ],
      relatedPapersCount: 19,
      recency: "Last 90 days",
      published: "Jul 2024",
    },
    {
      id: 4,
      title: "Inference-time compute disparity",
      severity: "Medium",
      domain: "Efficiency",
      description:
        "A 175B-parameter model serves every query with the full compute budget, despite most queries being solvable with far smaller models. Conditional compute remains only partially explored.",
      whyItMatters:
        "Serving costs dominate real-world LLM deployments. A 2-4x inference cost reduction at equal quality would save billions annually.",
      potentialApproaches: [
        "Confidence-based early exit strategies",
        "Per-token expert routing policies",
        "Speculative decoding with formal guarantees",
      ],
      relatedPapersCount: 28,
      recency: "Last 14 days",
      published: "Aug 2024",
    },
  ],
  underexplored: [
    {
      id: 5,
      title: "Multi-modal long-context fusion",
      severity: "High",
      domain: "Methodology",
      description:
        "Most long-context models are almost exclusively text-only. How to efficiently fuse long documents with embedded charts, tables, and diagrams at 100K+ token sequences.",
      whyItMatters:
        "Real papers and patents contain critical visual information — pure text models miss entirely.",
      potentialApproaches: [
        "Unified vision-language attention with per-modality routing",
        "Visual token compression for long-document figures",
      ],
      relatedPapersCount: 11,
      recency: "Last 60 days",
      published: "Jun 2024",
    },
    {
      id: 6,
      title: "Low-resource language alignment",
      severity: "High",
      domain: "Data",
      description:
        "RLHF and alignment work focuses almost exclusively on English. Low-resource languages have essentially no aligned baselines or evaluation.",
      whyItMatters:
        "Equitable access to AI benefits 95% of the world's population not served well by English-only models.",
      potentialApproaches: [
        "Cross-lingual transfer of alignment via multilingual anchors",
        "Translation-based bootstrapping with quality controls",
      ],
      relatedPapersCount: 7,
      recency: "Last 90 days",
      published: "May 2024",
    },
  ],
  contradictions: [
    {
      id: 7,
      title: "Scaling laws vs emergent abilities",
      severity: "Medium",
      domain: "Scaling",
      description:
        "One line of work claims emergent abilities appear discontinuously at scale; another claims they are smooth artifacts of metric choice with continuous scaling.",
      whyItMatters:
        "The field's investment thesis depends on this: if emergent is real, scaling is justified; if artifact, paradigm shift needed.",
      potentialApproaches: [
        "Cross-metric, cross-task controlled study at multiple scales",
        "Invariant metric family analysis across tokenizers",
      ],
      relatedPapersCount: 58,
      recency: "Last 14 days",
      published: "Aug 2024",
    },
    {
      id: 8,
      title: "Mixture-of-Experts quality claims",
      severity: "Medium",
      domain: "Efficiency",
      description:
        "Some papers claim MoEs match dense quality at lower cost; others find routing instability and quality degradation on careful matched-compute comparisons.",
      whyItMatters:
        "MoEs are the architecture behind GPT-4, Gemini — need ground truth on quality/cost tradeoffs.",
      potentialApproaches: [
        "Matched-FLOPs controlled benchmarks across datasets",
        "Routing stability metrics across training runs",
      ],
      relatedPapersCount: 41,
      recency: "Last 30 days",
      published: "Jul 2024",
    },
  ],
};

export default function ResearchGap() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("gaps");
  const [generating, setGenerating] = useState(false);
  const [filterDomain, setFilterDomain] = useState("all");
  const [filterImportance, setFilterImportance] = useState("all");
  const [filterRecency, setFilterRecency] = useState("all");

  const currentGaps = gapsData[activeTab] || [];

  const filteredGaps = currentGaps.filter((g) => {
    if (filterDomain !== "all" && g.domain !== filterDomain) return false;
    if (filterImportance !== "all" && g.severity !== filterImportance) return false;
    if (filterRecency !== "all") {
      const recencyMap = { "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days" };
      if (g.recency !== recencyMap[filterRecency]) return false;
    }
    return true;
  });

  const handleExplore = (gap) => {
    navigate("/research-ideas", { state: { seedGap: gap.title } });
  };

  const maxCount = Math.max(...categoryData.map((c) => c.count));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-medium text-primary-600">AI Research Analysis</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Research Gaps Analysis</h1>
          <p className="mt-2 text-slate-500">
            AI identifies unexplored areas in the literature and proposes actionable research directions.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <select className="appearance-none pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20">
              <option>📄 Attention Is All You Need (8 papers)</option>
              <option>📄 Longformer: The Long-Document Transformer</option>
              <option>📁 Upload new paper(s)...</option>
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <button className="px-4 py-2.5 rounded-lg border-2 border-dashed border-slate-200 bg-white text-sm font-bold text-slate-600 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload
          </button>
          <button
            onClick={() => {
              setGenerating(true);
              setTimeout(() => setGenerating(false), 2500);
            }}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold text-sm shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition flex items-center gap-1.5"
          >
            <svg className={'w-4 h-4 ' + (generating ? "animate-spin" : "")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {generating ? "Analyzing..." : "Re-analyze Papers"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(() => {
          const allGaps = Object.values(gapsData).flat();
          const highSeverityCount = allGaps.filter(function(g) { return g.severity === "High"; }).length;
          return [
            { label: "Total Gaps Found", value: allGaps.length, icon: "🔍", sub: highSeverityCount + " high severity" },
            { label: "Avg. Novelty Score", value: "82.5%", icon: "💡", sub: "Above average potential" },
            { label: "Categories Covered", value: categoryData.length, icon: "📂", sub: "Methodology → Safety" },
            { label: "Papers Analyzed", value: 8, icon: "📚", sub: "Citations: 450K+" },
          ].map(function(s, i) {
            return (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-lg hover:shadow-slate-200/60 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">{s.label}</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{s.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{s.sub}</p>
                  </div>
                  <div className="text-3xl">{s.icon}</div>
                </div>
              </div>
            );
          });
        })()}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-black text-lg text-slate-900">Gap Categories Distribution</h3>
            <p className="text-sm text-slate-500 mt-1">Number of identified research gaps by domain</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gradient-to-r from-primary-500 to-primary-600" />
              Gaps count
            </span>
          </div>
        </div>
        <div className="flex items-end gap-4 h-48">
          {categoryData.map((cat, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
              <div className="w-full flex flex-col items-center justify-end h-36">
              <span className="text-xs font-black text-slate-700 mb-1">{cat.count}</span>
              <div
                className={'w-full rounded-t-xl bg-gradient-to-t ' + cat.color + ' transition-all group-hover:opacity-80 shadow-md shadow-primary-500/10'}
                style={{ height: (cat.count / maxCount) * 100 + '%', minHeight: '8px' }}
              />
            </div>
            <div className="h-1 w-full bg-slate-100" />
            <span className="text-xs font-bold text-slate-600 text-center whitespace-nowrap">{cat.name}</span>
          </div>
          ))}
        </div>
      </div>

      <div className="flex gap-1 p-1.5 rounded-2xl bg-slate-100 w-fit">
        {tabConfig.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={'px-5 py-2.5 rounded-xl text-sm font-bold transition-all ' + (
            activeTab === tab.id
              ? "bg-white text-primary-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
          )}
        >
          <span className="mr-2">{tab.icon}</span>
          {tab.label}
          <span className={'ml-2 px-2 py-0.5 rounded-full text-[10px] font-black ' + (activeTab === tab.id ? "bg-primary-100 text-primary-700" : "bg-slate-200 text-slate-600")}>
            {gapsData[tab.id].length}
          </span>
        </button>
      ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-wrap items-center gap-3">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400">Filters:</span>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Domain</label>
          <select
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="all">All Domains</option>
            <option>Methodology</option>
            <option>Evaluation</option>
            <option>Data</option>
            <option>Efficiency</option>
            <option>Scaling</option>
            <option>Safety</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Importance</label>
          <select
            value={filterImportance}
            onChange={(e) => setFilterImportance(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="all">All Levels</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Recency</label>
          <select
            value={filterRecency}
            onChange={(e) => setFilterRecency(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="all">Any Time</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
        <div className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-bold">
          {filteredGaps.length} result{filteredGaps.length !== 1 ? "s" : ""}
        </div>
      </div>

      {filteredGaps.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredGaps.map((gap) => (
            <ResearchGapCard
              key={gap.id}
              gap={gap}
              onExplore={handleExplore}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white p-12 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-xl font-black text-slate-900">No gaps match your filters</h3>
          <p className="mt-2 text-sm text-slate-500">Try adjusting the filters above or clear all</p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-primary-600 to-accent-500 p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">Ready to explore research directions?</h2>
          <p className="mt-1 text-white/80 max-w-xl">
            Based on the gaps above, ScholarMind can formulate concrete research ideas with methods, baselines, and experimental plans.
          </p>
        </div>
        <button
          onClick={() => navigate("/research-ideas")}
          className="px-6 py-3.5 rounded-xl bg-white text-primary-700 font-bold shadow-xl hover:scale-105 transition flex items-center gap-2 flex-shrink-0"
        >
          💡 Generate Research Ideas
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
