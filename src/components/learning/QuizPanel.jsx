export default function QuizPanel({ artifact, answers, setAnswers, onRetake, regenerating = false,
  submitted = false, onSubmit, submitting = false, submitError = "", result = null }) {
  const questions = artifact?.payload?.questions || [];
  const answeredCount = Object.keys(answers).filter((index) => questions[Number(index)]).length;
  const score = result?.correct_answers ?? 0;
  const unansweredCount = result?.unanswered ?? Math.max(0, questions.length - answeredCount);
  const incorrectCount = result?.incorrect_answers ?? Math.max(0, answeredCount - score);

  if (!questions.length) return <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">Generate a paper-based quiz above to practice here.</div>;

  return <div className="mx-auto max-w-3xl space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div><h2 className="font-bold text-slate-900">{artifact.title}</h2><p className="text-sm text-slate-500">{questions.length} questions · {artifact.payload?.difficulty || "medium"} difficulty · answers are checked against the paper</p></div>
      <div className="rounded-full bg-primary-50 px-4 py-2 text-sm font-bold text-primary-700">{submitted ? `Score: ${score}/${questions.length}` : `${answeredCount}/${questions.length} answered`}</div>
      <button onClick={onRetake} disabled={regenerating} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40">{regenerating ? "Generating…" : "New questions"}</button>
    </div>
    {questions.map((question, questionIndex) => {
      const selectedAnswer = answers[questionIndex];
      const submittedQuestion = result?.questions?.find((item) => item.question_index === questionIndex);
      const correctAnswer = submittedQuestion?.correct_answer;
      return <article key={`${questionIndex}-${question.question}`} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-primary-600">Question {questionIndex + 1} of {questions.length}</p><h3 className="mt-1 text-lg font-bold leading-snug text-slate-900">{question.question}</h3></div>{question.page && <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700">p. {question.page}</span>}</div>
        <div className="space-y-2">{question.options.map((option, optionIndex) => {
          const isCorrect = submitted && option === correctAnswer;
          const isSelected = selectedAnswer === optionIndex;
          const style = !submitted ? (isSelected ? "border-primary-300 bg-primary-50 text-primary-900" : "border-slate-200 hover:border-primary-300 hover:bg-primary-50/50") : isCorrect ? "border-emerald-300 bg-emerald-50 text-emerald-900" : isSelected ? "border-red-300 bg-red-50 text-red-900" : "border-slate-100 bg-slate-50 text-slate-500";
          return <button key={optionIndex} disabled={submitted} aria-pressed={isSelected} onClick={() => setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition ${style}`}><span className="font-bold">{String.fromCharCode(65 + optionIndex)}.</span><span>{option}</span>{submitted && isCorrect && <span className="ml-auto text-xs font-semibold">Correct answer</span>}{submitted && isSelected && !isCorrect && <span className="ml-auto text-xs font-semibold">Your answer</span>}</button>;
        })}</div>
        {submitted && <div className={`rounded-lg p-3 ${selectedAnswer === undefined ? "bg-amber-50" : submittedQuestion?.is_correct ? "bg-emerald-50" : "bg-red-50"}`}><p className="text-xs font-semibold uppercase tracking-wide text-slate-700">{selectedAnswer === undefined ? "Unanswered" : submittedQuestion?.is_correct ? "Correct" : "Review the correct answer"}</p><p className="mt-1 text-sm leading-relaxed text-slate-700">{submittedQuestion?.explanation || question.explanation}</p></div>}
      </article>;
    })}
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-600">{submitted ? `${questions.length} total · ${score} correct · ${incorrectCount} incorrect · ${unansweredCount} unanswered` : `${unansweredCount} unanswered will count as incorrect.`}</p>
      {!submitted && <button onClick={onSubmit} disabled={submitting} className="rounded-lg bg-primary-600 px-5 py-2.5 font-bold text-white hover:bg-primary-700 disabled:opacity-50">{submitting ? "Saving results…" : "Submit quiz"}</button>}
      {submitError && <p role="alert" className="w-full text-sm text-red-700">{submitError}</p>}
    </div>
    {submitted && <section aria-live="polite" className="rounded-2xl border-2 border-primary-200 bg-gradient-to-br from-white via-primary-50/50 to-indigo-50 p-6 text-center">
      <p className="text-xs font-black uppercase tracking-wider text-primary-600">Quiz Results</p><h3 className="mt-2 text-3xl font-black text-slate-900">{score} / {questions.length} correct</h3>
      <p className="mt-1 text-lg font-bold text-primary-700">{Number(result?.percentage ?? (score / questions.length) * 100).toFixed(0)}%</p>
      <p className="mt-1 text-sm text-slate-600">{incorrectCount} incorrect · {unansweredCount} unanswered</p>
      <button onClick={onRetake} disabled={regenerating} className="mt-4 rounded-lg bg-primary-600 px-5 py-2.5 font-bold text-white hover:bg-primary-700 disabled:opacity-50">{regenerating ? "Generating new questions…" : "Retake with new questions"}</button>
    </section>}
  </div>;
}
