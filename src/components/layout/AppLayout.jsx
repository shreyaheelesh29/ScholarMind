import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      <Topbar />

      <main className="ml-64 pt-16">
        <div className="min-h-[calc(100vh-4rem)] p-6">
          {children}
        </div>
      </main>
    </div>
  );
}