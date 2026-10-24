from __future__ import annotations

import json
import re
import sys
import unittest
from contextlib import nullcontext
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import patch
from time import sleep

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import rag
import main


class TwoStageSemanticFlashcardTests(unittest.TestCase):
    def setUp(self):
        self.provider = patch.object(rag, "_provider_settings",
                                     return_value=("test-key", "https://provider.example/v1", False, "test-model"))
        self.provider.start()
        self.addCleanup(self.provider.stop)

    def test_malformed_model_json_gets_one_syntax_repair_attempt(self):
        with patch.object(rag, "_chat_request", return_value='{"summary":"fixed","items":[]}') as request:
            parsed = rag._study_json('{"summary":"broken" "items":[]}')
        self.assertEqual(parsed, {"summary": "fixed", "items": []})
        self.assertEqual(request.call_count, 1)

    def test_truncated_or_prose_wrapped_json_also_gets_repair_attempt(self):
        for malformed in ('{"cards":[{"front":"Question?"', 'Here is the result: cards are ready'):
            with self.subTest(malformed=malformed), patch.object(
                rag, "_chat_request", return_value='{"cards":[{"front":"Question?","back":"Answer."}]}'
            ) as request:
                parsed = rag._study_json(malformed)
            self.assertEqual(len(parsed["cards"]), 1)
            request.assert_called_once()

    def test_malformed_model_json_fails_with_controlled_error_if_repair_fails(self):
        with patch.object(rag, "_chat_request", return_value='{"still": broken}'):
            with self.assertRaisesRegex(ValueError, "malformed JSON after one repair attempt"):
                rag._study_json('{"broken":}')

    def test_document_analysis_covers_sections_and_keeps_exact_source_refs(self):
        chunks = [
            {"paper_id": "paper", "filename": "paper.pdf", "page_number": 1, "chunk_number": 1,
             "section": "Methods", "content": "The method combines sensors and a filtering algorithm."},
            {"paper_id": "paper", "filename": "paper.pdf", "page_number": 4, "chunk_number": 2,
             "section": "Results", "content": "The filtering algorithm reduced error by 12%."},
        ]
        responses = [
            json.dumps({"summary": "Sensors feed the filtering method.", "concepts": [
                {"name": "Filtering algorithm", "meaning": "It combines sensor inputs.", "importance": "high", "source_ids": ["c1"]}],
                "relationships": [{"from": "sensors", "relation": "feed", "to": "filtering algorithm", "source_ids": ["c1"]}]}),
            json.dumps({"summary": "Filtering reduced error.", "concepts": [
                {"name": "Filtering algorithm", "meaning": "It reduced error by 12%.", "importance": "high", "source_ids": ["c2"]}],
                "relationships": []}),
            json.dumps({"title": "Sensor Study", "subject": "Sensor filtering", "purpose": "Evaluate filtering",
                        "summary": "The paper describes a sensor filtering method and evaluates its error reduction.",
                        "topics": ["sensor filtering"], "relationships": ["Sensors provide inputs to filtering."],
                        "processes": [], "findings": ["Error fell by 12%"], "limitations": []}),
        ]
        with patch.object(rag, "_chat_request", side_effect=responses) as request:
            result = rag.analyze_document_semantics(chunks)
        self.assertEqual(request.call_count, 3)
        self.assertEqual([section["section"] for section in result["sections"]], ["Methods", "Results"])
        concept = result["concepts"][0]
        self.assertEqual({ref["chunk_number"] for ref in concept["source_refs"]}, {1, 2})
        self.assertEqual(concept["source_refs"][1]["page"], 4)
        self.assertTrue(any(relation.get("source_refs") for relation in result["relationships"]))

    def test_planner_uses_exact_requested_counts_of_five_ten_and_fifteen(self):
        representation = {"title": "Paper", "summary": "A study of distinct concepts.", "sections": [],
                          "concepts": [{"name": "Concept", "meaning": "Meaning"}]}

        def planning_response(_base, _model, messages, **_kwargs):
            match = re.search(r"Plan exactly (\d+)", messages[0]["content"])
            count = int(match.group(1))
            return json.dumps({"objectives": [
                {"concept": f"Concept {i}", "objective": f"Explain learning point {i} in detail", "query": f"point {i}"}
                for i in range(count)
            ]})

        for count in (5, 10, 15):
            with self.subTest(count=count), patch.object(rag, "_chat_request", side_effect=planning_response):
                objectives = rag.plan_flashcard_objectives([representation], count)
                self.assertEqual(len(objectives), count)
                self.assertEqual(objectives[-1]["id"], f"obj-{count}")

    def test_generated_cards_are_mapped_by_objective_id_even_if_provider_reorders_them(self):
        objectives = [{"id": f"obj-{i}", "concept": f"c{i}", "objective": f"objective {i}", "query": f"q{i}"}
                      for i in range(1, 4)]
        evidence = {item["id"]: [{"page_number": i, "section": "Results", "chunk_number": i,
                                   "content": f"Evidence for objective {i}."}]
                    for i, item in enumerate(objectives, 1)}
        response = json.dumps({"cards": [
            {"id": "obj-3", "front": "Question 3?", "back": "Answer 3."},
            {"id": "obj-1", "front": "Question 1?", "back": "Answer 1."},
            {"id": "obj-2", "front": "Question 2?", "back": "Answer 2."},
        ]})
        with patch.object(rag, "_chat_request", return_value=response):
            cards = rag.generate_planned_flashcards(objectives, evidence)
        self.assertEqual([card["id"] for card in cards], ["obj-1", "obj-2", "obj-3"])
        self.assertEqual([card["back"] for card in cards], ["Answer 1.", "Answer 2.", "Answer 3."])

    def test_single_card_generation_recovers_missing_id_and_standard_question_answer_keys(self):
        objective = {"id": "obj-1", "concept": "Recovery", "objective": "Recall the recovery outcome", "query": "recovery"}
        response = json.dumps({"question": "What happened to recovery time?", "answer": "It decreased."})
        with patch.object(rag, "_chat_request", return_value=response):
            cards = rag.generate_planned_flashcards([objective], {"obj-1": [{"content": "Recovery time decreased."}]})
        self.assertEqual(cards[0]["id"], "obj-1")
        self.assertEqual(cards[0]["front"], "What happened to recovery time?")
        self.assertEqual(cards[0]["back"], "It decreased.")

    def test_document_analysis_cache_reuses_same_hash_and_rebuilds_for_new_hash(self):
        cache = {}
        chunks = [{"paper_id": "paper-1", "page_number": 1, "chunk_number": 1,
                   "section": "Introduction", "content": "Source text."}]
        analyzed = {"title": "Cached representation", "sections": [], "concepts": []}

        def read_cache(paper_id, content_hash):
            return cache.get((paper_id, content_hash))

        def write_cache(paper_id, content_hash, representation):
            cache[(paper_id, content_hash)] = representation

        with patch.object(main, "list_paper_chunks", return_value=chunks), \
             patch.object(main, "get_paper_semantic_analysis", side_effect=read_cache), \
             patch.object(main, "save_paper_semantic_analysis", side_effect=write_cache), \
             patch.object(main, "paper_semantic_analysis_lock", side_effect=lambda *_args: nullcontext()), \
             patch.object(main, "analyze_document_semantics", return_value=analyzed) as analyze:
            paper_v1 = {"id": "paper-1", "content_sha256": "version-1"}
            self.assertEqual(main._semantic_representation_for_paper(paper_v1, {"id": "user-1"})[0], analyzed)
            self.assertEqual(main._semantic_representation_for_paper(paper_v1, {"id": "user-1"})[0], analyzed)
            paper_v2 = {"id": "paper-1", "content_sha256": "version-2"}
            self.assertEqual(main._semantic_representation_for_paper(paper_v2, {"id": "user-1"})[0], analyzed)
        self.assertEqual(analyze.call_count, 2)

    def test_concurrent_requests_share_one_document_analysis(self):
        cache = {}
        chunks = [{"paper_id": "paper-2", "page_number": 1, "chunk_number": 1,
                   "section": "Overview", "content": "Shared source text."}]
        representation = {"title": "Shared", "sections": [], "concepts": []}

        def read_cache(paper_id, content_hash):
            return cache.get((paper_id, content_hash))

        def write_cache(paper_id, content_hash, value):
            cache[(paper_id, content_hash)] = value

        def analyze(_chunks):
            sleep(0.05)
            return representation

        with patch.object(main, "list_paper_chunks", return_value=chunks), \
             patch.object(main, "get_paper_semantic_analysis", side_effect=read_cache), \
             patch.object(main, "save_paper_semantic_analysis", side_effect=write_cache), \
             patch.object(main, "paper_semantic_analysis_lock", side_effect=lambda *_args: nullcontext()), \
             patch.object(main, "analyze_document_semantics", side_effect=analyze) as analysis:
            paper = {"id": "paper-2", "content_sha256": "same-version"}
            with ThreadPoolExecutor(max_workers=2) as pool:
                outputs = list(pool.map(lambda _: main._semantic_representation_for_paper(paper, {"id": "user-1"}), range(2)))
        self.assertEqual(analysis.call_count, 1)
        self.assertEqual([output[0] for output in outputs], [representation, representation])

    def test_verification_keeps_objective_evidence_when_question_search_misses_it(self):
        card = {"id": "obj-1", "front": "What did the intervention change?", "back": "It reduced recovery time."}
        objective_evidence = {"obj-1": [{"paper_id": "paper-3", "filename": "paper.pdf", "page_number": 3,
                                          "chunk_number": 5, "section": "Results",
                                          "content": "The intervention reduced recovery time."}]}
        with patch.object(main, "embed_query", return_value=[0.0]), \
             patch.object(main, "hybrid_search", return_value=[]), \
             patch.object(main, "neighboring_chunks", return_value=[]), \
             patch.object(main, "verify_flashcards", side_effect=lambda cards, evidence: cards) as verify:
            verified, evidence = main._verify_flashcard_candidates(
                [card], ["paper-3"], {"id": "user-1"}, seed_evidence_by_id=objective_evidence
            )
        self.assertEqual(verified[0]["id"], "obj-1")
        self.assertEqual(evidence[0]["content"], objective_evidence["obj-1"][0]["content"])
        self.assertIn("paper-3", verify.call_args.args[1]["obj-1"][0]["paper_id"])


if __name__ == "__main__":
    unittest.main()
