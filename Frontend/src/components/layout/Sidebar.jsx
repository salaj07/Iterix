import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  LayoutDashboard, FolderKanban, Users, ListChecks, Trello, Layers,
  BarChart3, Bell, Settings, Boxes, Mail, ChevronLeft, ChevronRight, X, Sparkles,
  Building2, Plus, ChevronDown
} from "lucide-react";
import { toggleSidebar } from "@/store/slices/uiSlice";
import { setCurrentWorkspace } from "@/store/slices/workspaceSlice";
import { setCurrentProjectId } from "@/store/slices/projectsSlice";
import { cn } from "@/lib/utils";

const projectItems = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/kanban", label: "Kanban Board", icon: Trello },
  { to: "/app/unscheduled", label: "Unscheduled Work", icon: Layers },
  { to: "/app/sprints", label: "Sprints", icon: ListChecks },
  { to: "/app/teams", label: "Project Members", icon: Users },
  { to: "/app/reports", label: "Reports", icon: BarChart3 },
];

const globalItems = [
  { to: "/app/projects", label: "Projects", icon: FolderKanban },
  { to: "/app/workspaces", label: "Workspaces", icon: Boxes },
  { to: "/app/notifications", label: "Notifications", icon: Bell },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

function useClickOutside(cb) {
  const ref = useRef(null);
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) cb(); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [cb]);
  return ref;
}

function SidebarInner({ collapsed, onCloseMobile }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const unread = useSelector(s => (s.notifications.items || []).filter(i => !i.read).length);

  // Workspace state
  const workspaces = useSelector(s => s.workspace.workspaces) || [];
  const currentWorkspaceId = useSelector(s => s.workspace.currentWorkspaceId);
  const currentWs = workspaces.find(w => w && (w.id === currentWorkspaceId || w._id === currentWorkspaceId));

  // Project state
  const allProjects = useSelector(s => s.projects.projects) || [];
  const projects = allProjects.filter(p => p && (p.workspace === currentWorkspaceId || p.workspaceId === currentWorkspaceId));
  const currentProjectId = useSelector(s => s.projects.currentProjectId);
  const currentProject = projects.find(p => p && (p.id === currentProjectId || p._id === currentProjectId));

  // Workspace Admin role check
  const workspaceRole = currentWs?.role || "DEVELOPER";
  const isWorkspaceAdmin = workspaceRole === "ADMIN";

  // Dropdown open states
  const [wsOpen, setWsOpen] = useState(false);
  const [projOpen, setProjOpen] = useState(false);

  const wsRef = useClickOutside(() => setWsOpen(false));
  const projRef = useClickOutside(() => setProjOpen(false));

  const handleSwitchWorkspace = (ws) => {
    dispatch(setCurrentWorkspace(ws.id || ws._id));
    setWsOpen(false);
    setProjOpen(false);
  };

  const handleSwitchProject = (projectId) => {
    dispatch(setCurrentProjectId(projectId));
    setProjOpen(false);
  };

  return (
    <div className="h-full flex flex-col bg-[color:var(--sidebar)] backdrop-blur-xl border-r border-[color:var(--sidebar-border)]">
      {/* Title / Logo Header */}
      <div className="h-16 flex items-center px-4 border-b border-[color:var(--sidebar-border)] gap-3">
        <button onClick={() => navigate("/app/dashboard")} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-[color:var(--primary)] flex items-center justify-center text-white shrink-0">
            <Sparkles size={16} />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
                className="font-display font-bold text-[15px] tracking-tight"
              >
                Iterix
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <button
          className="ml-auto p-1.5 rounded-lg hover:bg-foreground/5 text-muted-foreground hidden md:block"
          onClick={() => dispatch(toggleSidebar())}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        <button className="ml-auto p-1.5 rounded-lg hover:bg-foreground/5 text-muted-foreground md:hidden" onClick={onCloseMobile}>
          <X size={18} />
        </button>
      </div>

      {/* Workspace & Project Selection Pane */}
      {!collapsed ? (
        <div className="p-3 border-b border-[color:var(--sidebar-border)] space-y-2.5">
          {/* Workspace Selector */}
          <div className="relative" ref={wsRef}>
            <button
              onClick={() => setWsOpen(o => !o)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-[color:var(--sidebar-border)] bg-foreground/[0.03] hover:bg-foreground/5 text-sm font-semibold transition-all"
            >
              <div className="w-5 h-5 rounded-md bg-[color:var(--primary)] flex items-center justify-center text-white text-[10px] shrink-0 font-bold">
                {currentWs?.name?.slice(0,1).toUpperCase() || "W"}
              </div>
              <span className="truncate flex-1 text-left">{currentWs?.name || "Select Workspace"}</span>
              <ChevronDown size={14} className="text-muted-foreground shrink-0" />
            </button>

            <AnimatePresence>
              {wsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute left-0 mt-1 w-full glass-strong p-2 z-50 rounded-xl border border-[color:var(--sidebar-border)] shadow-lg"
                >
                  <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Workspaces</div>
                  <div className="max-h-40 overflow-y-auto mt-1 space-y-0.5">
                    {workspaces.map(ws => (
                      <button
                        key={ws.id || ws._id}
                        onClick={() => handleSwitchWorkspace(ws)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-foreground/5 text-xs text-left transition-colors",
                          (ws.id === currentWorkspaceId || ws._id === currentWorkspaceId) && "bg-[color:var(--sidebar-accent)] text-foreground font-semibold"
                        )}
                      >
                        <div className="w-6 h-6 rounded bg-[color:var(--primary)]/15 flex items-center justify-center text-[color:var(--primary)] text-xs font-bold shrink-0">
                          {ws.name.slice(0,1).toUpperCase()}
                        </div>
                        <span className="truncate">{ws.name}</span>
                      </button>
                    ))}
                  </div>
                  {isWorkspaceAdmin && (
                    <>
                      <div className="h-px bg-border my-1.5" />
                      <button
                        onClick={() => {
                          setWsOpen(false);
                          toast.info("For creating the workspace contact to Iterix manager");
                        }}
                        className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-[color:var(--primary)] hover:text-white border border-dashed border-border text-xs text-muted-foreground transition-all font-medium"
                      >
                        <Plus size={13} /> Create Workspace
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Project Selector */}
          <div className="relative" ref={projRef}>
            <button
              onClick={() => setProjOpen(o => !o)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-[color:var(--sidebar-border)] bg-foreground/[0.03] hover:bg-foreground/5 text-sm font-semibold transition-all"
            >
              <FolderKanban size={15} className="text-[color:var(--primary)] shrink-0" />
              <span className="truncate flex-1 text-left text-xs font-medium">
                {currentProject ? `${currentProject.projectKey || "PROJ"} · ${currentProject.name}` : "Select Project"}
              </span>
              <ChevronDown size={14} className="text-muted-foreground shrink-0" />
            </button>

            <AnimatePresence>
              {projOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute left-0 mt-1 w-full glass-strong p-2 z-50 rounded-xl border border-[color:var(--sidebar-border)] shadow-lg"
                >
                  <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Projects</div>
                  <div className="max-h-40 overflow-y-auto mt-1 space-y-0.5">
                    {projects.map(p => (
                      <button
                        key={p.id || p._id}
                        onClick={() => handleSwitchProject(p.id || p._id)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-foreground/5 text-xs text-left transition-colors",
                          (p.id === currentProjectId || p._id === currentProjectId) && "bg-[color:var(--sidebar-accent)] text-foreground font-semibold"
                        )}
                      >
                        <FolderKanban size={13} className="text-muted-foreground shrink-0" />
                        <span className="truncate text-xs">{p.name}</span>
                      </button>
                    ))}
                    {projects.length === 0 && (
                      <div className="px-2.5 py-2 text-xs text-muted-foreground text-center">No projects in workspace</div>
                    )}
                  </div>
                  <div className="h-px bg-border my-1.5" />
                  <button
                    onClick={() => {
                      setProjOpen(false);
                      const role = currentWs?.role || "DEVELOPER";
                      if (role === "ADMIN" || role === "TEAM_LEAD") {
                        navigate("/app/projects", { state: { openCreateModal: true } });
                      } else {
                        toast.error("You do not have permission to create a project. Only Workspace Admins and Project Leads can create projects.");
                      }
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-[color:var(--primary)] hover:text-white border border-dashed border-border text-xs text-muted-foreground transition-all font-medium"
                  >
                    <Plus size={13} /> Create Project
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="p-3 border-b border-[color:var(--sidebar-border)] flex flex-col items-center gap-2.5">
          {/* Workspace Mini Icon */}
          <button
            onClick={() => navigate("/app/workspaces")}
            className="w-9 h-9 rounded-lg bg-[color:var(--primary)] flex items-center justify-center text-white text-xs font-bold hover:opacity-90 transition-all"
            title={currentWs?.name || "Workspaces"}
          >
            {currentWs?.name?.slice(0,1).toUpperCase() || "W"}
          </button>

          {/* Project Mini Icon */}
          <button
            onClick={() => navigate("/app/projects")}
            className="w-9 h-9 rounded-lg bg-foreground/5 flex items-center justify-center text-muted-foreground hover:bg-foreground/10 transition-all"
            title={currentProject?.name || "Projects"}
          >
            <FolderKanban size={16} />
          </button>
        </div>
      )}

      {/* Navigation Groups */}
      <nav className="flex-1 px-2 py-4 space-y-6 overflow-y-auto">
        {/* Project Specific Group */}
        <div>
          {!collapsed && (
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Project Context
            </div>
          )}
          <div className="space-y-0.5">
            {projectItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to} to={item.to} onClick={onCloseMobile}
                  className={({ isActive }) => cn(
                    "group relative flex items-center gap-3 px-3 h-10 rounded-[12px] text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[color:var(--sidebar-accent)] text-foreground"
                      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                  )}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="sidebar-active-pill"
                          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[color:var(--primary)]"
                        />
                      )}
                      <Icon size={18} className="shrink-0" />
                      <AnimatePresence initial={false}>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -4 }}
                            className="truncate"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Global Group */}
        <div>
          {!collapsed && (
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Workspace & General
            </div>
          )}
          <div className="space-y-0.5">
            {globalItems.map((item) => {
              const Icon = item.icon;
              const showBadge = item.label === "Notifications" && unread > 0;
              return (
                <NavLink
                  key={item.to} to={item.to} onClick={onCloseMobile}
                  className={({ isActive }) => cn(
                    "group relative flex items-center gap-3 px-3 h-10 rounded-[12px] text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[color:var(--sidebar-accent)] text-foreground"
                      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                  )}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="sidebar-active-pill"
                          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[color:var(--primary)]"
                        />
                      )}
                      <Icon size={18} className="shrink-0" />
                      <AnimatePresence initial={false}>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -4 }}
                            className="truncate"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {showBadge && !collapsed && (
                        <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[color:var(--primary)] text-[color:var(--primary-foreground)]">
                          {unread}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {
  return (
    <>
      {/* Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 76 : 248 }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="hidden md:block shrink-0 h-screen sticky top-0 z-30"
      >
        <SidebarInner collapsed={collapsed} />
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onCloseMobile}
            />
            <motion.aside
              className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-[260px]"
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 280, damping: 32 }}
            >
              <SidebarInner collapsed={false} onCloseMobile={onCloseMobile} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
