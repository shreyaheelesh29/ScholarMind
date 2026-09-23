import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ArtifactGenerator from "../components/research/ArtifactGenerator";

const keyInsights = [
  {
    icon: "🧠",
    title: "Novel Architecture Paradigm",
    detail:
      "Replaces recurrent and convolutional layers entirely with a self-attention mechanism, enabling unprecedented parallelization during training.",
    color: "primary",
  },
  {
    icon: "⚡",
    title: "Multi-Head Attention",
    detail:
      "8 parallel attention heads allow the model to learn diverse representation subspaces, capturing different linguistic relationships simultaneously.",
    color: "accent",
  },
  {
    icon: "📈",
    title: "State-of-the-Art Translation",
    detail:
      "Achieves 28.4 BLEU on WMT 2014 En-De (+2.0 over previous best) and 41.0 BLEU on En-Fr while training 3x faster than seq2seq baselines.",
    color: "success",
  },
  {
    icon: "🔓",
    title: "Scalability Without Depth Limits",
    detail:
      "Residual connections with layer normalization allow stable training of 6-layer encoder/decoder stacks without vanishing gradient issues.",
    color: "warning",
  },
  {
    icon: "🌐",
    title: "Foundation for Modern NLP",
    detail:
      "Directly inspired BERT, GPT, ViT, and nearly all subsequent large language models — arguably the most influential paper of the decade.",
    color: "primary",
  },
];

const keyFindings = [
  { label: "BLEU En-De", value: "28.4", suffix: "", delta: "+2.0 SOTA", tone: "success" },
  { label: "BLEU En-Fr", value: "41.0", suffix: "", delta: "New SOTA", tone: "success" },
  { label: "Training Time", value: "3.5", suffix: " days", delta: "8 GPUs", tone: "primary" },
  { label: "Parameters", value: "65", suffix: "M", delta: "Base model", tone: "accent" },
];

const limitations = [
  "Quadratic memory and compute cost with respect to sequence length, restricting applicability to very long documents (e.g., full books).",
  "Sinusoidal positional encodings do not generalize to sequence lengths longer than those seen during training — relative positional schemes later addressed this.",
  "No inherent recurrence or convolutional inductive bias means the model requires very large datasets to learn structural priors that CNNs/RNNs get for free.",
  "Encoder-decoder cross-attention is expensive for long target sequences; later work (GPT) moved to decoder-only to simplify training at scale.",
];

const futureWork = [
  "Efficient approximations to self-attention (e.g., sparse attention, linear attention) to unlock sub-quadratic scaling for long-context applications.",
  "Exploring multi-modal extensions combining vision, audio, and text within a single Transformer backbone with shared attention weights.",
  "Investigating better positional encoding schemes — learnable, rotary, or ALiBi — to improve length extrapolation without retraining.",
  "Applying the pure-attention paradigm to symbolic domains such as theorem proving, program synthesis, and structured prediction.",
];

export default function PaperSummary() {
  const navigate = useNavigate();
  const [selectedPaper, setSelectedPaper] = useState("transformer");
  const [copied, setCopied] = useState(false);

  const papers = [
    { id: "transformer", title: "Attention Is All You Need", authors: "Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin", venue: "NeurIPS 2017", tags: ["Transformers", "Attention", "Machine Translation", "NLP"] },
  ];

  const paper = papers.find((p) => p.id === selectedPaper);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    document.getElementById("paper-summary-generator")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const insightColorMap = {
    primary: { bg: "bg-primary-50", border: "border-primary-200", iconBg: "bg-primary-100 text-primary-700", title: "text-primary-900" },
    accent: { bg: "bg-accent-50", border: "border-accent-200", iconBg: "bg-accent-100 text-accent-700", title: "text-accent-900" },
    success: { bg: "bg-success-50", border: "border-success-200", iconBg: "bg-success-100 text-success-700", title: "text-success-800" },
    warning: { bg: "bg-warning-50", border: "border-warning-200", iconBg: "bg-warning-100 text-warning-700", title: "text-warning-800" },
  };

  const toneMap = {
    success: "from-success-500 to-success-600",
    primary: "from-primary-500 to-primary-600",
    accent: "from-accent-500 to-accent-600",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-medium text-primary-600">AI Research Analysis</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Paper Summary</h1>
          <p className="mt-2 text-slate-500">
            Comprehensive AI-generated summary with key insights, methodology, and actionable takeaways.
          </p>
        </div>
        <select
          value={selectedPaper}
          onChange={(e) => setSelectedPaper(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition"
        >
          <option value="transformer">Attention Is All You Need</option>
          <option value="bert">BERT: Pre-training of Deep Bidirectional Transformers</option>
          <option value="resnet">Deep Residual Learning for Image Recognition</option>
        </select>
      </div>

      <ArtifactGenerator id="paper-summary-generator" kinds={["summary", "report"]} heading="Generate a summary or report from an uploaded paper" />

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-primary-50/50 via-white to-accent-50/40 p-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg shadow-primary-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
              {paper?.title}
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-800">{paper?.authors}</span>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 text-primary-700 font-semibold">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {paper?.venue}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 font-medium">98,523 citations</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 font-medium">15 pages</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {paper?.tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-sm"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-200/70 flex flex-wrap gap-2.5">
          <button
            onClick={handleRegenerate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold text-sm shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition disabled:opacity-70"
            disabled={regenerating}
          >
            <svg
              className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Generate from my paper
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 transition"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
          <button
            onClick={() => navigate("/comparison")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-accent-600 to-accent-500 text-white font-semibold text-sm shadow-lg shadow-accent-500/25 hover:shadow-xl hover:shadow-accent-500/30 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            Compare
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md shadow-primary-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">AI-Generated Summary</h3>
              <p className="text-xs text-slate-500">Distilled from full paper text by ScholarMind AI</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-50 text-success-700 text-xs font-bold uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
            Ready
          </span>
        </div>

        <div className="p-6 space-y-6">
          <div className="rounded-xl bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-100/70 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary-600 text-white text-xs font-black shadow-sm">
                TL
              </span>
              <h4 className="font-bold text-slate-900 text-base">TL;DR</h4>
            </div>
            <p className="text-slate-700 leading-relaxed font-medium">
              The Transformer replaces recurrence and convolutions with pure self-attention, achieving SOTA on
              WMT translation while enabling massive parallelism. Its multi-head attention mechanism and
              encoder-decoder architecture laid the foundational blueprint for GPT, BERT, and virtually every
              modern large language model that followed.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
                💡
              </div>
              <h4 className="font-bold text-slate-900 text-base">Key Insights</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {keyInsights.map((insight, i) => {
                const c = insightColorMap[insight.color];
                return (
                  <div
                    key={i}
                    className={`rounded-xl border ${c.border} ${c.bg} p-4 hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg ${c.iconBg} flex items-center justify-center text-lg flex-shrink-0 shadow-sm`}>
                        {insight.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className={`font-bold ${c.title} text-sm leading-tight`}>
                          {insight.title}
                        </h5>
                        <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                          {insight.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {keyFindings.map((f) => (
              <div
                key={f.label}
                className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 hover:border-primary-200 hover:shadow-md transition"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{f.label}</p>
                <div className="mt-1.5 flex items-baseline gap-1">
                  <span className={`text-2xl font-black bg-gradient-to-br ${toneMap[f.tone]} bg-clip-text text-transparent`}>
                    {f.value}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">{f.suffix}</span>
                </div>
                <p className="mt-1 text-xs font-semibold text-success-600">{f.delta}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-accent-100 text-accent-700 flex items-center justify-center">
                🔬
              </div>
              <h4 className="font-bold text-slate-900 text-base">Methodology Summary</h4>
            </div>
            <div className="text-sm text-slate-700 leading-relaxed space-y-3">
              <p>
                The model adopts a canonical <strong>encoder-decoder structure</strong>, but replaces all
                recurrent and convolutional layers with stacked self-attention and point-wise, fully connected
                layers. The encoder comprises 6 identical layers, each with two sub-layers: a{" "}
                <em>multi-head self-attention mechanism</em> and a simple position-wise fully connected
                feed-forward network. Residual connections wrap each sub-layer, followed by layer normalization:
                <code className="mx-1 px-1.5 py-0.5 rounded bg-white border border-slate-200 text-xs font-mono text-slate-700">
                  LayerNorm(x + Sublayer(x))
                </code>
                .
              </p>
              <p>
                The decoder mirrors the encoder stack but inserts a third sub-layer performing{" "}
                <strong>multi-head cross-attention</strong> over the encoder output. Scaled dot-product attention
                computes attention scores as{" "}
                <code className="mx-1 px-1.5 py-0.5 rounded bg-white border border-slate-200 text-xs font-mono text-slate-700">
                  Attention(Q,K,V) = softmax(QK^T/√d_k)V
                </code>
                , with the √d_k scaling factor preventing dot-product saturation for large dimensions.
                Multi-head attention projects queries, keys, and values through <em>h = 8</em> learned linear
                projections, concatenates the results, and projects once more — letting the model jointly attend
                to information from different representation subspaces at different positions.
              </p>
              <p>
                Since the model contains no recurrence or convolution, <strong>sinusoidal positional
                encodings</strong> are injected at the inputs of both encoder and decoder to imbue sequence order
                information. The authors also experiment with learned positional embeddings, finding nearly
                identical results. Training uses the Adam optimizer with a carefully designed learning-rate
                warmup-and-decay schedule, label smoothing, and dropout on attention weights and sub-layer
                outputs for regularization.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-success-100 text-success-700 flex items-center justify-center">
                🔑
              </div>
              <h4 className="font-bold text-slate-900 text-base">Key Findings</h4>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-700">
              {[
                "Self-attention alone is sufficient for strong sequence modeling — recurrence and convolution are not inductive biases the model strictly requires.",
                "Multi-head attention with 8 heads consistently outperforms single-head attention, even when controlling for total compute.",
                "The Transformer generalizes well to English constituency parsing with minimal task-specific tuning, suggesting broad applicability beyond translation.",
                "Increasing model depth (N=6) and width (d_model=512, d_ff=2048) yields monotonic improvements without training instability.",
                "Training on WMT 2014 En-De converges in 3.5 days on 8 NVIDIA P100 GPUs — an order-of-magnitude wall-clock improvement over competitive seq2seq baselines.",
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 shadow-sm">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-warning-200 bg-gradient-to-br from-warning-50 to-amber-50/40 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-warning-100 text-warning-700 flex items-center justify-center">
                ⚠️
              </div>
              <h4 className="font-bold text-slate-900 text-base">Limitations</h4>
            </div>
            <ul className="space-y-2 text-sm text-slate-700">
              {limitations.map((l, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-1 text-warning-600 font-bold text-xs">▸</span>
                  <span className="leading-relaxed">{l}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-primary-200 bg-gradient-to-br from-primary-50 via-white to-accent-50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center shadow-sm">
                🚀
              </div>
              <h4 className="font-bold text-slate-900 text-base">Suggested Future Work</h4>
            </div>
            <ul className="space-y-2 text-sm text-slate-700">
              {futureWork.map((w, i) => (
                <li key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/60 border border-primary-100/60 hover:bg-white transition">
                  <span className="mt-0.5 w-6 h-6 rounded-md bg-primary-100 text-primary-700 text-[11px] font-black flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
