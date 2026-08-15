import PdfViewer from "../components/papers/PdfViewer";
import Button from "../components/ui/Button";
import { Link } from "react-router-dom";

export default function PdfViewerPage() {
  const paper = {
    title: "Attention Is All You Need: A Comprehensive Survey of Transformer Architectures",
    authors: ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar", "Jakob Uszkoreit"],
    venue: "NeurIPS 2024",
    year: 2024,
    citations: 15420,
    pages: 42,
    abstract:
      "This paper presents a comprehensive survey of transformer architectures that have revolutionized the field of natural language processing and beyond. We trace the evolution from the original transformer model to modern large language models, covering key architectural innovations, training methodologies, and applications across diverse domains. Our analysis highlights critical design decisions and their empirical impact on model performance...",
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">
                {paper.venue}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">{paper.year}</span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">
                <svg className="w-3.5 h-3.5 inline mr-1 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {paper.citations.toLocaleString()} citations
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">{paper.title}</h1>
            <p className="mt-1.5 text-sm text-slate-500">{paper.authors.join(", ")}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/chat">
              <Button variant="secondary" size="sm"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                }
              >
                Ask AI
              </Button>
            </Link>
            <Link to="/summary">
              <Button size="sm"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                }
              >
                Summary
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Abstract</h3>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed">{paper.abstract}</p>
          </div>
        </div>
      </div>

      <PdfViewer />
    </div>
  );
}
