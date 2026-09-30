import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../api";

export default function PdfViewer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paperId = searchParams.get("paperId");
  const requestedPage = Number.parseInt(searchParams.get("page") || "1", 10);
  const [paper, setPaper] = useState(null);
  const [pdfIndex, setPdfIndex] = useState({ contents: [], pages: [] });
  const [pdfUrl, setPdfUrl] = useState("");
  const [currentPage, setCurrentPage] = useState(Number.isFinite(requestedPage) ? requestedPage : 1);
  const [zoom, setZoom] = useState(100);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!paperId) {
      setPaper(null);
      setPdfIndex({ contents: [], pages: [] });
      setPdfUrl("");
      setError("");
      return undefined;
    }

    let cancelled = false;
    let objectUrl = "";
    setPaper(null);
    setPdfIndex({ contents: [], pages: [] });
    setPdfUrl("");
    setError("");

    const loadPaper = async () => {
      try {
        const [details, index, response] = await Promise.all([
          apiFetch(`/papers/${encodeURIComponent(paperId)}`),
          apiFetch(`/papers/${encodeURIComponent(paperId)}/index`),
          fetch(`/api/papers/${encodeURIComponent(paperId)}/file`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("scholarmind_token") || ""}` },
          }),
        ]);
        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.detail || "Could not load this PDF.");
        }
        objectUrl = URL.createObjectURL(await response.blob());
        if (!cancelled) {
          setPaper(details);
          setPdfIndex(index);
          setCurrentPage(Math.min(Math.max(requestedPage, 1), details.page_count || 1));
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
  const goToPage = (value) => {
    const page = Math.min(Math.max(Number.parseInt(value, 10) || 1, 1), totalPages || 1);
    setCurrentPage(page);
    setSearchParams((previous) => {
      previous.set("page", String(page));
      return previous;
    }, { replace: true });
  };

  if (!paperId) {
    return <div className="grid min-h-[60vh] place-items-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <div><h1 className="text-xl font-semibold text-slate-900">Choose a paper to view</h1><p className="mt-2 text-sm text-slate-500">Open a paper from your library to see its actual PDF pages here.</p><Link className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white" to="/papers">Go to My Papers</Link></div>
    </div>;
  }

  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}<div className="mt-3"><Link to="/papers" className="font-semibold underline">Back to My Papers</Link></div></div>;
  if (!paper || !pdfUrl) return <p className="p-6 text-sm text-slate-500" role="status">Loading PDF…</p>;

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
        <a href={`${pdfUrl}#page=${currentPage}&zoom=${zoom}`} target="_blank" rel="noreferrer" className="ml-1 rounded bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">Open PDF</a>
      </div>
    </header>
    <div className="flex min-h-0 flex-1">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white" aria-label="PDF index">
        <div className="border-b border-slate-100 px-4 py-3"><h2 className="text-sm font-semibold text-slate-800">Contents</h2><p className="mt-0.5 text-xs text-slate-500">Jump to a topic or page</p></div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {pdfIndex.contents.length > 0 && <nav aria-label="Topics" className="space-y-0.5">{pdfIndex.contents.map((item, i) => <button key={`${item.page}-${item.title}-${i}`} type="button" onClick={() => goToPage(item.page)} title={`Go to page ${item.page}`} className={`flex w-full items-start justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${currentPage === item.page ? "bg-indigo-50 font-semibold text-indigo-700" : "text-slate-700 hover:bg-slate-50"}`} style={{ paddingLeft: `${10 + Math.min(item.level || 0, 4) * 12}px` }}><span className="line-clamp-2">{item.title}</span><span className="shrink-0 text-slate-400">{item.page}</span></button>)}</nav>}
          <div className="mb-1 mt-4 border-t border-slate-100 pt-3"><h3 className="px-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Pages</h3></div>
          <nav aria-label="All PDF pages" className="space-y-0.5">{pdfIndex.pages.map((item) => <button key={item.page} type="button" onClick={() => goToPage(item.page)} className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${currentPage === item.page ? "bg-indigo-50 font-semibold text-indigo-700" : "text-slate-700 hover:bg-slate-50"}`}><span className="line-clamp-1">{item.title}</span><span className="shrink-0 text-slate-400">{item.page}</span></button>)}</nav>
        </div>
      </aside>
      <iframe key={`${pdfUrl}-${currentPage}-${zoom}`} title={`PDF viewer: ${paper.filename}`} src={`${pdfUrl}#page=${currentPage}&zoom=${zoom}`} className="min-h-0 min-w-0 flex-1 bg-slate-100" />
    </div>
  </section>;
}
