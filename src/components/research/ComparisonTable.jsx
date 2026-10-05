const rowOrder = [
  "Title",
  "Authors",
  "Year",
  "Methodology",
  "Dataset",
  "Results",
  "Strengths",
  "Weaknesses",
];

const highlightConfig = {
  best: {
    cell: "bg-success-50 border-l-4 border-l-success-500",
    badge: "bg-success-100 text-success-700",
  },
  good: {
    cell: "bg-primary-50 border-l-4 border-l-primary-500",
    badge: "bg-primary-100 text-primary-700",
  },
  neutral: {
    cell: "",
    badge: "bg-slate-100 text-slate-600",
  },
};

export default function ComparisonTable({ papers = [], bestPerRow = {} }) {
  const validPapers = papers.slice(0, 3);
  const paperCount = validPapers.length;

  if (paperCount < 2) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        </div>
        <h3 className="font-bold text-slate-900 text-lg">Select 2-3 Papers</h3>
        <p className="mt-1 text-sm text-slate-500">Choose at least two papers to begin side-by-side comparison.</p>
      </div>
    );
  }

  const getRowData = (paper, rowKey) => {
    if (!paper || !paper.data) return "—";
    return paper.data[rowKey] || "—";
  };

  const getHighlight = (rowKey, paperIndex) => {
    const bestIndex = bestPerRow[rowKey];
    if (bestIndex === undefined || bestIndex === null) return "neutral";
    if (bestIndex === paperIndex) return "best";
    return "good";
  };

  const paperColors = [
    { bg: "from-primary-500 to-primary-600", chip: "bg-primary-100 text-primary-700", headerBg: "from-primary-50/80 to-primary-100/50" },
    { bg: "from-accent-500 to-accent-600", chip: "bg-accent-100 text-accent-700", headerBg: "from-accent-50/80 to-accent-100/50" },
    { bg: "from-success-500 to-success-600", chip: "bg-success-100 text-success-700", headerBg: "from-success-50/80 to-success-100/50" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr>
              <th className="text-left px-5 py-4 w-44 sticky left-0 z-20 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Criteria
                </span>
              </th>
              {validPapers.map((paper, i) => {
                const color = paperColors[i];
                return (
                  <th
                    key={paper.id || i}
                    className={`text-left px-5 py-4 border-b border-slate-200 bg-gradient-to-r ${color.headerBg}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br ${color.bg} text-white text-[11px] font-black shadow-sm`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${color.chip}`}>
                        Paper {String.fromCharCode(65 + i)}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm leading-tight line-clamp-2">
                      {paper.title || `Paper ${String.fromCharCode(65 + i)}`}
                    </p>
                    {paper.year && (
                      <p className="mt-0.5 text-xs text-slate-500 font-medium">
                        {paper.authors ? `${paper.authors} • ` : ""}{paper.year}
                      </p>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rowOrder.map((rowKey, rowIdx) => {
              const isOdd = rowIdx % 2 === 1;
              return (
                <tr
                  key={rowKey}
                  className={`${isOdd ? "bg-slate-50/40" : "bg-white"} hover:bg-primary-50/20 transition-colors`}
                >
                  <td
                    className={`px-5 py-4 sticky left-0 z-10 font-semibold text-sm text-slate-800 align-top ${isOdd ? "bg-slate-50/90" : "bg-white"}`}
                  >
                    <div className="flex items-center gap-2">
                      {rowKey === "Title" && <span>📄</span>}
                      {rowKey === "Authors" && <span>👥</span>}
                      {rowKey === "Year" && <span>📅</span>}
                      {rowKey === "Methodology" && <span>🔬</span>}
                      {rowKey === "Dataset" && <span>📊</span>}
                      {rowKey === "Results" && <span>🏆</span>}
                      {rowKey === "Strengths" && <span>💪</span>}
                      {rowKey === "Weaknesses" && <span>⚠️</span>}
                      <span>{rowKey}</span>
                    </div>
                  </td>
                  {validPapers.map((paper, paperIdx) => {
                    const highlight = getHighlight(rowKey, paperIdx);
                    const style = highlightConfig[highlight];
                    const value = getRowData(paper, rowKey);
                    return (
                      <td
                        key={`${rowKey}-${paperIdx}`}
                        className={`px-5 py-4 align-top ${style.cell}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            {Array.isArray(value) ? (
                              <ul className="space-y-1">
                                {value.map((item, vi) => (
                                  <li key={vi} className="text-sm text-slate-700 leading-relaxed flex items-start gap-1.5">
                                    <span className="text-slate-400 mt-0.5">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-slate-700 leading-relaxed">
                                {value}
                              </p>
                            )}
                          </div>
                          {highlight === "best" && (
                            <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${style.badge}`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              Best
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-success-50 border-l-4 border-l-success-500" />
          <span className="font-semibold text-slate-600">Best in row</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-primary-50 border-l-4 border-l-primary-500" />
          <span className="font-semibold text-slate-600">Strong alternative</span>
        </div>
        <div className="ml-auto text-slate-500">
          Comparing {paperCount} papers • {rowOrder.length} criteria
        </div>
      </div>
    </div>
  );
}
