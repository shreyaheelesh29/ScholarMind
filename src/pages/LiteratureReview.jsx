import { useState } from "react";
import ArtifactGenerator from "../components/research/ArtifactGenerator";

const paperLibrary = [
  { id: 1, title: "Attention Is All You Need", authors: "Vaswani et al.", year: 2017, venue: "NeurIPS", citations: "98K", selected: true, tags: ["Architecture"] },
  { id: 2, title: "BERT: Pre-training of Deep Bidirectional Transformers", authors: "Devlin et al.", year: 2018, venue: "NAACL", citations: "92K", selected: true, tags: ["Pre-training"] },
  { id: 3, title: "Language Models are Few-Shot Learners (GPT-3)", authors: "Brown et al.", year: 2020, venue: "NeurIPS", citations: "57K", selected: true, tags: ["Scaling"] },
  { id: 4, title: "Exploring the Limits of Transfer Learning (T5)", authors: "Raffel et al.", year: 2019, venue: "JMLR", citations: "23K", selected: true, tags: ["Pre-training"] },
  { id: 5, title: "An Image is Worth 16x16 Words (ViT)", authors: "Dosovitskiy et al.", year: 2020, venue: "ICLR", citations: "41K", selected: false, tags: ["Architecture", "Vision"] },
  { id: 6, title: "Deep Residual Learning for Image Recognition", authors: "He et al.", year: 2015, venue: "CVPR", citations: "180K", selected: false, tags: ["Architecture"] },
  { id: 7, title: "Training Language Models to Follow Instructions (InstructGPT)", authors: "Ouyang et al.", year: 2022, venue: "NeurIPS", citations: "12K", selected: true, tags: ["Alignment"] },
  { id: 8, title: "LoRA: Low-Rank Adaptation of Large Language Models", authors: "Hu et al.", year: 2021, venue: "ICLR", citations: "18K", selected: true, tags: ["Efficiency"] },
];

const thematicSubsections = [
  {
    title: "Architectural Paradigms: From Recurrence to Pure Attention",
    body: `The period 2015-2017 established two foundational principles that underpin nearly all subsequent work. First, He et al. (2015) demonstrated that residual skip connections allow the stable training of networks far deeper than was previously feasible, directly inspiring the residual sub-layer design in every Transformer variant. Second, Vaswani et al. (2017) audaciously replaced all recurrent and convolutional inductive biases with pure self-attention, proving that parallel attention heads alone are a sufficient computational primitive for sequence transduction. This architectural contribution is the conceptual backbone on which BERT, GPT-3, T5, and ViT all build — each varying only the depth, width, training objective, and modality of inputs.

A particularly instructive cross-paper comparison emerges in the treatment of positional encodings. The original Transformer opted for fixed sinusoidal encodings and showed nearly identical results with learned positional embeddings; later work including T5 adopted relative positional biases, while ViT treated positional information as learned tokens prepended to the patch sequence. This diversity of approaches suggests that, counterintuitively, the precise mechanism for injecting order information is less critical than ensuring the model has access to some positional signal at all.`,
    keyPapers: ["Vaswani et al. 2017", "He et al. 2015", "Dosovitskiy et al. 2020"],
  },
  {
    title: "Pre-training Objectives: Autoregressive, Masked, and Unified Text-to-Text",
    body: `Post-2017, the community rapidly converged on the Transformer skeleton and turned its attention to the question of pre-training objectives — arguably the axis that now determines model behavior more than architectural details. Two orthogonal paradigms emerged. Devlin et al. (2018) introduced BERT with bidirectional Masked Language Modeling (MLM), corrupting a fraction of input tokens and training the model to reconstruct them, thereby enabling deep bidirectional representations that proved transformative for Natural Language Understanding (NLU) benchmarks. Concurrently, the GPT line pursued autoregressive next-token prediction in a decoder-only stack, which sacrifices bidirectionality but enables clean, scalable generation.

Raffel et al. (2019) took a different approach entirely with T5, framing every NLP task — from translation to summarization to classification — as a unified text-to-text problem. This simplification is conceptually elegant: task-specific prompts and output formats absorb the structural differences between benchmarks, and a single training objective (teacher-forced next-token prediction) applies universally. The T5 suite produced the largest and most systematic ablation study at the time, quantifying the impact of architectural choices, dataset mixtures, and training compute. Its results remain a reference calibration point for any new NLP system.`,
    keyPapers: ["Devlin et al. 2018", "Raffel et al. 2019"],
  },
  {
    title: "Scaling Laws and Emergent Capabilities",
    body: `Brown et al. (2020) pushed the decoder-only Transformer to 175 billion parameters and made a striking observation: many capabilities that are absent in smaller models emerge discontinuously once scale crosses a threshold. These few-shot, one-shot, and zero-shot abilities — including arithmetic, translation, and multi-step reasoning — cannot easily be predicted by extrapolating smaller-model loss curves. This result fundamentally reshaped the field's research priorities: rather than searching for incremental architectural tweaks, the community now treats raw scale, data quality, and training stability as first-class research variables.

An important caveat, however, is the widening accessibility gap. The Transformer and BERT are reproducible on modest compute budgets; GPT-3's estimated $4.6M training cost places it beyond the reach of nearly all academic institutions. This tension between capability and reproducibility remains one of the central open problems in the field and has motivated the efficiency techniques discussed below.`,
    keyPapers: ["Brown et al. 2020", "Hu et al. 2021"],
  },
  {
    title: "Alignment, Adaptation, and Efficiency at the Frontier",
    body: `Two more recent directions address the practical consequences of large-scale models. Ouyang et al. (2022) introduced Reinforcement Learning from Human Feedback (RLHF) to fine-tune InstructGPT, demonstrating that raw next-token prediction can produce fluent yet unhelpful outputs and that a modest budget of human preference labels bridges the capability-usability gap dramatically. This technique is now the standard recipe for production conversational systems.

On the efficiency side, Hu et al. (2021) proposed Low-Rank Adaptation (LoRA), which freezes the full pretrained weights and injects small trainable low-rank matrices into each transformer layer. LoRA reduces the number of trainable parameters by orders of magnitude while matching full fine-tuning quality on language modeling, translation, and instruction tuning. This democratizing contribution is the most actively adopted adaptation technique in 2024-era open-source LLM tooling and represents a crucial counterpoint to the scaling-only agenda: frontier research need not be the exclusive domain of organizations with warehouse-scale compute.`,
    keyPapers: ["Ouyang et al. 2022", "Hu et al. 2021"],
  },
];

const timelineEvents = [
  { year: "2015", title: "Residual Networks", paper: "He et al. (CVPR)", description: "Skip connections enable 152+ layer networks, solving the deep-training vanishing-gradient problem that had stymied the field for years." },
  { year: "2017", title: "Transformer Architecture", paper: "Vaswani et al. (NeurIPS)", description: "Attention is all you need — the paradigm shift that eliminates recurrence from state-of-the-art sequence models and unlocks massive parallelism." },
  { year: "2018", title: "BERT Revolution", paper: "Devlin et al. (NAACL)", description: "Bidirectional Masked Language Modeling sweeps NLU benchmarks and establishes the pretrain-then-fine-tune workflow as the default NLP paradigm." },
  { year: "2019", title: "T5: Unified Text-to-Text", paper: "Raffel et al. (JMLR)", description: "Frames every task as text-in/text-out; massive ablation study quantifies how data, scale, and objective each contribute to final performance." },
  { year: "2020", title: "GPT-3 & ViT: Scale & Cross-Domain", paper: "Brown et al. / Dosovitskiy et al.", description: "Emergent few-shot abilities at 175B parameters; meanwhile Vision Transformers prove attention conquers vision, too." },
  { year: "2021", title: "Parameter-Efficient Fine-Tuning", paper: "Hu et al. (ICLR — LoRA)", description: "Low-rank adapters make it feasible to fine-tune billion-scale models on a single consumer GPU, democratizing frontier research." },
  { year: "2022", title: "RLHF Alignment", paper: "Ouyang et al. (NeurIPS — InstructGPT)", description: "Human preference reward models close the gap between fluent next-token samplers and genuinely helpful, instruction-following assistants." },
];

const references = [
  "[1] He, K., Zhang, X., Ren, S., & Sun, J. (2016). Deep residual learning for image recognition. Proceedings of the IEEE conference on computer vision and pattern recognition, 770–778.",
  "[2] Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, L., & Polosukhin, I. (2017). Attention is all you need. Advances in neural information processing systems, 30.",
  "[3] Devlin, J., Chang, M. W., Lee, K., & Toutanova, K. (2018). BERT: Pre-training of deep bidirectional transformers for language understanding. arXiv preprint arXiv:1810.04805.",
  "[4] Raffel, C., Shazeer, N., Roberts, A., Lee, K., Narang, S., Matena, M., Zhou, Y., Li, W., & Liu, P. J. (2020). Exploring the limits of transfer learning with a unified text-to-text transformer. J. Mach. Learn. Res., 21(140), 1–67.",
  "[5] Dosovitskiy, A., Beyer, L., Kolesnikov, A., Weissenborn, D., Zhai, X., Unterthiner, T., Dehghani, M., Minderer, M., Heigold, G., Gelly, S., et al. (2020). An image is worth 16x16 words: Transformers for image recognition at scale. arXiv preprint arXiv:2010.11929.",
  "[6] Brown, T. B., Mann, B., Ryder, N., Subbiah, M., Kaplan, J., Dhariwal, P., Neelakantan, A., Shyam, P., Sastry, G., Askell, A., et al. (2020). Language models are few-shot learners. Advances in neural information processing systems, 33, 1877–1901.",
  "[7] Hu, E. J., Shen, Y., Wallis, P., Allen-Zhu, Z., Li, Y., Wang, S., & Chen, W. (2021). LoRA: Low-rank adaptation of large language models. arXiv preprint arXiv:2106.09685.",
  "[8] Ouyang, L., Wu, J., Jiang, X., Almeida, D., Wainwright, C., Mishkin, P., Zhang, C., Agarwal, S., Slama, K., Ray, A., et al. (2022). Training language models to follow instructions with human feedback. Advances in Neural Information Processing Systems, 35, 27730–27744.",
];

export default function LiteratureReview() {
  const [topic, setTopic] = useState("The Evolution of Transformer Architectures: From Attention Mechanisms to Scalable Language Models");
  const [papers, setPapers] = useState(paperLibrary);
  const [searchQuery, setSearchQuery] = useState("");
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  const togglePaper = (id) => {
    setPapers(papers.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p)));
  };

  const selectAll = () => {
    setPapers(papers.map((p) => ({ ...p, selected: true })));
  };

  const clearAll = () => {
    setPapers(papers.map((p) => ({ ...p, selected: false })));
  };

  const selectedCount = papers.filter((p) => p.selected).length;
  const filtered = papers.filter(
    (p) =>
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authors.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.join(" ").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const tags = ["Architecture", "Pre-training", "Scaling", "Alignment", "Efficiency", "Vision"];

  const exportFormats = [
    { id: "pdf", label: "Export as PDF", icon: "📕", detail: "Formatted manuscript with figures" },
    { id: "docx", label: "Export as DOCX", icon: "📘", detail: "Editable Microsoft Word format" },
    { id: "bibtex", label: "Export BibTeX", icon: "📑", detail: "BibTeX citation entries only" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <ArtifactGenerator id="literature-review-generator" kinds={["literature_review"]} multiPaper heading="Generate a literature review across your uploaded papers" />
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-medium text-primary-600">AI Research Analysis</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Literature Review Generator</h1>
          <p className="mt-2 text-slate-500">
            Synthesize multiple papers into a structured, thematically-organized review with AI assistance.
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => setExportDropdownOpen((o) => !o)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Review
            <svg className={`w-4 h-4 transition-transform ${exportDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {exportDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 p-2 z-20">
              {exportFormats.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setExportDropdownOpen(false)}
                  className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-primary-50/50 text-left transition"
                >
                  <span className="text-2xl">{f.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800">{f.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{f.detail}</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Papers Selected", value: String(selectedCount), total: ` / ${papers.length}`, icon: "📚", tone: "primary" },
          { label: "Themes Identified", value: "4", icon: "🎯", tone: "accent" },
          { label: "Time Span", value: "2015-2022", icon: "📅", tone: "success" },
          { label: "Total Citations", value: "520K+", icon: "⭐", tone: "warning" },
        ].map((s, i) => {
          const toneMap = {
            primary: "from-primary-500 to-primary-600",
            accent: "from-accent-500 to-accent-600",
            success: "from-success-500 to-success-600",
            warning: "from-warning-500 to-warning-600",
          };
          return (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-lg hover:shadow-slate-200/50 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
                  <p className="mt-2 flex items-baseline gap-0.5">
                    <span className={`text-3xl font-black bg-gradient-to-br ${toneMap[s.tone]} bg-clip-text text-transparent tabular-nums`}>
                      {s.value}
                    </span>
                    {s.total && <span className="text-sm font-bold text-slate-400">{s.total}</span>}
                  </p>
                </div>
                <div className="text-3xl">{s.icon}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Review Topic</h3>
                <p className="text-xs text-slate-500">Set the focus and scope of your synthesis</p>
              </div>
            </div>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={4}
              placeholder="e.g., Transformer architectures from 2015-2023 with a focus on scaling laws and efficiency..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-sm text-slate-800 leading-relaxed outline-none focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition resize-none"
            />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-primary-100 hover:text-primary-700 text-xs font-semibold text-slate-600 cursor-pointer transition"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-accent-100 text-accent-700 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Select Papers</h3>
                    <p className="text-xs text-slate-500">{selectedCount} of {papers.length} selected</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={selectAll} className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-primary-100 hover:text-primary-700 text-[11px] font-bold text-slate-600 transition">
                    All
                  </button>
                  <button onClick={clearAll} className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-error-50 hover:text-error-600 text-[11px] font-bold text-slate-600 transition">
                    None
                  </button>
                </div>
              </div>

              <div className="mt-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search library..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition"
                />
              </div>
            </div>

            <div className="max-h-[440px] overflow-y-auto">
              {filtered.map((p) => (
                <label
                  key={p.id}
                  className={`flex items-start gap-3 px-5 py-3.5 border-b border-slate-100 cursor-pointer transition last:border-b-0 ${
                    p.selected ? "bg-primary-50/40 hover:bg-primary-50/70" : "hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={p.selected}
                    onChange={() => togglePaper(p.id)}
                    className="mt-0.5 w-4.5 h-4.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold leading-tight truncate ${p.selected ? "text-primary-900" : "text-slate-800"}`}>
                      {p.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px]">
                      <span className="font-semibold text-slate-500">{p.authors}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500">{p.venue} {p.year}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-bold text-primary-600">{p.citations} cites</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {p.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wide"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/60">
              <button
                onClick={() => document.getElementById("literature-review-generator")?.scrollIntoView({ behavior: "smooth", block: "center" })}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-bold text-sm shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate from uploaded papers →
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="px-7 py-6 border-b border-slate-100 bg-gradient-to-r from-primary-50/60 via-white to-accent-50/60">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-md shadow-primary-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary-600">AI-Generated Literature Review</p>
                  <h2 className="mt-0.5 text-xl font-black text-slate-900 leading-tight">{topic}</h2>
                  <p className="text-xs text-slate-500 mt-1">Generated just now • {selectedCount} sources • 6 major sections</p>
                </div>
              </div>
            </div>

            <div className="p-7 space-y-8 text-slate-700 leading-relaxed">
              <section>
                <h3 className="text-lg font-black text-slate-900 border-l-4 border-primary-500 pl-4 mb-3">
                  1. Introduction
                </h3>
                <p className="text-sm leading-relaxed">
                  The field of deep learning has undergone a seismic methodological shift since 2017, when Vaswani et al.
                  proposed the Transformer — a pure attention-based architecture that dispensed entirely with the
                  recurrent and convolutional layers that had dominated sequence modeling for a decade. In the intervening
                  years, variants of this skeleton have not only conquered nearly every benchmark in natural language
                  processing but have also displaced task-specific designs in computer vision, speech, biology, and
                  reinforcement learning. This literature review synthesizes {selectedCount} highly-cited papers spanning
                  2015–2022, tracing four interconnected research themes: architectural paradigms, pre-training
                  objectives, scaling laws and emergent capabilities, and the complementary efficiency-alignment agenda
                  that has matured as models crossed the hundred-billion-parameter threshold.
                </p>
                <p className="text-sm leading-relaxed mt-3">
                  The narrative that emerges is one of successive <em>paradigm consolidations</em>. The residual
                  connections of He et al. (2015) solved the deep-optimization problem, clearing the way for the
                  Transformer's stacked architecture. The Transformer, in turn, reduced the design space to a single
                  computational primitive — scaled dot-product attention — around which subsequent papers innovated only
                  at the margins, focusing their effort instead on training objectives (BERT, T5), raw parameter count
                  (GPT-3, ViT), and adaptation recipes (LoRA, InstructGPT). Understanding this intellectual genealogy is
                  essential for any researcher entering the field today.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-black text-slate-900 border-l-4 border-primary-500 pl-4 mb-5">
                  2. Thematic Analysis
                </h3>
                <div className="space-y-7">
                  {thematicSubsections.map((subsection, i) => (
                    <article
                      key={i}
                      className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/40 p-6 hover:border-primary-200 hover:shadow-md hover:shadow-slate-200/40 transition"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 text-white text-[12px] font-black shadow-sm">
                          2.{i + 1}
                        </span>
                        <h4 className="font-black text-slate-900 leading-snug">{subsection.title}</h4>
                      </div>
                      <div className="text-sm leading-relaxed whitespace-pre-line text-slate-700">
                        {subsection.body}
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Key works:</span>
                        {subsection.keyPapers.map((cite) => (
                          <span
                            key={cite}
                            className="px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-bold border border-primary-100"
                          >
                            {cite}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-lg font-black text-slate-900 border-l-4 border-accent-500 pl-4 mb-5">
                  3. Research Timeline
                </h3>
                <div className="relative">
                  <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-500 via-accent-500 to-success-500 rounded-full" />
                  <div className="space-y-5">
                    {timelineEvents.map((event, i) => (
                      <div key={i} className="relative flex gap-5 pl-14">
                        <div className="absolute left-3.5 top-1.5 w-6 h-6 rounded-full border-4 border-white bg-gradient-to-br from-primary-500 to-accent-500 shadow-md z-10" />
                        <div className="flex-1 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/40 p-5 hover:shadow-md transition">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                              <span className="inline-block px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-black mb-2">
                                {event.year}
                              </span>
                              <h5 className="font-black text-slate-900 leading-tight">{event.title}</h5>
                              <p className="text-xs font-semibold text-accent-700 mt-0.5">{event.paper}</p>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 mt-3 leading-relaxed">{event.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-black text-slate-900 border-l-4 border-success-500 pl-4 mb-4">
                  4. Cross-Cutting Synthesis
                </h3>
                <div className="rounded-2xl border border-success-200 bg-gradient-to-br from-success-50/60 via-white to-primary-50/40 p-6">
                  <p className="text-sm leading-relaxed">
                    Taken together, the {selectedCount} papers reviewed here reveal a field that has progressively
                    <em> outsourced its research variables</em>. In 2015 the primary research questions were
                    architectural — how to train deep networks at all. By 2017 the architecture had stabilized on the
                    Transformer, and attention shifted to pre-training objectives (BERT, T5). By 2020 the objective had
                    stabilized on variants of next-token prediction, and the independent variable of interest became
                    <em> scale</em> (GPT-3). Today, with scale itself a settled engineering matter for well-resourced
                    organizations, active frontier research has moved one layer further out, into alignment with human
                    preferences (RLHF) and into methods that make frontier capabilities <em>accessible</em> to
                    smaller actors (LoRA and related parameter-efficient fine-tuning techniques).
                  </p>
                  <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { label: "Consensus", tone: "success", text: "Transformer + self-attention is the canonical backbone across NLP and vision." },
                      { label: "Open Question", tone: "warning", text: "What is the theoretically minimal data and compute required for emergent abilities?" },
                      { label: "Next Frontier", tone: "primary", text: "Multimodal unified architectures + alignment at all scales." },
                    ].map((c) => {
                      const toneClass = c.tone === "success" ? "border-success-200 bg-success-50/60" : c.tone === "warning" ? "border-warning-200 bg-warning-50/60" : "border-primary-200 bg-primary-50/60";
                      const textClass = c.tone === "success" ? "text-success-700" : c.tone === "warning" ? "text-warning-700" : "text-primary-700";
                      return (
                        <div key={c.label} className={`rounded-xl border ${toneClass} p-4`}>
                          <p className={`text-[10px] font-black uppercase tracking-wider ${textClass} mb-1`}>
                            {c.label}
                          </p>
                          <p className="text-sm text-slate-700 leading-relaxed">{c.text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-black text-slate-900 border-l-4 border-slate-400 pl-4 mb-4">
                  5. References
                </h3>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/40 divide-y divide-slate-200/70">
                  {references.map((ref, i) => (
                    <div key={i} className="px-5 py-3.5 first:rounded-t-2xl last:rounded-b-2xl hover:bg-white transition">
                      <p className="text-xs leading-relaxed text-slate-700 font-mono">{ref}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
