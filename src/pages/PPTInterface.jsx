import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, clearSession } from "../api";

const initialSlides = [
  {
    id: 1,
    type: "empty",
    label: "Start a deck",
    icon: "✦",
    title: "Your next presentation starts here",
    bullets: [],
    speakerNotes: "",
    gradient: "from-indigo-500 to-purple-500",
  },
];

export default function PPTInterface() {
  const navigate = useNavigate();
  const [slides, setSlides] = useState(initialSlides);
  const [availablePapers, setAvailablePapers] = useState([]);
  const [selectedPaperId, setSelectedPaperId] = useState("");
  const [inputType, setInputType] = useState("paper");
  const [sourceText, setSourceText] = useState("");
  const [presentationPurpose, setPresentationPurpose] = useState("research");
  const [customInstructions, setCustomInstructions] = useState("");
  const [slideCount, setSlideCount] = useState(8);
  const [generationError, setGenerationError] = useState("");
  const [generationNotice, setGenerationNotice] = useState("");
  const [authExpired, setAuthExpired] = useState(false);
  const [pptArtifact, setPptArtifact] = useState(null);
  const [current, setCurrent] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [notesExpanded, setNotesExpanded] = useState(true);
  const [notesSaveState, setNotesSaveState] = useState("saved");
  const notesSaveQueueRef = useRef(Promise.resolve());
  const slidePreviewRef = useRef(null);
  const presenterNotesRef = useRef(null);
  const [previewScroll, setPreviewScroll] = useState({ canScroll: false, atBottom: false });

  const slide = slides[current];

  useEffect(() => {
    const element = slidePreviewRef.current;
    if (!element) return undefined;
    const updateScrollState = () => {
      const next = {
        canScroll: element.scrollHeight > element.clientHeight + 4,
        atBottom: element.scrollTop + element.clientHeight >= element.scrollHeight - 8,
      };
      setPreviewScroll((previous) => previous.canScroll === next.canScroll && previous.atBottom === next.atBottom ? previous : next);
    };
    const mutationObserver = new MutationObserver(updateScrollState);
    const resizeObserver = new ResizeObserver(updateScrollState);
    element.addEventListener("scroll", updateScrollState, { passive: true });
    mutationObserver.observe(element, { childList: true, characterData: true, subtree: true });
    resizeObserver.observe(element);
    if (element.firstElementChild) resizeObserver.observe(element.firstElementChild);
    const frame = requestAnimationFrame(updateScrollState);
    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener("scroll", updateScrollState);
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [current, slides, editingId]);

  useEffect(() => {
    if (slidePreviewRef.current) slidePreviewRef.current.scrollTop = 0;
  }, [current, pptArtifact?.id]);

  const scrollPreview = () => {
    const element = slidePreviewRef.current;
    if (!element) return;
    element.scrollTo({ top: previewScroll.atBottom ? 0 : element.scrollTop + element.clientHeight * 0.75, behavior: "smooth" });
  };

  const reportError = (err) => {
    if (err.status === 401) {
      setAuthExpired(true);
      setGenerationError("Your session has expired. Sign in again to continue.");
      return;
    }
    const detail = String(err.message || "");
    setGenerationError(/presentation did not contain any slides/i.test(detail)
      ? "The backend is still running an older PPT generator. Restart ScholarMind’s backend, then retry generation."
      : detail);
  };

  const persistSlideEdits = (nextSlides, { presenterNotes = false } = {}) => {
    if (!pptArtifact?.id) return Promise.resolve(false);
    const payload = {
      ...(pptArtifact.payload || {}),
      slides: nextSlides.map((item) => ({
        title: item.title,
        content: item.bullets || [],
        speaker_notes: item.speakerNotes || "",
        page: Number.isInteger(item.page) ? item.page : null,
        pages: Array.isArray(item.pages) ? item.pages : [],
      })),
    };
    setPptArtifact((item) => ({ ...item, payload }));
    if (presenterNotes) setNotesSaveState("saving");
    const request = notesSaveQueueRef.current.catch(() => {}).then(() => apiFetch(`/artifacts/${pptArtifact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload }),
    }));
    notesSaveQueueRef.current = request;
    return request.then(() => {
      if (presenterNotes) setNotesSaveState("saved");
      return true;
    }).catch((err) => {
      if (presenterNotes) setNotesSaveState("error");
      reportError(err.status === 401 ? err : new Error(`Could not save ${presenterNotes ? "presenter notes" : "slide changes"}: ${err.message}`));
      return false;
    });
  };

  const addSlide = () => {
    const newSlide = {
      id: Date.now(), type: "generated", label: "New slide", title: "New slide",
      bullets: ["Add a key point from your source."], speakerNotes: "", page: null, pages: [],
      icon: "✨", gradient: "from-indigo-500 to-purple-500",
    };
    const nextSlides = [...slides, newSlide];
    setSlides(nextSlides);
    setCurrent(nextSlides.length - 1);
    setEditingId(newSlide.id);
    persistSlideEdits(nextSlides);
  };

  useEffect(() => {
    apiFetch("/papers").then(({ papers }) => {
      setAvailablePapers(papers);
      if (papers.length) setSelectedPaperId(papers[0].id);
    }).catch(reportError);
  }, []);

  const go = (dir) => setCurrent((i) => Math.max(0, Math.min(slides.length - 1, i + dir)));

  useEffect(() => {
    const onKeyDown = (event) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(event.target?.tagName) || event.target?.isContentEditable) return;
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [slides.length]);

  const chooseSource = (type) => {
    setInputType(type);
    document.getElementById("ppt-source")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleGenerate = async () => {
    if (inputType === "paper" && !selectedPaperId) { setGenerationError("Upload a paper first, then select it above."); return; }
    if (inputType !== "paper" && !sourceText.trim()) { setGenerationError(inputType === "topic" ? "Enter a topic for your presentation." : "Paste your notes to build the presentation."); return; }
    setGenerating(true);
    setGenerationProgress(15);
    setAuthExpired(false);
    setGenerationError("");
    setGenerationNotice("");
    if (slidePreviewRef.current) slidePreviewRef.current.scrollTop = 0;
    try {
      const result = await apiFetch("/learning/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "ppt_outline",
          paper_id: inputType === "paper" ? selectedPaperId : null,
          presentation_input_type: inputType,
          source_text: inputType === "paper" ? "" : sourceText.trim(),
          presentation_purpose: presentationPurpose,
          prompt: customInstructions.trim(),
          count: slideCount,
          variation_seed: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        }),
      });
      const content = result.artifact.payload || {};
      setPptArtifact(result.artifact);
      setGenerationNotice(content._generation_notice || "");
      const generated = (content.slides || []).map((item, i) => ({
        id: i + 1, type: "generated", label: item.title || `Slide ${i + 1}`, title: item.title || `Slide ${i + 1}`,
        bullets: Array.isArray(item.content) ? item.content : String(item.content || "").split(/(?<=[.!?])\s+/).filter(Boolean),
        speakerNotes: item.speaker_notes || "", page: item.page, pages: Array.isArray(item.pages) ? item.pages : (item.page ? [item.page] : []), icon: "📄", gradient: ["from-indigo-500 to-purple-500", "from-blue-500 to-cyan-500", "from-emerald-500 to-teal-500"][i % 3],
      }));
      if (!generated.length) throw new Error("The service returned no slides. Try again with a different paper.");
      setSlides(generated); setCurrent(0); setGenerationProgress(100); setNotesSaveState("saved");
      setNotesExpanded(true);
    } catch (err) { reportError(err); }
    finally { setGenerating(false); }
  };

  const savePresenterNotes = () => persistSlideEdits(slides, { presenterNotes: true });

  const handleDownload = async () => {
    if (!slides.length) return;
    setExporting(true);
    setGenerationError("");
    try {
      const response = await fetch("/api/presentations/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("scholarmind_token") || ""}`,
        },
        body: JSON.stringify({
          title: pptArtifact?.title || "ScholarMind Presentation",
          source_label: inputType === "paper"
            ? availablePapers.find((paper) => paper.id === selectedPaperId)?.filename || "Uploaded source"
            : inputType === "notes" ? "User-provided notes" : "User-provided topic",
          slides: slides.map((item) => ({
            title: item.title || item.label || "Untitled slide",
            content: item.bullets || [],
            speaker_notes: item.speakerNotes || "",
            page: Number.isInteger(item.page) ? item.page : null,
            pages: Array.isArray(item.pages) ? item.pages : [],
          })),
        }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        const error = new Error(result.detail || `Could not create PowerPoint (${response.status})`);
        error.status = response.status;
        throw error;
      }
      const file = await response.blob();
      const disposition = response.headers.get("content-disposition") || "";
      const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || "scholarmind-presentation.pptx";
      const url = URL.createObjectURL(file);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      reportError(err);
    } finally {
      setExporting(false);
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newSlides = [...slides];
    const [removed] = newSlides.splice(draggedIndex, 1);
    newSlides.splice(index, 0, removed);
    setSlides(newSlides);
    setDraggedIndex(index);
    if (current === draggedIndex) setCurrent(index);
    else if (draggedIndex < current && index >= current) setCurrent(current - 1);
    else if (draggedIndex > current && index <= current) setCurrent(current + 1);
  };

  const handleDrop = () => {
    setDraggedIndex(null);
    persistSlideEdits(slides);
  };

  const deleteSlide = (index) => {
    if (slides.length <= 1) return;
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    persistSlideEdits(newSlides);
    if (index === current) setCurrent(Math.max(0, current - 1));
    else if (index < current) setCurrent(current - 1);
  };

  return (
    <div className="min-h-[calc(100vh-7rem)] flex flex-col gap-4 animate-fade-in">
      <div id="ppt-source" className="flex items-start justify-between gap-4 flex-wrap scroll-mt-24">
        <div>
          <p className="text-sm font-medium text-primary-600">Output & Learning</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">PPT Generator</h1>
          <p className="mt-2 text-slate-500">Create a presentation from a paper, your notes, or a topic.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select aria-label="Presentation source" value={inputType} onChange={(e) => setInputType(e.target.value)} className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20">
            <option value="paper">From a research paper</option>
            <option value="notes">From my notes</option>
            <option value="topic">From a topic</option>
          </select>
          {inputType === "paper" && <select aria-label="Research paper" value={selectedPaperId} onChange={(e) => setSelectedPaperId(e.target.value)} className="max-w-56 px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20">
            {availablePapers.length ? availablePapers.map((paper) => <option key={paper.id} value={paper.id}>{paper.filename}</option>) : <option value="">No uploaded papers</option>}
          </select>}
          <select aria-label="Presentation purpose" value={presentationPurpose} onChange={(e) => setPresentationPurpose(e.target.value)} className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20">
            <option value="research">Research overview</option>
            <option value="lecture">Class lecture</option>
            <option value="thesis_defense">Thesis defense</option>
            <option value="conference">Conference talk</option>
            <option value="project_pitch">Project pitch</option>
          </select>
          <select aria-label="Number of slides" value={slideCount} onChange={(e) => setSlideCount(Number(e.target.value))} className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20">
            {[5, 8, 10, 12].map((count) => <option key={count} value={count}>{count} slides</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {inputType !== "paper" && <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
          {inputType === "topic" ? "Topic and source details" : "Paste your notes"}
          <textarea value={sourceText} onChange={(e) => setSourceText(e.target.value.slice(0, 15000))} rows={2} maxLength={15000} placeholder={inputType === "topic" ? "Enter the topic and the facts or details to include. Slides will use only what you provide here." : "Paste the notes or source material you want the slides to cover…"} className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm font-normal normal-case tracking-normal text-slate-800 outline-none focus:ring-2 focus:ring-primary-200" />
          <span className="mt-1 block text-[11px] font-normal normal-case tracking-normal">Source-only generation · {sourceText.length.toLocaleString()} / 15,000 characters. Upload longer material as a document.</span>
        </label>}
        <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
          Custom instructions <span className="font-normal normal-case tracking-normal">(optional)</span>
          <textarea value={customInstructions} onChange={(e) => setCustomInstructions(e.target.value.slice(0, 1000))} rows={2} maxLength={1000} placeholder="e.g. Focus on practical applications and use language suitable for first-year students" className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm font-normal normal-case tracking-normal text-slate-800 outline-none focus:ring-2 focus:ring-primary-200" />
        </label>
      </div>

      {generationError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <span>{generationError}</span>
        <div className="flex items-center gap-2">
          {!authExpired && <button type="button" onClick={handleGenerate} disabled={generating} className="rounded-lg border border-red-300 bg-white px-3 py-1.5 font-bold hover:bg-red-100 disabled:opacity-50">Retry</button>}
          {authExpired && <button type="button" onClick={() => { clearSession(); navigate("/login", { state: { from: "/ppt" } }); }} className="shrink-0 rounded-lg bg-red-700 px-4 py-2 font-bold text-white transition hover:bg-red-800">Sign in again</button>}
          <button type="button" aria-label="Dismiss error" onClick={() => setGenerationError("")} className="rounded-md p-1 text-red-700 hover:bg-red-100">✕</button>
        </div>
      </div>}
      {generationNotice && !generationError && <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{generationNotice}</div>}

      {generating && (
        <div className="rounded-xl border border-primary-200 bg-gradient-to-r from-primary-50 via-white to-accent-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm font-black text-slate-800">
                {generationProgress < 30 && (inputType === "paper" ? "🔍 Analyzing paper content & structure..." : "🔍 Analyzing your input...")}
                {generationProgress >= 30 && generationProgress < 60 && "📝 Drafting slide outlines & bullets..."}
                {generationProgress >= 60 && generationProgress < 90 && "🎨 Applying layout templates & styling..."}
                {generationProgress >= 90 && "✅ Finalizing presentation & citations..."}
              </span>
            </div>
            <span className="text-sm font-black text-primary-700">{generationProgress}%</span>
          </div>
          <div className="h-2 rounded-full bg-white border border-slate-200 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 transition-all duration-100 rounded-full"
              style={{ width: `${generationProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex gap-4 min-h-[32rem]">
        <div className="w-64 rounded-xl border border-slate-200 bg-white flex flex-col overflow-hidden flex-shrink-0 shadow-sm">
          <div className="p-3 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Slide Outline ({slides.length})
            </span>
            <button onClick={addSlide} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500" title="Add slide">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {slides.map((s, i) => (
              <div
                key={s.id}
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={handleDrop}
                onClick={() => setCurrent(i)}
                className={`group relative w-full text-left p-2 rounded-lg transition cursor-grab active:cursor-grabbing ${
                  i === current ? "bg-primary-50 ring-2 ring-primary-500" : "hover:bg-slate-50"
                } ${draggedIndex === i ? "opacity-50 scale-95" : ""}`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 text-sm ${
                      i === current ? "text-primary-500" : "text-slate-400 group-hover:text-primary-400"
                    }`}
                  >
                    ⋮⋮
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className={`text-[10px] font-black w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                          i === current ? "bg-primary-500 text-white" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="text-base">{s.icon}</span>
                    </div>
                    {editingId === s.id ? (
                      <input
                        autoFocus
                        defaultValue={s.label}
                        onBlur={(e) => {
                          const title = e.target.value.trim() || `Slide ${i + 1}`;
                          const nextSlides = slides.map((item, slideIndex) => slideIndex === i ? { ...item, title, label: title } : item);
                          setSlides(nextSlides);
                          persistSlideEdits(nextSlides);
                          setEditingId(null);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && setEditingId(null)}
                        onChange={(e) => setSlides((existing) => existing.map((item, slideIndex) => slideIndex === i ? { ...item, title: e.target.value, label: e.target.value } : item))}
                        className="w-full px-2 py-1 text-xs rounded border border-primary-300 focus:ring-1 focus:ring-primary-500 outline-none bg-white"
                      />
                    ) : (
                      <p className="text-xs font-semibold text-slate-800 leading-tight">{s.label}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(s.id);
                      }}
                      className="p-1 rounded hover:bg-white text-slate-400 hover:text-primary-600"
                      title="Edit"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSlide(i);
                      }}
                      disabled={slides.length <= 1}
                      className="p-1 rounded hover:bg-error-50 text-slate-400 hover:text-error-600 disabled:opacity-30"
                      title="Delete"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="flex-1 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-3 sm:p-6 overflow-hidden flex items-center justify-center min-h-[16rem] shadow-lg [container-type:size]">
            <div className="relative w-full max-w-4xl aspect-video bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col min-h-0">
              <div className={`h-2 bg-gradient-to-r ${slide.gradient} flex-shrink-0`} />
              <div ref={slidePreviewRef} tabIndex={0} role="region" aria-label="Slide preview. Scroll inside to read all slide text." className="ppt-preview-scroll flex-1 min-h-0 overflow-y-auto overscroll-y-contain bg-slate-50 p-4 sm:p-6">
                {slide.type === "empty" && (
                  <div className="flex h-full min-h-[15rem] flex-col items-center justify-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-3xl text-white shadow-lg shadow-indigo-200">✦</div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-primary-600">Presentation studio</p>
                    <h2 className="mt-2 max-w-xl text-2xl font-black leading-tight text-slate-900 sm:text-3xl">Build a clear story from your research</h2>
                    <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-500">Choose a source and audience above. ScholarMind will shape it into an editable, cited slide outline.</p>
                    <div className="mt-6 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-3">
                      {[["paper", "▤", "Research paper"], ["notes", "✎", "My notes"], ["topic", "◎", "A topic"]].map(([type, icon, label]) => (
                        <button key={type} type="button" onClick={() => chooseSource(type)} className={`rounded-xl border px-3 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${inputType === type ? "border-primary-300 bg-primary-50 ring-1 ring-primary-200" : "border-slate-200 bg-white hover:border-primary-200"}`}>
                          <span className="mr-2 text-primary-600">{icon}</span><span className="text-xs font-bold text-slate-700">{label}</span>
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={() => document.getElementById("ppt-source")?.scrollIntoView({ behavior: "smooth", block: "center" })} className="mt-5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-primary-700">Set up your deck <span aria-hidden="true">↓</span></button>
                  </div>
                )}
                {slide.type === "title" && (
                  <div className="h-full flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-primary-700 text-xs font-black uppercase shadow-md">
                          Research Proposal
                        </span>
                        <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 leading-tight max-w-[80%] break-words">
                          {slide.title}
                        </h2>
                        <p className="mt-3 text-base sm:text-lg text-slate-600 max-w-[85%] break-words">{slide.subtitle}</p>
                      </div>
                      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center shadow-2xl`}>
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex items-end justify-between pt-6 border-t-2 border-slate-100">
                      <div>
                        <p className="text-sm font-semibold text-slate-500">{slide.meta}</p>
                        <p className="text-lg font-bold text-slate-800 mt-1">{slide.authors}</p>
                      </div>
                      <p className="text-lg font-bold text-primary-600">{slide.date}</p>
                    </div>
                  </div>
                )}

                {(slide.type === "intro" || slide.type === "discussion") && (
                  <div className="h-full flex flex-col">
                    <div className="mb-5 pb-3 border-b-2 border-slate-100">
                      <span className={`text-xs font-black uppercase tracking-wider bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}>
                        Section {String(current).padStart(2, "0")}
                      </span>
                      <h2 className="text-3xl font-black text-slate-900 mt-1">{slide.title}</h2>
                    </div>
                    <div className="flex-1 space-y-2.5">
                      {slide.bullets?.map((b, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-xl bg-white/70 border border-slate-100 items-start">
                          <span className={`w-7 h-7 rounded-lg bg-gradient-to-br ${slide.gradient} text-white font-black flex items-center justify-center flex-shrink-0 shadow-md text-sm`}>
                            {i + 1}
                          </span>
                          <p className="text-base text-slate-800 leading-relaxed font-medium">{b}</p>
                        </div>
                      ))}
                    </div>
                    {slide.takeaway && (
                      <div className={`mt-4 p-4 rounded-xl bg-gradient-to-r ${slide.gradient} text-white shadow-lg`}>
                        <p className="text-xs uppercase font-black opacity-80">🎯 Key Takeaway</p>
                        <p className="text-xl font-black mt-0.5">{slide.takeaway}</p>
                      </div>
                    )}
                  </div>
                )}

                {slide.type === "background" && (
                  <div className="h-full flex flex-col">
                    <div className="mb-5 pb-3 border-b-2 border-slate-100">
                      <span className={`text-xs font-black uppercase tracking-wider bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}>
                        Section {String(current).padStart(2, "0")}
                      </span>
                      <h2 className="text-3xl font-black text-slate-900 mt-1">{slide.title}</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-3 flex-1">
                      {slide.columns?.map((col, i) => (
                        <div key={i} className="rounded-xl border-2 border-slate-100 bg-white/60 p-4 flex flex-col">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 bg-gradient-to-br ${slide.gradient}`}>
                            <span className="text-white font-black">{i + 1}</span>
                          </div>
                          <h3 className="text-base font-black text-slate-900 mb-2">{col.header}</h3>
                          <ul className="space-y-1.5 flex-1">
                            {col.items.map((it, j) => (
                              <li key={j} className="text-xs text-slate-700 flex items-start gap-1.5">
                                <span className="mt-1 text-primary-500 font-black">▸</span>
                                {it}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3.5 rounded-xl bg-warning-50 border-2 border-dashed border-warning-200">
                      <p className="text-xs font-black uppercase text-warning-700 tracking-wider mb-0.5">⚠️ Research Gap</p>
                      <p className="text-base font-bold text-slate-800">{slide.gap}</p>
                    </div>
                  </div>
                )}

                {slide.type === "methodology" && (
                  <div className="h-full flex flex-col">
                    <div className="mb-5 pb-3 border-b-2 border-slate-100">
                      <span className={`text-xs font-black uppercase tracking-wider bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}>
                        Section {String(current).padStart(2, "0")}
                      </span>
                      <h2 className="text-3xl font-black text-slate-900 mt-1">{slide.title}</h2>
                    </div>
                    <div className="flex-1 grid grid-cols-4 gap-3 items-center">
                      {slide.steps?.map((s, i) => (
                        <div key={i} className="relative">
                          <div className="rounded-2xl bg-white/70 border-2 border-slate-100 p-4 text-center hover:scale-105 transition hover:shadow-xl">
                            <div className={`w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br ${slide.gradient} text-white font-black text-xl flex items-center justify-center shadow-lg`}>
                              {s.num}
                            </div>
                            <h3 className="mt-3 font-black text-slate-900 text-base leading-tight">{s.title}</h3>
                            <p className="mt-1.5 text-xs text-slate-600 leading-snug">{s.desc}</p>
                          </div>
                          {i < (slide.steps?.length || 0) - 1 && (
                            <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 z-10 text-accent-500 text-lg">
                              →
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {slide.type === "results" && (
                  <div className="h-full flex flex-col">
                    <div className="mb-4 pb-2 border-b-2 border-slate-100">
                      <span className={`text-xs font-black uppercase tracking-wider bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}>
                        Section {String(current).padStart(2, "0")}
                      </span>
                      <h2 className="text-2xl font-black text-slate-900 mt-1">{slide.title}</h2>
                    </div>
                    <div className="rounded-xl border-2 border-slate-100 overflow-hidden flex-1">
                      <div className={`grid grid-cols-5 bg-gradient-to-r ${slide.gradient} text-white`}>
                        {slide.table?.headers.map((h) => (
                          <div key={h} className="px-4 py-3 text-sm font-black uppercase tracking-wider">
                            {h}
                          </div>
                        ))}
                      </div>
                      {slide.table?.rows.map((row, i) => (
                        <div
                          key={i}
                          className={`grid grid-cols-5 ${
                            row[0].includes("Ours")
                              ? "bg-gradient-to-r from-primary-50 to-success-50 ring-2 ring-primary-400 z-10 relative"
                              : i % 2
                              ? "bg-white"
                              : "bg-slate-50"
                          }`}
                        >
                          {row.map((c, j) => (
                            <div
                              key={j}
                              className={`px-4 py-3 border-b border-slate-100 text-sm ${
                                j === 0 ? "font-black text-slate-900" : "text-slate-700"
                              } ${row[0].includes("Ours") ? "font-black" : ""}`}
                            >
                              {c}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    <div className={`mt-3 p-3.5 rounded-xl bg-gradient-to-r ${slide.gradient} text-white shadow-lg`}>
                      <p className="text-xs font-black uppercase opacity-80 mb-0.5">✓ Core Claim</p>
                      <p className="text-lg font-black">{slide.claim}</p>
                    </div>
                  </div>
                )}

                {slide.type === "conclusion" && (
                  <div className="h-full flex flex-col">
                    <div className="mb-4 pb-2 border-b-2 border-slate-100">
                      <span className={`text-xs font-black uppercase tracking-wider bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}>
                        Section {String(current).padStart(2, "0")}
                      </span>
                      <h2 className="text-2xl font-black text-slate-900 mt-1">{slide.title}</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      {slide.contributions?.map((c, i) => (
                        <div key={i} className="rounded-xl bg-white/70 border-2 border-slate-100 p-4 flex items-start gap-3 hover:scale-[1.02] transition">
                          <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${slide.gradient} text-white font-black flex items-center justify-center flex-shrink-0 shadow-md`}>
                            ✦
                          </span>
                          <p className="text-sm text-slate-800 font-semibold leading-snug">{c}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {slide.type === "references" && (
                  <div className="h-full flex flex-col">
                    <div className="mb-4 pb-2 border-b-2 border-slate-100">
                      <span className={`text-xs font-black uppercase tracking-wider bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}>
                        Section {String(current).padStart(2, "0")}
                      </span>
                      <h2 className="text-2xl font-black text-slate-900 mt-1">{slide.title}</h2>
                    </div>
                    <div className="flex-1 space-y-2 overflow-auto">
                      {slide.references?.map((r, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-lg bg-white/60 border border-slate-100">
                          <span className={`w-7 h-7 rounded-md bg-gradient-to-br ${slide.gradient} text-white text-xs font-black flex items-center justify-center flex-shrink-0`}>
                            {i + 1}
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed">{r}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {slide.type === "generated" && (
                    <div className="min-w-0">
                    <div className="mb-3 border-b-2 border-slate-100 pb-2 sm:mb-4 sm:pb-3"><span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-primary-600">{slide.pages?.length > 1 ? `Source pages ${slide.pages.join(", ")}` : slide.page ? `Source page ${slide.page}` : pptArtifact?.payload?.presentation_input_type === "notes" ? "From your notes • no page citation" : pptArtifact?.payload?.presentation_input_type === "topic" ? "Topic overview • no page citation" : "Presentation preview"}</span><h2 className="mt-1 text-xl sm:text-2xl lg:text-3xl font-black leading-tight text-slate-900 break-words">{slide.title}</h2></div>
                    {editingId === slide.id ? (
                      <textarea
                        aria-label="Edit slide bullet points"
                        value={slide.bullets.join("\n")}
                        onChange={(e) => setSlides((existing) => existing.map((item, i) => i === current ? { ...item, bullets: e.target.value.split("\n") } : item))}
                        onBlur={() => persistSlideEdits(slides)}
                        rows={6}
                        className="min-h-48 w-full resize-y rounded-xl border border-primary-200 bg-white p-3 text-sm font-medium leading-relaxed text-slate-800 outline-none focus:ring-2 focus:ring-primary-200"
                        placeholder="One point per line"
                      />
                    ) : (
                      <ul className="space-y-2 pb-2">{slide.bullets.map((bullet, i) => <li key={i} className="rounded-xl border border-slate-100 bg-white/80 p-2 sm:p-3 text-sm sm:text-base font-medium text-slate-800 break-words">{bullet}</li>)}</ul>
                    )}
                  </div>
                )}
              </div>
              <div className="h-9 bg-slate-50 border-t border-slate-100 flex items-center justify-between px-5 flex-shrink-0">
                <span className="text-xs font-semibold text-slate-500">{slide.type === "generated" ? "Scroll inside the slide to read all text" : `ScholarMind • ${slide.label}`}</span>
                <span className={`text-xs font-black bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}>
                  {current + 1} / {slides.length}
                </span>
              </div>
              {slide.type === "generated" && <div className="absolute bottom-11 right-3 z-10 flex flex-wrap justify-end gap-2">
                {previewScroll.canScroll && <button type="button" onClick={scrollPreview} className="rounded-full border border-slate-300 bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-md hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                  {previewScroll.atBottom ? "↑ Back to top" : "↓ Scroll to read more"}
                </button>}
                <button type="button" onClick={() => presenterNotesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })} className="rounded-full bg-primary-600 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-300">
                  Presenter notes ↓
                </button>
              </div>}
            </div>
          </div>

          {slide.type === "generated" && <section ref={presenterNotesRef} className="scroll-mt-24 overflow-hidden rounded-xl border border-indigo-100 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-slate-900">Presenter notes <span className="font-medium text-slate-500">· Slide {current + 1}</span></h3>
                <p className="mt-0.5 text-xs text-slate-500">A slide-specific speaking script. Edit it here or read it from the exported PowerPoint notes.</p>
              </div>
              <button type="button" aria-expanded={notesExpanded} onClick={() => setNotesExpanded((expanded) => !expanded)} className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:border-indigo-200 hover:bg-indigo-50">
                {notesExpanded ? "Hide notes" : "Show notes"} <span aria-hidden="true">{notesExpanded ? "⌃" : "⌄"}</span>
              </button>
            </div>
            {notesExpanded && <div className="border-t border-indigo-50 px-4 pb-4">
              <textarea
                aria-label={`Presenter notes for slide ${current + 1}`}
                value={slide.speakerNotes || ""}
                onChange={(event) => {
                  setSlides((existing) => existing.map((item, i) => i === current ? { ...item, speakerNotes: event.target.value } : item));
                  setNotesSaveState("unsaved");
                }}
                rows={6}
                placeholder="Write what you plan to say: explain the slide’s key point, connect the evidence, and transition to the next slide…"
                className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-relaxed text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className={`text-xs font-semibold ${notesSaveState === "error" ? "text-red-600" : notesSaveState === "unsaved" ? "text-amber-700" : "text-slate-500"}`} role="status" aria-live="polite">
                  {notesSaveState === "saving" ? "Saving presenter notes…" : notesSaveState === "unsaved" ? "Unsaved changes. Save to keep your edits." : notesSaveState === "error" ? "Could not save. Try again." : "All presenter notes saved."}
                </span>
                <button
                  type="button"
                  onClick={savePresenterNotes}
                  disabled={notesSaveState === "saving" || notesSaveState === "saved" || !pptArtifact?.id}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                >
                  {notesSaveState === "saving" ? "Saving…" : "Save notes"}
                </button>
              </div>
            </div>}
          </section>}

          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-3">
            <div className="flex gap-3 overflow-x-auto pb-1">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setCurrent(i)}
                  className={`flex-shrink-0 w-28 rounded-lg border-2 p-1.5 transition-all ${
                    i === current ? "border-primary-500 ring-2 ring-primary-200 scale-[1.02] shadow-md" : "border-slate-200 hover:border-primary-300"
                  }`}
                >
                  <div className={`h-12 rounded-md bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white text-lg mb-1`}>
                    {s.icon}
                  </div>
                  <p className="text-[10px] font-bold text-slate-700 truncate text-center">{s.label}</p>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100">
                <button
                  onClick={() => go(-1)}
                  disabled={current === 0}
                  className="p-2 rounded-md text-slate-600 hover:bg-white disabled:opacity-40 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="px-3 py-1 rounded-md bg-white shadow-sm font-black text-sm text-slate-800 mx-1 min-w-[70px] text-center">
                  {current + 1} / {slides.length}
                </span>
                <button
                  onClick={() => go(1)}
                  disabled={current === slides.length - 1}
                  className="p-2 rounded-md text-slate-600 hover:bg-white disabled:opacity-40 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-1 min-w-[min(100%,24rem)] items-center justify-center gap-2 flex-wrap">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="shrink-0 whitespace-nowrap px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 text-white text-sm font-black shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/35 transition flex items-center gap-2 disabled:opacity-70"
                >
                  <svg className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate PPT
                </button>
                <button disabled={slide.type === "empty"} onClick={() => setEditingId((id) => id === slide.id ? null : slide.id)} className="shrink-0 whitespace-nowrap px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-black shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/35 transition flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
                  ✏️ {editingId === slide.id ? "Done Editing" : "Edit Slide"}
                </button>
                <button
                  onClick={() => navigate("/viewer")}
                  className="shrink-0 whitespace-nowrap px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-br from-success-500 to-emerald-600 text-white text-sm font-black shadow-lg shadow-success-500/25 hover:shadow-xl hover:shadow-success-500/35 transition flex items-center gap-2"
                >
                  🔬 Source Evidence
                </button>
                <button
                  onClick={() => navigate("/viva")}
                  className="shrink-0 whitespace-nowrap px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-br from-accent-500 to-pink-600 text-white text-sm font-black shadow-lg shadow-accent-500/25 hover:shadow-xl hover:shadow-accent-500/35 transition flex items-center gap-2"
                >
                  🎤 Viva Me
                </button>
              </div>

              <button onClick={handleDownload} disabled={(!pptArtifact && slides.length <= 1) || exporting} title={!pptArtifact && slides.length <= 1 ? "Generate a presentation or add a slide first" : "Download an editable PowerPoint file"} className="shrink-0 whitespace-nowrap px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white text-sm font-black shadow-lg hover:shadow-xl hover:scale-[1.02] transition flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {exporting ? "Preparing PowerPoint…" : "Download PPTX"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
