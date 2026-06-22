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
import { fetchProjectTasks, upsertTask, deleteTask } from "@/store/slices/tasksSlice";
import { fetchSprints, upsertSprint, deleteSprint } from "@/store/slices/sprintsSlice";
import { fetchNotifications, push as pushNotification } from "@/store/slices/notificationsSlice";
import { socket } from "@/services/socket.service";

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

  // Sync selected project to the active workspace
  useEffect(() => {
    if (currentWorkspaceId && projects.length > 0) {
      const wsProjects = projects.filter(
        (p) => p && (p.workspace === currentWorkspaceId || p.workspaceId === currentWorkspaceId)
      );
      const currentProjValid = wsProjects.some(
        (p) => p && (p.id === currentProjectId || p._id === currentProjectId)
      );
      if (!currentProjValid) {
        const firstProjId = wsProjects[0] ? (wsProjects[0].id || wsProjects[0]._id) : null;
        dispatch(setCurrentProjectId(firstProjId));
      }
    } else if (!currentWorkspaceId || projects.length === 0) {
      dispatch(setCurrentProjectId(null));
    }
  }, [currentWorkspaceId, projects, currentProjectId, dispatch]);

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

  // 5. Realtime Socket.io initialization
  useEffect(() => {
    // Connect to the socket server
    socket.connect();

    socket.on("connect", () => {
      console.log("⚡ Connected to real-time synchronization server");
    });

    socket.on("disconnect", () => {
      console.log("🔌 Disconnected from real-time synchronization server");
    });

    socket.on("new_notification", (data) => {
      console.log("🔔 New notification received via websocket:", data);
      dispatch(pushNotification(data));
    });

    socket.on("task_created", (data) => {
      console.log("📝 Task created event:", data);
      dispatch(upsertTask(data));
    });

    socket.on("task_updated", (data) => {
      console.log("✏️ Task updated event:", data);
      dispatch(upsertTask(data));
    });

    socket.on("task_deleted", (data) => {
      console.log("🗑️ Task deleted event:", data);
      if (data && data.id) {
        dispatch(deleteTask(data.id));
      }
    });

    socket.on("sprint_created", (data) => {
      console.log("🏃 Sprint created event:", data);
      dispatch(upsertSprint(data));
    });

    socket.on("sprint_updated", (data) => {
      console.log("🔄 Sprint updated event:", data);
      dispatch(upsertSprint(data));
    });

    socket.on("sprint_deleted", (data) => {
      console.log("❌ Sprint deleted event:", data);
      if (data && data.id) {
        dispatch(deleteSprint(data.id));
      }
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("new_notification");
      socket.off("task_created");
      socket.off("task_updated");
      socket.off("task_deleted");
      socket.off("sprint_created");
      socket.off("sprint_updated");
      socket.off("sprint_deleted");
      socket.disconnect();
      console.log("🔌 Socket disconnected on AppShell unmount");
    };
  }, [dispatch]);

  // 6. Manage project room subscription dynamically
  useEffect(() => {
    if (!currentProjectId) return;

    console.log(`📁 Requesting to join room for project: ${currentProjectId}`);
    socket.emit("join_project", currentProjectId);

    return () => {
      console.log(`📁 Leaving room for project: ${currentProjectId}`);
      socket.emit("leave_project", currentProjectId);
    };
  }, [currentProjectId]);

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
              {hasFetchedWorkspaces ? <Outlet /> : <DashboardSkeleton />}
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

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-foreground/10 rounded" />
          <div className="h-8 w-64 bg-foreground/10 rounded" />
        </div>
        <div className="h-10 w-28 bg-foreground/10 rounded-xl" />
      </div>

      {/* Grid of stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass p-5 h-24 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="w-8 h-8 rounded-lg bg-foreground/10" />
              <div className="w-8 h-4 bg-foreground/10 rounded" />
            </div>
            <div className="h-4 w-28 bg-foreground/10 rounded" />
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="glass p-5 space-y-3 h-64 flex flex-col justify-between">
            <div className="h-5 w-36 bg-foreground/10 rounded" />
            <div className="space-y-2.5 pt-3 flex-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-border/50">
                  <div className="h-4 w-48 bg-foreground/10 rounded" />
                  <div className="h-4 w-12 bg-foreground/10 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="glass p-5 space-y-3 h-64 flex flex-col justify-between">
            <div className="h-5 w-32 bg-foreground/10 rounded" />
            <div className="space-y-3 pt-3 flex-1">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-foreground/10" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 w-24 bg-foreground/10 rounded" />
                    <div className="h-3 w-16 bg-foreground/10 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
