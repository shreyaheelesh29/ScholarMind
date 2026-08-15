import { useState } from "react";
import { useNavigate } from "react-router-dom";

const initialSlides = [
  {
    id: 1,
    type: "title",
    label: "Title slide",
    icon: "🏷",
    title: "FlashAttention-3",
    subtitle: "Fused Attention with State-Space Backbone for Long Context",
    meta: "Research Proposal • ScholarMind PPT Generator",
    authors: "Presented by: John Doe",
    date: "August 2024",
    gradient: "from-indigo-500 via-purple-500 to-pink-500",
  },
  {
    id: 2,
    type: "intro",
    label: "Introduction",
    icon: "👋",
    title: "Introduction & Research Context",
    bullets: [
      "Transformer models have revolutionized NLP and beyond",
      "Self-attention scales quadratically — a critical bottleneck",
      "Long documents (128K+ tokens) increasingly important",
      "Goal: match full-attention quality at O(n) cost",
    ],
    gradient: "from-blue-500 via-indigo-500 to-purple-500",
  },
  {
    id: 3,
    type: "background",
    label: "Background",
    icon: "📚",
    title: "Background & Related Work",
    columns: [
      { header: "Efficient Attention", items: ["FlashAttention-2 (Dao 2023)", "Longformer (Beltagy 2020)", "BigBird (Zaheer 2020)"] },
      { header: "State-Space Models", items: ["Mamba (Gu 2023)", "S4 (Gu 2022)", "Hyena (Poli 2023)"] },
      { header: "Hybrid Methods", items: ["Jamba (AI21 2024)", "RecurrentGemma (DeepMind 2024)"] },
    ],
    gap: "No method fuses IO-aware sparse kernels with learnable SSM routing at train-time.",
    gradient: "from-purple-500 via-fuchsia-500 to-pink-500",
  },
  {
    id: 4,
    type: "methodology",
    label: "Methodology",
    icon: "🔬",
    title: "Proposed Methodology",
    steps: [
      { num: "1", title: "FlashAttention Kernel", desc: "Block-sparse forward/backward with recompute" },
      { num: "2", title: "Parallel SSM Stream", desc: "Small Mamba layer → global routing weights" },
      { num: "3", title: "Gated Fusion", desc: "Gate mixes attention and SSM streams" },
      { num: "4", title: "Fine-tuning", desc: "LongBench, SCROLLS, PubMed QA" },
    ],
    gradient: "from-pink-500 via-rose-500 to-red-500",
  },
  {
    id: 5,
    type: "results",
    label: "Results",
    icon: "📊",
    title: "Experimental Results",
    table: {
      headers: ["Method", "FLOPs/n", "LongBench F1", "PubMed EM", "Cost"],
      rows: [
        ["FlashAttn-2 (full)", "O(n²)", "76.2", "54.1", "$$$"],
        ["Longformer", "O(n)", "65.4", "42.8", "$"],
        ["Mamba", "O(n)", "68.0", "44.5", "$"],
        ["Ours (target)", "O(n)", "74.0+", "51.0+", "$"],
      ],
    },
    claim: "Near-full-attention quality at SSM cost — Pareto frontier shift.",
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
  },
  {
    id: 6,
    type: "discussion",
    label: "Discussion",
    icon: "💬",
    title: "Discussion & Limitations",
    bullets: [
      "CUDA kernel engineering effort non-trivial — Triton reference provided",
      "SSM dimension tradeoff: 128-512 width sweet spot",
      "Best on: long QA, summarization. Neutral on: short text tasks",
      "Future work: multi-modal (image + text) fusion at scale",
    ],
    takeaway: "Practical architecture for labs without infinite compute.",
    gradient: "from-teal-500 via-emerald-500 to-green-500",
  },
  {
    id: 7,
    type: "conclusion",
    label: "Conclusion",
    icon: "🎯",
    title: "Conclusion & Contributions",
    contributions: [
      "Novel fused attention + SSM dual-stream architecture",
      "Reproducible CUDA kernels; open-source training code",
      "New leaderboard across 14 long-context tasks",
      "Ablation study of fusion strategies and dimensions",
    ],
    gradient: "from-cyan-500 via-blue-500 to-indigo-500",
  },
  {
    id: 8,
    type: "references",
    label: "References",
    icon: "📖",
    title: "References",
    references: [
      "[1] Dao et al. — FlashAttention: Fast & Memory-Efficient Exact Attention, NeurIPS 2022",
      "[2] Beltagy et al. — Longformer: The Long-Document Transformer, ACL 2020",
      "[3] Gu et al. — Mamba: Linear-Time Sequence Modeling with Selective State Spaces, 2023",
      "[4] Zaheer et al. — Big Bird: Transformers for Longer Sequences, NeurIPS 2020",
      "[5] Poli et al. — Hyena Hierarchy: Towards Larger Convolutional Language Models, ICML 2023",
    ],
    gradient: "from-slate-500 via-slate-600 to-slate-800",
  },
];

export default function PPTInterface() {
  const navigate = useNavigate();
  const [slides, setSlides] = useState(initialSlides);
  const [current, setCurrent] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const slide = slides[current];

  const go = (dir) => setCurrent((i) => Math.max(0, Math.min(slides.length - 1, i + dir)));

  const handleGenerate = () => {
    setGenerating(true);
    setGenerationProgress(0);
    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setGenerating(false);
          return 100;
        }
        return prev + 4;
      });
    }, 80);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newSlides = [...slides];
    const [removed] = newSlides.splice(draggedIndex, 1);
    newSlides.splice(index, 0, removed);
    setSlides(newSlides);
    setDraggedIndex(index);
    if (current === draggedIndex) setCurrent(index);
    else if (draggedIndex < current && index >= current) setCurrent(current - 1);
    else if (draggedIndex > current && index <= current) setCurrent(current + 1);
  };

  const handleDrop = () => {
    setDraggedIndex(null);
  };

  const deleteSlide = (index) => {
    if (slides.length <= 1) return;
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    if (index === current) setCurrent(Math.max(0, current - 1));
    else if (index < current) setCurrent(current - 1);
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col gap-4 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-medium text-primary-600">Output & Learning</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">PPT Generator</h1>
          <p className="mt-2 text-slate-500">Turn your research into a ready-to-present slide deck with citations.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <select className="appearance-none pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20">
              <option>📄 FlashAttention-3 Proposal (8 sources)</option>
              <option>📄 TruthSeeker Bench paper</option>
              <option>📁 Select another paper...</option>
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {generating && (
        <div className="rounded-xl border border-primary-200 bg-gradient-to-r from-primary-50 via-white to-accent-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm font-black text-slate-800">
                {generationProgress < 30 && "🔍 Analyzing paper content & structure..."}
                {generationProgress >= 30 && generationProgress < 60 && "📝 Drafting slide outlines & bullets..."}
                {generationProgress >= 60 && generationProgress < 90 && "🎨 Applying layout templates & styling..."}
                {generationProgress >= 90 && "✅ Finalizing presentation & citations..."}
              </span>
            </div>
            <span className="text-sm font-black text-primary-700">{generationProgress}%</span>
          </div>
          <div className="h-2 rounded-full bg-white border border-slate-200 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 transition-all duration-100 rounded-full"
              style={{ width: `${generationProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="w-64 rounded-xl border border-slate-200 bg-white flex flex-col overflow-hidden flex-shrink-0">
          <div className="p-3 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Slide Outline ({slides.length})
            </span>
            <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500" title="Add slide">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {slides.map((s, i) => (
              <div
                key={s.id}
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={handleDrop}
                onClick={() => setCurrent(i)}
                className={`group relative w-full text-left p-2 rounded-lg transition cursor-grab active:cursor-grabbing ${
                  i === current ? "bg-primary-50 ring-2 ring-primary-500" : "hover:bg-slate-50"
                } ${draggedIndex === i ? "opacity-50 scale-95" : ""}`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 text-sm ${
                      i === current ? "text-primary-500" : "text-slate-400 group-hover:text-primary-400"
                    }`}
                  >
                    ⋮⋮
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className={`text-[10px] font-black w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                          i === current ? "bg-primary-500 text-white" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="text-base">{s.icon}</span>
                    </div>
                    {editingId === s.id ? (
                      <input
                        autoFocus
                        defaultValue={s.label}
                        onBlur={() => setEditingId(null)}
                        onKeyDown={(e) => e.key === "Enter" && setEditingId(null)}
                        className="w-full px-2 py-1 text-xs rounded border border-primary-300 focus:ring-1 focus:ring-primary-500 outline-none bg-white"
                      />
                    ) : (
                      <p className="text-xs font-semibold text-slate-800 leading-tight">{s.label}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(s.id);
                      }}
                      className="p-1 rounded hover:bg-white text-slate-400 hover:text-primary-600"
                      title="Edit"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSlide(i);
                      }}
                      disabled={slides.length <= 1}
                      className="p-1 rounded hover:bg-error-50 text-slate-400 hover:text-error-600 disabled:opacity-30"
                      title="Delete"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="flex-1 rounded-xl bg-gradient-to-br from-slate-800 via-slate-900 to-black p-6 overflow-auto flex items-center justify-center min-h-0">
            <div className="w-full max-w-4xl aspect-video bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              <div className={`h-2 bg-gradient-to-r ${slide.gradient} flex-shrink-0`} />
              <div className={`flex-1 p-8 overflow-auto bg-gradient-to-br ${slide.gradient} bg-opacity-[0.03]`}>
                {slide.type === "title" && (
                  <div className="h-full flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-primary-700 text-xs font-black uppercase shadow-md">
                          Research Proposal
                        </span>
                        <h2 className="mt-6 text-4xl font-black text-slate-900 leading-tight max-w-[80%]">
                          {slide.title}
                        </h2>
                        <p className="mt-4 text-xl text-slate-600 max-w-[85%]">{slide.subtitle}</p>
                      </div>
                      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center shadow-2xl`}>
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex items-end justify-between pt-6 border-t-2 border-slate-100">
                      <div>
                        <p className="text-sm font-semibold text-slate-500">{slide.meta}</p>
                        <p className="text-lg font-bold text-slate-800 mt-1">{slide.authors}</p>
                      </div>
                      <p className="text-lg font-bold text-primary-600">{slide.date}</p>
                    </div>
                  </div>
                )}

                {(slide.type === "intro" || slide.type === "discussion") && (
                  <div className="h-full flex flex-col">
                    <div className="mb-5 pb-3 border-b-2 border-slate-100">
                      <span className={`text-xs font-black uppercase tracking-wider bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}>
                        Section {String(current).padStart(2, "0")}
                      </span>
                      <h2 className="text-3xl font-black text-slate-900 mt-1">{slide.title}</h2>
                    </div>
                    <div className="flex-1 space-y-2.5">
                      {slide.bullets?.map((b, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-xl bg-white/70 border border-slate-100 items-start">
                          <span className={`w-7 h-7 rounded-lg bg-gradient-to-br ${slide.gradient} text-white font-black flex items-center justify-center flex-shrink-0 shadow-md text-sm`}>
                            {i + 1}
                          </span>
                          <p className="text-base text-slate-800 leading-relaxed font-medium">{b}</p>
                        </div>
                      ))}
                    </div>
                    {slide.takeaway && (
                      <div className={`mt-4 p-4 rounded-xl bg-gradient-to-r ${slide.gradient} text-white shadow-lg`}>
                        <p className="text-xs uppercase font-black opacity-80">🎯 Key Takeaway</p>
                        <p className="text-xl font-black mt-0.5">{slide.takeaway}</p>
                      </div>
                    )}
                  </div>
                )}

                {slide.type === "background" && (
                  <div className="h-full flex flex-col">
                    <div className="mb-5 pb-3 border-b-2 border-slate-100">
                      <span className={`text-xs font-black uppercase tracking-wider bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}>
                        Section {String(current).padStart(2, "0")}
                      </span>
                      <h2 className="text-3xl font-black text-slate-900 mt-1">{slide.title}</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-3 flex-1">
                      {slide.columns?.map((col, i) => (
                        <div key={i} className="rounded-xl border-2 border-slate-100 bg-white/60 p-4 flex flex-col">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 bg-gradient-to-br ${slide.gradient}`}>
                            <span className="text-white font-black">{i + 1}</span>
                          </div>
                          <h3 className="text-base font-black text-slate-900 mb-2">{col.header}</h3>
                          <ul className="space-y-1.5 flex-1">
                            {col.items.map((it, j) => (
                              <li key={j} className="text-xs text-slate-700 flex items-start gap-1.5">
                                <span className="mt-1 text-primary-500 font-black">▸</span>
                                {it}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3.5 rounded-xl bg-warning-50 border-2 border-dashed border-warning-200">
                      <p className="text-xs font-black uppercase text-warning-700 tracking-wider mb-0.5">⚠️ Research Gap</p>
                      <p className="text-base font-bold text-slate-800">{slide.gap}</p>
                    </div>
                  </div>
                )}

                {slide.type === "methodology" && (
                  <div className="h-full flex flex-col">
                    <div className="mb-5 pb-3 border-b-2 border-slate-100">
                      <span className={`text-xs font-black uppercase tracking-wider bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}>
                        Section {String(current).padStart(2, "0")}
                      </span>
                      <h2 className="text-3xl font-black text-slate-900 mt-1">{slide.title}</h2>
                    </div>
                    <div className="flex-1 grid grid-cols-4 gap-3 items-center">
                      {slide.steps?.map((s, i) => (
                        <div key={i} className="relative">
                          <div className="rounded-2xl bg-white/70 border-2 border-slate-100 p-4 text-center hover:scale-105 transition hover:shadow-xl">
                            <div className={`w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br ${slide.gradient} text-white font-black text-xl flex items-center justify-center shadow-lg`}>
                              {s.num}
                            </div>
                            <h3 className="mt-3 font-black text-slate-900 text-base leading-tight">{s.title}</h3>
                            <p className="mt-1.5 text-xs text-slate-600 leading-snug">{s.desc}</p>
                          </div>
                          {i < (slide.steps?.length || 0) - 1 && (
                            <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 z-10 text-accent-500 text-lg">
                              →
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {slide.type === "results" && (
                  <div className="h-full flex flex-col">
                    <div className="mb-4 pb-2 border-b-2 border-slate-100">
                      <span className={`text-xs font-black uppercase tracking-wider bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}>
                        Section {String(current).padStart(2, "0")}
                      </span>
                      <h2 className="text-2xl font-black text-slate-900 mt-1">{slide.title}</h2>
                    </div>
                    <div className="rounded-xl border-2 border-slate-100 overflow-hidden flex-1">
                      <div className={`grid grid-cols-5 bg-gradient-to-r ${slide.gradient} text-white`}>
                        {slide.table?.headers.map((h) => (
                          <div key={h} className="px-4 py-3 text-sm font-black uppercase tracking-wider">
                            {h}
                          </div>
                        ))}
                      </div>
                      {slide.table?.rows.map((row, i) => (
                        <div
                          key={i}
                          className={`grid grid-cols-5 ${
                            row[0].includes("Ours")
                              ? "bg-gradient-to-r from-primary-50 to-success-50 ring-2 ring-primary-400 z-10 relative"
                              : i % 2
                              ? "bg-white"
                              : "bg-slate-50"
                          }`}
                        >
                          {row.map((c, j) => (
                            <div
                              key={j}
                              className={`px-4 py-3 border-b border-slate-100 text-sm ${
                                j === 0 ? "font-black text-slate-900" : "text-slate-700"
                              } ${row[0].includes("Ours") ? "font-black" : ""}`}
                            >
                              {c}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    <div className={`mt-3 p-3.5 rounded-xl bg-gradient-to-r ${slide.gradient} text-white shadow-lg`}>
                      <p className="text-xs font-black uppercase opacity-80 mb-0.5">✓ Core Claim</p>
                      <p className="text-lg font-black">{slide.claim}</p>
                    </div>
                  </div>
                )}

                {slide.type === "conclusion" && (
                  <div className="h-full flex flex-col">
                    <div className="mb-4 pb-2 border-b-2 border-slate-100">
                      <span className={`text-xs font-black uppercase tracking-wider bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}>
                        Section {String(current).padStart(2, "0")}
                      </span>
                      <h2 className="text-2xl font-black text-slate-900 mt-1">{slide.title}</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      {slide.contributions?.map((c, i) => (
                        <div key={i} className="rounded-xl bg-white/70 border-2 border-slate-100 p-4 flex items-start gap-3 hover:scale-[1.02] transition">
                          <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${slide.gradient} text-white font-black flex items-center justify-center flex-shrink-0 shadow-md`}>
                            ✦
                          </span>
                          <p className="text-sm text-slate-800 font-semibold leading-snug">{c}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {slide.type === "references" && (
                  <div className="h-full flex flex-col">
                    <div className="mb-4 pb-2 border-b-2 border-slate-100">
                      <span className={`text-xs font-black uppercase tracking-wider bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}>
                        Section {String(current).padStart(2, "0")}
                      </span>
                      <h2 className="text-2xl font-black text-slate-900 mt-1">{slide.title}</h2>
                    </div>
                    <div className="flex-1 space-y-2 overflow-auto">
                      {slide.references?.map((r, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-lg bg-white/60 border border-slate-100">
                          <span className={`w-7 h-7 rounded-md bg-gradient-to-br ${slide.gradient} text-white text-xs font-black flex items-center justify-center flex-shrink-0`}>
                            {i + 1}
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed">{r}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="h-9 bg-slate-50 border-t border-slate-100 flex items-center justify-between px-5 flex-shrink-0">
                <span className="text-xs font-semibold text-slate-500">ScholarMind • {slide.label}</span>
                <span className={`text-xs font-black bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}>
                  {current + 1} / {slides.length}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-3">
            <div className="flex gap-3 overflow-x-auto pb-1">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setCurrent(i)}
                  className={`flex-shrink-0 w-28 rounded-lg border-2 p-1.5 transition-all ${
                    i === current ? "border-primary-500 ring-2 ring-primary-200 scale-[1.02] shadow-md" : "border-slate-200 hover:border-primary-300"
                  }`}
                >
                  <div className={`h-12 rounded-md bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white text-lg mb-1`}>
                    {s.icon}
                  </div>
                  <p className="text-[10px] font-bold text-slate-700 truncate text-center">{s.label}</p>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100">
                <button
                  onClick={() => go(-1)}
                  disabled={current === 0}
                  className="p-2 rounded-md text-slate-600 hover:bg-white disabled:opacity-40 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="px-3 py-1 rounded-md bg-white shadow-sm font-black text-sm text-slate-800 mx-1 min-w-[70px] text-center">
                  {current + 1} / {slides.length}
                </span>
                <button
                  onClick={() => go(1)}
                  disabled={current === slides.length - 1}
                  className="p-2 rounded-md text-slate-600 hover:bg-white disabled:opacity-40 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 flex items-center justify-center gap-2 flex-wrap">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 text-white text-sm font-black shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/35 transition flex items-center gap-2 disabled:opacity-70"
                >
                  <svg className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate PPT
                </button>
                <button className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-black shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/35 transition flex items-center gap-2">
                  🧠 Deep Explain
                </button>
                <button
                  onClick={() => navigate("/viewer")}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-success-500 to-emerald-600 text-white text-sm font-black shadow-lg shadow-success-500/25 hover:shadow-xl hover:shadow-success-500/35 transition flex items-center gap-2"
                >
                  🔬 Source Evidence
                </button>
                <button
                  onClick={() => navigate("/viva")}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-accent-500 to-pink-600 text-white text-sm font-black shadow-lg shadow-accent-500/25 hover:shadow-xl hover:shadow-accent-500/35 transition flex items-center gap-2"
                >
                  🎤 Viva Me
                </button>
              </div>

              <button className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white text-sm font-black shadow-lg hover:shadow-xl hover:scale-[1.02] transition flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PPT
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
