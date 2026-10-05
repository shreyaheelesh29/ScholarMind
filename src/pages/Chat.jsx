import { useState } from "react";
import { Link } from "react-router-dom";
import ChatWindow from "../components/chat/ChatWindow";

export default function Chat() {
  const [selectedPaper] = useState({
    id: "p1",
    title: "Attention Is All You Need",
    authors: "Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Lukasz Kaiser, Illia Polosukhin",
    year: 2017,
    venue: "NeurIPS",
    arxivId: "1706.03762",
    pages: 11,
  });

  const quickSuggestions = [
    {
      label: "Summarize this paper",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      query: "Provide a comprehensive summary of this paper, including its key contributions, methodology, and main findings.",
    },
    {
      label: "What's the methodology?",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      query: "Explain the research methodology used in this paper in detail. What experimental setup, datasets, and evaluation metrics were used?",
    },
    {
      label: "Compare with BERT paper",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
      query: "Compare this paper with the BERT paper (Devlin et al., 2019). What are the key differences in architecture, training approach, and use cases?",
    },
    {
      label: "Find limitations",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      query: "Identify and discuss the limitations and weaknesses of this research. What aspects could be improved in future work?",
    },
  ];

  const handleSuggestionClick = (query) => {
    // In a real app, this would inject the query into ChatWindow's input and trigger send
    console.log("Quick suggestion clicked:", query);
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col gap-4 animate-fade-in">
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-primary-50 via-white to-accent-50">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-primary-500/20">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-accent-100 text-accent-700">
                  Active Paper Context
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-primary-100 text-primary-700">
                  {selectedPaper.venue} {selectedPaper.year}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                  arXiv:{selectedPaper.arxivId}
                </span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 leading-snug">{selectedPaper.title}</h1>
              <p className="text-xs text-slate-500 mt-1.5 line-clamp-1">
                <span className="font-medium text-slate-600">Authors:</span> {selectedPaper.authors}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                to="/viewer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-primary-600 hover:border-primary-200 transition text-xs font-semibold"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View PDF
              </Link>
              <Link
                to="/summary"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 transition text-xs font-semibold"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Summary
              </Link>
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Quick Research Suggestions</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quickSuggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(s.query)}
                className="group flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-primary-200 hover:bg-primary-50/50 hover:shadow-md hover:shadow-primary-500/10 transition text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-primary-100 flex items-center justify-center flex-shrink-0 transition">
                  <span className="text-slate-500 group-hover:text-primary-600 transition">{s.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-primary-700 transition leading-tight">
                    {s.label}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-primary-500 transition">
                    Click to ask
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ChatWindow />
      </div>
    </div>
  );
}
