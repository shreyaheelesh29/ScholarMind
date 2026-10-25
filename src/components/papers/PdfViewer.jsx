import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../api";

function DocumentPageText({ text, title }) {
  const lines = String(text || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const numbered = lines.map((line, index) => {
    const match = line.match(/^(\d{1,2})(?:[.)]\s*(.*)|\s+(.*)|$)$/);
    return match ? { index, number: Number(match[1]), inline: (match[2] || match[3] || "").trim() } : null;
  }).filter(Boolean);
  const isStepSequence = numbered.length >= 2
    && numbered.every((step, index) => step.number === index + 1);

  if (!isStepSequence) {
    return <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-700">{text || "No extracted text is available for this page."}</p>;
  }

  const introLines = lines.slice(0, numbered[0].index).filter((line) => line.toLowerCase() !== String(title || "").toLowerCase());
  const steps = numbered.map((step, index) => {
    const end = numbered[index + 1]?.index ?? lines.length;
    const following = lines.slice(step.index + 1, end);
    const label = step.inline || following.shift() || `Step ${step.number}`;
    return { number: step.number, label, details: following };
  });

  return <div className="mt-5 space-y-4">
    {introLines.length > 0 && <p className="text-sm leading-7 text-slate-600">{introLines.join(" · ")}</p>}
    <ol className="space-y-3" aria-label="Numbered steps">
      {steps.map((step) => <li key={step.number} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-sm">{step.number}</span>
        <div className="min-w-0 pt-1">
          <h3 className="font-semibold leading-6 text-slate-900">{step.label}</h3>
          {step.details.length > 0 && <div className="mt-1 space-y-1 text-sm leading-6 text-slate-600">{step.details.map((detail, index) => <p key={index}>{detail}</p>)}</div>}
        </div>
      </li>)}
    </ol>
  </div>;
}

export default function PdfViewer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paperId = searchParams.get("paperId");
  const requestedPage = Number.parseInt(searchParams.get("page") || "1", 10);
  const [paper, setPaper] = useState(null);
  const [pdfIndex, setPdfIndex] = useState({ contents: [], pages: [] });
  const [annotations, setAnnotations] = useState([]);
  const [pdfUrl, setPdfUrl] = useState("");
  const [currentPage, setCurrentPage] = useState(Number.isFinite(requestedPage) ? requestedPage : 1);
  const [zoom, setZoom] = useState(100);
  const [error, setError] = useState("");
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const [annotationKind, setAnnotationKind] = useState("note");
  const [annotationPage, setAnnotationPage] = useState("1");
  const [annotationContent, setAnnotationContent] = useState("");
  const [annotationError, setAnnotationError] = useState("");
  const [savingAnnotation, setSavingAnnotation] = useState(false);

  useEffect(() => {
    if (!paperId) {
      setPaper(null);
      setPdfIndex({ contents: [], pages: [] });
      setAnnotations([]);
      setPdfUrl("");
      setError("");
      return undefined;
    }

    let cancelled = false;
    let objectUrl = "";
    setPaper(null);
    setPdfIndex({ contents: [], pages: [] });
    setAnnotations([]);
    setPdfUrl("");
    setError("");

    const loadPaper = async () => {
      try {
        const [details, annotationData] = await Promise.all([
          apiFetch(`/papers/${encodeURIComponent(paperId)}`),
          apiFetch(`/papers/${encodeURIComponent(paperId)}/annotations`),
        ]);
        const index = await apiFetch(`/papers/${encodeURIComponent(paperId)}/index`);
        if (details.file_type === ".pdf") {
          const response = await fetch(`/api/papers/${encodeURIComponent(paperId)}/file`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("scholarmind_token") || ""}` },
          });
          if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(result.detail || "Could not load this PDF.");
          }
          objectUrl = URL.createObjectURL(await response.blob());
        }
        if (!cancelled) {
          setPaper(details);
          setAnnotations(annotationData.annotations || []);
          setCurrentPage(Math.min(Math.max(requestedPage, 1), details.page_count || 1));
          setPdfIndex(index);
          setPdfUrl(objectUrl);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || "Could not load this PDF.");
      }
    };

    loadPaper();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [paperId]);

  const totalPages = paper?.page_count || 0;
  const isPdf = paper?.file_type === ".pdf";
  const goToPage = (value) => {
    const page = Math.min(Math.max(Number.parseInt(value, 10) || 1, 1), totalPages || 1);
    setCurrentPage(page);
    setSearchParams((previous) => {
      previous.set("page", String(page));
      return previous;
    }, { replace: true });
  };

  const openAnnotationForm = () => {
    setAnnotationPage(String(currentPage));
    setAnnotationContent("");
    setAnnotationError("");
    setShowAnnotationForm(true);
  };

  const saveAnnotation = async (event) => {
    event.preventDefault();
    const pageNumber = Number.parseInt(annotationPage, 10);
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > totalPages) {
      setAnnotationError(`Choose a page from 1 to ${totalPages}.`);
      return;
    }
    setSavingAnnotation(true);
    setAnnotationError("");
    try {
      const result = await apiFetch(`/papers/${encodeURIComponent(paperId)}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_number: pageNumber, kind: annotationKind, content: annotationContent }),
      });
      setAnnotations((items) => [result.annotation, ...items]);
      setShowAnnotationForm(false);
      setAnnotationContent("");
      goToPage(pageNumber);
    } catch (saveError) {
      setAnnotationError(saveError.message || "Could not save this annotation.");
    } finally {
      setSavingAnnotation(false);
    }
  };

  const removeAnnotation = async (annotationId) => {
    try {
      await apiFetch(`/papers/${encodeURIComponent(paperId)}/annotations/${encodeURIComponent(annotationId)}`, { method: "DELETE" });
      setAnnotations((items) => items.filter((item) => item.id !== annotationId));
    } catch (deleteError) {
      setAnnotationError(deleteError.message || "Could not delete this annotation.");
    }
  };

  if (!paperId) {
    return <div className="grid min-h-[60vh] place-items-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <div><h1 className="text-xl font-semibold text-slate-900">Choose a paper to view</h1><p className="mt-2 text-sm text-slate-500">Open a paper from your library to see its actual PDF pages here.</p><Link className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white" to="/papers">Go to My Papers</Link></div>
    </div>;
  }

  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}<div className="mt-3"><Link to="/papers" className="font-semibold underline">Back to My Papers</Link></div></div>;
  if (!paper || (isPdf && !pdfUrl)) return <p className="p-6 text-sm text-slate-500" role="status">Loading document…</p>;

  return <section className="flex h-[calc(100vh-8rem)] min-h-[500px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
      <div className="min-w-0"><Link to="/papers" className="text-xs font-medium text-indigo-600 hover:underline">My Papers</Link><h1 className="truncate font-semibold text-slate-900">{paper.filename}</h1></div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1} className="rounded border px-2 py-1 text-sm disabled:opacity-40" aria-label="Previous page">←</button>
        <label className="flex items-center gap-1 text-sm text-slate-600"><span className="sr-only">PDF page</span><input type="number" min="1" max={totalPages} value={currentPage} onChange={(event) => goToPage(event.target.value)} className="w-16 rounded border border-slate-300 px-2 py-1 text-center"/><span>/ {totalPages}</span></label>
        <button type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages} className="rounded border px-2 py-1 text-sm disabled:opacity-40" aria-label="Next page">→</button>
        <span className="mx-1 h-6 border-l" />
        <button type="button" onClick={() => setZoom((value) => Math.max(50, value - 10))} className="rounded border px-2 py-1 text-sm" aria-label="Zoom out">−</button>
        <span className="w-12 text-center text-sm text-slate-600">{zoom}%</span>
        <button type="button" onClick={() => setZoom((value) => Math.min(200, value + 10))} className="rounded border px-2 py-1 text-sm" aria-label="Zoom in">+</button>
        {isPdf && <a href={`${pdfUrl}#page=${currentPage}&zoom=${zoom}`} target="_blank" rel="noreferrer" className="ml-1 rounded bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">Open PDF</a>}
      </div>
    </header>
    <div className="flex min-h-0 flex-1">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white" aria-label="PDF index">
        <div className="border-b border-slate-100 px-4 py-3"><h2 className="text-sm font-semibold text-slate-800">Contents</h2><p className="mt-0.5 text-xs text-slate-500">Jump to a topic or page</p></div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {pdfIndex.contents.length > 0 && <nav aria-label="Topics" className="space-y-0.5">{pdfIndex.contents.map((item, i) => <button key={`${item.page}-${item.title}-${i}`} type="button" onClick={() => goToPage(item.page)} title={`Go to page ${item.page}`} className={`flex w-full items-start justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${currentPage === item.page ? "bg-indigo-50 font-semibold text-indigo-700" : "text-slate-700 hover:bg-slate-50"}`} style={{ paddingLeft: `${10 + Math.min(item.level || 0, 4) * 12}px` }}><span className="line-clamp-2">{item.title}</span><span className="shrink-0 text-slate-400">{item.page}</span></button>)}</nav>}
          <div className="mb-1 mt-4 border-t border-slate-100 pt-3"><h3 className="px-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Pages</h3></div>
          <nav aria-label={isPdf ? "All PDF pages" : "All document pages"} className="space-y-0.5">{pdfIndex.pages.map((item) => <button key={item.page} type="button" onClick={() => goToPage(item.page)} className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${currentPage === item.page ? "bg-indigo-50 font-semibold text-indigo-700" : "text-slate-700 hover:bg-slate-50"}`}><span className="line-clamp-1">{item.title || `Page ${item.page}`}</span><span className="shrink-0 text-slate-400">{item.page}</span></button>)}</nav>
          <section className="mt-4 border-t border-slate-100 pt-3" aria-label="Saved notes and highlights">
            <div className="flex items-center justify-between gap-2 px-2.5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Notes & highlights</h3>
              <button type="button" onClick={openAnnotationForm} className="rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100">+ Add</button>
            </div>
            {annotationError && !showAnnotationForm && <p role="alert" className="mx-2.5 mt-2 text-xs text-red-700">{annotationError}</p>}
            {showAnnotationForm && <form onSubmit={saveAnnotation} className="mx-1 mt-2 space-y-2 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
              <div className="flex items-center justify-between gap-2"><label htmlFor="annotation-page" className="text-xs font-medium text-slate-700">PDF page</label><input id="annotation-page" type="number" min="1" max={totalPages} value={annotationPage} onChange={(event) => setAnnotationPage(event.target.value)} className="w-16 rounded border border-slate-300 px-2 py-1 text-right text-xs" /></div>
              <div className="flex rounded-md bg-white p-1"><button type="button" onClick={() => setAnnotationKind("note")} className={`flex-1 rounded px-2 py-1 text-xs ${annotationKind === "note" ? "bg-indigo-100 font-semibold text-indigo-700" : "text-slate-600"}`}>Note</button><button type="button" onClick={() => setAnnotationKind("highlight")} className={`flex-1 rounded px-2 py-1 text-xs ${annotationKind === "highlight" ? "bg-amber-100 font-semibold text-amber-800" : "text-slate-600"}`}>Highlight</button></div>
              <label className="sr-only" htmlFor="annotation-content">{annotationKind === "highlight" ? "Text to highlight" : "Your note"}</label>
              <textarea id="annotation-content" required maxLength={5000} rows={3} value={annotationContent} onChange={(event) => setAnnotationContent(event.target.value)} placeholder={annotationKind === "highlight" ? "Paste the passage you want to highlight…" : "Write a note for this page…"} className="w-full resize-y rounded-md border border-slate-200 bg-white p-2 text-xs outline-none focus:border-indigo-400" />
              {annotationError && <p role="alert" className="text-xs text-red-700">{annotationError}</p>}
              <div className="flex justify-end gap-2"><button type="button" onClick={() => { setShowAnnotationForm(false); setAnnotationError(""); }} className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-white">Cancel</button><button type="submit" disabled={savingAnnotation || !annotationContent.trim()} className="rounded bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50">{savingAnnotation ? "Saving…" : "Save"}</button></div>
            </form>}
            {annotations.length === 0 ? <p className="px-2.5 py-3 text-xs text-slate-400">Save a note or passage for quick reference.</p> : <ul className="mt-2 space-y-1">{annotations.map((annotation) => <li key={annotation.id} className={`group flex items-start gap-1 rounded-lg p-2 ${annotation.kind === "highlight" ? "bg-amber-50" : "hover:bg-slate-50"}`}><button type="button" onClick={() => goToPage(annotation.page_number)} className="min-w-0 flex-1 text-left" title={`Go to page ${annotation.page_number}`}><span className={`text-[10px] font-semibold uppercase ${annotation.kind === "highlight" ? "text-amber-800" : "text-indigo-700"}`}>{annotation.kind === "highlight" ? "Highlight" : "Note"} · p. {annotation.page_number}</span><span className="mt-1 block line-clamp-3 text-xs text-slate-700">{annotation.content}</span></button><button type="button" onClick={() => removeAnnotation(annotation.id)} aria-label={`Delete ${annotation.kind} on page ${annotation.page_number}`} className="rounded px-1 text-slate-400 opacity-0 hover:bg-white hover:text-red-600 group-hover:opacity-100 focus:opacity-100">×</button></li>)}</ul>}
          </section>
        </div>
      </aside>
      {isPdf ? <iframe key={`${pdfUrl}-${currentPage}-${zoom}`} title={`PDF viewer: ${paper.filename}`} src={`${pdfUrl}#page=${currentPage}&zoom=${zoom}`} className="min-h-0 min-w-0 flex-1 bg-slate-100" /> : <article className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-slate-50 p-6" aria-label={`Document page ${currentPage}`}>
        <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{paper.file_type?.replace(".", "").toUpperCase() || "DOCUMENT"} · Page / slide {currentPage} of {totalPages}</p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">{pdfIndex.pages[currentPage - 1]?.title || `Page ${currentPage}`}</h2>
          <DocumentPageText text={pdfIndex.pages[currentPage - 1]?.text} title={pdfIndex.pages[currentPage - 1]?.title} />
          <p className="mt-6 border-t border-slate-100 pt-3 text-xs text-slate-500">Text extracted from the uploaded file. Original layout and images are not shown in this viewer.</p>
        </div>
      </article>}
    </div>
  </section>;
}
