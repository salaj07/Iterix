import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import TaskDetailModal from "@/components/tasks/TaskDetailModal";
import { closeTask, openSearch, closeSearch } from "@/store/slices/uiSlice";
import { setCurrentProjectId } from "@/store/slices/projectsSlice";
import Modal from "@/components/common/Modal";
import { Input } from "@/components/common/Primitives";
import { Search } from "lucide-react";
import { roleLabel } from "@/lib/format";

// Async thunks for data loading
import { fetchWorkspaces } from "@/store/slices/workspaceSlice";
import { fetchProjects, fetchProjectMembers } from "@/store/slices/projectsSlice";
import { fetchMembers } from "@/store/slices/orgSlice";
import { fetchProjectTasks } from "@/store/slices/tasksSlice";
import { fetchSprints } from "@/store/slices/sprintsSlice";
import { fetchNotifications } from "@/store/slices/notificationsSlice";

export default function AppShell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sidebarCollapsed = useSelector(s => s.ui.sidebarCollapsed);
  const taskId = useSelector(s => s.ui.taskModalId);
  const searchOpen = useSelector(s => s.ui.searchOpen);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const allTasks = useSelector(s => s.tasks.tasks) || [];
  const allProjects = useSelector(s => s.projects.projects) || [];
  const allMembers = useSelector(s => s.org.members) || [];

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (searchOpen) {
          dispatch(closeSearch());
        } else {
          dispatch(openSearch());
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch, searchOpen]);

  const filteredTasks = searchQuery ? allTasks.filter(t => t && t.title && t.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5) : [];
  const filteredProjects = searchQuery ? allProjects.filter(p => p && p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5) : [];
  const filteredMembers = searchQuery ? allMembers.filter(m => m && m.name && m.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5) : [];
  
  const hasResults = filteredTasks.length > 0 || filteredProjects.length > 0 || filteredMembers.length > 0;

  const currentWorkspaceId = useSelector(s => s.workspace.currentWorkspaceId);
  const currentProjectId = useSelector(s => s.projects.currentProjectId);
  const projects = useSelector(s => s.projects.projects) || [];
  const workspaces = useSelector(s => s.workspace.workspaces) || [];
  const loadingWorkspaces = useSelector(s => s.workspace.loading);
  const [hasFetchedWorkspaces, setHasFetchedWorkspaces] = useState(false);

  // 1. Fetch workspaces and notifications on mount
  useEffect(() => {
    dispatch(fetchWorkspaces()).finally(() => setHasFetchedWorkspaces(true));
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Redirect to onboarding if the user has no workspaces
  useEffect(() => {
    if (hasFetchedWorkspaces && !loadingWorkspaces && (workspaces || []).length === 0) {
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
  const projectIdsStr = (projects || []).map(p => p ? (p.id || p._id) : "").join(",");
  useEffect(() => {
    if ((projects || []).length > 0) {
      projects.forEach(p => {
        if (!p) return;
        const pid = p.id || p._id;
        if (pid) {
          dispatch(fetchProjectTasks(pid));
          dispatch(fetchSprints(pid));
        }
      });
    }
  }, [dispatch, projectIdsStr]);

  // 4. Fetch project members when currentProjectId changes
  useEffect(() => {
    if (currentProjectId) {
      dispatch(fetchProjectMembers(currentProjectId));
    }
  }, [dispatch, currentProjectId]);

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

      <Modal
        open={searchOpen}
        onClose={() => { dispatch(closeSearch()); setSearchQuery(""); }}
        title="Command Search"
        className="max-w-xl"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search everything... (type task name, project, or email)"
              className="h-11 pl-11 bg-foreground/[0.02] w-full"
            />
          </div>

          <div className="max-h-[350px] overflow-y-auto mt-2 space-y-4 divide-y divide-border/40 pr-1">
            {searchQuery && !hasResults && (
              <div className="text-center py-10 text-xs text-muted-foreground">
                No results found for "{searchQuery}"
              </div>
            )}
            
            {!searchQuery && (
              <div className="text-center py-10 text-xs text-muted-foreground">
                Type something to search across tasks, projects, and members...
              </div>
            )}

            {filteredProjects.length > 0 && (
              <div className="pt-3 first:pt-0">
                <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60">Projects</div>
                <div className="mt-1 space-y-0.5">
                  {filteredProjects.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        dispatch(setCurrentProjectId(p.id));
                        navigate(`/app/projects/${p.id}`);
                        dispatch(closeSearch());
                        setSearchQuery("");
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-foreground/5 text-xs text-left transition-all font-medium"
                    >
                      <span>{p.name}</span>
                      <span className="text-[10px] text-muted-foreground bg-foreground/5 px-1.5 py-0.5 rounded uppercase">{p.key}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredTasks.length > 0 && (
              <div className="pt-3 first:pt-0">
                <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60">Tasks</div>
                <div className="mt-1 space-y-0.5">
                  {filteredTasks.map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        dispatch(openTask(t.id));
                        dispatch(closeSearch());
                        setSearchQuery("");
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-foreground/5 text-xs text-left transition-all font-medium"
                    >
                      <span className="truncate pr-4">{t.title}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{t.status}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredMembers.length > 0 && (
              <div className="pt-3 first:pt-0">
                <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60">Members</div>
                <div className="mt-1 space-y-0.5">
                  {filteredMembers.map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        navigate("/app/teams");
                        dispatch(closeSearch());
                        setSearchQuery("");
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-foreground/5 text-xs text-left transition-all font-medium"
                    >
                      <div className="w-5 h-5 rounded-full bg-[color:var(--primary)]/10 text-[color:var(--primary)] flex items-center justify-center text-[10px] font-bold">
                        {m.name ? m.name.slice(0,1).toUpperCase() : "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate">{m.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{m.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
