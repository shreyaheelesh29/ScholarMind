import test from "node:test";
import assert from "node:assert/strict";

import { requestQuizAttempt, requestFreshQuiz } from "../src/components/learning/quiz.js";
import { cleanFlashcardText, normalizeFlashcards, saveFlashcardReview } from "../src/components/learning/flashcards.js";

test("quiz attempts send selected answers and return the saved attempt", async () => {
  const expected = { id: "attempt-1", score: 1 };
  let request;
  const attempt = await requestQuizAttempt(async (...args) => {
    request = args;
    return { attempt: expected };
  }, "quiz-1", { 0: 2 });

  assert.equal(attempt, expected);
  assert.equal(request[0], "/quizzes/quiz-1/attempts");
  assert.equal(request[1].method, "POST");
  assert.deepEqual(JSON.parse(request[1].body), { answers: { 0: 2 } });
});

test("fresh quiz generation rejects an empty response with a useful message", async () => {
  await assert.rejects(
    requestFreshQuiz(async () => ({ artifact: { payload: { questions: [] } } }), {
      paperId: "paper-1", count: 5, difficulty: "medium", previousQuestions: [],
    }),
    /did not return usable quiz questions/,
  );
});

test("flashcard text cleanup removes numbering and normalizes whitespace", () => {
  assert.equal(cleanFlashcardText("  Question 12:  What is\n RAG?  ", true), "What is RAG?");
  assert.deepEqual(normalizeFlashcards([{ question: "1) Define RAG", answer: "  Retrieval\n augmented generation " }]), [
    { question: "1) Define RAG", answer: "  Retrieval\n augmented generation ", front: "Define RAG", back: "Retrieval augmented generation" },
  ]);
});

test("flashcard review sends the selected rating", async () => {
  let request;
  const response = { ok: true };
  const result = await saveFlashcardReview(async (...args) => {
    request = args;
    return response;
  }, "artifact-1", 2, "good");

  assert.equal(result, response);
  assert.equal(request[0], "/artifacts/artifact-1/flashcard-reviews");
  assert.deepEqual(JSON.parse(request[1].body), { reviews: { "2": "good" } });
});
