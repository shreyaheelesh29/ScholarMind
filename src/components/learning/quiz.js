export async function requestQuizAttempt(apiFetch, quizId, selectedOptions) {
  const { attempt } = await apiFetch(`/quizzes/${quizId}/attempts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers: selectedOptions }),
  });
  return attempt;
}

export async function requestFreshQuiz(apiFetch, { paperId, count, difficulty, previousQuestions }) {
  const result = await apiFetch("/learning/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: "quiz",
      paper_id: paperId,
      count,
      difficulty,
      avoid_questions: previousQuestions.map((question) => question.question).filter(Boolean).slice(0, 20),
      variation_seed: Date.now().toString(36),
    }),
  });
  const artifact = result.artifact;
  if (!Array.isArray(artifact?.payload?.questions) || !artifact.payload.questions.length) {
    throw new Error("The model did not return usable quiz questions. Your previous quiz is still available; try again.");
  }
  return artifact;
}
