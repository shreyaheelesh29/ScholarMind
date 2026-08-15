import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ComparisonTable from "../components/research/ComparisonTable";

const paperLibrary = [
  {
    id: "transformer",
    title: "Attention Is All You Need",
    short: "Transformer",
    authors: "Vaswani et al.",
    year: "2017",
    data: {
      Title: "Attention Is All You Need",
      Authors: "Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin",
      Year: "2017",
      Methodology: [
        "Encoder-decoder architecture with 6 layers each",
        "Multi-head self-attention (h=8 heads, d_k=64)",
        "Scaled dot-product attention with √d_k normalization",
        "Sinusoidal positional encodings injected at input",
        "Residual connections + LayerNorm around each sub-layer",
      ],
      Dataset: [
        "WMT 2014 English→German (4.5M sentence pairs)",
        "WMT 2014 English→French (36M sentence pairs)",
        "Byte-pair encoding (BPE) for tokenization",
      ],
      Results: [
        "En→De: 28.4 BLEU (new SOTA, +2.0 over previous best)",
        "En→Fr: 41.0 BLEU (new SOTA ensemble record)",
        "Training: 3.5 days on 8 NVIDIA P100 GPUs",
      ],
      Strengths: [
        "Massively parallelizable — no sequential compute bottleneck",
        "Superior empirical performance on translation benchmarks",
        "Directly extensible to multi-modal and cross-domain tasks",
      ],
      Weaknesses: [
        "O(n²) memory and compute in sequence length",
        "Sin/cos positional encodings don't extrapolate lengths",
        "Lacks the built-in locality biases of CNNs/RNNs",
      ],
    },
  },
  {
    id: "bert",
    title: "BERT: Pre-training of Deep Bidirectional Transformers",
    short: "BERT",
    authors: "Devlin et al.",
    year: "2018",
    data: {
      Title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
      Authors: "Jacob Devlin, Ming-Wei Chang, Kenton Lee, Kristina Toutanova",
      Year: "2018",
      Methodology: [
        "Encoder-only Transformer (12 layers Base / 24 layers Large)",
        "Masked Language Modeling (MLM) — bidirectional pre-training",
        "Next Sentence Prediction (NSP) for sentence-pair tasks",
        "WordPiece tokenizer (30K vocab)",
        "Fine-tune a single classification head on each downstream task",
      ],
      Dataset: [
        "BookCorpus (800M words) + English Wikipedia (2,500M words)",
        "Evaluated on GLUE, SQuAD, SWAG, MultiNLI benchmarks",
      ],
      Results: [
        "GLUE benchmark: 80.5% average (new SOTA by +7% at release)",
        "SQuAD 1.1: 93.2% F1, surpassing human performance",
        "SQuAD 2.0: 83.1% F1 (SOTA at release)",
      ],
      Strengths: [
        "Deep bidirectional context — learns from both directions simultaneously",
        "Minimal task-specific architectures — one model, many tasks",
        "Open source release catalyzed entire NLP research ecosystem",
      ],
      Weaknesses: [
        "MLM pretraining/fine-tuning mismatch — [MASK] tokens absent at fine-tune",
        "NSP objective shown noisy; later work (RoBERTa) removed it entirely",
        "Absolute positional encodings don't generalize sequence length",
      ],
    },
  },
  {
    id: "gpt3",
    title: "Language Models are Few-Shot Learners",
    short: "GPT-3",
    authors: "Brown et al.",
    year: "2020",
    data: {
      Title: "Language Models are Few-Shot Learners",
      Authors: "Tom B. Brown, Benjamin Mann, Nick Ryder, Melanie Subbiah, Jared Kaplan, Prafulla Dhariwal, Arvind Neelakantan, Pranav Shyam, Girish Sastry, Amanda Askell, et al.",
      Year: "2020",
      Methodology: [
        "Decoder-only Transformer, scaled to 175B parameters",
        "Autoregressive next-token prediction (no masking)",
        "In-context learning: few-shot demonstrations via prompt",
        "96-layer, 128 attention heads, d_model=12,288",
        "Evaluated zero-shot, one-shot, few-shot — no gradient updates",
      ],
      Dataset: [
        "CommonCrawl filtered (410B tokens, 60% of training)",
        "WebText2 (19B tokens), Books1/Books2 (67B tokens total)",
        "English Wikipedia (3B tokens)",
      ],
      Results: [
        "Few-shot SOTA on many NLP benchmarks without any fine-tuning",
        "TriviaQA: 71.2% accuracy (few-shot, closed-book)",
        "LAMBADA: 86.4% accuracy (SOTA at time of publication)",
      ],
      Strengths: [
        "Emergent capabilities appear predictably with scale",
        "Zero/few-shot prompting removes per-task fine-tuning burden",
        "Broad task coverage without bespoke architecture changes",
      ],
      Weaknesses: [
        "Closed weights: only API access, no reproduction possible",
        "Estimated training cost ~$4.6M — prohibitive for academia",
        "In-context learning is brittle and sample-inefficient",
      ],
    },
  },
];

const radarCategories = [
  "Innovation",
  "Performance",
  "Efficiency",
  "Reproducibility",
  "Ecosystem Impact",
  "Practical Usability",
];

const paperRadarScores = {
  transformer: [95, 88, 72, 90, 98, 70],
  bert: [90, 92, 68, 92, 95, 88],
  gpt3: [85, 95, 45, 25, 90, 96],
};

const overallScores = [
  { id: "transformer", score: 89, rank: 1 },
  { id: "bert", score: 88, rank: 2 },
  { id: "gpt3", score: 80, rank: 3 },
];

export default function PaperComparison() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(["transformer", "bert", "gpt3"]);

  const togglePaper = (slotIndex, paperId) => {
    const next = [...selected];
    next[slotIndex] = paperId;
    setSelected(next);
  };

  const addThirdPaper = () => {
    if (selected.length < 3) {
      const remaining = paperLibrary.find((p) => !selected.includes(p.id));
      if (remaining) setSelected([...selected, remaining.id]);
    }
  };

  const removeThirdPaper = () => {
    if (selected.length === 3) setSelected(selected.slice(0, 2));
  };

  const papers = selected
    .map((id) => paperLibrary.find((p) => p.id === id))
    .filter(Boolean);

  const bestPerRow = {
    Year: papers.findIndex((p) => parseInt(p?.data?.Year || "0") === Math.max(...papers.map((p) => parseInt(p?.data?.Year || "0")))),
    Results: papers.findIndex((p) => p.id === "gpt3"),
    Strengths: papers.findIndex((p) => p.id === "bert"),
    Weaknesses: papers.findIndex((p) => p.id === "transformer"),
  };

  const renderRadarChart = () => {
    const numSides = radarCategories.length;
    const cx = 150;
    const cy = 150;
    const radius = 110;

    const getPoint = (index, value, r = radius) => {
      const angle = (Math.PI * 2 * index) / numSides - Math.PI / 2;
      const scaledR = (value / 100) * r;
      return [cx + scaledR * Math.cos(angle), cy + scaledR * Math.sin(angle)];
    };

    const getAxisPoint = (index, r = radius) => {
      const angle = (Math.PI * 2 * index) / numSides - Math.PI / 2;
      return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
    };

    const colors = ["#6366f1", "#d946ef", "#22c55e"];

    return (
      <svg viewBox="0 0 300 300" className="w-full h-full">
        <defs>
          {papers.map((_, i) => (
            <linearGradient key={i} id={`radar-fill-${i}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={colors[i]} stopOpacity="0.25" />
              <stop offset="100%" stopColor={colors[i]} stopOpacity="0.1" />
            </linearGradient>
          ))}
        </defs>

        {[0.25, 0.5, 0.75, 1].map((scale) => {
          const points = radarCategories
            .map((_, i) => {
              const [x, y] = getAxisPoint(i, radius * scale);
              return `${x},${y}`;
            })
            .join(" ");
          return <polygon key={scale} points={points} fill="none" stroke="#e2e8f0" strokeWidth={scale === 1 ? 1.5 : 1} strokeDasharray={scale < 1 ? "3 3" : undefined} />;
        })}

        {radarCategories.map((_, i) => {
          const [x, y] = getAxisPoint(i);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e2e8f0" strokeWidth={1} />;
        })}

        {papers.map((p, paperIdx) => {
          const scores = paperRadarScores[p.id] || Array(6).fill(50);
          const points = scores
            .map((score, i) => {
              const [x, y] = getPoint(i, score);
              return `${x},${y}`;
            })
            .join(" ");
          return (
            <g key={p.id}>
              <polygon points={points} fill={`url(#radar-fill-${paperIdx})`} stroke={colors[paperIdx]} strokeWidth={2} strokeLinejoin="round" />
              {scores.map((score, i) => {
                const [x, y] = getPoint(i, score);
                return <circle key={i} cx={x} cy={y} r={3.5} fill={colors[paperIdx]} stroke="white" strokeWidth={1.5} />;
              })}
            </g>
          );
        })}

        {radarCategories.map((cat, i) => {
          const [x, y] = getAxisPoint(i, radius + 20);
          return (
            <text
              key={cat}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[11px] font-bold fill-slate-600"
            >
              {cat}
            </text>
          );
        })}
      </svg>
    );
  };

  const paperSwatches = [
    { bg: "bg-primary-500", ring: "ring-primary-200", text: "text-primary-700", pill: "bg-primary-100" },
    { bg: "bg-accent-500", ring: "ring-accent-200", text: "text-accent-700", pill: "bg-accent-100" },
    { bg: "bg-success-500", ring: "ring-success-200", text: "text-success-700", pill: "bg-success-100" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-sm font-medium text-primary-600">AI Research Analysis</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Paper Comparison</h1>
        <p className="mt-2 text-slate-500">
          Side-by-side analysis of 2-3 research papers with AI-generated synthesis and multi-dimensional scoring.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Select Papers to Compare</h3>
            <p className="text-sm text-slate-500 mt-0.5">Choose 2 or 3 papers from your library.</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
              {papers.length} paper{papers.length !== 1 ? "s" : ""} loaded
            </span>
            {selected.length === 2 ? (
              <button
                onClick={addThirdPaper}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition"
              >
                <span className="text-primary-600 font-black">+</span> Add 3rd Paper
              </button>
            ) : (
              <button
                onClick={removeThirdPaper}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold transition"
              >
                Remove 3rd
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((slot) => {
            const swatch = paperSwatches[slot];
            const currentId = selected[slot];
            const disabled = slot === 2 && selected.length < 3;
            return (
              <div
                key={slot}
                className={`relative rounded-2xl border-2 p-5 transition ${
                  disabled
                    ? "border-dashed border-slate-200 bg-slate-50/50 opacity-70"
                    : "border-slate-200 bg-gradient-to-br from-white to-slate-50 hover:border-primary-300 hover:shadow-md"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-xl ${swatch.bg} text-white font-black text-sm flex items-center justify-center shadow-md shadow-${slot === 0 ? "primary" : slot === 1 ? "accent" : "success"}-500/20`}>
                      {String.fromCharCode(65 + slot)}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full ${swatch.pill} ${swatch.text} text-[10px] font-black uppercase tracking-wide`}>
                      Paper {String.fromCharCode(65 + slot)}
                    </span>
                  </div>
                </div>

                {disabled ? (
                  <button
                    onClick={addThirdPaper}
                    className="w-full h-full min-h-[88px] rounded-xl border-2 border-dashed border-slate-300 hover:border-primary-400 hover:bg-white flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:text-primary-600 transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-sm font-bold">Click to add Paper C</span>
                  </button>
                ) : (
                  <select
                    value={currentId}
                    onChange={(e) => togglePaper(slot, e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition cursor-pointer"
                  >
                    {paperLibrary.map((p) => (
                      <option key={p.id} value={p.id} disabled={selected.includes(p.id) && p.id !== currentId}>
                        {p.short} — {p.title}
                      </option>
                    ))}
                  </select>
                )}

                {!disabled && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500">
                      {paperLibrary.find((p) => p.id === currentId)?.authors} • {paperLibrary.find((p) => p.id === currentId)?.year}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ComparisonTable papers={papers} bestPerRow={bestPerRow} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md shadow-primary-500/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Multi-dimensional Comparison</h3>
                <p className="text-xs text-slate-500">Radar chart across 6 key evaluation axes</p>
              </div>
            </div>
          </div>

          <div className="aspect-square max-w-md mx-auto">
            {renderRadarChart()}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-5 pt-4 border-t border-slate-100">
            {papers.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2.5">
                <span className={`w-3.5 h-3.5 rounded-full ${paperSwatches[i].bg} ring-4 ${paperSwatches[i].ring}`} />
                <div>
                  <p className="text-sm font-bold text-slate-800 leading-none">{p.short}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{p.year}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning-500 to-accent-500 flex items-center justify-center shadow-md shadow-warning-500/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Overall Scores</h3>
                <p className="text-xs text-slate-500">Weighted composite ranking</p>
              </div>
            </div>

            <div className="space-y-4">
              {papers.map((p, i) => {
                const info = overallScores.find((s) => s.id === p.id);
                const score = info?.score || 75;
                const rank = info?.rank || i + 1;
                const swatch = paperSwatches[i];
                const rankGradients = [
                  "from-yellow-400 to-amber-500",
                  "from-slate-300 to-slate-500",
                  "from-orange-400 to-orange-600",
                ];
                return (
                  <div key={p.id} className="relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${swatch.bg}`} />
                        <span className="text-sm font-bold text-slate-800 leading-tight">{p.short}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br ${rankGradients[rank - 1]} text-white text-[11px] font-black shadow-sm`}>
                          #{rank}
                        </span>
                        <span className={`text-lg font-black ${swatch.text} tabular-nums`}>{score}</span>
                      </div>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${swatch.bg} shadow-inner transition-all`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 gap-3">
              {[
                { label: "Top Innovation", value: "Transformer", tone: "primary" },
                { label: "Top Performance", value: "GPT-3", tone: "accent" },
                { label: "Most Reproducible", value: "Transformer", tone: "success" },
                { label: "Broadest Impact", value: "BERT", tone: "warning" },
              ].map((award) => (
                <div key={award.label} className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{award.label}</p>
                  <p className={`text-sm font-black mt-0.5 text-${award.tone}-700`}>{award.value}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate("/literature-review")}
            className="w-full p-5 rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 text-white shadow-xl shadow-primary-500/25 hover:shadow-2xl hover:shadow-primary-500/35 transition group"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-bold opacity-90">Next step</p>
                <p className="text-lg font-black mt-0.5">Generate Literature Review →</p>
              </div>
              <svg className="w-8 h-8 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 via-white to-accent-50 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg shadow-primary-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 text-lg">AI Synthesis: Differences & Complementary Strengths</h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-700 text-[11px] font-black uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                ScholarMind AI
              </span>
            </div>

            <div className="mt-4 space-y-4 text-sm text-slate-700 leading-relaxed">
              <p>
                These three papers collectively trace the evolution of the Transformer paradigm from pure architectural
                innovation (Vaswani 2017) to task-agnostic pre-training (BERT, 2018) and emergent few-shot
                capability at extreme scale (GPT-3, 2020). While they share the core self-attention backbone, each
                occupies a distinct and complementary region of the design space.
              </p>
              <p>
                <span className="font-bold text-primary-800">The Transformer</span> contributes the foundational
                architecture — it is the only encoder-decoder model of the three and excels at structured transduction
                tasks such as translation where explicit alignment between input and output is critical. Its strength
                lies in <em>conceptual clarity and reproducibility</em>: a 65M-parameter model trainable on 8 GPUs in
                3.5 days, with open-source code that seeded an entire ecosystem. Researchers building domain-specific
                seq2seq models or exploring novel attention variants should anchor on this paper.
              </p>
              <p>
                <span className="font-bold text-accent-800">BERT</span> pivots to the encoder-only design and
                introduces the <em>bidirectional pre-training</em> paradigm that dominated NLU from 2018 onwards. Its
                greatest contribution is not raw architecture but the recipe for task transfer: pretrain once on
                massive unlabeled text, then fine-tune a tiny classification head per task. For NLU benchmarks,
                question answering, or sentence-pair classification, BERT-style models remain the pragmatic choice
                when compute budgets are modest and state-of-the-art accuracy is required.
              </p>
              <p>
                <span className="font-bold text-success-800">GPT-3</span> pushes the decoder-only variant to 175B
                parameters and demonstrates that emergent in-context learning can, for many tasks, match or exceed
                supervised fine-tuning — without any gradient updates. This property is transformative for product
                teams and end-users, who can solve novel tasks purely through prompting. The tradeoff is{" "}
                <em>accessibility and reproducibility</em>: the closed-weight model is available only via API, and
                reproduction costs are prohibitive. GPT-3 excels where generality and promptability matter more than
                cost, control, or auditability.
              </p>
              <div className="rounded-xl bg-white/70 border border-primary-100 p-4 mt-2">
                <p className="text-xs font-black uppercase tracking-wider text-primary-700 mb-2">
                  ✦ Practical Takeaway
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  None of these three models dominates on all six radar axes. A research pipeline that combines the
                  reproducible architectural ideas of the Transformer, the bidirectional pre-training recipe of BERT,
                  and the emergent few-shot evaluation protocol from GPT-3 is likely to outperform any single approach
                  on modern NLP benchmarks. For new research, start from the Transformer's clean design, adopt BERT's
                  bidirectional MLM pretraining, and measure zero/few-shot generalization following GPT-3's evaluation
                  framework.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
