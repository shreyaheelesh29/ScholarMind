import { useState } from "react";

const flashcards = [
  { id: 1, front: "What is the formula for scaled dot-product attention?", back: "Attention(Q,K,V) = softmax(QK^T / √d_k) × V" },
  { id: 2, front: "Why 1/√d_k scaling?", back: "Prevents softmax saturation at large d_k → keeps gradients healthy." },
  { id: 3, front: "How many heads in the original Transformer?", back: "h = 8 attention heads, each d_k=d_v=64." },
  { id: 4, front: "Positional encoding: sine or learned?", back: "Sinusoidal; paper shows sine and learned perform similar; sine extrapolates." },
  { id: 5, front: "Transformer's # of encoder/decoder layers?", back: "N = 6 identical layers in both encoder and decoder stacks." },
  { id: 6, front: "Residual connection + layer norm order?", back: "Pre-LN? No — original Transformer uses: LayerNorm(x + Sublayer(x))." },
];

const quizQuestions = [
  {
    id: 1,
    q: "What is the primary reason for using multi-head attention instead of single-head attention?",
    options: [
      "It reduces the total number of parameters",
      "It allows the model to jointly attend to different representation subspaces",
      "It speeds up inference by parallelizing across GPUs",
      "It prevents over-fitting by adding stochasticity",
    ],
    correct: 1,
    explain: "Multi-head attention projects Q/K/V h times with different learned projections. Each head learns a different subspace, enabling richer representations.",
  },
  {
    id: 2,
    q: "In the encoder self-attention, each position can attend to:",
    options: [
      "Only previous positions",
      "All positions in the input sequence",
      "Only the CLS token",
      "Exactly one position via argmax",
    ],
    correct: 1,
    explain: "Encoder self-attention is bidirectional (causality mask applied only in decoder self-attention).",
  },
  {
    id: 3,
    q: "Training recipe: optimizer + learning rate schedule?",
    options: [
      "Adam + fixed LR = 1e-4",
      "Adam + inverse sqrt warmup schedule",
      "SGD with momentum + cosine decay",
      "RMSProp + step decay every 10 epochs",
    ],
    correct: 1,
    explain: "Paper uses Adam (β1=0.9, β2=0.98, ε=1e-9) with LR = d_model^-0.5 · min(step^-0.5, step · warmup^-1.5), warmup=4000.",
  },
];

export default function Learning() {
  const [tab, setTab] = useState("cards");
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [quizIdx, setQuizIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [answers, setAnswers] = useState(Array(quizQuestions.length).fill(null));

  const handleAnswer = (optIdx) => {
    if (answers[quizIdx] !== null) return;
    setSelected(optIdx);
    const a = [...answers]; a[quizIdx] = optIdx; setAnswers(a);
    if (optIdx === quizQuestions[quizIdx].correct) setScore(s => s + 1);
  };

  const nextQuiz = () => {
    if (quizIdx < quizQuestions.length - 1) {
      setQuizIdx(quizIdx + 1);
      setSelected(answers[quizIdx + 1]);
    } else {
      setQuizDone(true);
    }
  };

  const resetQuiz = () => {
    setQuizIdx(0); setSelected(null); setScore(0); setQuizDone(false);
    setAnswers(Array(quizQuestions.length).fill(null));
  };

  const mindmapNodes = [
    { id: "center", label: "Transformer", x: 50, y: 50, color: "from-primary-500 to-accent-500", size: "lg" },
    { id: "enc", label: "Encoder", x: 20, y: 30, color: "from-primary-400 to-primary-600", size: "md" },
    { id: "dec", label: "Decoder", x: 80, y: 30, color: "from-accent-400 to-accent-600", size: "md" },
    { id: "attn", label: "Multi-Head Attention", x: 20, y: 55, color: "from-primary-300 to-primary-500", size: "sm" },
    { id: "ffn", label: "FFN (2-layer)", x: 20, y: 75, color: "from-primary-300 to-primary-500", size: "sm" },
    { id: "mask", label: "Masked Self-Attn", x: 80, y: 55, color: "from-accent-300 to-accent-500", size: "sm" },
    { id: "cross", label: "Cross Attention", x: 80, y: 75, color: "from-accent-300 to-accent-500", size: "sm" },
    { id: "pos", label: "Positional Encoding", x: 50, y: 85, color: "from-slate-400 to-slate-600", size: "sm" },
    { id: "res", label: "Residual + LN", x: 50, y: 20, color: "from-slate-400 to-slate-600", size: "sm" },
  ];

  const mindmapEdges = [
    ["center", "enc"], ["center", "dec"],
    ["center", "pos"], ["center", "res"],
    ["enc", "attn"], ["enc", "ffn"],
    ["dec", "mask"], ["dec", "cross"],
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-sm font-medium text-primary-600">Output & Learning</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">🎓 Learning Tools</h1>
        <p className="mt-2 text-slate-500">Reinforce understanding with flashcards, quizzes, and interactive mind maps.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { l: "Flashcards Mastered", v: `${Math.round((cardIdx / flashcards.length) * 100)}%`, sub: `${cardIdx} of ${flashcards.length}`, i: "🃏" },
          { l: "Quiz Score", v: `${score}/${quizQuestions.length}`, sub: quizDone ? "Complete" : "In progress", i: "✅" },
          { l: "Mind Map Topics", v: mindmapNodes.length, sub: "Key concepts linked", i: "🗺" },
          { l: "Study Time", v: "2h 14m", sub: "This week", i: "⏱" },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-lg hover:shadow-slate-200/60 transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">{s.l}</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{s.v}</p>
                <p className="mt-1 text-xs text-slate-500">{s.sub}</p>
              </div>
              <span className="text-3xl">{s.i}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 w-fit">
        {[
          { id: "cards", l: "🃏 Flashcards" },
          { id: "quiz", l: "✅ Quiz" },
          { id: "map", l: "🗺 Mind Map" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition ${tab === t.id ? "bg-white text-primary-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === "cards" && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Card {cardIdx + 1} of {flashcards.length}</p>
            <div className="mt-3 h-2 w-full max-w-md mx-auto bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all" style={{ width: `${((cardIdx + 1) / flashcards.length) * 100}%` }} />
            </div>
          </div>

          <div onClick={() => setFlipped(!flipped)} className="relative h-80 cursor-pointer group" style={{ perspective: "1500px" }}>
            <div className="absolute inset-0 transition-transform duration-700" style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 p-10 flex flex-col items-center justify-center text-white shadow-2xl shadow-primary-500/40" style={{ backfaceVisibility: "hidden" }}>
                <span className="text-xs font-black uppercase tracking-widest opacity-75 mb-4">Question</span>
                <h3 className="text-3xl font-black text-center leading-tight max-w-lg">{flashcards[cardIdx].front}</h3>
                <p className="mt-8 text-sm opacity-75">Click to reveal answer →</p>
              </div>
              <div className="absolute inset-0 rounded-3xl bg-white border-2 border-primary-200 p-10 flex flex-col items-center justify-center shadow-2xl" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                <span className="text-xs font-black uppercase tracking-widest text-primary-500 mb-4">Answer</span>
                <h3 className="text-2xl font-bold text-center text-slate-800 leading-relaxed max-w-lg">{flashcards[cardIdx].back}</h3>
                <p className="mt-8 text-xs text-slate-400">← Click to flip back</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button onClick={e => { e.stopPropagation(); setFlipped(false); setCardIdx(i => Math.max(0, i - 1)); }} disabled={cardIdx === 0} className="px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-40 transition flex items-center gap-2">
              ← Previous
            </button>
            <button className="px-5 py-3 rounded-xl bg-success-50 text-success-700 font-bold hover:bg-success-100 transition flex items-center gap-1">
              ❌ Again
            </button>
            <button className="px-5 py-3 rounded-xl bg-warning-50 text-warning-700 font-bold hover:bg-warning-100 transition flex items-center gap-1">
              🟡 Hard
            </button>
            <button className="px-5 py-3 rounded-xl bg-primary-50 text-primary-700 font-bold hover:bg-primary-100 transition flex items-center gap-1">
              ✅ Got It
            </button>
            <button onClick={e => { e.stopPropagation(); setFlipped(false); setCardIdx(i => Math.min(flashcards.length - 1, i + 1)); }} disabled={cardIdx === flashcards.length - 1} className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 disabled:opacity-40 transition flex items-center gap-2">
              Next →
            </button>
          </div>
        </div>
      )}

      {tab === "quiz" && (
        <div className="max-w-3xl mx-auto">
          {!quizDone ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-7 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-primary-600">Question {quizIdx + 1} of {quizQuestions.length}</span>
                  <h3 className="mt-1 text-2xl font-black text-slate-900 leading-snug">{quizQuestions[quizIdx].q}</h3>
                </div>
                <span className="px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-black">Score: {score}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all" style={{ width: `${((quizIdx + (answers[quizIdx] !== null ? 1 : 0)) / quizQuestions.length) * 100}%` }} />
              </div>

              <div className="space-y-3">
                {quizQuestions[quizIdx].options.map((opt, i) => {
                  const revealed = answers[quizIdx] !== null;
                  const isCorrect = i === quizQuestions[quizIdx].correct;
                  const isChosen = selected === i;
                  let cls = "border-slate-200 bg-white hover:bg-slate-50";
                  if (revealed && isCorrect) cls = "border-success-400 bg-success-50 ring-2 ring-success-200";
                  else if (revealed && isChosen && !isCorrect) cls = "border-error-400 bg-error-50 ring-2 ring-error-200";
                  return (
                    <button key={i} onClick={() => handleAnswer(i)} className={`w-full p-4 rounded-xl border-2 text-left transition ${cls}`}>
                      <div className="flex items-start gap-3">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black flex-shrink-0 border-2 ${revealed && isCorrect ? "bg-success-500 border-success-500 text-white" : revealed && isChosen ? "bg-error-500 border-error-500 text-white" : "bg-white border-slate-200 text-slate-500"}`}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-slate-800 font-medium">{opt}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {answers[quizIdx] !== null && (
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 animate-fade-in">
                  <p className="text-xs font-black uppercase tracking-wider text-primary-600 mb-1">💡 Explanation</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{quizQuestions[quizIdx].explain}</p>
                </div>
              )}

              {answers[quizIdx] !== null && (
                <button onClick={nextQuiz} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-black shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition flex items-center justify-center gap-2">
                  {quizIdx < quizQuestions.length - 1 ? "Next Question →" : "View Final Results →"}
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-primary-200 bg-gradient-to-br from-white via-primary-50/30 to-accent-50/30 p-10 text-center overflow-hidden relative">
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-gradient-to-br from-primary-400/20 to-accent-400/20" />
              <div className="relative">
                <div className="w-28 h-28 mx-auto rounded-[2.5rem] bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-2xl shadow-primary-500/30 mb-6">
                  <span className="text-6xl font-black text-white">{Math.round((score / quizQuestions.length) * 100)}%</span>
                </div>
                <h2 className="text-4xl font-black text-slate-900 mb-2">
                  {score === quizQuestions.length ? "🎉 Perfect Score!" : score >= 2 ? "🔥 Great Job!" : "📚 Keep Practicing"}
                </h2>
                <p className="text-lg text-slate-600 mb-8">
                  You got <span className="font-black text-primary-700">{score}</span> out of <span className="font-black">{quizQuestions.length}</span> questions correct.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button onClick={resetQuiz} className="px-6 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-50 transition flex items-center gap-2">
                    🔁 Retry Quiz
                  </button>
                  <button onClick={() => setTab("cards")} className="px-6 py-3 rounded-xl border-2 border-primary-200 bg-primary-50 text-primary-700 font-bold hover:bg-primary-100 transition flex items-center gap-2">
                    🃏 Review Flashcards
                  </button>
                  <button onClick={() => setTab("map")} className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-black shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition flex items-center gap-2">
                    🗺 Explore Mind Map →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "map" && (
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-primary-50/30 overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-white flex items-center justify-between">
            <div>
              <h3 className="font-black text-xl text-slate-900">Transformer Architecture Mind Map</h3>
              <p className="text-sm text-slate-500">Click nodes to explore sub-topics • Drag canvas to pan (conceptual visualization)</p>
            </div>
            <div className="flex gap-1 p-1 rounded-lg bg-slate-100">
              <button className="px-3 py-1.5 rounded-md bg-white shadow-sm text-xs font-bold text-primary-700">🔭 Explore</button>
              <button className="px-3 py-1.5 rounded-md text-xs font-bold text-slate-500 hover:text-slate-700">✏ Edit</button>
              <button className="px-3 py-1.5 rounded-md text-xs font-bold text-slate-500 hover:text-slate-700">➕ Expand</button>
            </div>
          </div>
          <div className="h-[600px] relative">
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <marker id="arrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
                </marker>
              </defs>
              {mindmapEdges.map(([a, b], i) => {
                const na = mindmapNodes.find(n => n.id === a);
                const nb = mindmapNodes.find(n => n.id === b);
                return na && nb && <line key={i} x1={`${na.x}%`} y1={`${na.y}%`} x2={`${nb.x}%`} y2={`${nb.y}%`} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 4" markerEnd="url(#arrow)" />;
              })}
            </svg>
            {mindmapNodes.map(n => (
              <div key={n.id} className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group" style={{ left: `${n.x}%`, top: `${n.y}%` }}>
                <div className={`rounded-2xl bg-gradient-to-br ${n.color} text-white shadow-xl shadow-primary-500/20 hover:scale-110 hover:shadow-2xl hover:shadow-primary-500/40 transition-all ${n.size === "lg" ? "px-7 py-5" : n.size === "md" ? "px-5 py-3.5" : "px-4 py-2.5"}`}>
                  <p className={`font-black whitespace-nowrap text-white ${n.size === "lg" ? "text-2xl" : n.size === "md" ? "text-lg" : "text-sm"}`}>{n.label}</p>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 rounded-lg bg-slate-900 text-white text-xs px-3 py-1.5 opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
                  Click to learn more
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
