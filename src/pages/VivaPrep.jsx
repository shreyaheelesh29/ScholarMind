import { useState, useRef, useEffect } from "react";

const questionBank = {
  Methodology: [
    {
      id: 1,
      difficulty: "Medium",
      question: "What is the core motivation behind combining FlashAttention with a state-space backbone?",
      expectedLength: "2 minutes",
      sampleOutline: [
        "State FlashAttention strength: faithful attention quality but O(n²)",
        "State SSM (Mamba) strength: O(n) speed but benchmark quality gap",
        "Proposed dual-stream architecture: best of both worlds",
        "Design constraint: fusion gate overhead negligible (<5%)",
      ],
      tips: [
        "Quantify the tradeoff with real FLOPs numbers",
        "Mention the 'no free lunch' theorem — where approximation happens",
      ],
      paperRef: "FlashAttention-3 proposal, §2 Motivation",
      page: 2,
    },
    {
      id: 2,
      difficulty: "Hard",
      question: "Walk me through the gating mechanism — why gated fusion instead of concatenation?",
      expectedLength: "3 minutes",
      sampleOutline: [
        "Gating formula: α = σ(W[x_attn; x_ssm]) per token",
        "Concatenation forces equal weighting — not data-dependent",
        "Gating lets each position decide: global vs local context",
        "Connection to highway networks, FiLM conditioning — but per-token dynamic",
        "Ablation requirement: show gate matters empirically, not just extra params",
      ],
      tips: [
        "Draw the gate operation on whiteboard if available",
        "Describe a pathological case where gate is essential (e.g., table row lookup)",
      ],
      paperRef: "§3.3 Gated Fusion Module",
      page: 4,
    },
  ],
  Results: [
    {
      id: 3,
      difficulty: "Medium",
      question: "Which single result in Table 1 is your strongest evidence of contribution?",
      expectedLength: "2 minutes",
      sampleOutline: [
        "Most convincing: PubMed EM at 128K length",
        "Why PubMed: requires multi-hop evidence over 100s of pages",
        "Baseline Longformer degrades most here because of window limits",
        "Target: 51%+ at O(n) — central evidence",
        "Secondary evidence: Pareto frontier plot across all tasks",
      ],
      tips: [
        "Lead with the 'hero metric' — don't bury it",
        "Admit where baseline ties you — shows rigor",
      ],
      paperRef: "Table 1, §5 Expected Results",
      page: 6,
    },
    {
      id: 4,
      difficulty: "Hard",
      question: "If SSM stream ablated to zero dimension, do you recover FlashAttention exactly?",
      expectedLength: "3 minutes",
      sampleOutline: [
        "Expected: yes, up to layer norm / residual paths",
        "Must verify: (1) gate α with zero SSM → identity mapping",
        "(2) gate bias initialized ~0 for SSM pathway at start",
        "Failure to recover is red flag for experimental rigor",
        "Also check: kernel numerical reproducibility bit-level",
      ],
      tips: [
        "Signal you thought about experimental controls — examiners love this",
        "Name specific checksums/hashes you'd compare",
      ],
      paperRef: "§7 Ablations Plan",
      page: 7,
    },
  ],
  Literature: [
    {
      id: 5,
      difficulty: "Medium",
      question: "Why is Longformer a fair baseline but insufficient by itself?",
      expectedLength: "2.5 minutes",
      sampleOutline: [
        "Longformer = sliding windows + few heuristic global tokens (CLS etc.)",
        "Failure modes: (1) tokens 2 windows apart never interact directly",
        "(2) global tokens hand-picked, not learned — doesn't generalize",
        "(3) custom CUDA → reproducibility issues outside NVIDIA",
        "Include anyway: most deployed long-context baseline",
      ],
      tips: [
        "Show familiarity beyond 'just citations' — actual engineering tradeoffs",
        "Mention specific papers using Longformer and their pain points",
      ],
      paperRef: "Baseline Selection §4.1",
      page: 5,
    },
    {
      id: 6,
      difficulty: "Easy",
      question: "Contrast Mamba, Hyena, and S4 — which is closest in spirit and why?",
      expectedLength: "2 minutes",
      sampleOutline: [
        "S4: diagonal + low-rank correction, no data-dependent selection",
        "Hyena: long convolutions with implicit parameterization",
        "Mamba: SELECTIVE scan — input-dependent state transitions",
        "Closest: Mamba, because selection = data-dependent routing analogous to attention",
        "Upshot: Mamba gating and our fusion gate share conceptual DNA",
      ],
      tips: [
        "Use the word 'selection mechanism' — it's Mamba's distinctive term",
      ],
      paperRef: "Related Work §2",
      page: 3,
    },
  ],
  Novelty: [
    {
      id: 7,
      difficulty: "Hard",
      question: "Jamba already mixes MoE + attention + Mamba layers. What is new here?",
      expectedLength: "3 minutes",
      sampleOutline: [
        "Jamba: alternating TOKEN-level layers (layer i = attention, layer i+1 = Mamba)",
        "Ours: fused STREAMS per SAME layer, gated per-position",
        "Key difference: fine-grained per-token routing, not per-layer schedule",
        "Analogy: Jamba is like having 2 expert teams take turns; ours is both teams active and manager decides per task",
        "Ablation: build Jamba-style alternator to prove fusion > alternation",
      ],
      tips: [
        "Be generous to prior work — 'Jamba is a great baseline, we build on it'",
        "Always propose the ablation that distinguishes you from nearest neighbor",
      ],
      paperRef: "§8 Novelty Discussion",
      page: 8,
    },
    {
      id: 8,
      difficulty: "Easy",
      question: "What broader impact does cheaper long-context inference have?",
      expectedLength: "1.5 minutes",
      sampleOutline: [
        "Upsides: democratization (more labs run 128K), energy efficiency",
        "Downsides: mass document laundering for misinformation, privacy on sensitive corpora",
        "Mitigations: release weights only, not training data extractors",
        "Release safety card alongside model",
      ],
      tips: [
        "Always balance upsides/downsides — shows critical thinking",
        "Name a concrete mitigation, not vague ideas",
      ],
      paperRef: "Broader Impact Statement",
      page: 7,
    },
  ],
};

const categories = Object.keys(questionBank);
const allQuestions = categories.flatMap((cat) =>
  questionBank[cat].map((q) => ({ ...q, category: cat }))
);

const difficultyColor = {
  Easy: "bg-success-50 text-success-700 border-success-200",
  Medium: "bg-warning-50 text-warning-700 border-warning-200",
  Hard: "bg-error-50 text-error-700 border-error-200",
};

const categoryColor = {
  Methodology: "bg-primary-50 text-primary-700 border-primary-200",
  Results: "bg-accent-50 text-accent-700 border-accent-200",
  Literature: "bg-success-50 text-success-700 border-success-200",
  Novelty: "bg-warning-50 text-warning-700 border-warning-200",
};

export default function VivaPrep() {
  const [activeTab, setActiveTab] = useState("questions");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [mockRunning, setMockRunning] = useState(false);
  const [mockTime, setMockTime] = useState(0);
  const [mockQuestionIdx, setMockQuestionIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [weaknesses] = useState([
    { topic: "Gate initialization proof", severity: "High", mentions: 3 },
    { topic: "Jamba comparison section", severity: "Medium", mentions: 2 },
    { topic: "Numerical reproducibility claims", severity: "Medium", mentions: 2 },
    { topic: "Concrete FLOPs per model variant", severity: "Low", mentions: 1 },
  ]);
  const timerRef = useRef(null);

  const filteredQuestions =
    categoryFilter === "All"
      ? allQuestions
      : allQuestions.filter((q) => q.category === categoryFilter);

  const currentQuestion = filteredQuestions[currentIdx % filteredQuestions.length];

  useEffect(() => {
    if (!mockRunning) return;
    timerRef.current = setInterval(() => setMockTime((t) => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [mockRunning]);

  useEffect(() => {
    setShowAnswer(false);
    setCurrentIdx(0);
  }, [categoryFilter]);

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const nextMockQuestion = () => {
    setAnsweredCount((c) => c + 1);
    if (mockQuestionIdx < allQuestions.length - 1) {
      setMockQuestionIdx((i) => i + 1);
    } else {
      setMockRunning(false);
    }
  };

  const mockQuestion = allQuestions[mockQuestionIdx];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-sm font-medium text-primary-600">Output & Learning</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">🎤 Viva Preparation</h1>
        <p className="mt-2 text-slate-500">
          Ace your defense with AI-guided practice, weakness detection, and real-time coaching.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Questions", value: allQuestions.length, icon: "📝" },
          { label: "Categories", value: categories.length, icon: "📂" },
          { label: "Practiced", value: answeredCount, icon: "✅" },
          { label: "Weaknesses Flagged", value: weaknesses.length, icon: "⚠️" },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-lg hover:shadow-slate-200/60 transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">{s.label}</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{s.value}</p>
              </div>
              <span className="text-3xl">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 p-1.5 rounded-2xl bg-slate-100 w-fit">
        {[
          { id: "questions", label: "Practice Questions", icon: "❓" },
          { id: "weakness", label: "Weakness Spotter", icon: "🔍" },
          { id: "coach", label: "Answer Coach", icon: "🎯" },
          { id: "mock", label: "Mock Viva", icon: "🎭" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id
                ? "bg-white text-primary-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "questions" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Category:</span>
            <div className="flex gap-1.5 flex-wrap">
              {["All", ...categories].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold capitalize transition ${
                    categoryFilter === cat
                      ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-500/20"
                      : "bg-white border border-slate-200 text-slate-600 hover:border-primary-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentIdx((i) => i - 1);
                  setShowAnswer(false);
                }}
                disabled={currentIdx === 0}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                ← Prev
              </button>
              <span className="text-sm font-black text-slate-800 min-w-[60px] text-center">
                {(currentIdx % filteredQuestions.length) + 1} / {filteredQuestions.length}
              </span>
              <button
                onClick={() => {
                  setCurrentIdx((i) => i + 1);
                  setShowAnswer(false);
                }}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-bold shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition"
              >
                Next →
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${categoryColor[currentQuestion.category]}`}>
                  {currentQuestion.category}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${difficultyColor[currentQuestion.difficulty]}`}>
                  {currentQuestion.difficulty}
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                  ⏱ Expected: {currentQuestion.expectedLength}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-500">
                  📄 {currentQuestion.paperRef} • p.{currentQuestion.page}
                </span>
                <button
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition"
                >
                  {showAnswer ? "🙈 Hide Outline" : "👀 Show Outline"}
                </button>
              </div>
            </div>

            <div className="p-7">
              <p className="text-xs font-black uppercase tracking-wider text-primary-600 mb-2">
                Question {(currentIdx % filteredQuestions.length) + 1}
              </p>
              <h2 className="text-2xl font-black text-slate-900 leading-snug">
                {currentQuestion.question}
              </h2>
            </div>

            <div className="px-7 pb-7 space-y-4">
              {showAnswer && (
                <div className="space-y-4 animate-fade-in">
                  <div className="rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50/50 to-white p-5">
                    <h3 className="font-black text-primary-800 mb-3 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-primary-500 text-white flex items-center justify-center text-sm">
                        💡
                      </span>
                      Sample Answer Outline
                    </h3>
                    <ol className="space-y-2.5">
                      {currentQuestion.sampleOutline.map((point, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-md bg-primary-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-sm text-slate-800 leading-relaxed font-medium">{point}</p>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="rounded-2xl border border-accent-200 bg-gradient-to-br from-accent-50/50 to-white p-5">
                    <h3 className="font-black text-accent-800 mb-3 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-accent-500 text-white flex items-center justify-center text-sm">
                        💎
                      </span>
                      Pro Tips
                    </h3>
                    <ul className="space-y-2">
                      {currentQuestion.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="text-accent-500 font-black mt-0.5">▸</span>
                          <p className="text-sm text-slate-700 leading-relaxed">{tip}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {!showAnswer && (
                <div className="h-32 rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
                  <p className="text-sm font-bold text-slate-400">
                    💡 Practice answering aloud, then reveal the answer outline for comparison
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-black text-slate-900 mb-4">📋 Question Bank</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {filteredQuestions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIdx(i);
                      setShowAnswer(false);
                    }}
                    className={`w-full p-3 rounded-xl text-left transition border ${
                      i === currentIdx % filteredQuestions.length
                        ? "border-primary-500 bg-primary-50 shadow-md shadow-primary-500/10"
                        : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${categoryColor[q.category]}`}>
                          {q.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${difficultyColor[q.difficulty]}`}>
                          {q.difficulty}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 mt-1 line-clamp-2 leading-snug">
                      {q.question}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white">
              <h3 className="font-black text-lg mb-4">🎯 Viva Pro Tips</h3>
              <div className="space-y-3 text-sm">
                {[
                  "Paused? Say 'Let me ground that in the paper' → buy 5 seconds.",
                  "Quantify everything: refer to exact table numbers and metrics.",
                  "Don't know? 'I'd ablate X in §Y, predicted outcome Z'.",
                  "Every answer ends with: evidence → claim → broader impact.",
                  "Whiteboard: always draw the architecture before explaining.",
                ].map((tip, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm hover:bg-white/10 transition">
                    <span className="text-primary-400 font-black text-lg flex-shrink-0">{i + 1}</span>
                    <p className="text-white/90 leading-snug">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "weakness" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-black text-lg text-slate-900 mb-5 flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-warning-500 to-error-500 text-white flex items-center justify-center">
                ⚠️
              </span>
              Detected Weakness Zones
              <span className="ml-auto text-xs font-bold text-slate-500">
                Based on practice session patterns
              </span>
            </h3>
            <div className="space-y-3">
              {weaknesses.map((w, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-gradient-to-r from-slate-50 to-white hover:shadow-md transition">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-4 h-4 rounded-full ring-4 ring-offset-2 ${
                        w.severity === "High"
                          ? "bg-error-500 ring-error-200"
                          : w.severity === "Medium"
                          ? "bg-warning-500 ring-warning-200"
                          : "bg-success-500 ring-success-200"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-black text-slate-900">{w.topic}</p>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          w.severity === "High"
                            ? "bg-error-50 text-error-700"
                            : w.severity === "Medium"
                            ? "bg-warning-50 text-warning-700"
                            : "bg-success-50 text-success-700"
                        }`}
                      >
                        {w.severity}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-slate-500">
                        Mentioned in {w.mentions} answer{w.mentions > 1 ? "s" : ""}
                      </p>
                      <div className="flex-1 max-w-[200px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            w.severity === "High"
                              ? "bg-gradient-to-r from-error-400 to-error-600"
                              : w.severity === "Medium"
                              ? "bg-gradient-to-r from-warning-400 to-warning-600"
                              : "bg-gradient-to-r from-success-400 to-success-600"
                          }`}
                          style={{ width: `${(w.mentions / 4) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-primary-50 text-primary-700 text-xs font-bold hover:bg-primary-100 transition">
                    Practice →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "coach" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-black text-lg text-slate-900 mb-4">🎯 Answer Structure Coach</h3>
            <p className="text-sm text-slate-500 mb-5">
              Every strong viva answer follows the STAR-P method.
            </p>
            <div className="space-y-3">
              {[
                { letter: "S", name: "State", desc: "Directly answer the question in 1 sentence", color: "from-primary-500 to-indigo-500" },
                { letter: "T", name: "Thesis", desc: "Your core claim or position", color: "from-indigo-500 to-purple-500" },
                { letter: "A", name: "Anchor", desc: "Cite evidence: table/figure/page number", color: "from-purple-500 to-accent-500" },
                { letter: "R", name: "Rebuttal", desc: "Address counterargument / limitation", color: "from-accent-500 to-pink-500" },
                { letter: "P", name: "Punchline", desc: "So what? Why does this matter?", color: "from-pink-500 to-rose-500" },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/60 border border-slate-100">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} text-white font-black text-2xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                    {step.letter}
                  </div>
                  <div>
                    <p className="font-black text-slate-900">{step.name}</p>
                    <p className="text-sm text-slate-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 via-white to-accent-50 p-6">
              <h3 className="font-black text-lg text-slate-900 mb-4">⏱ Answer Time Guidelines</h3>
              <div className="space-y-3">
                {[
                  { type: "Easy", length: "1-1.5 min", desc: "Definitions, context, prior work summaries", bar: "from-success-400 to-success-600", width: "25%" },
                  { type: "Medium", length: "2-3 min", desc: "Method details, specific results, baseline comparisons", bar: "from-warning-400 to-warning-600", width: "50%" },
                  { type: "Hard", length: "3-4 min", desc: "Novelty arguments, ablation design, limitations", bar: "from-error-400 to-error-600", width: "75%" },
                ].map((g, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/70 border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2.5 py-0.5 rounded text-[11px] font-black uppercase ${difficultyColor[g.type]}`}>
                        {g.type}
                      </span>
                      <span className="text-xs font-black text-slate-700">{g.length}</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{g.desc}</p>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${g.bar} rounded-full`} style={{ width: g.width }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="font-black text-slate-900 mb-3">🛟 Filler Phrases (to buy time)</h3>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {[
                  "\"Great question — let me ground that in the architecture.\"",
                  "\"That's one of the key design decisions; here's the tradeoff we analyzed.\"",
                  "\"I'd separate this into two claims: the empirical and the theoretical.\"",
                  "\"If I had to push back, I'd say — let's test that with ablation X.\"",
                ].map((phrase, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 italic">
                    💬 {phrase}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "mock" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg ${
                  mockRunning
                    ? "bg-gradient-to-br from-error-500 to-error-600 animate-pulse-soft"
                    : "bg-gradient-to-br from-slate-400 to-slate-600"
                }`}>
                  {recording ? (
                    <span className="w-5 h-5 rounded bg-white" />
                  ) : (
                    "🎭"
                  )}
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                    {mockRunning ? "Mock Viva in Progress" : "Mock Viva Ready"}
                  </p>
                  <p className="text-3xl font-black text-slate-900">{formatTime(mockTime)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                  Question {mockQuestionIdx + 1} / {allQuestions.length}
                </span>
                {!mockRunning ? (
                  <button
                    onClick={() => {
                      setMockRunning(true);
                      setMockTime(0);
                      setMockQuestionIdx(0);
                      setAnsweredCount(0);
                      setRecording(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-error-600 to-primary-600 text-white font-black shadow-lg shadow-primary-500/25 hover:shadow-xl transition flex items-center gap-2"
                  >
                    ▶ Start Mock Viva
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setMockRunning(false);
                      setRecording(false);
                      clearInterval(timerRef.current);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-black hover:bg-slate-900 transition flex items-center gap-2"
                  >
                    ■ End Session
                  </button>
                )}
              </div>
            </div>

            {mockRunning && (
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-5">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 transition-all"
                  style={{ width: `${((mockQuestionIdx + 1) / allQuestions.length) * 100}%` }}
                />
              </div>
            )}

            {mockRunning ? (
              <div className="space-y-4">
                <div className="rounded-2xl border-2 border-primary-300 bg-gradient-to-br from-primary-50 via-white to-accent-50 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${categoryColor[mockQuestion.category]}`}>
                        {mockQuestion.category}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${difficultyColor[mockQuestion.difficulty]}`}>
                        {mockQuestion.difficulty}
                      </span>
                      {recording && (
                        <span className="px-3 py-1 rounded-full bg-error-50 text-error-700 text-xs font-black uppercase border border-error-200 flex items-center gap-1.5 animate-pulse-soft">
                          <span className="w-2 h-2 rounded-full bg-error-500" /> Recording
                        </span>
                      )}
                    </div>
                    <span className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-black">
                      ⏱ {formatTime(mockTime)}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 leading-snug mb-4">
                    {mockQuestion.question}
                  </h3>
                  <p className="text-sm text-slate-500">
                    📄 {mockQuestion.paperRef} — Time target: {mockQuestion.expectedLength}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setRecording(!recording)}
                      className={`px-5 py-2.5 rounded-xl font-black text-sm transition flex items-center gap-2 ${
                        recording
                          ? "bg-error-50 text-error-700 border border-error-200 hover:bg-error-100"
                          : "bg-success-50 text-success-700 border border-success-200 hover:bg-success-100"
                      }`}
                    >
                      {recording ? "⏸ Pause Recording" : "⏵ Resume Recording"}
                    </button>
                    <button className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition flex items-center gap-2">
                      👀 Hint
                    </button>
                  </div>
                  <button
                    onClick={nextMockQuestion}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-black shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/35 transition flex items-center gap-2"
                  >
                    {mockQuestionIdx < allQuestions.length - 1 ? "✓ Answered — Next →" : "✓ Finish Mock Viva"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white p-10 text-center">
                <div className="text-6xl mb-4">🎭</div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Ready for a Real Simulation?</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                  A full mock viva: 8 randomized questions across categories, 20+ minutes,
                  recording indicator, and AI feedback at the end.
                </p>
                <div className="flex items-center justify-center gap-6 mb-6 text-sm">
                  {[
                    ["⏱", "20 min timer"],
                    ["🔴", "Recording status"],
                    ["🎲", "Random order"],
                    ["📊", "Score report"],
                  ].map(([i, t]) => (
                    <div key={t} className="flex items-center gap-1.5 text-slate-600 font-semibold">
                      <span>{i}</span> {t}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setMockRunning(true);
                    setMockTime(0);
                    setMockQuestionIdx(0);
                    setAnsweredCount(0);
                    setRecording(true);
                  }}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary-600 via-accent-500 to-pink-600 text-white font-black shadow-xl shadow-primary-500/25 hover:shadow-2xl hover:scale-[1.02] transition-all text-lg flex items-center gap-2 mx-auto"
                >
                  ▶ Begin Mock Viva
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Time Elapsed", value: formatTime(mockTime), icon: "⏱", color: "text-primary-600" },
              { label: "Answered", value: answeredCount, icon: "✅", color: "text-success-600" },
              { label: "Remaining", value: Math.max(0, allQuestions.length - answeredCount), icon: "📋", color: "text-warning-600" },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">{s.label}</p>
                    <p className={`mt-2 text-3xl font-black ${s.color}`}>{s.value}</p>
                  </div>
                  <span className="text-3xl">{s.icon}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
