import { useEffect, useRef, useState } from "react";
import QuizPanel from "../components/learning/QuizPanel";
import FlashcardsPanel from "../components/learning/FlashcardsPanel";
import MindMapPanel from "../components/learning/MindMapPanel";
import { apiFetch, getSessionUser } from "../api";
import ArtifactGenerator from "../components/research/ArtifactGenerator";
import { cleanFlashcardText, normalizeFlashcards, requestFlashcards, saveFlashcardReview } from "../components/learning/flashcards";
import { requestFreshQuiz, requestQuizAttempt } from "../components/learning/quiz";
import { requestMindMap, requestMindMapExpansion } from "../components/learning/mindmaps";

function learningSessionKey() {
  const userId = getSessionUser()?.id;
  return userId ? `scholarmind_learning_session_${userId}` : null;
}

function readLearningSession() {
  const key = learningSessionKey();
  if (!key) return null;
  try { return JSON.parse(sessionStorage.getItem(key) || "null"); } catch { return null; }
}

function writeLearningSession(snapshot) {
  const key = learningSessionKey();
  if (!key) return;
  try { sessionStorage.setItem(key, JSON.stringify(snapshot)); } catch { /* Keep the live in-memory view if storage is unavailable. */ }
}

function formatStudyTime(seconds = 0) {
  const totalMinutes = Math.floor(Math.max(0, Number(seconds) || 0) / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

const flashcards = [];

export default function Learning() {
  const [availablePapers, setAvailablePapers] = useState([]);
  const [selectedPaperId, setSelectedPaperId] = useState("");
  const [mindmapPrompt, setMindmapPrompt] = useState("");
  const [flashcardCount, setFlashcardCount] = useState("6");
  const [generatedCards, setGeneratedCards] = useState(null);
  const [generatedCardsArtifactId, setGeneratedCardsArtifactId] = useState(null);
  const [generatedMindmap, setGeneratedMindmap] = useState(null);
  const [generatedMindmapArtifactId, setGeneratedMindmapArtifactId] = useState(null);
  const generatedMindmapRef = useRef(null);
  const mindmapSaveQueueRef = useRef(Promise.resolve());
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [quizQuestionCount, setQuizQuestionCount] = useState("8");
  const [quizRequestedCount, setQuizRequestedCount] = useState(null);
  const [quizDifficulty, setQuizDifficulty] = useState("medium");
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizAttempt, setQuizAttempt] = useState(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizSubmitError, setQuizSubmitError] = useState("");
  const quizSubmitInFlightRef = useRef(false);
  const [quizRegenerating, setQuizRegenerating] = useState(false);
  const [quizGenerationError, setQuizGenerationError] = useState("");
  const quizRegenerationInFlightRef = useRef(false);
  const [cardOrder, setCardOrder] = useState(() => flashcards.map((_, index) => index));
  const [cardRatings, setCardRatings] = useState({});
  const [retriedCards, setRetriedCards] = useState(() => new Set());
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [generationMode, setGenerationMode] = useState("");
  const [flashcardNotice, setFlashcardNotice] = useState("");
  const [selectedMindmapNodeId, setSelectedMindmapNodeId] = useState("root");
  const [collapsedMindmapNodes, setCollapsedMindmapNodes] = useState(() => new Set());
  const [expandingMindmapNodes, setExpandingMindmapNodes] = useState(() => new Set());
  const [mindmapError, setMindmapError] = useState("");
  const [mindmapNotice, setMindmapNotice] = useState("");
  const [exhaustedMindmapNodes, setExhaustedMindmapNodes] = useState(() => new Set());
  const [pendingMindmapFocusId, setPendingMindmapFocusId] = useState("");
  const [mindmapSearch, setMindmapSearch] = useState("");
  const [mindmapZoom, setMindmapZoom] = useState(1);
  const [mindmapPan, setMindmapPan] = useState({ x: 0, y: 0 });
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const studySessionIdRef = useRef(null);
  const [tab, setTab] = useState("cards");
  const studyActivityRef = useRef(tab);
  const mapViewportRef = useRef(null);
  const mapStageRef = useRef(null);
  const panDragRef = useRef(null);
  useEffect(() => { studyActivityRef.current = tab; }, [tab]);
  useEffect(() => {
    const cached = readLearningSession();
    if (cached) {
      if (cached.generatedMindmap?.nodes?.length) {
        generatedMindmapRef.current = cached.generatedMindmap;
        setGeneratedMindmap(cached.generatedMindmap);
        setGeneratedMindmapArtifactId(cached.generatedMindmapArtifactId || null);
      }
      if (cached.generatedQuiz) setGeneratedQuiz({
        ...cached.generatedQuiz,
        payload: { ...cached.generatedQuiz.payload, questions: (cached.generatedQuiz.payload?.questions || []).map(({ answer, ...question }) => question) },
      });
      if (cached.quizAttempt) setQuizAttempt(cached.quizAttempt);
      if (typeof cached.quizSubmitted === "boolean") setQuizSubmitted(cached.quizSubmitted);
      if (cached.quizRequestedCount != null) setQuizRequestedCount(String(cached.quizRequestedCount));
      else if (cached.generatedQuiz) setQuizRequestedCount(String(cached.quizQuestionCount ?? cached.generatedQuiz.payload?.questions?.length ?? "8"));
      if (cached.generatedCards) setGeneratedCards(cached.generatedCards.map((card) => ({
        ...card,
        front: cleanFlashcardText(card.front || card.question || card.title, true),
        back: cleanFlashcardText(card.back || card.answer || card.content),
      })));
      if (typeof cached.flashcardNotice === "string") setFlashcardNotice(cached.flashcardNotice);
      if (cached.generatedCardsArtifactId) setGeneratedCardsArtifactId(cached.generatedCardsArtifactId);
      if (Array.isArray(cached.cardOrder)) setCardOrder(cached.cardOrder);
      if (cached.cardRatings && typeof cached.cardRatings === "object") setCardRatings(cached.cardRatings);
      if (Array.isArray(cached.retriedCards)) setRetriedCards(new Set(cached.retriedCards));
      if (Number.isInteger(cached.cardIdx)) setCardIdx(cached.cardIdx);
      if (typeof cached.flipped === "boolean") setFlipped(cached.flipped);
      if (cached.quizAnswers && typeof cached.quizAnswers === "object") setQuizAnswers(cached.quizAnswers);
      if (cached.selectedPaperId) setSelectedPaperId(cached.selectedPaperId);
      if (cached.flashcardCount != null) setFlashcardCount(String(cached.flashcardCount));
      if (cached.quizQuestionCount != null) setQuizQuestionCount(String(cached.quizQuestionCount));
      if (["simple", "medium", "hard"].includes(cached.quizDifficulty)) setQuizDifficulty(cached.quizDifficulty);
      if (typeof cached.mindmapPrompt === "string") setMindmapPrompt(cached.mindmapPrompt);
      if (cached.selectedMindmapNodeId) setSelectedMindmapNodeId(cached.selectedMindmapNodeId);
      if (Array.isArray(cached.collapsedMindmapNodes)) setCollapsedMindmapNodes(new Set(cached.collapsedMindmapNodes));
      if (Array.isArray(cached.exhaustedMindmapNodes)) setExhaustedMindmapNodes(new Set(cached.exhaustedMindmapNodes));
      if (Number.isFinite(cached.mindmapZoom)) setMindmapZoom(cached.mindmapZoom);
      if (cached.mindmapPan && Number.isFinite(cached.mindmapPan.x) && Number.isFinite(cached.mindmapPan.y)) setMindmapPan(cached.mindmapPan);
      if (["cards", "quiz", "map"].includes(cached.tab)) setTab(cached.tab);
    }
    apiFetch("/papers").then(({ papers }) => {
      setAvailablePapers(papers);
      if (papers.length) setSelectedPaperId((current) => current || papers[0].id);
    }).catch((err) => setGenerationError(err.message));
  }, []);
  useEffect(() => {
    let alive = true;
    const refreshMetrics = () => apiFetch("/dashboard/metrics").then((metrics) => {
      if (alive) setDashboardMetrics(metrics);
    }).catch(() => {});
    refreshMetrics();
    window.addEventListener("scholarmind-data-updated", refreshMetrics);
    return () => { alive = false; window.removeEventListener("scholarmind-data-updated", refreshMetrics); };
  }, []);
  useEffect(() => {
    let alive = true;
    let timer;
    let lastCheckpoint = Date.now();
    const heartbeat = async (endSession = false) => {
      const sessionId = studySessionIdRef.current;
      if (!sessionId) return;
      const now = Date.now();
      const elapsedSeconds = Math.min(60, Math.max(0, Math.floor((now - lastCheckpoint) / 1000)));
      lastCheckpoint = now;
      if (!elapsedSeconds && !endSession) return;
      try {
        await apiFetch(`/study-sessions/${sessionId}/heartbeat`, {
          method: "POST", keepalive: endSession, skipDashboardRefresh: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ elapsed_seconds: elapsedSeconds, end_session: endSession,
            activity_type: studyActivityRef.current === "map" ? "mindmap" : studyActivityRef.current === "quiz" ? "quiz" : "flashcards" }),
        });
      } catch { /* Session tracking must not interrupt study tools. */ }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") heartbeat();
      else lastCheckpoint = Date.now();
    };
    apiFetch("/study-sessions", { method: "POST", skipDashboardRefresh: true })
      .then(({ session_id: sessionId }) => {
        if (!alive) {
          apiFetch(`/study-sessions/${sessionId}/heartbeat`, {
            method: "POST", skipDashboardRefresh: true,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ elapsed_seconds: 0, end_session: true, activity_type: studyActivityRef.current === "map" ? "mindmap" : studyActivityRef.current === "quiz" ? "quiz" : "flashcards" }),
          }).catch(() => {});
          return;
        }
        studySessionIdRef.current = sessionId;
        lastCheckpoint = Date.now();
        timer = window.setInterval(() => {
          if (document.visibilityState === "visible") heartbeat();
        }, 30000);
        document.addEventListener("visibilitychange", onVisibilityChange);
      }).catch(() => {});
    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      heartbeat(true);
    };
  }, []);
  async function submitQuiz() {
    if (!generatedQuiz?.id || quizSubmitInFlightRef.current || quizSubmitted) return;
    quizSubmitInFlightRef.current = true;
    setQuizSubmitting(true);
    setQuizSubmitError("");
    const questions = generatedQuiz.payload?.questions || [];
    const selectedOptions = Object.fromEntries(Object.entries(quizAnswers)
      .filter(([index, optionIndex]) => questions[Number(index)]?.options?.[optionIndex] !== undefined)
      .map(([index, optionIndex]) => [index, questions[Number(index)].options[optionIndex]]));
    try {
      const attempt = await requestQuizAttempt(apiFetch, generatedQuiz.id, selectedOptions);
      setQuizAttempt(attempt);
      setQuizSubmitted(true);
    } catch (error) {
      setQuizSubmitError(error.message || "Could not save your quiz result. Try submitting again.");
    } finally {
      quizSubmitInFlightRef.current = false;
      setQuizSubmitting(false);
    }
  }
  async function regenerateQuiz(previousArtifact = generatedQuiz) {
    if (quizRegenerationInFlightRef.current) return;
    const previousQuestions = previousArtifact?.payload?.questions || [];
    const paperId = previousArtifact?.paper_id || previousArtifact?.payload?.source_paper_ids?.[0] || selectedPaperId;
    if (!paperId) {
      setQuizGenerationError("Could not find the source paper for this quiz. Choose a paper and generate a quiz first.");
      return;
    }
    quizRegenerationInFlightRef.current = true;
    setQuizRegenerating(true);
    setQuizGenerationError("");
    try {
      const nextQuiz = await requestFreshQuiz(apiFetch, {
        paperId,
        count: Math.max(1, Math.min(20, Number(quizRequestedCount ?? quizQuestionCount) || previousQuestions.length || 8)),
        difficulty: quizDifficulty,
        previousQuestions,
      });
      setGeneratedQuiz(nextQuiz);
      setQuizDifficulty(nextQuiz.payload?.difficulty || quizDifficulty);
      setQuizAnswers({});
      setQuizAttempt(null);
      setQuizSubmitted(false);
      setQuizSubmitError("");
    } catch (error) {
      setQuizGenerationError(error.message || "Could not generate new questions. Your previous quiz is still available; try again.");
    } finally {
      quizRegenerationInFlightRef.current = false;
      setQuizRegenerating(false);
    }
  }
  const generateFromPaper = async (kind, requestedCount = 8) => {
    if (!selectedPaperId) { setGenerationError("Upload a paper first, then choose it here."); return; }
    const count = Number(requestedCount);
    if (kind === "flashcards" && (!Number.isInteger(count) || count < 1 || count > 20)) {
      setGenerationError("Choose a whole number from 1 to 20 flashcards.");
      return;
    }
    setGenerating(true); setGenerationError(""); setGenerationMode("");
    try {
      const result = kind === "flashcards"
        ? await requestFlashcards(apiFetch, selectedPaperId, count)
        : await requestMindMap(apiFetch, selectedPaperId, mindmapPrompt);
      const payload = result.artifact.payload || {};
      setGenerationMode(payload._generation_mode || "");
      if (kind === "flashcards") {
        const cards = normalizeFlashcards(payload.cards || []);
        setFlashcardNotice(payload._generation_notice || "");
        setGeneratedCards(cards);
        setGeneratedCardsArtifactId(result.artifact.id);
        setCardOrder(cards.map((_, index) => index));
        setCardRatings(payload.progress?.card_reviews || {});
        setRetriedCards(new Set());
        setTab("cards"); setCardIdx(0); setFlipped(false);
      }
      if (kind === "mindmap") {
        generatedMindmapRef.current = payload;
        setGeneratedMindmap(payload);
        setMindmapNotice(payload._generation_notice || "");
        setGeneratedMindmapArtifactId(result.artifact.id);
        setSelectedMindmapNodeId("root");
        setCollapsedMindmapNodes(new Set());
        setExhaustedMindmapNodes(new Set());
        setMindmapZoom(1);
        setMindmapPan({ x: 0, y: 0 });
        setMindmapError("");
        setTab("map");
      }
    } catch (err) { setGenerationError(err.message); }
    finally { setGenerating(false); }
  };
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    writeLearningSession({
      tab, selectedPaperId, mindmapPrompt, generatedMindmap, generatedMindmapArtifactId,
      flashcardCount, generatedCardsArtifactId, flashcardNotice, quizQuestionCount, quizRequestedCount, quizDifficulty,
      selectedMindmapNodeId, collapsedMindmapNodes: [...collapsedMindmapNodes], exhaustedMindmapNodes: [...exhaustedMindmapNodes], mindmapZoom, mindmapPan,
      generatedQuiz, quizAnswers, quizSubmitted, quizAttempt, generatedCards, cardOrder, cardRatings,
      retriedCards: [...retriedCards], cardIdx, flipped,
    });
  }, [tab, selectedPaperId, generatedMindmap, generatedMindmapArtifactId, selectedMindmapNodeId,
    collapsedMindmapNodes, mindmapZoom, mindmapPan, mindmapPrompt, exhaustedMindmapNodes, generatedQuiz, quizAnswers, quizSubmitted, quizAttempt,
    generatedCards, generatedCardsArtifactId, cardOrder, cardRatings, retriedCards, cardIdx, flipped,
    flashcardCount, flashcardNotice, quizQuestionCount, quizRequestedCount, quizDifficulty]);

  const demoMindmapNodes = [];
  const demoMindmapEdges = [];
  const visibleCards = generatedCards === null ? flashcards : generatedCards.map((card, i) => ({ ...card, id: card.id || `flashcard-${i + 1}`, front: cleanFlashcardText(card.front || card.question || card.title || "Study prompt", true), back: cleanFlashcardText(card.back || card.answer || card.content || "No answer supplied") }));
  const masteredCards = Number(dashboardMetrics?.flashcards_mastered) || 0;
  const reviewedCards = Number(dashboardMetrics?.flashcards_reviewed) || 0;
  const totalFlashcards = Number(dashboardMetrics?.flashcards_total) || 0;
  const activeCardIdx = cardOrder[cardIdx] ?? 0;
  const activeCard = visibleCards[activeCardIdx];
  const advanceCard = () => { setFlipped(false); setCardIdx((index) => Math.min(cardOrder.length, index + 1)); };
  const rateCard = (rating) => {
    if (!activeCard) return;
    setCardRatings((ratings) => ({ ...ratings, [activeCardIdx]: rating }));
    if (generatedCardsArtifactId) {
      saveFlashcardReview(apiFetch, generatedCardsArtifactId, activeCardIdx, rating)
        .catch((error) => setGenerationError(`Your rating could not be saved: ${error.message}`));
    }
    if (rating === "again" && !retriedCards.has(activeCardIdx)) {
      setRetriedCards((retried) => new Set(retried).add(activeCardIdx));
      setCardOrder((order) => [...order, activeCardIdx]);
    }
    advanceCard();
  };
  const rawMindmapNodes = generatedMindmap?.nodes || demoMindmapNodes;
  const mindmapEdges = generatedMindmap ? (generatedMindmap.edges || []) : demoMindmapEdges.map(([source, target]) => ({ source, target, label: "" }));
  const mindmapChildren = mindmapEdges.reduce((children, edge) => {
    (children[edge.source] ||= []).push(edge.target);
    return children;
  }, {});
  const mindmapRoot = rawMindmapNodes.find((node) => node.id === "root" || node.id === "center") || rawMindmapNodes[0];
  const mindmapPositions = new Map();
  const mindmapDepths = new Map();
  const mindmapParents = new Map();
  let mindmapLayoutWidth = 1200;
  let mindmapLayoutHeight = 600;
  if (mindmapRoot) {
    // Lay the map out as a tidy tree. Each leaf gets its own horizontal slot;
    // parents are centered over their descendants, so newly generated sibling
    // branches never reuse the same fixed radial coordinates.
    let leafCount = 0;
    let maxDepth = 0;
    const laidOut = new Set();
    const layoutSubtree = (nodeId, depth, branchId = nodeId) => {
      if (laidOut.has(nodeId)) return null;
      laidOut.add(nodeId);
      maxDepth = Math.max(maxDepth, depth);
      mindmapDepths.set(nodeId, depth);
      const children = mindmapChildren[nodeId] || [];
      const childCenters = [];
      for (const childId of children) {
        if (laidOut.has(childId)) continue;
        mindmapParents.set(childId, { parentId: nodeId, branchId: depth === 0 ? childId : branchId });
        const center = layoutSubtree(childId, depth + 1, depth === 0 ? childId : branchId);
        if (center !== null) childCenters.push(center);
      }
      if (!childCenters.length) {
        const center = leafCount * 420 + 210;
        leafCount += 1;
        mindmapPositions.set(nodeId, { x: center, y: 100 + depth * 260 });
        return center;
      }
      const center = (childCenters[0] + childCenters[childCenters.length - 1]) / 2;
      mindmapPositions.set(nodeId, { x: center, y: 100 + depth * 260 });
      return center;
    };
    layoutSubtree(mindmapRoot.id, 0);
    mindmapLayoutWidth = Math.max(1260, leafCount * 420);
    mindmapLayoutHeight = Math.max(600, (maxDepth + 1) * 260 + 120);
    const horizontalOffset = (mindmapLayoutWidth - leafCount * 420) / 2;
    for (const [nodeId, position] of mindmapPositions) {
      mindmapPositions.set(nodeId, { x: ((position.x + horizontalOffset) / mindmapLayoutWidth) * 100, y: (position.y / mindmapLayoutHeight) * 100 });
    }
  }
  const mindmapNodes = rawMindmapNodes.map((node, index) => {
    const id = node.id || `node-${index}`;
    const isRoot = id === mindmapRoot?.id;
    const position = mindmapPositions.get(id) || { x: 50, y: 50 };
    const depth = mindmapDepths.get(id) || 0;
    return { ...node, id, label: node.label || node.title || "Topic", x: position.x, y: position.y,
      color: isRoot ? "from-primary-500 to-accent-500" : "from-primary-300 to-primary-600", size: isRoot ? "lg" : depth === 1 ? "md" : "sm", depth };
  });
  const visibleMindmapIds = new Set();
  const visitMindmapNode = (id) => {
    if (visibleMindmapIds.has(id)) return;
    visibleMindmapIds.add(id);
    if (!collapsedMindmapNodes.has(id)) (mindmapChildren[id] || []).forEach(visitMindmapNode);
  };
  const positionedMindmapRoot = mindmapNodes.find((node) => node.id === mindmapRoot?.id) || mindmapNodes[0];
  if (positionedMindmapRoot) visitMindmapNode(positionedMindmapRoot.id);
  const visibleMindmapNodes = mindmapNodes.filter((node) => visibleMindmapIds.has(node.id));
  const selectedMindmapNode = mindmapNodes.find((node) => node.id === selectedMindmapNodeId) || positionedMindmapRoot;
  const selectedMindmapPath = [];
  if (selectedMindmapNode) {
    let pathNode = selectedMindmapNode;
    const seenPathIds = new Set();
    while (pathNode && !seenPathIds.has(pathNode.id)) {
      seenPathIds.add(pathNode.id);
      selectedMindmapPath.unshift(pathNode);
      const parentId = mindmapParents.get(pathNode.id)?.parentId;
      pathNode = mindmapNodes.find((node) => node.id === parentId);
    }
  }
  const selectedMindmapPathIds = new Set(selectedMindmapPath.map((node) => node.id));
  const isDescendantOfSelectedMindmapNode = (nodeId) => {
    let parentId = mindmapParents.get(nodeId)?.parentId;
    const visited = new Set();
    while (parentId && !visited.has(parentId)) {
      if (parentId === selectedMindmapNode?.id) return true;
      visited.add(parentId);
      parentId = mindmapParents.get(parentId)?.parentId;
    }
    return false;
  };
  const focusMindmapNode = (node) => {
    if (!node) return;
    setSelectedMindmapNodeId(node.id);
    const ancestorIds = new Set();
    let ancestorId = node.id;
    while (ancestorId && !ancestorIds.has(ancestorId)) {
      ancestorIds.add(ancestorId);
      ancestorId = mindmapParents.get(ancestorId)?.parentId;
    }
    setCollapsedMindmapNodes((current) => new Set([...current].filter((id) => !ancestorIds.has(id))));
    const viewport = mapViewportRef.current;
    const stage = mapStageRef.current;
    const targetZoom = node.size === "lg" ? 1 : 1.05;
    setMindmapZoom(targetZoom);
    if (viewport && stage) {
      setMindmapPan({
        x: viewport.clientWidth / 2 - (node.x / 100) * stage.clientWidth * targetZoom,
        y: viewport.clientHeight * 0.32 - (node.y / 100) * stage.clientHeight * targetZoom,
      });
    }
  };
  useEffect(() => {
    if (!pendingMindmapFocusId) return undefined;
    const frame = requestAnimationFrame(() => {
      const node = mindmapNodes.find((item) => item.id === pendingMindmapFocusId);
      const viewport = mapViewportRef.current;
      const stage = mapStageRef.current;
      if (node && viewport && stage) {
        setMindmapZoom(1);
        setMindmapPan({
          x: viewport.clientWidth / 2 - (node.x / 100) * stage.clientWidth,
          y: viewport.clientHeight * 0.32 - (node.y / 100) * stage.clientHeight,
        });
      }
      setPendingMindmapFocusId("");
    });
    return () => cancelAnimationFrame(frame);
  }, [pendingMindmapFocusId, mindmapNodes]);
  const expandMindmapNode = async (nodeId) => {
    if (!generatedMindmap || expandingMindmapNodes.has(nodeId)) return;
    if (exhaustedMindmapNodes.has(nodeId)) return;
    if (mindmapNodes.length >= 250) {
      setMindmapError("This map has reached its 250-concept safety limit. No more branches can be added.");
      return;
    }
    const sourcePaperId = generatedMindmap.source_paper_ids?.[0] || selectedPaperId;
    const parent = generatedMindmap.nodes?.find((node) => node.id === nodeId);
    if (!sourcePaperId || !parent) return;
    const ancestors = [];
    let ancestorId = nodeId;
    const ancestrySeen = new Set();
    while (ancestorId && !ancestrySeen.has(ancestorId)) {
      ancestrySeen.add(ancestorId);
      const ancestor = mindmapNodes.find((node) => node.id === ancestorId);
      if (ancestor) ancestors.unshift(ancestor.label);
      ancestorId = mindmapParents.get(ancestorId)?.parentId;
    }
    setMindmapError("");
    setMindmapNotice("");
    setExpandingMindmapNodes((current) => new Set(current).add(nodeId));
    try {
      const result = await requestMindMapExpansion(apiFetch, {
            paper_id: sourcePaperId,
            node_id: nodeId,
            node_label: parent.label,
            breadcrumb: ancestors.slice(-12),
            context: [mindmapPrompt.trim() ? `Map direction: ${mindmapPrompt.trim()}` : "", parent.summary, parent.details, parent.evidence].filter(Boolean).join("\n").slice(0, 1600),
            existing_nodes: mindmapNodes.map(({ id, label }) => ({ id, label })),
          });
      if (result.exhausted || !(result.children || []).length) {
        setExhaustedMindmapNodes((current) => new Set(current).add(nodeId));
        setMindmapNotice(result.message || "No more source-supported subtopics remain under this branch.");
        return;
      }
      const currentMap = generatedMindmapRef.current || generatedMindmap;
      const existingIds = new Set((currentMap.nodes || []).map((node) => node.id));
      const seenLabels = new Set((currentMap.nodes || []).map((node) => node.label?.trim().toLocaleLowerCase()));
      const availableSlots = Math.max(0, 250 - existingIds.size);
      const newChildren = (result.children || []).filter((node) => {
        const label = node.label?.trim().toLocaleLowerCase();
        if (!node.id || !label || existingIds.has(node.id) || seenLabels.has(label)) return false;
        seenLabels.add(label);
        return true;
      }).slice(0, availableSlots);
      if (!newChildren.length) {
        setExhaustedMindmapNodes((current) => new Set(current).add(nodeId));
        setMindmapNotice("No more distinct, source-supported subtopics remain under this branch.");
        return;
      }
      const acceptedIds = new Set([...existingIds, ...newChildren.map((node) => node.id)]);
      const newEdges = (result.edges || []).filter((edge) => acceptedIds.has(edge.source) && acceptedIds.has(edge.target)
        && !(currentMap.edges || []).some((existing) => existing.source === edge.source && existing.target === edge.target));
      const updatedMap = {
        ...currentMap,
        nodes: [...(currentMap.nodes || []), ...newChildren],
        edges: [...(currentMap.edges || []), ...newEdges],
      };
      generatedMindmapRef.current = updatedMap;
      setGeneratedMindmap(updatedMap);
      setPendingMindmapFocusId(nodeId);
      setCollapsedMindmapNodes((current) => { const next = new Set(current); next.delete(nodeId); return next; });
      setExhaustedMindmapNodes((current) => { const next = new Set(current); next.delete(nodeId); return next; });
      setMindmapNotice(`Added ${newChildren.length} source-supported concepts under ${parent.label}.`);
      if (generatedMindmapArtifactId) {
        try {
          mindmapSaveQueueRef.current = mindmapSaveQueueRef.current.catch(() => {}).then(() => apiFetch(`/artifacts/${generatedMindmapArtifactId}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payload: generatedMindmapRef.current }),
          }));
          await mindmapSaveQueueRef.current;
        } catch {
          setMindmapNotice("New concepts are available in this view, but could not be saved to your history.");
        }
      }
    } catch (error) {
      setMindmapError(error.message || "Could not expand this branch. Try again.");
    } finally {
      setExpandingMindmapNodes((current) => { const next = new Set(current); next.delete(nodeId); return next; });
    }
  };
  const chooseMindmapNode = (node) => {
    focusMindmapNode(node);
    if (collapsedMindmapNodes.has(node.id)) {
      setCollapsedMindmapNodes((current) => { const next = new Set(current); next.delete(node.id); return next; });
    } else if (!(mindmapChildren[node.id] || []).length && generatedMindmap) {
      expandMindmapNode(node.id);
    }
  };
  const searchMindmap = (event) => {
    event.preventDefault();
    const query = mindmapSearch.trim().toLocaleLowerCase();
    if (!query) return;
    const match = mindmapNodes.find((node) => node.label.toLocaleLowerCase().includes(query));
    if (match) focusMindmapNode(match);
    else if (mindmapSearch.trim()) setMindmapError(`No concept matched “${mindmapSearch.trim()}”.`);
  };
  const startMindmapPan = (event) => {
    if (event.target.closest("button, a, input")) return;
    panDragRef.current = { x: event.clientX, y: event.clientY, panX: mindmapPan.x, panY: mindmapPan.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveMindmapPan = (event) => {
    if (!panDragRef.current) return;
    setMindmapPan({
      x: panDragRef.current.panX + event.clientX - panDragRef.current.x,
      y: panDragRef.current.panY + event.clientY - panDragRef.current.y,
    });
  };
  const stopMindmapPan = () => { panDragRef.current = null; };
  const downloadMindmap = () => {
    const rootLabel = mindmapRoot?.label || "Mind map";
    const lines = [`# ${rootLabel}`, ""];
    const appendChildren = (parentId, depth, path = new Set()) => {
      if (path.has(parentId)) return;
      const nextPath = new Set(path).add(parentId);
      (mindmapChildren[parentId] || []).forEach((childId) => {
        const child = mindmapNodes.find((node) => node.id === childId);
        if (!child) return;
        const edge = mindmapEdges.find((item) => item.source === parentId && item.target === childId);
        lines.push(`${"  ".repeat(depth)}- **${child.label}**${edge?.label ? ` — ${edge.label}` : ""}${child.page ? ` (p. ${child.page})` : ""}`);
        appendChildren(childId, depth + 1, nextPath);
      });
    };
    if (mindmapRoot) appendChildren(mindmapRoot.id, 1);
    const blobUrl = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = `${rootLabel.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "mind-map"}.md`;
    anchor.click();
    URL.revokeObjectURL(blobUrl);
  };

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
        <div className="w-full space-y-1.5">
          <label htmlFor="mindmap-prompt" className="block text-sm font-semibold text-slate-700">Topic or focus <span className="font-normal text-slate-400">(optional)</span></label>
          <textarea id="mindmap-prompt" value={mindmapPrompt} onChange={(event) => setMindmapPrompt(event.target.value)} maxLength={1000} rows={3} placeholder="Enter a topic or question—for example, ‘How does the proposed model reduce energy use?’ The map will center on this focus." className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
          <p className="text-xs text-slate-500">ScholarMind will prioritize your topic and use evidence from the selected paper. If the paper doesn’t cover it, it will tell you. {mindmapPrompt.length}/1000</p>
        </div>
        <label htmlFor="flashcard-count" className="flex items-center gap-2 text-sm font-semibold text-slate-700">Cards
          <input id="flashcard-count" aria-label="Number of flashcards" type="number" min="1" max="20" step="1" required value={flashcardCount} onChange={(event) => setFlashcardCount(event.target.value)} disabled={generating} className="w-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal" />
        </label>
        <button onClick={() => generateFromPaper("flashcards", flashcardCount)} disabled={generating || !selectedPaperId} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{generating ? "Generating…" : `Generate ${flashcardCount || ""} flashcards`}</button>
        <button onClick={() => generateFromPaper("mindmap")} disabled={generating || !selectedPaperId} className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-semibold text-primary-700 disabled:opacity-50">Generate mind map</button>
        {generationError && <p className="w-full text-sm text-red-600">{generationError}</p>}
        {generationMode === "ai" && <p className="w-full text-sm font-medium text-emerald-700">AI-generated from the selected PDF.</p>}
      </div>

      <ArtifactGenerator kinds={["quiz", "visualization"]} heading="Generate a source-based quiz or visualization outline"
        quizCount={quizQuestionCount} onQuizCountChange={setQuizQuestionCount}
        quizDifficulty={quizDifficulty} onQuizDifficultyChange={setQuizDifficulty}
        onQuizGenerated={(artifact) => {
          const questions = artifact.payload?.questions || [];
          const requestedCount = Number(quizQuestionCount);
          setQuizRequestedCount(String(Number.isInteger(requestedCount) && requestedCount >= 1 && requestedCount <= 20 ? requestedCount : questions.length || 8));
          setGeneratedQuiz(artifact);
          setQuizDifficulty(artifact.payload?.difficulty || quizDifficulty);
          setQuizAnswers({}); setQuizAttempt(null); setQuizSubmitted(false); setQuizSubmitError("");
          setTab("quiz");
        }} />
      {quizGenerationError && <p role="alert" className="-mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-800">{quizGenerationError} {generatedQuiz && <button onClick={() => regenerateQuiz()} className="ml-1 font-bold underline">Try again</button>}</p>}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { l: "Flashcards Mastered", v: `${totalFlashcards ? Math.round(masteredCards / totalFlashcards * 100) : 0}%`, sub: `${masteredCards} mastered · ${reviewedCards} reviewed of ${totalFlashcards}`, i: "🃏" },
          { l: "Papers Available", v: dashboardMetrics?.papers_available ?? "—", sub: "Processed in your library", i: "📄" },
          { l: "Mind Map Topics", v: dashboardMetrics?.mindmap_topics ?? "—", sub: "Unique saved paper topics", i: "🗺" },
          { l: "Study Time", v: formatStudyTime(dashboardMetrics?.study_seconds_week), sub: "This week · UTC", i: "⏱" },
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

      {tab === "cards" && <FlashcardsPanel {...{ visibleCards, cardIdx, cardOrder, cardRatings, setCardIdx, setFlipped, flipped, activeCard, activeCardIdx, rateCard, advanceCard, notice: flashcardNotice }} />}

      {tab === "quiz" && <div><QuizPanel key={generatedQuiz?.id || "quiz"} artifact={generatedQuiz} answers={quizAnswers} setAnswers={setQuizAnswers} onRetake={() => regenerateQuiz()} regenerating={quizRegenerating} submitted={quizSubmitted} onSubmit={submitQuiz} submitting={quizSubmitting} submitError={quizSubmitError} result={quizAttempt} /></div>}

      {tab === "map" && <MindMapPanel {...{mindmapEdges, mindmapRoot, mindmapChildren, mindmapNodes, visibleMindmapNodes, selectedMindmapNode, selectedMindmapPath, selectedMindmapPathIds, isDescendantOfSelectedMindmapNode, mindmapPositions, mindmapLayoutWidth, mindmapLayoutHeight, mindmapPan, mindmapZoom, collapsedMindmapNodes, exhaustedMindmapNodes, expandingMindmapNodes, mindmapError, mindmapNotice, mindmapSearch, generatedMindmap, generatedMindmapArtifactId, mindmapPrompt, mapViewportRef, mapStageRef, searchMindmap, downloadMindmap, focusMindmapNode, chooseMindmapNode, expandMindmapNode, startMindmapPan, moveMindmapPan, stopMindmapPan, setCollapsedMindmapNodes, setSelectedMindmapNodeId, setMindmapZoom, setMindmapPan, setMindmapSearch}} />}
    </div>
  );
}
