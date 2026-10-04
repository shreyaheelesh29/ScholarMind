import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
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
  const [generatedMindmapArtifactId, setGeneratedMindmapArtifactId] = useState(null);
  const generatedMindmapRef = useRef(null);
  const mindmapSaveQueueRef = useRef(Promise.resolve());
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
  const [selectedMindmapNodeId, setSelectedMindmapNodeId] = useState("root");
  const [collapsedMindmapNodes, setCollapsedMindmapNodes] = useState(() => new Set());
  const [expandingMindmapNodes, setExpandingMindmapNodes] = useState(() => new Set());
  const [mindmapError, setMindmapError] = useState("");
  const [mindmapNotice, setMindmapNotice] = useState("");
  const [pendingMindmapFocusId, setPendingMindmapFocusId] = useState("");
  const [mindmapSearch, setMindmapSearch] = useState("");
  const [mindmapZoom, setMindmapZoom] = useState(1);
  const [mindmapPan, setMindmapPan] = useState({ x: 0, y: 0 });
  const mapViewportRef = useRef(null);
  const mapStageRef = useRef(null);
  const panDragRef = useRef(null);
  useEffect(() => {
    apiFetch("/papers").then(({ papers }) => {
      setAvailablePapers(papers);
      if (papers.length) setSelectedPaperId(papers[0].id);
    }).catch((err) => setGenerationError(err.message));
    apiFetch("/me/data").then(({ artifacts = [] }) => {
      const lastQuiz = artifacts.find((artifact) => artifact.kind === "quiz" && Array.isArray(artifact.payload?.questions) && artifact.payload.questions.length > 0);
      if (lastQuiz) setGeneratedQuiz(randomizeQuizOptions(lastQuiz));
      const lastMindmap = artifacts.find((artifact) => artifact.kind === "mindmap" && Array.isArray(artifact.payload?.nodes) && artifact.payload.nodes.length > 0);
      if (lastMindmap) {
        generatedMindmapRef.current = lastMindmap.payload;
        setGeneratedMindmap(lastMindmap.payload);
        setGeneratedMindmapArtifactId(lastMindmap.id);
        setSelectedMindmapNodeId("root");
        if (lastMindmap.payload?.source_paper_ids?.[0]) setSelectedPaperId(lastMindmap.payload.source_paper_ids[0]);
      }
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
      if (kind === "mindmap") {
        generatedMindmapRef.current = payload;
        setGeneratedMindmap(payload);
        setGeneratedMindmapArtifactId(result.artifact.id);
        setSelectedMindmapNodeId("root");
        setCollapsedMindmapNodes(new Set());
        setMindmapZoom(1);
        setMindmapPan({ x: 0, y: 0 });
        setMindmapError("");
        setTab("map");
      }
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
  const rawMindmapNodes = generatedMindmap?.nodes || demoMindmapNodes.map(({ id, label }) => ({ id, label }));
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
      const result = await apiFetch("/learning/mindmap/expand", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paper_id: sourcePaperId,
          node_id: nodeId,
          node_label: parent.label,
          breadcrumb: ancestors,
          context: [parent.summary, parent.details, parent.evidence].filter(Boolean).join("\n").slice(0, 1600),
          existing_nodes: mindmapNodes.map(({ id, label }) => ({ id, label })),
        }),
      });
      const currentMap = generatedMindmapRef.current || generatedMindmap;
      const existingIds = new Set((currentMap.nodes || []).map((node) => node.id));
      const existingLabels = new Set((currentMap.nodes || []).map((node) => node.label?.trim().toLocaleLowerCase()));
      const newChildren = (result.children || []).filter((node) => !existingIds.has(node.id) && !existingLabels.has(node.label?.trim().toLocaleLowerCase()));
      if (!newChildren.length) throw new Error("The model did not return any new concepts for this branch.");
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
      setMindmapNotice(`Added ${newChildren.length} source-grounded concepts under ${parent.label}.`);
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
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white p-5">
            <div>
              <h3 className="font-black text-xl text-slate-900">{generatedMindmap ? "Generated Paper Mind Map" : "Transformer Architecture Mind Map"}</h3>
              <p className="text-sm text-slate-500">Select a concept to focus its branch; surrounding topics shrink while you explore. Drag to pan and use the zoom controls to navigate.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <form onSubmit={searchMindmap} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
                <input list="mindmap-concept-options" value={mindmapSearch} onChange={(event) => setMindmapSearch(event.target.value)} aria-label="Search concepts in mind map" placeholder="Find a concept…" className="w-36 rounded-md px-2 py-1.5 text-sm outline-none sm:w-48" />
                <datalist id="mindmap-concept-options">{mindmapNodes.map((node) => <option key={node.id} value={node.label} />)}</datalist>
                <button type="submit" className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">Find</button>
              </form>
              <button onClick={() => setCollapsedMindmapNodes(new Set(mindmapRoot ? [mindmapRoot.id] : []))} disabled={!mindmapRoot || !(mindmapChildren[mindmapRoot.id] || []).length} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">Collapse branches</button>
              <button onClick={() => {
                if (!mindmapRoot) return;
                setSelectedMindmapNodeId(mindmapRoot.id);
                setCollapsedMindmapNodes((current) => { const next = new Set(current); next.delete(mindmapRoot.id); return next; });
                setMindmapZoom(1);
                const viewport = mapViewportRef.current;
                if (viewport) {
                  viewport.scrollTo({ top: 0, left: 0, behavior: "smooth" });
                  const rootPosition = mindmapPositions.get(mindmapRoot.id) || { x: 50, y: 50 };
                  setMindmapPan({ x: Math.max(12, viewport.clientWidth / 2 - (rootPosition.x / 100) * mindmapLayoutWidth), y: 20 - (rootPosition.y / 100) * mindmapLayoutHeight });
                } else setMindmapPan({ x: 0, y: 0 });
              }} disabled={!mindmapRoot} className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-100 disabled:opacity-40">Show root</button>
              <button onClick={() => setCollapsedMindmapNodes(new Set())} disabled={!collapsedMindmapNodes.size} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">Expand all</button>
              <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1" aria-label="Mind map zoom controls">
                <button onClick={() => setMindmapZoom((value) => Math.max(0.6, Math.round((value - 0.1) * 10) / 10))} disabled={mindmapZoom <= 0.6} aria-label="Zoom out" className="h-8 w-8 rounded-md text-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40">−</button>
                <button onClick={() => { setMindmapZoom(1); setMindmapPan({ x: 0, y: 0 }); }} aria-label="Reset zoom and position" className="min-w-14 px-2 text-xs font-semibold text-slate-600">{Math.round(mindmapZoom * 100)}%</button>
                <button onClick={() => setMindmapZoom((value) => Math.min(1.6, Math.round((value + 0.1) * 10) / 10))} disabled={mindmapZoom >= 1.6} aria-label="Zoom in" className="h-8 w-8 rounded-md text-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40">+</button>
              </div>
              <button onClick={downloadMindmap} disabled={!mindmapRoot} className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-40">Download outline</button>
            </div>
          </div>
          {mindmapNodes.length === 0 && <p className="p-8 text-center text-slate-600">No validated mind map was returned. Check your configured AI model, then generate again.</p>}
          {mindmapError && <p role="alert" className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-800">{mindmapError}</p>}
          {mindmapNotice && <p role="status" className="border-b border-emerald-100 bg-emerald-50 px-5 py-3 text-sm text-emerald-800">{mindmapNotice}</p>}
          {mindmapNodes.length > 0 && <div ref={mapViewportRef} onPointerDown={startMindmapPan} onPointerMove={moveMindmapPan} onPointerUp={stopMindmapPan} onPointerCancel={stopMindmapPan} className="relative h-[min(72vh,720px)] min-h-[480px] overflow-hidden touch-none bg-[radial-gradient(#cbd5e1_0.8px,transparent_0.8px)] [background-size:20px_20px] cursor-grab active:cursor-grabbing">
          <div ref={mapStageRef} className="relative min-w-[760px] transition-transform duration-300 ease-out" style={{ width: `${mindmapLayoutWidth}px`, height: `${mindmapLayoutHeight}px`, transform: `translate(${mindmapPan.x}px, ${mindmapPan.y}px) scale(${mindmapZoom})`, transformOrigin: "0 0" }}>
            <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
              <defs>
                <marker id="mindmap-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                </marker>
              </defs>
              {mindmapEdges.map((edge, i) => {
                const na = visibleMindmapNodes.find(n => n.id === edge.source);
                const nb = visibleMindmapNodes.find(n => n.id === edge.target);
                if (!na || !nb) return null;
                return <g key={i}>
                  <line x1={`${na.x}%`} y1={`${na.y}%`} x2={`${nb.x}%`} y2={`${nb.y}%`} stroke="#94a3b8" strokeOpacity="0.65" strokeWidth="2" markerEnd="url(#mindmap-arrow)" />
                  {edge.label && <text x={`${(na.x + nb.x) / 2}%`} y={`${(na.y + nb.y) / 2}%`} textAnchor="middle" className="fill-slate-700" fontSize="12" fontWeight="600" paintOrder="stroke" stroke="white" strokeWidth="5" strokeLinejoin="round">{edge.label}</text>}
                </g>;
              })}
            </svg>
            {visibleMindmapNodes.map((n) => {
              const isSelected = selectedMindmapNode?.id === n.id;
              const isAncestor = selectedMindmapPathIds.has(n.id) && !isSelected;
              const isDescendant = isDescendantOfSelectedMindmapNode(n.id);
              const nodeScale = isSelected ? 1.1 : isDescendant ? 0.92 : isAncestor ? 0.76 : 0.62;
              const nodeOpacity = isSelected || isDescendant ? 1 : isAncestor ? 0.76 : 0.48;
              return <div key={n.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${n.x}%`, top: `${n.y}%`, zIndex: isSelected ? 20 : isAncestor || isDescendant ? 10 : 1 }}>
                <div className="transition-[scale,opacity] duration-300 ease-out" style={{ scale: String(nodeScale), opacity: nodeOpacity }}>
                <button onClick={() => chooseMindmapNode(n)} aria-pressed={selectedMindmapNode?.id === n.id} aria-label={`${n.label}${expandingMindmapNodes.has(n.id) ? ", generating subtopics" : ""}`} className={`w-fit rounded-2xl border text-white transition hover:-translate-y-0.5 ${n.size === "lg" ? "min-w-[14rem] max-w-[28rem] px-7 py-5" : "min-w-[14rem] max-w-[22rem] px-5 py-4"} ${selectedMindmapNode?.id === n.id ? "border-white ring-4 ring-primary-300 shadow-2xl shadow-primary-900/25" : "border-white/30 shadow-xl shadow-indigo-900/20 hover:shadow-2xl"}`} style={{ backgroundColor: n.size === "lg" ? "#6d28d9" : "#4f46e5", backgroundImage: n.size === "lg" ? "linear-gradient(135deg, #6d28d9 0%, #4f46e5 52%, #c026c7 100%)" : "linear-gradient(135deg, #0284c7 0%, #4338ca 100%)", textShadow: "0 1px 2px rgba(15,23,42,0.35)" }}>
                  <span className={`block whitespace-normal break-words [overflow-wrap:anywhere] text-center font-extrabold leading-snug ${n.size === "lg" ? "text-xl" : "text-base"}`}>{n.label}</span>
                  {n.page && <span className="mt-1 block text-center text-xs font-semibold text-white/80">Source · p. {n.page}</span>}
                  {expandingMindmapNodes.has(n.id) && <span className="mt-2 block text-xs font-semibold text-white/90">Generating subtopics…</span>}
                </button>
                {(mindmapChildren[n.id] || []).length > 0 && <button onClick={(event) => { event.stopPropagation(); setCollapsedMindmapNodes((current) => { const next = new Set(current); if (next.has(n.id)) next.delete(n.id); else next.add(n.id); return next; }); }} aria-label={`${collapsedMindmapNodes.has(n.id) ? "Expand" : "Collapse"} ${n.label} branch`} title={`${collapsedMindmapNodes.has(n.id) ? "Expand" : "Collapse"} branch`} className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-slate-900 text-sm font-bold text-white shadow-md hover:bg-primary-700">{collapsedMindmapNodes.has(n.id) ? "+" : "−"}</button>}
                </div>
              </div>;
            })}
          </div>
          </div>}
          {selectedMindmapNode && <section className="border-t border-slate-200 bg-white p-5" aria-live="polite">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-wider text-primary-600">Selected concept</p>
                <h4 className="mt-1 text-lg font-bold text-slate-900">{selectedMindmapNode.label}</h4>
                <nav aria-label="Mind map breadcrumb" className="mt-2 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                  {selectedMindmapPath.map((node, index) => <span key={node.id} className="inline-flex items-center gap-1">{index > 0 && <span aria-hidden="true">›</span>}<button onClick={() => focusMindmapNode(node)} className={`rounded px-1 py-0.5 hover:bg-primary-50 hover:text-primary-700 ${index === selectedMindmapPath.length - 1 ? "font-bold text-slate-800" : ""}`}>{node.label}</button></span>)}
                </nav>
                <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-700">{selectedMindmapNode.summary || selectedMindmapNode.evidence || "Select a concept to inspect its supporting detail."}</p>
                {selectedMindmapNode.details && <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-600">{selectedMindmapNode.details}</p>}
                {selectedMindmapNode.example && <p className="mt-3 max-w-4xl rounded-lg bg-amber-50 p-3 text-sm text-amber-950"><strong>Example: </strong>{selectedMindmapNode.example}</p>}
                {!!selectedMindmapNode.key_points?.length && <ul className="mt-3 grid max-w-4xl gap-2 sm:grid-cols-2">{selectedMindmapNode.key_points.map((point, index) => <li key={`${index}-${point}`} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{selectedMindmapNode.importance && <span className="mr-1 text-amber-500" title="Important concept">★</span>}{point}</li>)}</ul>}
                {!!selectedMindmapNode.related_concepts?.length && <div className="mt-3 flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">Related concepts</span>{selectedMindmapNode.related_concepts.map((concept) => <button key={concept} onClick={() => { const relatedNode = mindmapNodes.find((node) => node.label.toLocaleLowerCase() === concept.toLocaleLowerCase()); if (relatedNode) chooseMindmapNode(relatedNode); else { setMindmapSearch(concept); expandMindmapNode(selectedMindmapNode.id); } }} className="rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-100">{concept}</button>)}</div>}
                {selectedMindmapNode.evidence && <blockquote className="mt-3 max-w-4xl border-l-2 border-primary-300 pl-3 text-sm italic text-slate-500">“{selectedMindmapNode.evidence}”</blockquote>}
              </div>
              {selectedMindmapNode.page && <span className="shrink-0 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700">Source page {selectedMindmapNode.page}</span>}
              <div className="flex flex-wrap gap-2">
                <button onClick={() => expandMindmapNode(selectedMindmapNode.id)} disabled={!generatedMindmap || expandingMindmapNodes.has(selectedMindmapNode.id)} className="rounded-lg border border-primary-200 px-4 py-2.5 text-sm font-bold text-primary-700 hover:bg-primary-50 disabled:opacity-50">{expandingMindmapNodes.has(selectedMindmapNode.id) ? "Generating…" : "Generate deeper branches"}</button>
                <Link to={`/chat?question=${encodeURIComponent(`Explain “${selectedMindmapNode.label}” using my uploaded paper, and cite the relevant page.`)}${generatedMindmap?.source_paper_ids?.[0] ? `&paper_id=${encodeURIComponent(generatedMindmap.source_paper_ids[0])}` : ""}`} className="shrink-0 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-700">Ask in chat</Link>
              </div>
            </div>
          </section>}
        </div>
      )}
    </div>
  );
}
