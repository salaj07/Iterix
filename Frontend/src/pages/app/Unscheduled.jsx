import { useMemo, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Filter, Plus, ArrowRight, Trash2, FolderKanban, Calendar } from "lucide-react";
import Button from "@/components/common/Button";
import { Input, Select, Badge, GlassCard } from "@/components/common/Primitives";
import Avatar from "@/components/common/Avatar";
import { openTask } from "@/store/slices/uiSlice";
import { moveTask, deleteTaskAsync, updateTask, moveToSprintAsync, changeTaskStatusAsync } from "@/store/slices/tasksSlice";
import { priorityTone, typeTone } from "@/lib/format";
import { PRIORITIES, TASK_TYPES } from "@/store/seed";
import { can, ACTIONS } from "@/lib/rbac";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import { cn } from "@/lib/utils";

export default function Unscheduled() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get("filter");

  const currentWorkspaceId = useSelector(s => s.workspace.currentWorkspaceId);
  const currentProjectId = useSelector(s => s.projects.currentProjectId);
  const allProjects = useSelector(s => s.projects.projects) || [];
  const projects = allProjects.filter(p => p && (p.workspace === currentWorkspaceId || p.workspaceId === currentWorkspaceId));
  const currentProject = projects.find(p => p && (p.id === currentProjectId || p._id === currentProjectId));

  const allTasks = useSelector(s => s.tasks.tasks) || [];
  const tasks = allTasks.filter(t => t && t.projectId === currentProjectId);

  const allSprints = useSelector(s => s.sprints.sprints) || [];
  const sprints = allSprints.filter(s => s && s.projectId === currentProjectId);
  const activeSprint = sprints.find(s => s.status === "active");

  const projectMembers = useSelector(s => s.projects.projectMembers) || [];
  const workspaceMembers = useSelector(s => s.org.members) || [];
  const user = useSelector(s => s.auth.user);
  
  // Find current user's workspace role
  const myWorkspaceMember = workspaceMembers.find(m => m && m.id === user?.id);
  const role = myWorkspaceMember?.role;

  // Find project member and role
  const myProjectMember = projectMembers.find(pm => pm && (pm.id === user?.id || pm.userId === user?.id || (pm.user && pm.user._id === user?.id)));
  const projectRole = myProjectMember?.role || "DEVELOPER";
  const isProjectLead = role === "ADMIN" || projectRole === "TEAM_LEAD" || currentProject?.teamLeadId === user?.id || currentProject?.createdBy === user?.id;

  const [q, setQ] = useState(() => {
    return localStorage.getItem(`Iterix-backlog-filter-q-${currentProjectId}`) || "";
  });
  const [priority, setPriority] = useState(() => {
    return localStorage.getItem(`Iterix-backlog-filter-priority-${currentProjectId}`) || "";
  });
  const [type, setType] = useState(() => {
    return localStorage.getItem(`Iterix-backlog-filter-type-${currentProjectId}`) || "";
  });
  const [assigneeId, setAssigneeId] = useState(() => {
    return localStorage.getItem(`Iterix-backlog-filter-assignee-${currentProjectId}`) || "";
  });
  const [statusFilter, setStatusFilter] = useState(filterParam === "backlog" ? "Backlog" : "");
  const [open, setOpen] = useState(false);

  // Sync state when project changes
  useEffect(() => {
    if (currentProjectId) {
      setQ(localStorage.getItem(`Iterix-backlog-filter-q-${currentProjectId}`) || "");
      setPriority(localStorage.getItem(`Iterix-backlog-filter-priority-${currentProjectId}`) || "");
      setType(localStorage.getItem(`Iterix-backlog-filter-type-${currentProjectId}`) || "");
      setAssigneeId(localStorage.getItem(`Iterix-backlog-filter-assignee-${currentProjectId}`) || "");
    }
  }, [currentProjectId]);

  // Sync status filter when query parameter changes
  useEffect(() => {
    if (filterParam === "backlog") {
      setStatusFilter("Backlog");
    }
  }, [filterParam]);

  const handleQChange = (val) => {
    setQ(val);
    localStorage.setItem(`Iterix-backlog-filter-q-${currentProjectId}`, val);
  };
  const handlePriorityChange = (val) => {
    setPriority(val);
    localStorage.setItem(`Iterix-backlog-filter-priority-${currentProjectId}`, val);
  };
  const handleTypeChange = (val) => {
    setType(val);
    localStorage.setItem(`Iterix-backlog-filter-type-${currentProjectId}`, val);
  };
  const handleAssigneeChange = (val) => {
    setAssigneeId(val);
    localStorage.setItem(`Iterix-backlog-filter-assignee-${currentProjectId}`, val);
  };

  const backlog = useMemo(() => tasks.filter(t => {
    if (t.sprintId) return false;
    if (statusFilter && t.status !== statusFilter) return false;
    if (priority && t.priority !== priority) return false;
    if (type && t.type !== type) return false;
    if (assigneeId) {
      if (assigneeId === "unassigned") {
        if (t.assigneeId) return false;
      } else {
        if (t.assigneeId !== assigneeId) return false;
      }
    }
    if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [tasks, q, priority, type, assigneeId, statusFilter]);

  const addToSprint = (t) => {
    const active = sprints.find(s => s.status === "active");
    if (!active) return;
    dispatch(updateTask({ id: t.id, sprintId: active.id }));
    dispatch(moveTask({ id: t.id, status: "Todo", by: user?.id }));
    dispatch(moveToSprintAsync({ taskId: t.id, sprintId: active.id }));
    dispatch(changeTaskStatusAsync({ taskId: t.id, status: "Todo" }));
  };

  if (!currentWorkspaceId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="font-display text-2xl font-bold">No workspace selected</h2>
        <p className="text-sm text-muted-foreground mt-2">Please select or create a workspace to view unscheduled work.</p>
      </div>
    );
  }

  if (!currentProjectId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-2xl">
        <div className="w-16 h-16 rounded-2xl bg-[color:var(--primary)]/10 text-[color:var(--primary)] flex items-center justify-center mb-6">
          <FolderKanban size={28} />
        </div>
        <h2 className="font-display text-2xl font-bold">No project selected</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Please select a project from the workspace menu in the left pane to view its unscheduled work.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs text-muted-foreground tracking-wider uppercase font-semibold">
            Project: {currentProject?.projectKey} · {currentProject?.name}
          </div>
          <h1 className="font-display text-3xl font-bold mt-1">Unscheduled Work</h1>
          <p className="text-sm text-muted-foreground mt-1">Unscheduled tasks in this project. Move to Todo to start working, or schedule into a sprint.</p>
        </div>
        {can(role, ACTIONS.CREATE_TASK) && (
          <Button onClick={() => setOpen(true)}><Plus size={15} /> New task</Button>
        )}
      </div>

      <GlassCard className="p-3 md:p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => handleQChange(e.target.value)} className="h-10 pl-9" placeholder="Search tasks…" />
          </div>
          <Select className="w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Unscheduled</option>
            <option value="Backlog">Backlog Status Only</option>
            <option value="Todo">Todo Status Only</option>
            <option value="In Progress">In Progress Only</option>
            <option value="In Review">In Review Only</option>
            <option value="Done">Done Only</option>
          </Select>
          <Select className="w-40" value={assigneeId} onChange={(e) => handleAssigneeChange(e.target.value)}>
            <option value="">Any assignee</option>
            <option value="unassigned">Unassigned</option>
            {projectMembers.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
          <Select className="w-36" value={priority} onChange={(e) => handlePriorityChange(e.target.value)}>
            <option value="">Any priority</option>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </Select>
          <Select className="w-32" value={type} onChange={(e) => handleTypeChange(e.target.value)}>
            <option value="">Any type</option>
            {TASK_TYPES.map(t => <option key={t}>{t}</option>)}
          </Select>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        {backlog.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            <Filter className="mx-auto mb-3 opacity-40" />
            No tasks match your filters.
          </div>
        ) : (
          <div className="divide-y divide-border">
            <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              <div className="col-span-4">Title</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-1">Priority</div>
              <div className="col-span-1">Pts</div>
              <div className="col-span-1">Due Date</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            {backlog.map((t) => {
              const isAssignee = t.assigneeId === user?.id;
              const canChangeStatus = isProjectLead || isAssignee;
              return (
                <motion.div
                  key={t.id}
                  whileHover={{ backgroundColor: "rgba(255,96,68,0.04)" }}
                  className="grid grid-cols-12 gap-3 px-4 py-3 items-center"
                >
                  <button onClick={() => dispatch(openTask(t.id))} className="col-span-12 md:col-span-4 text-left text-sm font-medium hover:text-[color:var(--primary)] truncate">
                    {t.title}
                  </button>
                  <div className="col-span-3 md:col-span-2">
                    <Select
                      value={t.status}
                      disabled={!canChangeStatus}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        dispatch(moveTask({ id: t.id, status: newStatus, by: user?.id }));
                        dispatch(changeTaskStatusAsync({ taskId: t.id, status: newStatus }));
                      }}
                      className="h-8 py-0 px-2 text-xs w-28"
                    >
                      <option value="Backlog">Backlog</option>
                      <option value="Todo">Todo</option>
                      <option value="In Progress">In Progress</option>
                      <option value="In Review">In Review</option>
                      {isProjectLead && <option value="Done">Done</option>}
                    </Select>
                  </div>
                  <div className="col-span-3 md:col-span-2"><Badge tone={typeTone(t.type)} className="border-transparent">{t.type}</Badge></div>
                  <div className="col-span-3 md:col-span-1"><Badge tone={priorityTone(t.priority)}>{t.priority}</Badge></div>
                  <div className="col-span-2 md:col-span-1 text-sm text-muted-foreground">{t.points ?? "—"}</div>
                  <div className="col-span-3 md:col-span-1 text-xs text-muted-foreground flex items-center">
                    {t.dueDate ? (
                      <span className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded",
                        new Date(t.dueDate) < new Date() ? "bg-red-500/10 text-red-500 font-medium" : "text-muted-foreground"
                      )}>
                        <Calendar size={12} />
                        {new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    ) : (
                      <span className="opacity-40">—</span>
                    )}
                  </div>
                  <div className="col-span-9 md:col-span-1 flex justify-end gap-1">
                    {isProjectLead && (
                      <button
                        onClick={() => addToSprint(t)}
                        disabled={!activeSprint}
                        title={activeSprint ? `Move to active sprint: ${activeSprint.name}` : "No active sprint in this project"}
                        className={cn(
                          "p-1.5 rounded-md hover:bg-foreground/5 transition-colors",
                          activeSprint ? "text-muted-foreground hover:text-[color:var(--primary)]" : "text-muted-foreground/30 cursor-not-allowed"
                        )}
                      >
                        <ArrowRight size={15} />
                      </button>
                    )}
                    {can(role, ACTIONS.DELETE_TASK) && (
                      <button onClick={() => dispatch(deleteTaskAsync(t.id))} title="Delete"
                        className="p-1.5 rounded-md hover:bg-foreground/5 text-muted-foreground hover:text-red-500">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </GlassCard>

      <CreateTaskModal open={open} onClose={() => setOpen(false)} projectId={currentProjectId} defaultStatus="Backlog" />
    </div>
  );
}
