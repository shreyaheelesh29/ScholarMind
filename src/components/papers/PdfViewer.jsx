import { useState } from "react";

export default function PdfViewer() {
  const [currentPage, setCurrentPage] = useState(5);
  const [totalPages] = useState(42);
  const [zoom, setZoom] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("outline");

  const outline = [
    { id: 1, title: "1. Introduction", page: 1, children: [
      { id: 2, title: "1.1 Background", page: 2 },
      { id: 3, title: "1.2 Problem Statement", page: 3 },
      { id: 4, title: "1.3 Contributions", page: 4 },
    ]},
    { id: 5, title: "2. Related Work", page: 5, children: [
      { id: 6, title: "2.1 Deep Learning", page: 6 },
      { id: 7, title: "2.2 Transformer Models", page: 8 },
      { id: 8, title: "2.3 Large Language Models", page: 10 },
    ]},
    { id: 9, title: "3. Methodology", page: 12, children: [
      { id: 10, title: "3.1 Dataset", page: 13 },
      { id: 11, title: "3.2 Model Architecture", page: 15 },
      { id: 12, title: "3.3 Training Setup", page: 18 },
    ]},
    { id: 13, title: "4. Experiments", page: 20 },
    { id: 14, title: "5. Results and Discussion", page: 28 },
    { id: 15, title: "6. Conclusion", page: 38 },
    { id: 16, title: "References", page: 40 },
  ];

  const bookmarks = [
    { id: 1, title: "Key Definition 3.2", page: 15, desc: "Proposed architecture details" },
    { id: 2, title: "Table 4.2", page: 25, desc: "Main results comparison" },
    { id: 3, title: "Figure 5.1", page: 32, desc: "Ablation study visualization" },
  ];

  const searchResults = [
    { id: 1, page: 3, snippet: "Our main contribution is the novel approach to..." },
    { id: 2, page: 8, snippet: "Transformer models have shown remarkable ability to..." },
    { id: 3, page: 15, snippet: "The architecture combines the strengths of both..." },
    { id: 4, page: 25, snippet: "Results demonstrate significant improvement over..." },
  ];

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="h-[calc(100vh-4rem-3rem)] flex border border-slate-200 rounded-2xl bg-white overflow-hidden">
      <div className="w-72 border-r border-slate-200 flex flex-col">
        <div className="flex border-b border-slate-200">
          {[
            { id: "outline", label: "Outline", icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            )},
            { id: "bookmarks", label: "Bookmarks", icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            )},
            { id: "search", label: "Search", icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )},
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setSidebarTab(tab.id); if (tab.id === "search") setSearchOpen(true); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition ${
                sidebarTab === tab.id
                  ? "text-primary-600 border-primary-500"
                  : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {sidebarTab === "outline" && (
            <div className="p-3">
              {outline.map((item) => (
                <div key={item.id}>
                  <button
                    onClick={() => goToPage(item.page)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition ${
                      currentPage >= item.page && (!item.children || currentPage < (outline[outline.indexOf(item) + 1]?.page || totalPages + 1))
                        ? "bg-primary-50 text-primary-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate">{item.title}</span>
                    <span className="text-xs text-slate-400 ml-2 flex-shrink-0">{item.page}</span>
                  </button>
                  {item.children && (
                    <div className="ml-4 border-l border-slate-100">
                      {item.children.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => goToPage(child.page)}
                          className={`w-full flex items-center justify-between pl-4 pr-3 py-1.5 rounded-r-lg text-left text-xs transition ${
                            currentPage === child.page
                              ? "bg-primary-50 text-primary-700 font-semibold"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span className="truncate">{child.title}</span>
                          <span className="text-slate-400 ml-2 flex-shrink-0">{child.page}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {sidebarTab === "bookmarks" && (
            <div className="p-3 space-y-2">
              {bookmarks.map((b) => (
                <button
                  key={b.id}
                  onClick={() => goToPage(b.page)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-left hover:border-primary-200 hover:bg-primary-50/50 transition group"
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-primary-700">{b.title}</p>
                    <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">p.{b.page}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{b.desc}</p>
                </button>
              ))}
              <button className="w-full p-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-primary-400 hover:text-primary-600 text-sm font-medium transition">
                + Add Bookmark
              </button>
            </div>
          )}

          {sidebarTab === "search" && (
            <div className="p-3">
              <div className="relative mb-3">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in document..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
              <div className="space-y-1">
                {searchQuery && searchResults.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => goToPage(r.page)}
                    className="w-full p-3 rounded-lg text-left hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-primary-600">Page {r.page}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{r.snippet}</p>
                  </button>
                ))}
                {!searchQuery && (
                  <p className="text-center text-sm text-slate-400 py-8">
                    Type to search within the paper
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-100">
        <div className="h-12 border-b border-slate-200 bg-white flex items-center justify-between px-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-1 text-sm">
              <input
                type="number"
                value={currentPage}
                onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                className="w-12 px-2 py-1 rounded border border-slate-200 text-center text-slate-900 outline-none focus:border-primary-400"
              />
              <span className="text-slate-400 mx-1">/</span>
              <span className="text-slate-600 font-medium">{totalPages}</span>
            </div>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="w-12 text-center text-sm text-slate-600 font-medium">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <div className="w-px h-6 bg-slate-200 mx-2" />
            <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8 flex items-start justify-center">
          <div
            className="bg-white shadow-xl rounded-sm"
            style={{ width: `${(612 * zoom) / 100}px`, height: `${(792 * zoom) / 100}px` }}
          >
            <div className="h-full w-full p-12 flex flex-col">
              <h2 className="text-xl font-bold text-slate-900 mb-6">2. Related Work</h2>
              <p className="text-sm leading-relaxed text-slate-700 mb-4">
                <span className="font-semibold">2.1 Deep Learning.</span> In recent years, deep learning has revolutionized the field of artificial intelligence, enabling breakthroughs across various domains including computer vision, natural language processing, and speech recognition. The success of deep neural networks can be attributed to their ability to learn hierarchical representations from large-scale datasets...
              </p>
              <p className="text-sm leading-relaxed text-slate-700 mb-4">
                Convolutional Neural Networks (CNNs) have been the dominant architecture for visual recognition tasks since the seminal work of Krizhevsky et al. (2012). Their hierarchical feature extraction capabilities, combined with weight sharing and pooling operations, make them particularly well-suited for grid-structured data such as images.
              </p>
              <p className="text-sm leading-relaxed text-slate-700 mb-4">
                <span className="font-semibold">2.2 Transformer Models.</span> The transformer architecture, introduced by Vaswani et al. (2017), marked a paradigm shift in sequence modeling. By replacing recurrent connections with self-attention mechanisms, transformers achieved superior performance while enabling significantly more parallelization during training.
              </p>
              <div className="my-6 p-4 bg-slate-50 border-l-4 border-primary-500 rounded-r-lg">
                <p className="text-xs font-semibold text-primary-700 mb-1">Key Insight</p>
                <p className="text-xs text-slate-600 italic">
                  "Attention is all you need" — the foundational insight that enabled scalable sequence modeling without recurrence.
                </p>
              </div>
              <p className="text-sm leading-relaxed text-slate-700">
                Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions, capturing diverse linguistic relationships within the input sequence.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
