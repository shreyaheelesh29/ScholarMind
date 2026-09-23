import { useState, useRef, useEffect } from "react";

export default function Citation({ number, paperId, paperTitle, authors, page, section, year, excerpt }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const popoverRef = useRef(null);
  const badgeRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        badgeRef.current &&
        !badgeRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const viewSource = async () => {
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    try {
      const response = await fetch(`/api/papers/${paperId}/file`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("scholarmind_token") || ""}` },
      });
      if (!response.ok) throw new Error("Could not open this source paper");
      const url = URL.createObjectURL(await response.blob());
      if (tab) tab.location.href = `${url}#page=${page || 1}`;
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      if (tab) tab.close();
      setError(err.message);
    }
  };

  const copyCitation = async () => {
    try {
      await navigator.clipboard.writeText(`${paperTitle || "Source paper"}, p. ${page || "?"}${excerpt ? `\n\n${excerpt}` : ""}`);
      setError("Citation copied");
    } catch {
      setError("Could not copy citation");
    }
  };

  return (
    <span className="relative inline-flex items-center">
      <button
        ref={badgeRef}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center min-w-[22px] h-[18px] px-1.5 rounded-md bg-primary-100 text-primary-700 font-semibold text-[11px] align-top leading-none border border-primary-200 hover:bg-primary-500 hover:text-white hover:border-primary-500 transition-all cursor-pointer shadow-sm hover:shadow-md"
      >
        [{number}]
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute z-50 left-0 top-full mt-2 w-80 rounded-xl bg-white border border-slate-200 shadow-xl shadow-slate-200/60 overflow-hidden animate-fade-in"
        >
          <div className="bg-gradient-to-r from-primary-500 to-accent-500 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-white/80 uppercase tracking-wider">Source Reference</p>
                <p className="text-sm font-bold text-white mt-0.5">Citation [{number}]</p>
              </div>
            </div>

            {excerpt && <div className="rounded-lg border border-primary-100 bg-primary-50/60 p-3"><p className="text-[11px] font-semibold uppercase tracking-wider text-primary-700">Retrieved passage</p><p className="mt-1 max-h-28 overflow-auto text-xs leading-relaxed text-slate-700">{excerpt}</p></div>}
            {error && <p className="text-xs text-slate-500">{error}</p>}
          </div>

          <div className="p-4 space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Paper Title</p>
              <p className="text-sm font-semibold text-slate-900 leading-snug">{paperTitle || "Unknown Paper"}</p>
            </div>

            {authors && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Authors</p>
                <p className="text-xs text-slate-600 leading-relaxed">{authors}</p>
              </div>
            )}

            <div className="flex items-center gap-4 pt-1">
              {page && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-xs font-medium text-slate-700">Page {page}</span>
                </div>
              )}
              {section && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  <span className="text-xs font-medium text-slate-700 truncate max-w-[140px]">{section}</span>
                </div>
              )}
              {year && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-medium text-slate-700">{year}</span>
                </div>
              )}
            </div>
          </div>

          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button onClick={viewSource} className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View in PDF
            </button>
            <button onClick={copyCitation} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </button>
          </div>
        </div>
      )}
    </span>
  );
}
