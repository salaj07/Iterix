import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Search, Filter, Plus, ArrowRight, Trash2, FolderKanban } from "lucide-react";
import Button from "@/components/common/Button";
import { Input, Select, Badge, GlassCard } from "@/components/common/Primitives";
import Avatar from "@/components/common/Avatar";
import { openTask } from "@/store/slices/uiSlice";
import { moveTask, deleteTaskAsync, updateTask, moveToSprintAsync, changeTaskStatusAsync } from "@/store/slices/tasksSlice";
import { priorityTone, typeTone } from "@/lib/format";
import { PRIORITIES, TASK_TYPES } from "@/store/seed";
import { can, ACTIONS } from "@/lib/rbac";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";

export default function Backlog() {
  const dispatch = useDispatch();
  const currentWorkspaceId = useSelector(s => s.workspace.currentWorkspaceId);
  const currentProjectId = useSelector(s => s.projects.currentProjectId);
  const allProjects = useSelector(s => s.projects.projects) || [];
  const projects = allProjects.filter(p => p && (p.workspace === currentWorkspaceId || p.workspaceId === currentWorkspaceId));
  const currentProject = projects.find(p => p && (p.id === currentProjectId || p._id === currentProjectId));

  const allTasks = useSelector(s => s.tasks.tasks) || [];
  const tasks = allTasks.filter(t => t && t.projectId === currentProjectId);

  const allSprints = useSelector(s => s.sprints.sprints) || [];
  const sprints = allSprints.filter(s => s && s.projectId === currentProjectId);

  const projectMembers = useSelector(s => s.projects.projectMembers) || [];
  const workspaceMembers = useSelector(s => s.org.members) || [];
  const user = useSelector(s => s.auth.user);
  
  // Find current user's workspace role
  const myWorkspaceMember = workspaceMembers.find(m => m && m.id === user?.id);
  const role = myWorkspaceMember?.role;

  const [q, setQ] = useState("");
  const [priority, setPriority] = useState("");
  const [type, setType] = useState("");
  const [open, setOpen] = useState(false);

  const backlog = useMemo(() => tasks.filter(t => {
    if (t.status !== "Backlog") return false;
    if (priority && t.priority !== priority) return false;
    if (type && t.type !== type) return false;
    if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [tasks, q, priority, type]);

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
        <p className="text-sm text-muted-foreground mt-2">Please select or create a workspace to view your backlog.</p>
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
          Please select a project from the workspace menu in the left pane to view its backlog.
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
          <h1 className="font-display text-3xl font-bold mt-1">Backlog</h1>
          <p className="text-sm text-muted-foreground mt-1">All unscheduled work. Prioritize and pull into a sprint.</p>
        </div>
        {can(role, ACTIONS.CREATE_TASK) && (
          <Button onClick={() => setOpen(true)}><Plus size={15} /> New backlog item</Button>
        )}
      </div>

      <GlassCard className="p-3 md:p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} className="h-10 pl-9" placeholder="Search backlog…" />
          </div>
          <Select className="w-36" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">Any priority</option>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </Select>
          <Select className="w-32" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Any type</option>
            {TASK_TYPES.map(t => <option key={t}>{t}</option>)}
          </Select>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        {backlog.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            <Filter className="mx-auto mb-3 opacity-40" />
            No backlog items match your filters.
          </div>
        ) : (
          <div className="divide-y divide-border">
            <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              <div className="col-span-6">Title</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Priority</div>
              <div className="col-span-1">Pts</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            {backlog.map((t) => {
              // Find assignee in workspaceMembers or projectMembers
              const assignee = workspaceMembers.find(m => m.id === t.assigneeId);
              return (
                <motion.div
                  key={t.id}
                  whileHover={{ backgroundColor: "rgba(255,96,68,0.04)" }}
                  className="grid grid-cols-12 gap-3 px-4 py-3 items-center"
                >
                  <button onClick={() => dispatch(openTask(t.id))} className="col-span-12 md:col-span-6 text-left text-sm font-medium hover:text-[color:var(--primary)] truncate">
                    {t.title}
                  </button>
                  <div className="col-span-3 md:col-span-2"><Badge tone={typeTone(t.type)} className="border-transparent">{t.type}</Badge></div>
                  <div className="col-span-3 md:col-span-2"><Badge tone={priorityTone(t.priority)}>{t.priority}</Badge></div>
                  <div className="col-span-2 md:col-span-1 text-sm text-muted-foreground">{t.points ?? "—"}</div>
                  <div className="col-span-4 md:col-span-1 flex justify-end gap-1">
                    {can(role, ACTIONS.MOVE_TASK_ANY) && (
                      <button onClick={() => addToSprint(t)} title="Add to active sprint"
                        className="p-1.5 rounded-md hover:bg-foreground/5 text-muted-foreground hover:text-[color:var(--primary)]">
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
