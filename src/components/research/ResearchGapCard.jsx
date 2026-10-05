import { useState } from "react";

const severityStyles = {
  High: "bg-error-50 text-error-700 border-error-200",
  Medium: "bg-warning-50 text-warning-700 border-warning-200",
  Low: "bg-success-50 text-success-700 border-success-200",
};

const severityDot = {
  High: "bg-error-500",
  Medium: "bg-warning-500",
  Low: "bg-success-500",
};

export default function ResearchGapCard({ gap, onExplore, onSave, onShare }) {
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSave = () => {
    setSaved(!saved);
    if (onSave) onSave(gap);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 group">
      <div className="p-6 pb-5">
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${severityStyles[gap.severity]}`}>
              <span className={`w-2 h-2 rounded-full ${severityDot[gap.severity]}`} />
              {gap.severity}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wide">
              {gap.domain || "General"}
            </span>
            {gap.recency && (
              <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-bold uppercase tracking-wide">
                {gap.recency}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSave}
              className={`p-2 rounded-lg border transition ${saved ? "bg-primary-50 border-primary-200 text-primary-600" : "border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-primary-600 hover:border-primary-200"}`}
              title={saved ? "Unsave" : "Save gap"}
            >
              <svg className="w-4 h-4" fill={saved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
            <button
              onClick={() => onShare && onShare(gap)}
              className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-primary-600 hover:border-primary-200 transition"
              title="Share"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>

        <h3 className="font-bold text-lg text-slate-900 leading-snug group-hover:text-primary-700 transition">
          {gap.title}
        </h3>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          {gap.description}
        </p>

        <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-primary-50 via-white to-accent-50 border border-primary-100/70">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs font-black uppercase tracking-wider text-primary-700">Why It Matters</p>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{gap.whyItMatters}</p>
        </div>

        {expanded && (
          <div className="mt-4 space-y-4 animate-fade-in">
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-base">🚀</span>
                <p className="text-xs font-black uppercase tracking-wider text-accent-700">Potential Approaches</p>
              </div>
              <ul className="space-y-2">
                {(gap.potentialApproaches || []).map((approach, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2.5 pl-1">
                    <span className="w-5 h-5 rounded-md bg-gradient-to-br from-accent-500 to-primary-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {approach}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs font-semibold">
              {gap.relatedPapersCount || 0} related paper{gap.relatedPapersCount !== 1 ? "s" : ""}
            </span>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            {expanded ? "Show Less" : "Show More"}
            <svg className={`w-3.5 h-3.5 transition ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {gap.published && (
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {gap.published}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onExplore && onExplore(gap)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-bold shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 hover:scale-[1.02] transition-all flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Explore
          </button>
          <button
            onClick={handleSave}
            className={`px-4 py-2 rounded-lg text-sm font-bold border transition ${saved ? "bg-primary-50 border-primary-200 text-primary-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-primary-300 hover:text-primary-700"}`}
          >
            {saved ? "Saved" : "Save"}
          </button>
          <button
            onClick={() => onShare && onShare(gap)}
            className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 hover:border-primary-300 hover:text-primary-700 transition flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
