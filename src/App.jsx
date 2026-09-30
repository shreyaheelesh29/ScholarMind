import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import { apiFetch } from "./api";
import { applyTheme, getTheme } from "./theme";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const UploadPaper = lazy(() => import("./pages/UploadPaper"));
const PapersList = lazy(() => import("./pages/PapersList"));
const PdfViewer = lazy(() => import("./pages/PdfViewer"));
const Chat = lazy(() => import("./pages/Chat"));
const PaperSummary = lazy(() => import("./pages/PaperSummary"));
const PaperComparison = lazy(() => import("./pages/PaperComparison"));
const LiteratureReview = lazy(() => import("./pages/LiteratureReview"));
const ResearchGap = lazy(() => import("./pages/ResearchGap"));
const ResearchIdeas = lazy(() => import("./pages/ResearchIdeas"));
const PPTInterface = lazy(() => import("./pages/PPTInterface"));
const VivaPrep = lazy(() => import("./pages/VivaPrep"));
const Learning = lazy(() => import("./pages/Learning"));
const Settings = lazy(() => import("./pages/Settings"));
const MyData = lazy(() => import("./pages/MyData"));
const Admin = lazy(() => import("./pages/Admin"));

export default function App() {
  useEffect(() => {
    applyTheme(getTheme());
    if (localStorage.getItem("scholarmind_token")) {
      apiFetch("/settings").then((settings) => applyTheme(settings.theme)).catch(() => {});
    }
  }, []);

  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="grid min-h-screen place-items-center text-sm font-medium text-slate-500" role="status">
            Loading ScholarMind…
          </div>
        }
      >
        <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          }
        />

        <Route
          path="/upload"
          element={
            <AppLayout>
              <UploadPaper />
            </AppLayout>
          }
        />

        <Route
          path="/papers"
          element={
            <AppLayout>
              <PapersList />
            </AppLayout>
          }
        />

        <Route
          path="/viewer"
          element={
            <AppLayout>
              <PdfViewer />
            </AppLayout>
          }
        />

        <Route
          path="/chat"
          element={
            <AppLayout>
              <Chat />
            </AppLayout>
          }
        />

        <Route
          path="/summary"
          element={
            <AppLayout>
              <PaperSummary />
            </AppLayout>
          }
        />

        <Route
          path="/comparison"
          element={
            <AppLayout>
              <PaperComparison />
            </AppLayout>
          }
        />

        <Route
          path="/literature-review"
          element={
            <AppLayout>
              <LiteratureReview />
            </AppLayout>
          }
        />

        <Route
          path="/research-gap"
          element={
            <AppLayout>
              <ResearchGap />
            </AppLayout>
          }
        />

        <Route
          path="/research-ideas"
          element={
            <AppLayout>
              <ResearchIdeas />
            </AppLayout>
          }
        />

        <Route
          path="/ppt"
          element={
            <AppLayout>
              <PPTInterface />
            </AppLayout>
          }
        />

        <Route
          path="/viva"
          element={
            <AppLayout>
              <VivaPrep />
            </AppLayout>
          }
        />

        <Route
          path="/learning"
          element={
            <AppLayout>
              <Learning />
            </AppLayout>
          }
        />

        <Route
          path="/settings"
          element={
            <AppLayout>
              <Settings />
            </AppLayout>
          }
        />

        <Route path="/my-data" element={<AppLayout><MyData /></AppLayout>} />
        <Route path="/admin" element={<AppLayout><Admin /></AppLayout>} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
