import { useState } from "react";
import PaperCard from "../components/papers/PaperCard";
import Button from "../components/ui/Button";
import { Link } from "react-router-dom";

const papers = [
  {
    id: 1,
    title: "Attention Is All You Need: A Comprehensive Survey of Transformer Architectures",
    authors: ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar"],
    year: 2024,
    pages: 42,
    field: "Machine Learning",
    tags: ["Transformers", "NLP", "Attention"],
    status: "processed",
  },
  {
    id: 2,
    title: "Deep Learning for Medical Image Analysis: Recent Advances and Future Directions",
    authors: ["Sarah Chen", "Michael Zhang"],
    year: 2024,
    pages: 28,
    field: "Computer Vision",
    tags: ["Medical Imaging", "CNN", "Deep Learning"],
    status: "processed",
  },
  {
    id: 3,
    title: "Large Language Models in Scientific Research: Opportunities and Challenges",
    authors: ["Emily Johnson", "David Williams", "Lisa Park", "Raj Patel"],
    year: 2025,
    pages: 35,
    field: "Natural Language Processing",
    tags: ["LLM", "Research", "AI Ethics"],
    status: "processed",
  },
  {
    id: 4,
    title: "Reinforcement Learning for Autonomous Systems in Dynamic Environments",
    authors: ["James Wilson", "Maria Garcia"],
    year: 2024,
    pages: 51,
    field: "Robotics",
    tags: ["RL", "Autonomy", "Control"],
    status: "processing",
  },
  {
    id: 5,
    title: "Graph Neural Networks: A Comprehensive Review on Methodologies and Applications",
    authors: ["Alex Kim", "Sophie Brown"],
    year: 2023,
    pages: 64,
    field: "Machine Learning",
    tags: ["GNN", "Graphs", "Survey"],
    status: "processed",
  },
  {
    id: 6,
    title: "Federated Learning: Privacy-Preserving Machine Learning at Scale",
    authors: ["Tom Anderson", "Julia Lee"],
    year: 2024,
    pages: 22,
    field: "Machine Learning",
    tags: ["Federated", "Privacy", "Distributed"],
    status: "pending",
  },
];

export default function PapersList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedField, setSelectedField] = useState("All");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState("grid");

  const fields = ["All", "Machine Learning", "Computer Vision", "Natural Language Processing", "Robotics"];

  const filtered = papers.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authors.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesField = selectedField === "All" || p.field === selectedField;
    return matchesSearch && matchesField;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Papers</h1>
          <p className="mt-1 text-slate-500">{filtered.length} paper(s) in your library</p>
        </div>
        <Link to="/upload">
          <Button
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Upload New Paper
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[280px] relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, or tag..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <select
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 outline-none"
          >
            {fields.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 outline-none"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Title (A-Z)</option>
            <option value="cited">Most Cited</option>
          </select>

          <div className="flex items-center rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition ${
                viewMode === "grid" ? "bg-white shadow-sm text-primary-600" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition ${
                viewMode === "list" ? "bg-white shadow-sm text-primary-600" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No papers found</h3>
          <p className="mt-2 text-slate-500">Try adjusting your search or filters, or upload a new paper.</p>
          <Link to="/upload" className="mt-5 inline-block">
            <Button>Upload a Paper</Button>
          </Link>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
              : "space-y-3"
          }
        >
          {filtered.map((paper) =>
            viewMode === "grid" ? (
              <PaperCard key={paper.id} paper={paper} />
            ) : (
              <div
                key={paper.id}
                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-white hover:shadow-md hover:border-primary-200 transition"
              >
                <div className="w-14 h-16 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{paper.title}</h3>
                  <p className="text-sm text-slate-500 truncate">{paper.authors.join(", ")} · {paper.year}</p>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    {paper.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-medium">{t}</span>
                    ))}
                  </div>
                </div>
                <Link to="/viewer" className="px-3 py-2 rounded-lg bg-primary-50 text-primary-700 text-sm font-semibold hover:bg-primary-100 transition">Open</Link>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
