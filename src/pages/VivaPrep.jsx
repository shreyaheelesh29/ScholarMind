import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ArtifactGenerator from "../components/research/ArtifactGenerator";

const tabs = [
  { id: "questions", label: "Practice Questions", icon: "❓" },
  { id: "weakness", label: "Weakness Spotter", icon: "🔍" },
  { id: "coach", label: "Answer Coach", icon: "🎯" },
  { id: "mock", label: "Mock Viva", icon: "🎭" },
];

const cleanQuestions = (artifact) => {
  const items = artifact?.payload?.questions;
  if (!Array.isArray(items)) return [];
  return items.filter((item) => typeof item?.question === "string" && item.question.trim()).map((item, index) => ({
    id: `${artifact.id || "viva"}-${index}`,
    question: item.question.trim(),
    answer: typeof item.answer === "string" ? item.answer.trim() : "",
    page: Number.isInteger(item.page) && item.page > 0 ? item.page : null,
  }));
};

export default function VivaPrep() {
  const [activeTab, setActiveTab] = useState("questions");
  const [questions, setQuestions] = useState([]);
  const [paper, setPaper] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answers, setAnswers] = useState({});
  const [confidence, setConfidence] = useState({});
  const [mockRunning, setMockRunning] = useState(false);
  const [mockTime, setMockTime] = useState(0);
  const [mockQuestionIdx, setMockQuestionIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [hintVisible, setHintVisible] = useState(false);
  const timerRef = useRef(null);

  const currentQuestion = questions[currentIdx] || null;
  const mockQuestion = questions[mockQuestionIdx] || null;
  const weakQuestions = useMemo(() => questions
    .map((question, index) => ({ ...question, index, rating: confidence[question.id] }))
    .filter((question) => question.rating === "low"), [questions, confidence]);

  const handleVivaGenerated = (artifact, sourcePaper) => {
    const generated = cleanQuestions(artifact);
    setQuestions(generated);
    setPaper(sourcePaper || null);
    setCurrentIdx(0);
    setMockQuestionIdx(0);
    setAnswers({});
    setConfidence({});
    setAnsweredCount(0);
    setShowAnswer(false);
    setMockRunning(false);
    setRecording(false);
  };

  useEffect(() => {
    if (!mockRunning) return undefined;
    timerRef.current = setInterval(() => setMockTime((time) => time + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [mockRunning]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const openQuestion = (index, tab = "questions") => {
    setCurrentIdx(index);
    setShowAnswer(false);
    setActiveTab(tab);
  };
  const saveAnswer = (question, value) => setAnswers((saved) => ({ ...saved, [question.id]: value }));
  const saveConfidence = (question, value) => setConfidence((saved) => ({ ...saved, [question.id]: value }));
  const startMock = () => {
    setMockTime(0);
    setMockQuestionIdx(0);
    setAnsweredCount(0);
    setRecording(true);
    setHintVisible(false);
    setMockRunning(true);
  };
  const nextMockQuestion = () => {
    setAnsweredCount((count) => count + 1);
    if (mockQuestionIdx < questions.length - 1) setMockQuestionIdx((index) => index + 1);
    else { setMockRunning(false); setRecording(false); }
  };

  return <div className="space-y-6 animate-fade-in">
    <ArtifactGenerator id="viva-generator" kinds={["viva"]} heading="Generate viva questions from an uploaded paper" onVivaGenerated={handleVivaGenerated} />

    <header>
      <p className="text-sm font-medium text-primary-600">Output &amp; Learning</p>
      <h1 className="mt-1 text-3xl font-bold text-slate-900">🎤 Viva Preparation</h1>
      <p className="mt-2 text-slate-500">Practice, review and assess your answers using questions generated from your selected paper.</p>
    </header>

    <section className="grid grid-cols-2 gap-4 md:grid-cols-4" aria-label="Viva practice summary">
      {[
        { label: "Paper Questions", value: questions.length, icon: "📝" },
        { label: "Source Paper", value: paper?.filename || "None yet", icon: "📄", compact: true },
        { label: "Practiced", value: answeredCount, icon: "✅" },
        { label: "Need More Practice", value: weakQuestions.length, icon: "⚠️" },
      ].map((stat) => <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-xs font-black uppercase tracking-wider text-slate-400">{stat.label}</p><p className={`mt-2 truncate font-black text-slate-900 ${stat.compact ? "text-base" : "text-3xl"}`} title={String(stat.value)}>{stat.value}</p></div><span className="text-2xl">{stat.icon}</span></div>
      </div>)}
    </section>

    <nav className="flex w-fit flex-wrap gap-1 rounded-2xl bg-slate-100 p-1.5" aria-label="Viva tools">
      {tabs.map((tab) => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${activeTab === tab.id ? "bg-white text-primary-700 shadow-sm" : "text-slate-500 hover:bg-white/50 hover:text-slate-700"}`}><span className="mr-2">{tab.icon}</span>{tab.label}</button>)}
    </nav>

    {!questions.length ? <div className="rounded-2xl border border-dashed border-indigo-200 bg-white p-8 text-center">
      <p className="text-lg font-bold text-slate-800">Generate questions from a paper to begin</p>
      <p className="mt-2 text-sm text-slate-500">All four practice tools use the generated question set and its paper citations. No sample paper questions are loaded.</p>
      <button onClick={() => document.getElementById("viva-generator")?.scrollIntoView({ behavior: "smooth", block: "center" })} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700">Go to question generator ↑</button>
    </div> : <>
      {activeTab === "questions" && currentQuestion && <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 p-5">
              <div><p className="text-xs font-bold uppercase tracking-wide text-indigo-600">Question {currentIdx + 1} of {questions.length}</p><p className="mt-1 text-xs text-slate-500">{paper?.filename || "Selected paper"}{currentQuestion.page ? ` · Page ${currentQuestion.page}` : ""}</p></div>
              <div className="flex gap-2"><button disabled={currentIdx === 0} onClick={() => openQuestion(currentIdx - 1)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">← Previous</button><button disabled={currentIdx >= questions.length - 1} onClick={() => openQuestion(currentIdx + 1)} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Next →</button></div>
            </div>
            <div className="space-y-5 p-6">
              <h2 className="text-xl font-bold leading-snug text-slate-900">{currentQuestion.question}</h2>
              {currentQuestion.page && paper?.id && <Link to={`/viewer?paperId=${encodeURIComponent(paper.id)}&page=${currentQuestion.page}`} className="inline-flex rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">Open source page {currentQuestion.page} ↗</Link>}
              <label className="block text-sm font-semibold text-slate-700">Your practice answer<textarea value={answers[currentQuestion.id] || ""} onChange={(event) => saveAnswer(currentQuestion, event.target.value)} rows={5} placeholder="Write or dictate your answer, then compare it with the paper-grounded answer…" className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" /></label>
              <div className="flex flex-wrap items-center justify-between gap-3"><button onClick={() => setShowAnswer((shown) => !shown)} className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">{showAnswer ? "Hide suggested answer" : "Reveal paper answer"}</button><label className="flex items-center gap-2 text-sm text-slate-600">Self-assessment<select value={confidence[currentQuestion.id] || ""} onChange={(event) => saveConfidence(currentQuestion, event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-2"><option value="">Choose…</option><option value="low">Need more practice</option><option value="medium">Almost there</option><option value="high">Confident</option></select></label></div>
              {showAnswer && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Suggested answer from the selected paper</p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{currentQuestion.answer || "No answer was included with this generated question."}</p>{currentQuestion.page && <p className="mt-2 text-xs text-emerald-800">Source: {paper?.filename || "Selected paper"}, page {currentQuestion.page}</p>}</div>}
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="mb-3 font-bold text-slate-900">Question set</h3><div className="max-h-[32rem] space-y-2 overflow-y-auto">{questions.map((question, index) => <button key={question.id} onClick={() => openQuestion(index)} className={`w-full rounded-xl border p-3 text-left transition ${index === currentIdx ? "border-indigo-400 bg-indigo-50" : "border-slate-100 bg-slate-50 hover:border-indigo-200"}`}><span className="text-xs font-bold uppercase text-indigo-600">Question {index + 1}{question.page ? ` · p. ${question.page}` : ""}</span><span className="mt-1 block text-sm font-medium text-slate-800">{question.question}</span></button>)}</div></section>
        </div>
      </div>}

      {activeTab === "weakness" && <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-bold text-slate-900">Weakness Spotter</h2><p className="mb-5 mt-1 text-sm text-slate-500">Based on your self-assessment of questions generated from {paper?.filename || "the selected paper"}.</p>{weakQuestions.length ? <div className="space-y-3">{weakQuestions.map((question) => <article key={question.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50/50 p-4"><div><p className="font-semibold text-slate-900">{question.question}</p><p className="mt-1 text-xs text-slate-500">Marked “Need more practice”{question.page ? ` · Source page ${question.page}` : ""}</p></div><button onClick={() => openQuestion(question.index)} className="rounded-lg bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100">Practice →</button></article>)}</div> : <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600">No weak areas marked yet. Practice a generated question and choose “Need more practice” in its self-assessment to track it here.</div>}</section>}

      {activeTab === "coach" && currentQuestion && <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-xs font-bold uppercase tracking-wide text-indigo-600">Answer coach · {currentIdx + 1}/{questions.length}</p><h2 className="mt-2 text-lg font-bold text-slate-900">{currentQuestion.question}</h2><label className="mt-5 block text-sm font-semibold text-slate-700">Draft your answer<textarea value={answers[currentQuestion.id] || ""} onChange={(event) => saveAnswer(currentQuestion, event.target.value)} rows={7} placeholder="Answer in your own words, using evidence from the paper…" className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" /></label><div className="mt-3 flex flex-wrap gap-2"><button disabled={currentIdx === 0} onClick={() => { setCurrentIdx((index) => index - 1); }} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">← Previous</button><button disabled={currentIdx >= questions.length - 1} onClick={() => setCurrentIdx((index) => index + 1)} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Next question →</button><button onClick={() => setShowAnswer((shown) => !shown)} className="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700">{showAnswer ? "Hide comparison" : "Compare with paper answer"}</button></div>{showAnswer && <div className="mt-4 rounded-xl bg-emerald-50 p-4"><p className="text-xs font-bold uppercase text-emerald-800">Paper-grounded answer</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{currentQuestion.answer || "No suggested answer was provided."}</p>{currentQuestion.page && <p className="mt-2 text-xs text-emerald-800">Page {currentQuestion.page}</p>}</div>}</section>
        <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-6"><h3 className="font-bold text-slate-900">Build a clear viva answer</h3><p className="mt-1 text-sm text-slate-600">Use the paper evidence for this question; the steps below are a structure guide.</p><ol className="mt-5 space-y-3">{[{ title: "Answer directly", detail: "State your response to the question in one clear sentence." }, { title: "Explain the reasoning", detail: "Describe the method, result or concept the paper presents." }, { title: "Point to evidence", detail: currentQuestion.page ? `Use the cited passage on page ${currentQuestion.page}.` : "Refer to a specific passage, figure or result in the paper." }, { title: "Add a qualification", detail: "Mention a limitation or condition only when the paper supports it." }].map((step, index) => <li key={step.title} className="flex gap-3 rounded-xl bg-white/80 p-4"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">{index + 1}</span><div><p className="font-semibold text-slate-800">{step.title}</p><p className="mt-1 text-sm text-slate-600">{step.detail}</p></div></li>)}</ol></section>
      </div>}

      {activeTab === "mock" && <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{mockRunning ? "Mock viva in progress" : "Mock viva"}</p><h2 className="mt-1 text-3xl font-black text-slate-900">{formatTime(mockTime)}</h2><p className="mt-1 text-sm text-slate-500">{paper?.filename || "Selected paper"} · {questions.length} paper-generated questions</p></div>{mockRunning ? <button onClick={() => { setMockRunning(false); setRecording(false); }} className="rounded-lg bg-slate-800 px-4 py-2 font-semibold text-white">End session</button> : <button onClick={startMock} className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700">Start mock viva</button>}</div>
        {mockRunning && mockQuestion && <div className="mt-6 space-y-4"><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-indigo-500 transition-all" style={{ width: `${((mockQuestionIdx + 1) / questions.length) * 100}%` }} /></div><article className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5"><p className="text-xs font-bold uppercase text-indigo-600">Question {mockQuestionIdx + 1} of {questions.length}{mockQuestion.page ? ` · Source page ${mockQuestion.page}` : ""}{recording ? " · Practice active" : " · Paused"}</p><h3 className="mt-2 text-xl font-bold text-slate-900">{mockQuestion.question}</h3>{mockQuestion.page && paper?.id && <Link to={`/viewer?paperId=${encodeURIComponent(paper.id)}&page=${mockQuestion.page}`} className="mt-2 inline-block text-sm font-semibold text-indigo-700">Open source page ↗</Link>}</article><label className="block text-sm font-semibold text-slate-700">Your spoken answer notes<textarea value={answers[mockQuestion.id] || ""} onChange={(event) => saveAnswer(mockQuestion, event.target.value)} rows={4} placeholder="Add notes after answering aloud…" className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal" /></label><div className="flex flex-wrap justify-between gap-3"><button onClick={() => setRecording((value) => !value)} className="rounded-lg border px-4 py-2 text-sm font-semibold">{recording ? "Pause practice" : "Resume practice"}</button><button onClick={() => setHintVisible((visible) => !visible)} className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700">{hintVisible ? "Hide answer" : "Show paper answer"}</button><button onClick={nextMockQuestion} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white">{mockQuestionIdx < questions.length - 1 ? "Mark answered · Next →" : "Finish mock viva"}</button></div>{hintVisible && <div className="rounded-xl bg-emerald-50 p-4 text-sm text-slate-700"><p className="font-bold text-emerald-800">Suggested paper answer</p><p className="mt-2 whitespace-pre-wrap">{mockQuestion.answer || "No suggested answer was provided."}</p></div>}</div>}
        {!mockRunning && <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-5 text-sm text-slate-600">The mock session will use these {questions.length} generated questions in order. Your timer, progress and answer notes are tracked during this session.</div>}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">{[{ label: "Questions completed", value: answeredCount }, { label: "Remaining in session", value: Math.max(questions.length - answeredCount, 0) }, { label: "Time elapsed", value: formatTime(mockTime) }].map((stat) => <div key={stat.label} className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase text-slate-500">{stat.label}</p><p className="mt-1 text-xl font-bold text-slate-900">{stat.value}</p></div>)}</div>
      </section>}
    </>}
  </div>;
}
