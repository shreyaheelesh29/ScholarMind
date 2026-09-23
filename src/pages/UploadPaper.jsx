import { useState } from "react";
import { apiFetch } from "../api";
import UploadZone from "../components/papers/UploadZone";
import Button from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";

export default function UploadPaper() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFilesSelected = (files) => {
    const newFiles = files.map((f) => ({
      id: Date.now() + Math.random(),
      file: f,
      name: f.name,
      size: f.size,
      progress: 0,
      status: "queued",
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);

    newFiles.forEach((nf) => uploadToBackend(nf));
  };

  const uploadToBackend = async (upload) => {
    setUploading(true);
    setUploadedFiles((prev) => prev.map((f) =>
      f.id === upload.id ? { ...f, progress: 25, status: "uploading" } : f
    ));
    try {
      const body = new FormData();
      body.append("file", upload.file);
      const result = await apiFetch("/papers/upload", { method: "POST", body });
      setUploadedFiles((prev) => prev.map((f) => f.id === upload.id ? {
        ...f, paperId: result.paper_id, progress: 100, status: "processed", chunkCount: result.total_chunks
      } : f));
    } catch (error) {
      setUploadedFiles((prev) => prev.map((f) =>
        f.id === upload.id ? { ...f, status: "failed", error: error.message } : f
      ));
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (id) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const statusInfo = {
    queued: { color: "bg-slate-100 text-slate-600", label: "Queued" },
    uploading: { color: "bg-primary-100 text-primary-700", label: "Uploading" },
    processing: { color: "bg-warning-100 text-warning-700", label: "Processing" },
    processed: { color: "bg-success-100 text-success-700", label: "Ready" },
    failed: { color: "bg-red-100 text-red-700", label: "Failed" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Upload Papers</h1>
          <p className="mt-1 text-slate-500">Upload PDF documents to analyze with AI</p>
        </div>
        {uploadedFiles.some((f) => f.status === "processed") && (
          <Button
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
          >
            Start Analysis
          </Button>
        )}
      </div>

      <UploadZone onFilesSelected={handleFilesSelected} />

      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upload Queue</CardTitle>
                <CardDescription>{uploadedFiles.length} file(s) in queue</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUploadedFiles([])}
              >
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {uploadedFiles.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 truncate">{f.name}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusInfo[f.status].color}`}>
                      {statusInfo[f.status].label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatSize(f.size)} · {Math.round(f.progress)}%
                  </p>
                  {(f.status === "uploading" || f.status === "processing") && (
                    <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          f.status === "processing"
                            ? "bg-warning-500 animate-pulse-soft"
                            : "bg-primary-500"
                        }`}
                        style={{ width: `${f.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => removeFile(f.id)}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: "📄", title: "Smart Parsing", desc: "Automatically extracts text, tables, and citations from PDFs" },
          { icon: "🧠", title: "AI Indexing", desc: "Papers are indexed and ready for chat-based Q&A immediately" },
          { icon: "🔍", title: "Full-Text Search", desc: "Search across all uploaded papers instantly with context" },
        ].map((f) => (
          <Card key={f.title}>
            <CardContent>
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
