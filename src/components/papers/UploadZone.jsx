import { useCallback, useState } from "react";

export default function UploadZone({ onFilesSelected, className = "" }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateAndProcess = useCallback(
    (files) => {
      setError("");
      const pdfFiles = Array.from(files).filter((f) => {
        const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
        if (!isPdf) {
          setError(`File "${f.name}" is not a PDF. Only PDF files are supported.`);
          return false;
        }
        if (f.size > 100 * 1024 * 1024) {
          setError(`File "${f.name}" exceeds 100MB size limit.`);
          return false;
        }
        return true;
      });
      if (pdfFiles.length > 0 && onFilesSelected) {
        onFilesSelected(pdfFiles);
      }
    },
    [onFilesSelected]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      validateAndProcess(e.dataTransfer.files);
    },
    [validateAndProcess]
  );

  const handleFileInput = useCallback(
    (e) => {
      validateAndProcess(e.target.files);
      e.target.value = "";
    },
    [validateAndProcess]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative rounded-2xl border-2 border-dashed p-10 transition-all text-center cursor-pointer ${
        isDragging
          ? "border-primary-500 bg-primary-50 scale-[1.01]"
          : error
          ? "border-slate-300 bg-white hover:border-primary-400 hover:bg-primary-50/50"
          : "border-slate-300 bg-white hover:border-primary-400 hover:bg-primary-50/50"
      } ${className}`}
    >
      <label className="flex flex-col items-center cursor-pointer">
        <div
          className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 transition ${
            isDragging ? "bg-primary-500/20" : "bg-primary-100"
          }`}
        >
          <svg
            className={`w-10 h-10 transition ${
              isDragging ? "text-primary-600" : "text-primary-500"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <h3 className="text-xl font-bold text-slate-900">
          {isDragging ? "Drop your PDFs here" : "Drop your PDFs here or click to browse"}
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Upload research papers up to 100MB each · PDF format supported
        </p>

        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Batch upload
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success-50 text-success-700 text-xs font-medium">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Fast processing
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-50 text-accent-700 text-xs font-medium">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Secure storage
          </span>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-error-50 border border-error-100 text-error-600 px-4 py-2 text-sm">
            {error}
          </div>
        )}

        <input
          type="file"
          multiple
          accept=".pdf,application/pdf"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </label>
    </div>
  );
}
