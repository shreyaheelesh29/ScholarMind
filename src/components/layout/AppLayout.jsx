import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout({ children }) {
  const location = useLocation();
  const [token, setToken] = useState(() => localStorage.getItem("scholarmind_token"));

  useEffect(() => {
    const syncToken = () => setToken(localStorage.getItem("scholarmind_token"));
    window.addEventListener("scholarmind-user-updated", syncToken);
    window.addEventListener("storage", syncToken);
    return () => {
      window.removeEventListener("scholarmind-user-updated", syncToken);
      window.removeEventListener("storage", syncToken);
    };
  }, []);

  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;

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
