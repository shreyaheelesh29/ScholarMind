import { Link } from "react-router-dom";

const stats = [
  {
    title: "Papers",
    value: "12",
    description: "Uploaded research papers",
  },
  {
    title: "Analyses",
    value: "8",
    description: "AI analyses completed",
  },
  {
    title: "Research Ideas",
    value: "15",
    description: "Ideas generated",
  },
  {
    title: "Presentations",
    value: "4",
    description: "PPTs generated",
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-indigo-600">
          Welcome back
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Research Dashboard
        </h1>

        <p className="mt-2 text-slate-500">
          Analyze papers, discover research gaps, and turn your research into
          presentations.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">
              {stat.title}
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {stat.value}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {stat.description}
            </p>
          </div>
        ))}
      </div>

      {/* Main actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Start Research
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Upload a research paper and let ScholarMind help you understand,
            analyze, compare, and develop new research ideas.
          </p>

          <Link to="/upload" className="mt-5 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">
            Upload Paper
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Quick Actions
          </h2>

          <div className="mt-4 space-y-2">
            <Link to="/summary" className="block w-full rounded-lg bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100">
              Analyze a Paper
            </Link>

            <Link to="/comparison" className="block w-full rounded-lg bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100">
              Compare Papers
            </Link>

            <Link to="/research-ideas" className="block w-full rounded-lg bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100">
              Generate Research Idea
            </Link>

            <Link to="/ppt" className="block w-full rounded-lg bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100">
              Create PPT
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}