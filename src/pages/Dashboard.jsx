import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, getSessionUser } from "../api";

const actions = [
  ["Analyze a Paper", "/summary", "Generate a cited summary or report"],
  ["Compare Papers", "/comparison", "Compare two or three uploaded papers"],
  ["Literature Review", "/literature-review", "Synthesize selected papers"],
  ["Research Gaps", "/research-gap", "Explore evidence-backed open questions"],
  ["Research Ideas", "/research-ideas", "Develop candidate proposals from your papers"],
  ["Create Presentation", "/ppt", "Build a presentation from source material"],
];

function ago(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return date.toLocaleDateString();
}

function formatStudyTime(seconds = 0) {
  const totalMinutes = Math.floor(Math.max(0, Number(seconds) || 0) / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

const studyActivityLabels = { flashcards: "Flashcards", quiz: "Quiz", mindmap: "Mind maps" };
const studyActivityColors = { flashcards: "bg-violet-500", quiz: "bg-sky-500", mindmap: "bg-emerald-500" };
const studyActivityOrder = ["flashcards", "quiz", "mindmap"];

function formatStudyDay(date) {
  const [year, month, day] = String(date).split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, { weekday: "short", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [studyActivityOpen, setStudyActivityOpen] = useState(false);
  const user = getSessionUser();

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const result = await apiFetch("/me/data");
        if (alive) {
          setData(result);
          setError("");
          setLastUpdated(new Date());
        }
      } catch (loadError) {
        if (alive) setError(loadError.message);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const refreshWhenVisible = () => { if (document.visibilityState === "visible") load(); };
    window.addEventListener("scholarmind-data-updated", load);
    window.addEventListener("focus", refreshWhenVisible);
    return () => {
      alive = false;
      window.removeEventListener("scholarmind-data-updated", load);
      window.removeEventListener("focus", refreshWhenVisible);
    };
  }, []);

  const stats = useMemo(() => {
    const artifacts = data?.artifacts || [];
    const metrics = data?.dashboard_metrics || {};
    const totalCards = Number(metrics.flashcards_total) || 0;
    const masteredCards = Number(metrics.flashcards_mastered) || 0;
    const masteredPercent = totalCards ? Math.round((masteredCards / totalCards) * 100) : 0;
    return [
      { title: "Flashcards Mastered", value: `${masteredPercent}%`, description: `${masteredCards} mastered of ${totalCards} available` },
      { title: "Papers Available", value: metrics.papers_available ?? data?.papers?.filter((paper) => paper.chunk_count > 0).length ?? "—", description: "Successfully processed in your library" },
      { title: "Mind Map Topics", value: metrics.mindmap_topics ?? artifacts.filter((item) => item.kind === "mindmap").length, description: "Unique saved topics" },
      { title: "Study Time", value: formatStudyTime(metrics.study_seconds_week), description: "This week · UTC" },
    ];
  }, [data]);

  const recentHistory = (data?.history || []).slice(0, 6);

  return (
    <div className="space-y-7 animate-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-indigo-600">Welcome back{user?.name ? `, ${user.name}` : ""}</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Research Dashboard</h1>
          <p className="mt-2 text-slate-500">Your papers, saved analysis, and recent research activity.</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && <span className="text-xs text-slate-400">Updated {lastUpdated.toLocaleTimeString()}</span>}
          <button onClick={() => { setLoading(true); apiFetch("/me/data").then((result) => { setData(result); setError(""); setLastUpdated(new Date()); }).catch((e) => setError(e.message)).finally(() => setLoading(false)); }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Refresh</button>
        </div>
      </header>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Could not refresh your dashboard: {error}</div>}

      <section aria-label="Your research at a glance" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => stat.title === "Study Time" ? <button key={stat.title} type="button"
          aria-expanded={studyActivityOpen} aria-controls="dashboard-study-activity"
          onClick={() => setStudyActivityOpen((open) => !open)}
          className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:shadow-lg hover:shadow-slate-200/60">
          <p className="text-sm font-medium text-slate-500">{stat.title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{loading && !data ? "…" : stat.value}</p>
          <p className="mt-1 text-xs text-slate-400">{stat.description}</p>
          <span className="mt-3 block text-xs font-semibold text-indigo-600">{studyActivityOpen ? "Hide activity" : "View daily activity"}</span>
        </button> : <article key={stat.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">{stat.title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{loading && !data ? "…" : stat.value}</p>
          <p className="mt-1 text-xs text-slate-400">{stat.description}</p>
        </article>)}
      </section>

      {studyActivityOpen && (() => {
        const days = data?.dashboard_metrics?.study_activity_days || [];
        const dailyTotals = days.map((day) => studyActivityOrder.reduce((sum, kind) => sum + (Number(day.activities?.[kind]) || 0), 0));
        const maxDailySeconds = Math.max(1, ...dailyTotals);
        const activityTotals = studyActivityOrder.map((kind) => ({
          kind,
          seconds: days.reduce((sum, day) => sum + (Number(day.activities?.[kind]) || 0), 0),
        }));
        return <section id="dashboard-study-activity" aria-label="Study activity this week" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Study activity by day</h2>
              <p className="mt-1 text-sm text-slate-500">Time on the Learning page, grouped by the selected tool · UTC. Activity detail starts from this update.</p>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
              {activityTotals.map(({ kind, seconds }) => <span key={kind} className="inline-flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-sm ${studyActivityColors[kind]}`} />
                {studyActivityLabels[kind]} · {formatStudyTime(seconds)}
              </span>)}
            </div>
          </div>
          <div className="mt-5 grid grid-cols-7 gap-2 sm:gap-4" role="img" aria-label="Stacked bar chart of daily study time by flashcards, quiz, and mind maps">
            {days.map((day, index) => {
              const total = dailyTotals[index] || 0;
              return <div key={day.date} className="flex min-w-0 flex-col items-center gap-2" title={`${formatStudyDay(day.date)}: ${formatStudyTime(total)}`}>
                <span className="h-4 text-center text-[10px] font-medium text-slate-500 sm:text-xs">{formatStudyTime(total)}</span>
                <div className="flex h-28 w-full max-w-10 items-end overflow-hidden rounded-md bg-slate-100" aria-hidden="true">
                  <div className="flex w-full flex-col justify-end" style={{ height: `${Math.max(total ? 5 : 0, total / maxDailySeconds * 100)}%` }}>
                    {studyActivityOrder.map((kind) => {
                      const seconds = Number(day.activities?.[kind]) || 0;
                      return seconds ? <div key={kind} className={`${studyActivityColors[kind]} w-full`} style={{ height: `${seconds / total * 100}%`, minHeight: 2 }} /> : null;
                    })}
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-600 sm:text-xs">{formatStudyDay(day.date)}</span>
              </div>;
            })}
          </div>
        </section>;
      })()}

      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Start Research</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">Upload PDFs, then ask questions or generate source-based study and research materials. Results are saved to your history.</p>
          <Link to="/upload" className="mt-5 inline-flex rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">Upload a paper</Link>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {actions.map(([label, href, description]) => <Link key={href} to={href} className="rounded-xl border border-slate-100 bg-slate-50 p-3 transition hover:border-indigo-200 hover:bg-indigo-50">
              <span className="block text-sm font-semibold text-slate-800">{label}</span>
              <span className="mt-1 block text-xs text-slate-500">{description}</span>
            </Link>)}
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-900">Recent activity</h2><p className="mt-1 text-sm text-slate-500">Synced with your account history</p></div><Link to="/my-data" className="text-sm font-semibold text-indigo-600 hover:underline">View history</Link></div>
          {recentHistory.length ? <ul className="mt-4 divide-y divide-slate-100">{recentHistory.map((item) => <li key={item.id} className="flex items-start justify-between gap-3 py-3">
            <div className="min-w-0"><p className="text-sm font-medium text-slate-800">{item.action.replaceAll("_", " ")}</p><p className="truncate text-xs text-slate-500">{item.details?.filename || item.details?.title || item.details?.kind || "ScholarMind activity"}</p></div>
            <time className="shrink-0 text-xs text-slate-400" dateTime={item.created_at}>{ago(item.created_at)}</time>
          </li>)}</ul> : <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">{loading ? "Loading your activity…" : "Your uploads and generated materials will appear here."}</p>}
        </section>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-900">Your papers</h2><p className="mt-1 text-sm text-slate-500">Recently uploaded PDFs in your library</p></div><Link to="/papers" className="text-sm font-semibold text-indigo-600 hover:underline">View all papers</Link></div>
        {data?.papers?.length ? <ul className="mt-4 divide-y divide-slate-100">{data.papers.slice(0, 5).map((paper) => <li key={paper.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate font-medium text-slate-800">{paper.filename}</p><p className="text-sm text-slate-500">{paper.page_count} pages · {paper.chunk_count} searchable passages</p></div><Link to={`/viewer?paperId=${encodeURIComponent(paper.id)}`} className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">Open PDF</Link></li>)}</ul> : <p className="mt-4 text-sm text-slate-500">{loading ? "Loading your library…" : <><Link className="font-semibold text-indigo-700 hover:underline" to="/upload">Upload a PDF</Link> to start building your research library.</>}</p>}
      </section>
    </div>
  );
}
