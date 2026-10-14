export function cleanFlashcardText(value, removeSerial = false) {
  let text = String(value || "").replace(/#{1,6}\s*={3,}/g, "").replace(/={3,}/g, "").replace(/\s+/g, " ").trim();
  if (removeSerial) text = text.replace(/^(?:(?:question\s*)?\d{1,3}\s*[.):\-]\s*)+/i, "").trim();
  return text;
}

export async function requestFlashcards(apiFetch, paperId, count) {
  return apiFetch("/learning/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "flashcards", paper_id: paperId, count }),
  });
}

export function normalizeFlashcards(cards = []) {
  return cards.map((card) => ({
    ...card,
    front: cleanFlashcardText(card.front || card.question || card.title, true),
    back: cleanFlashcardText(card.back || card.answer || card.content),
  }));
}

export function saveFlashcardReview(apiFetch, artifactId, cardIndex, rating) {
  return apiFetch(`/artifacts/${artifactId}/flashcard-reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reviews: { [String(cardIndex)]: rating } }),
  });
}
