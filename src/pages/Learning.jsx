import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../api";
import ArtifactGenerator from "../components/research/ArtifactGenerator";

const flashcards = [
  { id: 1, front: "What is the formula for scaled dot-product attention?", back: "Attention(Q,K,V) = softmax(QK^T / √d_k) × V" },
  { id: 2, front: "Why 1/√d_k scaling?", back: "Prevents softmax saturation at large d_k → keeps gradients healthy." },
  { id: 3, front: "How many heads in the original Transformer?", back: "h = 8 attention heads, each d_k=d_v=64." },
  { id: 4, front: "Positional encoding: sine or learned?", back: "Sinusoidal; paper shows sine and learned perform similar; sine extrapolates." },
  { id: 5, front: "Transformer's # of encoder/decoder layers?", back: "N = 6 identical layers in both encoder and decoder stacks." },
  { id: 6, front: "Residual connection + layer norm order?", back: "Pre-LN? No — original Transformer uses: LayerNorm(x + Sublayer(x))." },
];

function randomizeQuizOptions(artifact) {
  const questions = artifact?.payload?.questions;
  if (!Array.isArray(questions)) return artifact;
  return { ...artifact, payload: { ...artifact.payload, questions: questions.map((question) => {
    const options = [...(question.options || [])];
    const correctOption = options[question.answer];
    for (let index = options.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [options[index], options[swapIndex]] = [options[swapIndex], options[index]];
    }
    return { ...question, options, answer: options.indexOf(correctOption) };
  }) } };
}

function GeneratedQuiz({ artifact }) {
  const questions = artifact?.payload?.questions || [];
  const [answers, setAnswers] = useState({});
  useEffect(() => setAnswers({}), [artifact?.id]);
  const answeredCount = Object.keys(answers).length;
  const score = Object.entries(answers).filter(([index, answer]) => questions[Number(index)]?.answer === answer).length;
  const quizComplete = questions.length > 0 && answeredCount === questions.length;

  if (!questions.length) return <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">Generate a paper-based quiz above to practice here.</div>;

  return <div className="mx-auto max-w-3xl space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div><h2 className="font-bold text-slate-900">{artifact.title}</h2><p className="text-sm text-slate-500">{questions.length} questions · {artifact.payload?.difficulty || "medium"} difficulty · answers are checked against the paper</p></div>
      <div className="rounded-full bg-primary-50 px-4 py-2 text-sm font-bold text-primary-700">Score: {score}/{questions.length} · {answeredCount}/{questions.length} answered</div>
      <button onClick={() => setAnswers({})} disabled={!answeredCount} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40">Start over</button>
    </div>
    {questions.map((question, questionIndex) => {
      const selectedAnswer = answers[questionIndex];
      return <article key={`${questionIndex}-${question.question}`} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-primary-600">Question {questionIndex + 1} of {questions.length}</p><h3 className="mt-1 text-lg font-bold leading-snug text-slate-900">{question.question}</h3></div>{question.page && <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700">p. {question.page}</span>}</div>
        <div className="space-y-2">{question.options.map((option, optionIndex) => {
          const isCorrect = optionIndex === question.answer;
          const isSelected = selectedAnswer === optionIndex;
          const style = selectedAnswer === undefined ? "border-slate-200 hover:border-primary-300 hover:bg-primary-50/50" : isCorrect ? "border-emerald-300 bg-emerald-50 text-emerald-900" : isSelected ? "border-red-300 bg-red-50 text-red-900" : "border-slate-100 bg-slate-50 text-slate-500";
          return <button key={optionIndex} disabled={selectedAnswer !== undefined} onClick={() => setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition ${style}`}><span className="font-bold">{String.fromCharCode(65 + optionIndex)}.</span><span>{option}</span>{selectedAnswer !== undefined && isCorrect && <span className="ml-auto text-xs font-semibold">Correct</span>}</button>;
        })}</div>
        {selectedAnswer !== undefined && <div className="rounded-lg bg-blue-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{selectedAnswer === question.answer ? "Correct" : "Review"}</p><p className="mt-1 text-sm leading-relaxed text-slate-700">{question.explanation}</p></div>}
      </article>;
    })}
    {quizComplete && <section aria-live="polite" className="rounded-2xl border-2 border-primary-200 bg-gradient-to-br from-white via-primary-50/50 to-indigo-50 p-6 text-center">
      <p className="text-xs font-black uppercase tracking-wider text-primary-600">Quiz Results</p><h3 className="mt-2 text-3xl font-black text-slate-900">{score} / {questions.length} correct</h3>
      <p className="mt-1 text-lg font-bold text-primary-700">{Math.round((score / questions.length) * 100)}%</p>
      <p className="mt-2 text-slate-600">{score === questions.length ? "Excellent work — you got every question right!" : score >= questions.length * 0.7 ? "Great work — review any missed explanations to strengthen your understanding." : "Review the explanations above, then try again to improve your score."}</p>
      <button onClick={() => setAnswers({})} className="mt-4 rounded-lg bg-primary-600 px-5 py-2.5 font-bold text-white hover:bg-primary-700">Retake quiz</button>
    </section>}
  </div>;
}

export default function Learning() {
  const [availablePapers, setAvailablePapers] = useState([]);
  const [selectedPaperId, setSelectedPaperId] = useState("");
  const [generatedCards, setGeneratedCards] = useState(null);
  const [generatedMindmap, setGeneratedMindmap] = useState(null);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [quizNotice, setQuizNotice] = useState("");
  const quizSectionRef = useRef(null);
  const [cardOrder, setCardOrder] = useState(() => flashcards.map((_, index) => index));
  const [cardRatings, setCardRatings] = useState({});
  const [retriedCards, setRetriedCards] = useState(() => new Set());
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [generationMode, setGenerationMode] = useState("");
  const [generationNotice, setGenerationNotice] = useState("");
  useEffect(() => {
    apiFetch("/papers").then(({ papers }) => {
      setAvailablePapers(papers);
      if (papers.length) setSelectedPaperId(papers[0].id);
    }).catch((err) => setGenerationError(err.message));
    apiFetch("/me/data").then(({ artifacts = [] }) => {
      const lastQuiz = artifacts.find((artifact) => artifact.kind === "quiz" && Array.isArray(artifact.payload?.questions) && artifact.payload.questions.length > 0);
      if (lastQuiz) setGeneratedQuiz(randomizeQuizOptions(lastQuiz));
    }).catch(() => {});
  }, []);
  const generateFromPaper = async (kind) => {
    if (!selectedPaperId) { setGenerationError("Upload a paper first, then choose it here."); return; }
    setGenerating(true); setGenerationError(""); setGenerationMode(""); setGenerationNotice("");
    try {
      const result = await apiFetch("/learning/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, paper_id: selectedPaperId, count: kind === "mindmap" ? 6 : 8 }) });
      const payload = result.artifact.payload || {};
      setGenerationMode(payload._generation_mode || "");
      setGenerationNotice(payload._generation_notice || "");
      if (kind === "flashcards") {
        const cards = payload.cards || [];
        setGeneratedCards(cards);
        setCardOrder(cards.map((_, index) => index));
        setCardRatings({});
        setRetriedCards(new Set());
        setTab("cards"); setCardIdx(0); setFlipped(false);
      }
      if (kind === "mindmap") { setGeneratedMindmap(payload); setTab("map"); }
    } catch (err) { setGenerationError(err.message); }
    finally { setGenerating(false); }
  };
  const [tab, setTab] = useState("cards");
  useEffect(() => {
    if (generatedQuiz && tab === "quiz") quizSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [generatedQuiz, tab]);
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const demoMindmapNodes = [
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

  const demoMindmapEdges = [
    ["center", "enc"], ["center", "dec"],
    ["center", "pos"], ["center", "res"],
    ["enc", "attn"], ["enc", "ffn"],
    ["dec", "mask"], ["dec", "cross"],
  ];
  const visibleCards = generatedCards === null ? flashcards : generatedCards.map((card, i) => ({ id: i + 1, front: card.front || card.question || card.title || "Study prompt", back: card.back || card.answer || card.content || "No answer supplied" }));
  const activeCardIdx = cardOrder[cardIdx] ?? 0;
  const activeCard = visibleCards[activeCardIdx];
  const advanceCard = () => { setFlipped(false); setCardIdx((index) => Math.min(cardOrder.length, index + 1)); };
  const rateCard = (rating) => {
    if (!activeCard) return;
    setCardRatings((ratings) => ({ ...ratings, [activeCardIdx]: rating }));
    if (rating === "again" && !retriedCards.has(activeCardIdx)) {
      setRetriedCards((retried) => new Set(retried).add(activeCardIdx));
      setCardOrder((order) => [...order, activeCardIdx]);
    }
    advanceCard();
  };
  const mindmapNodes = generatedMindmap ? (generatedMindmap.nodes || []).map((node, i, nodes) => {
    const isRoot = node.id === "root";
    const childIndex = isRoot ? 0 : nodes.slice(0, i).filter((item) => item.id !== "root").length;
    const childCount = Math.max(nodes.length - 1, 1);
    const angle = -Math.PI / 2 + (childIndex * 2 * Math.PI) / childCount;
    return { id: node.id || `node-${i}`, label: node.label || node.title || "Topic", page: node.page, evidence: node.evidence,
      x: isRoot ? 50 : 50 + 34 * Math.cos(angle), y: isRoot ? 50 : 50 + 37 * Math.sin(angle),
      color: isRoot ? "from-primary-500 to-accent-500" : "from-primary-300 to-primary-600", size: isRoot ? "lg" : "sm" };
  }) : demoMindmapNodes;
  const mindmapEdges = generatedMindmap ? (generatedMindmap.edges || []) : demoMindmapEdges.map(([source, target]) => ({ source, target, label: "" }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-sm font-medium text-primary-600">Output & Learning</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">🎓 Learning Tools</h1>
        <p className="mt-2 text-slate-500">Reinforce understanding with flashcards, quizzes, and interactive mind maps.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <label className="text-sm font-semibold text-slate-700" htmlFor="study-paper">Generate from paper</label>
        <select id="study-paper" value={selectedPaperId} onChange={(e) => setSelectedPaperId(e.target.value)} className="min-w-64 rounded-lg border border-slate-200 px-3 py-2 text-sm" disabled={!availablePapers.length}>
          {availablePapers.length ? availablePapers.map((paper) => <option key={paper.id} value={paper.id}>{paper.filename}</option>) : <option value="">No uploaded papers</option>}
        </select>
        <button onClick={() => generateFromPaper("flashcards")} disabled={generating || !selectedPaperId} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{generating ? "Generating…" : "Generate flashcards"}</button>
        <button onClick={() => generateFromPaper("mindmap")} disabled={generating || !selectedPaperId} className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-semibold text-primary-700 disabled:opacity-50">Generate mind map</button>
        {generationError && <p className="w-full text-sm text-red-600">{generationError}</p>}
        {generationMode === "source_fallback" && <p role="status" className="w-full rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{generationNotice || "Gemini was unavailable; this material uses retrieved PDF passages only."}</p>}
        {generationMode === "ai" && <p className="w-full text-sm font-medium text-emerald-700">AI-generated from the selected PDF.</p>}
      </div>

      <ArtifactGenerator kinds={["quiz", "visualization"]} heading="Generate a source-based quiz or visualization outline" onQuizGenerated={(artifact) => { setGeneratedQuiz(randomizeQuizOptions(artifact)); setQuizNotice(`Your ${artifact.payload?.difficulty || "medium"} quiz is ready below.`); setTab("quiz"); }} />
      {quizNotice && <p role="status" className="-mt-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">{quizNotice}</p>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { l: "Flashcards Mastered", v: visibleCards.length ? `${Math.round((Object.values(cardRatings).filter((rating) => rating === "got-it").length / visibleCards.length) * 100)}%` : "—", sub: `${Object.keys(cardRatings).length} reviewed of ${visibleCards.length}`, i: "🃏" },
          { l: "Papers Available", v: availablePapers.length, sub: "Ready for paper-based learning", i: "📄" },
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
          {visibleCards.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">No validated flashcards were returned. Check the configured AI model, then generate again.</div> : cardIdx >= cardOrder.length ? <div className="rounded-2xl border border-primary-100 bg-white p-10 text-center shadow-sm">
            <p className="text-4xl">🎉</p>
            <h2 className="mt-3 text-2xl font-black text-slate-900">Deck reviewed</h2>
            <p className="mt-2 text-slate-600">You marked {Object.keys(cardRatings).length} of {visibleCards.length} cards. Cards marked Again were shown once more.</p>
            <button onClick={() => { setCardIdx(0); setFlipped(false); }} className="mt-6 rounded-xl bg-primary-600 px-6 py-3 font-bold text-white hover:bg-primary-700">Review deck again</button>
          </div> : <>
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Card {cardIdx + 1} of {cardOrder.length}</p>
            <div className="mt-3 h-2 w-full max-w-md mx-auto bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all" style={{ width: `${((cardIdx + 1) / cardOrder.length) * 100}%` }} />
            </div>
          </div>

          <div onClick={() => setFlipped(!flipped)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setFlipped((value) => !value); } }} role="button" tabIndex={0} aria-label={flipped ? "Show flashcard question" : "Reveal flashcard answer"} className="relative h-80 cursor-pointer group" style={{ perspective: "1500px" }}>
            <div className="absolute inset-0 transition-transform duration-700" style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 p-6 text-white shadow-2xl shadow-primary-500/40 sm:p-8" style={{ backfaceVisibility: "hidden" }}>
                <span className="text-xs font-black uppercase tracking-widest opacity-75 mb-4">Question</span>
                <div className="max-h-44 w-full max-w-lg overflow-y-auto px-2" onClick={(event) => event.stopPropagation()}>
                  <h3 className="break-words text-center text-lg font-black leading-snug sm:text-2xl">{activeCard.front}</h3>
                </div>
                <p className="mt-8 text-sm opacity-75">Click to reveal answer →</p>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-primary-200 bg-white p-6 shadow-2xl sm:p-8" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                <span className="text-xs font-black uppercase tracking-widest text-primary-500 mb-4">Answer</span>
                <div className="max-h-44 w-full max-w-lg overflow-y-auto px-2" onClick={(event) => event.stopPropagation()}>
                  <h3 className="break-words text-center text-base font-semibold leading-relaxed text-slate-800 sm:text-lg">{activeCard.back}</h3>
                </div>
                <p className="mt-8 text-xs text-slate-400">← Click to flip back</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button onClick={e => { e.stopPropagation(); setFlipped(false); setCardIdx(i => Math.max(0, i - 1)); }} disabled={cardIdx === 0} className="px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-40 transition flex items-center gap-2">
              ← Previous
            </button>
            <button onClick={() => rateCard("again")} aria-pressed={cardRatings[activeCardIdx] === "again"} className="px-5 py-3 rounded-xl bg-success-50 text-success-700 font-bold hover:bg-success-100 transition flex items-center gap-1">
              ❌ Again
            </button>
            <button onClick={() => rateCard("hard")} aria-pressed={cardRatings[activeCardIdx] === "hard"} className="px-5 py-3 rounded-xl bg-warning-50 text-warning-700 font-bold hover:bg-warning-100 transition flex items-center gap-1">
              🟡 Hard
            </button>
            <button onClick={() => rateCard("got-it")} aria-pressed={cardRatings[activeCardIdx] === "got-it"} className="px-5 py-3 rounded-xl bg-primary-50 text-primary-700 font-bold hover:bg-primary-100 transition flex items-center gap-1">
              ✅ Got It
            </button>
            <button onClick={advanceCard} disabled={cardIdx === cardOrder.length - 1} className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 disabled:opacity-40 transition flex items-center gap-2">
              Next →
            </button>
          </div>
          </>}
        </div>
      )}

      {tab === "quiz" && <div ref={quizSectionRef} className="scroll-mt-6"><GeneratedQuiz artifact={generatedQuiz} /></div>}

      {tab === "map" && (
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-primary-50/30 overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-white flex items-center justify-between">
            <div>
              <h3 className="font-black text-xl text-slate-900">{generatedMindmap ? "Generated Paper Mind Map" : "Transformer Architecture Mind Map"}</h3>
              <p className="text-sm text-slate-500">Each concept cites its paper page. Hover over a node to inspect the supporting passage.</p>
            </div>
            <div className="flex gap-1 p-1 rounded-lg bg-slate-100">
              <button className="px-3 py-1.5 rounded-md bg-white shadow-sm text-xs font-bold text-primary-700">🔭 Explore</button>
              <button className="px-3 py-1.5 rounded-md text-xs font-bold text-slate-500 hover:text-slate-700">✏ Edit</button>
              <button className="px-3 py-1.5 rounded-md text-xs font-bold text-slate-500 hover:text-slate-700">➕ Expand</button>
            </div>
          </div>
          {mindmapNodes.length === 0 && <p className="p-8 text-center text-slate-600">No validated mind map was returned. Check your configured AI model, then generate again.</p>}
          <div className="h-[600px] relative">
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <marker id="arrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
                </marker>
              </defs>
              {mindmapEdges.map((edge, i) => {
                const na = mindmapNodes.find(n => n.id === edge.source);
                const nb = mindmapNodes.find(n => n.id === edge.target);
                if (!na || !nb) return null;
                return <g key={i}>
                  <line x1={`${na.x}%`} y1={`${na.y}%`} x2={`${nb.x}%`} y2={`${nb.y}%`} stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#arrow)" />
                  {edge.label && <text x={`${(na.x + nb.x) / 2}%`} y={`${(na.y + nb.y) / 2}%`} textAnchor="middle" className="fill-slate-500" fontSize="11">{edge.label}</text>}
                </g>;
              })}
            </svg>
            {mindmapNodes.map(n => (
              <div key={n.id} className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group" style={{ left: `${n.x}%`, top: `${n.y}%` }}>
                <div className={`w-fit rounded-2xl border border-white/30 text-white shadow-xl shadow-indigo-900/20 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-900/30 ${n.size === "lg" ? "min-w-[13rem] max-w-[26rem] px-7 py-5" : "min-w-[10rem] max-w-[20rem] px-5 py-4"}`} style={{ backgroundColor: n.size === "lg" ? "#6d28d9" : "#4f46e5", backgroundImage: n.size === "lg" ? "linear-gradient(135deg, #6d28d9 0%, #4f46e5 52%, #c026d3 100%)" : "linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)", textShadow: "0 1px 2px rgba(15,23,42,0.35)" }}>
                  <p className={`whitespace-normal break-words [overflow-wrap:anywhere] text-center font-extrabold leading-snug text-white ${n.size === "lg" ? "text-xl" : "text-sm sm:text-base"}`}>{n.label}</p>
                  {n.page && <p className="mt-1 text-center text-xs font-semibold text-white/80">Source · p. {n.page}</p>}
                </div>
                <div className="absolute left-1/2 z-10 w-64 -translate-x-1/2 top-full mt-2 rounded-lg bg-slate-900 text-white text-xs px-3 py-2 opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-normal shadow-lg">
                  <span className="font-semibold">Evidence from p. {n.page}: </span>{n.evidence || "Demo concept"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
