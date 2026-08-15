import { Link } from "react-router-dom";

export default function PaperCard({ paper }) {
  const statusColors = {
    processed: "bg-success-100 text-success-700",
    processing: "bg-warning-100 text-warning-700",
    pending: "bg-slate-100 text-slate-600",
    error: "bg-error-100 text-error-700",
  };

  const statusLabels = {
    processed: "Processed",
    processing: "Processing...",
    pending: "Pending",
    error: "Error",
  };

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white hover:shadow-lg hover:border-primary-200 transition-all overflow-hidden">
      <Link to="/viewer" className="block">
        <div className="relative h-40 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center p-6 group-hover:from-primary-50 group-hover:to-accent-50/50 transition">
          <div className="w-16 h-20 rounded-md bg-white shadow-md border border-slate-200 flex flex-col items-center justify-center">
            <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="mt-1 text-[10px] font-bold text-slate-400">PDF</span>
          </div>
          <span className="absolute top-3 right-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusColors[paper.status]}`}>
              {statusLabels[paper.status]}
            </span>
          </span>
        </div>
      </Link>

      <div className="p-5">
        <Link to="/viewer" className="block">
          <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-primary-600 transition">
            {paper.title}
          </h3>
          <p className="mt-1.5 text-sm text-slate-500 line-clamp-1">
            {paper.authors?.join(", ") || "Unknown authors"}
          </p>
        </Link>

        <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{paper.year}</span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{paper.pages} pgs</span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span>{paper.field}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {paper.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
          <Link
            to="/summary" className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary-50 text-primary-700 text-xs font-semibold hover:bg-primary-100 transition">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Summary
          </Link>
          <Link
            to="/chat"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Chat
          </Link>
          <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
