import { useState } from "react";

function StarRating({ score, max = 10 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(max)].map((_, i) => {
        const filled = i < Math.round(score);
        const half = !filled && i < score && i >= score - 0.5;
        return (
          <svg
            key={i}
            className={`w-4 h-4 ${filled ? "text-accent-500" : half ? "text-accent-300" : "text-slate-200"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      })}
    </div>
  );
}

function FeasibilityBar({ score }) {
  const color =
    score >= 80
      ? "from-success-500 to-success-400"
      : score >= 60
      ? "from-warning-500 to-warning-400"
      : "from-error-500 to-error-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-full`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-black text-slate-700 w-8 text-right">{score}</span>
    </div>
  );
}

export default function ResearchIdeaCard({ idea, onSave }) {
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSave = () => {
    setSaved(!saved);
    if (onSave) onSave(idea);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 group">
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {(idea.field || ["General"]).map((f, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-[11px] font-bold uppercase tracking-wide"
              >
                {f}
              </span>
            ))}
          </div>
          <button
            onClick={handleSave}
            className={`p-2 rounded-lg border transition flex-shrink-0 ${saved ? "bg-primary-50 border-primary-200 text-primary-600" : "border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-primary-600 hover:border-primary-200"}`}
            title={saved ? "Remove bookmark" : "Bookmark idea"}
          >
            <svg className="w-4 h-4" fill={saved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>

        <h3 className="font-bold text-lg text-slate-900 leading-snug group-hover:text-primary-700 transition mb-3">
          {idea.title}
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Novelty</span>
            </div>
            <StarRating score={idea.noveltyScore || idea.novelty / 10} />
            <p className="mt-1 text-xs text-slate-500">
              <span className="font-black text-accent-600">{idea.noveltyScore || Math.round(idea.novelty / 10)}</span>
              <span className="text-slate-400"> / 10</span>
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Feasibility</span>
            </div>
            <FeasibilityBar score={idea.feasibilityScore || idea.feasibility} />
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-4">{idea.description}</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-success-50 to-white border border-success-100">
            <div className="flex items-center gap-1.5 mb-1.5">
              <svg className="w-3.5 h-3.5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <p className="text-[10px] font-black uppercase tracking-wider text-success-700">Estimated Impact</p>
            </div>
            <p className="text-xs font-bold text-slate-800 leading-snug">{idea.estimatedImpact || "High — Top-tier venue potential"}</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-warning-50 to-white border border-warning-100">
            <div className="flex items-center gap-1.5 mb-1.5">
              <svg className="w-3.5 h-3.5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-[10px] font-black uppercase tracking-wider text-warning-700">Resources</p>
            </div>
            <p className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">{idea.requiredResources || idea.resources || "Standard compute setup"}</p>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="text-xs font-black uppercase tracking-wider text-primary-700">Methodology Sketch</p>
            </div>
            <ul className="space-y-2">
              {(idea.methodologySketch || idea.methods || []).map((step, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-gradient-to-br from-primary-500 to-accent-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100">
          {idea.targetVenue && (
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span className="text-xs font-semibold text-slate-600">{idea.targetVenue}</span>
            </div>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 ml-auto"
          >
            {expanded ? "Hide Details" : "View Methodology"}
            <svg className={`w-3.5 h-3.5 transition ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2">
        <button
          onClick={handleSave}
          className={`px-4 py-2 rounded-lg text-sm font-bold border transition flex items-center gap-1.5 ${saved ? "bg-primary-50 border-primary-200 text-primary-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-primary-300 hover:text-primary-700"}`}
        >
          <svg className="w-4 h-4" fill={saved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          {saved ? "Bookmarked" : "Bookmark"}
        </button>
      </div>
    </div>
  );
}
