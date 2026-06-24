import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useSelector } from "react-redux";
import { GoogleOAuthProvider } from '@react-oauth/google';

import Landing from "@/pages/Landing";
import Login from "@/pages/auth/Login";
import OtpVerify from "@/pages/auth/OtpVerify";
import Onboarding from "@/pages/Onboarding";
import AppShell from "@/components/layout/AppShell";

import Dashboard from "@/pages/app/Dashboard";
import Workspaces from "@/pages/app/Workspaces";
import Projects from "@/pages/app/Projects";
import ProjectDetail from "@/pages/app/ProjectDetail";
import Teams from "@/pages/app/Teams";
import Sprints from "@/pages/app/Sprints";
import KanbanPage from "@/pages/app/KanbanPage";
import Reports from "@/pages/app/Reports";
import Notifications from "@/pages/app/Notifications";
import Settings from "@/pages/app/Settings";
import Unscheduled from "@/pages/app/Unscheduled";
import NotFound from "@/pages/NotFound";

function ProtectedRoute({ children }) {
  const isAuth = useSelector((s) => s.auth.isAuthenticated);
  const loading = useSelector((s) => s.auth.loading);
  const loc = useLocation();

  // While fetchMe is in flight (on page refresh), show brand loader splash
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <motion.div
          initial={{ opacity: 0.5, scale: 0.95 }}
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.95, 1, 0.95] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-[12px] bg-[color:var(--primary)] flex items-center justify-center text-white shadow-lg shadow-[color:var(--primary)]/20">
            <svg className="w-5.5 h-5.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
            </svg>
          </div>
          <span className="font-display font-bold text-2xl tracking-tight">Iterix</span>
        </motion.div>
      </div>
    );
  }

  if (!isAuth) return <Navigate to="/login" state={{ from: loc }} replace />;
  return children;
}

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/login/otp" element={<PageTransition><OtpVerify /></PageTransition>} />
          <Route path="/onboarding" element={<PageTransition><Onboarding /></PageTransition>} />

          <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="workspaces" element={<Workspaces />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="projects/:id/board" element={<KanbanPage />} />
            <Route path="teams" element={<Teams mode="project" />} />
            <Route path="workspace-members" element={<Teams mode="workspace" />} />
            <Route path="sprints" element={<Sprints />} />
            <Route path="kanban" element={<KanbanPage />} />
            <Route path="backlog" element={<Navigate to="/app/unscheduled" replace />} />
            <Route path="unscheduled" element={<Unscheduled />} />
            <Route path="reports" element={<Reports />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </GoogleOAuthProvider>

  );
}
