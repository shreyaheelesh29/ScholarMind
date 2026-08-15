const statusConfig = {
  pending: {
    label: "Pending",
    className: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  },
  processing: {
    label: "Processing",
    className: "bg-warning-50 text-warning-600",
    dot: "bg-warning-500 animate-pulse",
  },
  complete: {
    label: "Complete",
    className: "bg-success-50 text-success-600",
    dot: "bg-success-500",
  },
  error: {
    label: "Error",
    className: "bg-error-50 text-error-600",
    dot: "bg-error-500",
  },
};

export default function AnalysisCard({
  icon,
  title,
  description,
  status = "pending",
  actions = [],
}) {
  const statusStyle = statusConfig[status] || statusConfig.pending;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:shadow-slate-200/60 transition-all duration-300 overflow-hidden group">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-md shadow-primary-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <span className="text-white text-xl">{icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold text-slate-900 text-lg leading-tight truncate">
                {title}
              </h3>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide flex-shrink-0 ${statusStyle.className}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                {statusStyle.label}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-3">
              {description}
            </p>
          </div>
        </div>
      </div>

      {actions && actions.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-2">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                action.variant === "primary"
                  ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30"
                  : action.variant === "accent"
                  ? "bg-gradient-to-r from-accent-600 to-accent-500 text-white shadow-md shadow-accent-500/20 hover:shadow-lg"
                  : action.variant === "ghost"
                  ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  : "border border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300"
              }`}
            >
              {action.icon && <span className="text-base">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
