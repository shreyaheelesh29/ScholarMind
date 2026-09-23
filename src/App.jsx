import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UploadPaper from "./pages/UploadPaper";
import PapersList from "./pages/PapersList";
import PdfViewer from "./pages/PdfViewer";
import Chat from "./pages/Chat";
import PaperSummary from "./pages/PaperSummary";
import PaperComparison from "./pages/PaperComparison";
import LiteratureReview from "./pages/LiteratureReview";
import ResearchGap from "./pages/ResearchGap";
import ResearchIdeas from "./pages/ResearchIdeas";
import PPTInterface from "./pages/PPTInterface";
import VivaPrep from "./pages/VivaPrep";
import Learning from "./pages/Learning";
import Settings from "./pages/Settings";
import MyData from "./pages/MyData";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
