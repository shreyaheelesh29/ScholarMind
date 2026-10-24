from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import rag


PASSAGE = {
    "paper_id": "paper-1", "filename": "study.pdf", "page_number": 4,
    "chunk_number": 7, "section": "Results",
    "content": "The intervention reduced mean recovery time by 20% compared with standard care. The study included 120 participants.",
}


def review(card_id: str, answer: str, quote: str, *, supported: bool = True,
           matches: bool = True, page: int = 4, chunk: int = 7) -> str:
    return json.dumps({"verifications": [{
        "id": card_id, "supported": supported, "question_answer_match": matches,
        "answer": answer,
        "evidence": [{"quote": quote, "page": page, "chunk_number": chunk}],
    }]})


class FlashcardVerificationTests(unittest.TestCase):
    def setUp(self):
        self.provider = patch.object(rag, "_provider_settings", return_value=("", "http://localhost:11434", True, "test-model"))
        self.provider.start()
        self.addCleanup(self.provider.stop)

    def card(self, card_id="card-1", front="By how much did the intervention reduce recovery time?", back="20%."):
        return {"id": card_id, "front": front, "back": back}

    def test_accepts_answer_supported_by_exact_question_specific_source_quote(self):
        card = self.card()
        response = review("card-1", "It reduced mean recovery time by 20% compared with standard care.",
                          "The intervention reduced mean recovery time by 20% compared with standard care.")
        with patch.object(rag, "_chat_request", return_value=response):
            verified = rag.verify_flashcards([card], {"card-1": [PASSAGE]})
        self.assertEqual(len(verified), 1)
        self.assertEqual(verified[0]["front"], card["front"])
        self.assertEqual(verified[0]["id"], "card-1")
        self.assertEqual(verified[0]["page"], 4)
        self.assertEqual(verified[0]["section"], "Results")

    def test_rejects_plausible_topic_answer_when_it_does_not_answer_question(self):
        card = self.card(front="How many participants were included?", back="Recovery time fell by 20%.")
        response = review("card-1", "Recovery time fell by 20%.",
                          "The intervention reduced mean recovery time by 20% compared with standard care.", matches=False)
        with patch.object(rag, "_chat_request", return_value=response):
            verified = rag.verify_flashcards([card], {"card-1": [PASSAGE]})
        self.assertEqual(verified, [])  # initial review and bounded repair both reject

    def test_rejects_quote_from_wrong_page_and_unsupported_numeric_claim(self):
        card = self.card()
        wrong_page = review("card-1", "It reduced recovery time by 20%.",
                            "The intervention reduced mean recovery time by 20% compared with standard care.", page=99)
        unsupported_number = review("card-1", "It reduced recovery time by 30%.",
                                    "The intervention reduced mean recovery time by 20% compared with standard care.")
        for response in (wrong_page, unsupported_number):
            with self.subTest(response=response), patch.object(rag, "_chat_request", return_value=response):
                self.assertEqual(rag.verify_flashcards([card], {"card-1": [PASSAGE]}), [])

    def test_repair_can_correct_answer_but_preserves_card_identity_and_front(self):
        card = self.card(front="How many participants were included?", back="The study included 100 participants.")
        repaired = review("card-1", "The study included 120 participants.",
                          "The study included 120 participants.")
        with patch.object(rag, "_chat_request", side_effect=["{bad json}", repaired]) as request:
            verified = rag.verify_flashcards([card], {"card-1": [PASSAGE]})
        self.assertEqual(request.call_count, 2)
        self.assertEqual(len(verified), 1)
        self.assertEqual(verified[0]["front"], card["front"])
        self.assertEqual(verified[0]["id"], card["id"])
        self.assertEqual(verified[0]["back"], "The study included 120 participants.")

    def test_verifier_output_order_cannot_swap_answers_between_cards(self):
        cards = [self.card("first", "By how much did recovery time fall?"),
                 self.card("second", "How many participants were included?")]
        evidence = {"first": [PASSAGE], "second": [PASSAGE]}
        # The verifier returns records in reverse order; IDs, not list position,
        # determine the answer-to-question association.
        response = json.dumps({"verifications": [
            {"id": "second", "supported": True, "question_answer_match": True,
             "answer": "120 participants.", "evidence": [{"quote": "The study included 120 participants.", "page": 4, "chunk_number": 7}]},
            {"id": "first", "supported": True, "question_answer_match": True,
             "answer": "Recovery time fell by 20%.", "evidence": [{"quote": "The intervention reduced mean recovery time by 20% compared with standard care.", "page": 4, "chunk_number": 7}]},
        ]})
        with patch.object(rag, "_chat_request", return_value=response):
            verified = rag.verify_flashcards(cards, evidence)
        self.assertEqual([card["id"] for card in verified], ["first", "second"])
        self.assertEqual([card["back"] for card in verified], ["Recovery time fell by 20%.", "120 participants."])

    def test_local_verifier_reviews_one_card_at_a_time_to_fit_small_context(self):
        cards = [self.card("first"), self.card("second")]

        def response_for_card(_base, _model, messages, **_kwargs):
            user_message = messages[1]["content"]
            payload = json.loads(user_message[user_message.index("{"):])
            card_id = payload["cards"][0]["id"]
            return review(card_id, "Recovery time fell by 20%.",
                          "The intervention reduced mean recovery time by 20% compared with standard care.")

        with patch.object(rag, "_chat_request", side_effect=response_for_card) as request:
            verified = rag.verify_flashcards(cards, {card["id"]: [PASSAGE] for card in cards})
        self.assertEqual(request.call_count, 2)
        self.assertEqual([card["id"] for card in verified], ["first", "second"])

    def test_local_verifier_accepts_single_record_aliases_and_keeps_candidate_answer(self):
        card = self.card(back="Recovery time fell by 20%.")
        response = json.dumps({
            "is_supported": "true", "answers_question": "yes",
            "evidence": [{"text": "The intervention reduced mean recovery time by 20% compared with standard care.",
                          "page": 4, "chunk_number": 7}],
        })
        with patch.object(rag, "_chat_request", return_value=response):
            verified = rag.verify_flashcards([card], {"card-1": [PASSAGE]})
        self.assertEqual(len(verified), 1)
        self.assertEqual(verified[0]["back"], card["back"])

    def test_no_provider_or_no_evidence_returns_no_unverified_cards(self):
        card = self.card()
        with patch.object(rag, "_provider_settings", return_value=("", "", False, "")):
            self.assertEqual(rag.verify_flashcards([card], {"card-1": [PASSAGE]}), [])
        with patch.object(rag, "_chat_request") as request:
            self.assertEqual(rag.verify_flashcards([card], {"card-1": []}), [])
            request.assert_not_called()


if __name__ == "__main__":
    unittest.main()
