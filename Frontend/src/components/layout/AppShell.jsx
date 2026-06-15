import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import TaskDetailModal from "@/components/tasks/TaskDetailModal";
import { closeTask } from "@/store/slices/uiSlice";

// Async thunks for data loading
import { fetchWorkspaces } from "@/store/slices/workspaceSlice";
import { fetchProjects } from "@/store/slices/projectsSlice";
import { fetchMembers } from "@/store/slices/orgSlice";
import { fetchProjectTasks } from "@/store/slices/tasksSlice";
import { fetchSprints } from "@/store/slices/sprintsSlice";
import { fetchNotifications } from "@/store/slices/notificationsSlice";

export default function AppShell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sidebarCollapsed = useSelector(s => s.ui.sidebarCollapsed);
  const taskId = useSelector(s => s.ui.taskModalId);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const currentWorkspaceId = useSelector(s => s.workspace.currentWorkspaceId);
  const projects = useSelector(s => s.projects.projects);
  const workspaces = useSelector(s => s.workspace.workspaces);
  const loadingWorkspaces = useSelector(s => s.workspace.loading);
  const [hasFetchedWorkspaces, setHasFetchedWorkspaces] = useState(false);

  // 1. Fetch workspaces and notifications on mount
  useEffect(() => {
    dispatch(fetchWorkspaces()).finally(() => setHasFetchedWorkspaces(true));
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Redirect to onboarding if the user has no workspaces
  useEffect(() => {
    if (hasFetchedWorkspaces && !loadingWorkspaces && workspaces.length === 0) {
      navigate("/onboarding", { replace: true });
    }
  }, [hasFetchedWorkspaces, loadingWorkspaces, workspaces.length, navigate]);

  // 2. Fetch projects and workspace members whenever selected workspace changes
  useEffect(() => {
    if (currentWorkspaceId) {
      dispatch(fetchProjects());
      dispatch(fetchMembers(currentWorkspaceId));
    }
  }, [dispatch, currentWorkspaceId]);

  // 3. Fetch project tasks and sprints when the list of projects changes
  const projectIdsStr = projects.map(p => p.id || p._id).join(",");
  useEffect(() => {
    if (projects.length > 0) {
      projects.forEach(p => {
        const pid = p.id || p._id;
        if (pid) {
          dispatch(fetchProjectTasks(pid));
          dispatch(fetchSprints(pid));
        }
      });
    }
  }, [dispatch, projectIdsStr]);

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onOpenMobileSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="p-4 md:p-8 max-w-[1600px] mx-auto"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <TaskDetailModal taskId={taskId} onClose={() => dispatch(closeTask())} />
    </div>
  );
}
