import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Plus, FolderKanban, Calendar, Search } from "lucide-react";
import Button from "@/components/common/Button";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import { fetchSprints } from "@/store/slices/sprintsSlice";
import { fetchProjectTasks } from "@/store/slices/tasksSlice";
import { Select, GlassCard, Input, Label } from "@/components/common/Primitives";
import { PRIORITIES, TASK_TYPES } from "@/store/seed";

export default function KanbanPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentWorkspaceId = useSelector(s => s.workspace.currentWorkspaceId);
  const currentProjectId = useSelector(s => s.projects.currentProjectId);
  const allProjects = useSelector(s => s.projects.projects) || [];
  const projects = allProjects.filter(p => p && (p.workspace === currentWorkspaceId || p.workspaceId === currentWorkspaceId));
  const currentProject = projects.find(p => p && (p.id === currentProjectId || p._id === currentProjectId));

  const allSprints = useSelector(s => s.sprints.sprints) || [];
  const sprints = allSprints.filter(s => s && s.projectId === currentProjectId);
  const activeSprint = sprints.find(s => s.status === "active");

  const workspaceMembers = useSelector(s => s.org.members) || [];

  const [selectedSprintId, setSelectedSprintId] = useState(() => {
    if (currentProjectId) {
      const saved = localStorage.getItem(`Iterix-kanban-sprint-${currentProjectId}`);
      if (saved) return saved;
    }
    return "active";
  });
  const [open, setOpen] = useState(false);
  const [defStatus, setDefStatus] = useState("Backlog");

  // Filters State with LocalStorage persistence
  const [q, setQ] = useState(() => {
    return localStorage.getItem(`Iterix-kanban-filter-q-${currentProjectId}`) || "";
  });
  const [priority, setPriority] = useState(() => {
    return localStorage.getItem(`Iterix-kanban-filter-priority-${currentProjectId}`) || "";
  });
  const [assigneeId, setAssigneeId] = useState(() => {
    return localStorage.getItem(`Iterix-kanban-filter-assignee-${currentProjectId}`) || "";
  });
  const [type, setType] = useState(() => {
    return localStorage.getItem(`Iterix-kanban-filter-type-${currentProjectId}`) || "";
  });

  useEffect(() => {
    if (currentProjectId) {
      dispatch(fetchSprints(currentProjectId));
    }
  }, [dispatch, currentProjectId]);

  // Sync / Auto-select active sprint and filter states on load
  useEffect(() => {
    if (!currentProjectId) return;
    const saved = localStorage.getItem(`Iterix-kanban-sprint-${currentProjectId}`);
    if (saved) {
      const exists = saved === "backlog" || sprints.some(s => s.id === saved || s._id === saved);
      if (exists) {
        setSelectedSprintId(saved);
      }
    } else {
      if (activeSprint) {
        setSelectedSprintId(activeSprint.id);
      } else {
        setSelectedSprintId("backlog");
      }
    }

    setQ(localStorage.getItem(`Iterix-kanban-filter-q-${currentProjectId}`) || "");
    setPriority(localStorage.getItem(`Iterix-kanban-filter-priority-${currentProjectId}`) || "");
    setAssigneeId(localStorage.getItem(`Iterix-kanban-filter-assignee-${currentProjectId}`) || "");
    setType(localStorage.getItem(`Iterix-kanban-filter-type-${currentProjectId}`) || "");
  }, [activeSprint, currentProjectId, sprints.length]);

  const handleSprintChange = (val) => {
    setSelectedSprintId(val);
    if (currentProjectId) {
      localStorage.setItem(`Iterix-kanban-sprint-${currentProjectId}`, val);
    }
  };

  const handleQChange = (val) => {
    setQ(val);
    localStorage.setItem(`Iterix-kanban-filter-q-${currentProjectId}`, val);
  };

  const handlePriorityChange = (val) => {
    setPriority(val);
    localStorage.setItem(`Iterix-kanban-filter-priority-${currentProjectId}`, val);
  };

  const handleAssigneeChange = (val) => {
    setAssigneeId(val);
    localStorage.setItem(`Iterix-kanban-filter-assignee-${currentProjectId}`, val);
  };

  const handleTypeChange = (val) => {
    setType(val);
    localStorage.setItem(`Iterix-kanban-filter-type-${currentProjectId}`, val);
  };

  if (!currentWorkspaceId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="font-display text-2xl font-bold">No workspace selected</h2>
        <p className="text-sm text-muted-foreground mt-2">Please select or create a workspace to view your board.</p>
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
          Please select a project from the workspace menu in the left pane to view its Kanban board.
        </p>
      </div>
    );
  }

  const resolvedSprintId = selectedSprintId === "active" ? (activeSprint?.id || "backlog") : selectedSprintId;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs text-muted-foreground tracking-wider uppercase font-semibold">
            Project: {currentProject?.projectKey} · {currentProject?.name}
          </div>
          <h1 className="font-display text-3xl font-bold mt-1">Kanban Board</h1>
          <p className="text-sm text-muted-foreground mt-1">Drag tasks to update status.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            className="w-48 h-9 text-xs"
            value={selectedSprintId}
            onChange={(e) => handleSprintChange(e.target.value)}
          >
            {activeSprint ? (
              <option value={activeSprint.id}>Active: {activeSprint.name}</option>
            ) : (
              <option value="active" disabled>No active sprint</option>
            )}
            <option value="backlog">Backlog / Unscheduled</option>
            {sprints
              .filter(s => s.id !== activeSprint?.id)
              .map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status})
                </option>
              ))}
          </Select>
          <Button onClick={() => { setDefStatus("Todo"); setOpen(true); }}><Plus size={15} /> New task</Button>
        </div>
      </div>

      {/* Filters bar */}
      <GlassCard className="p-3 md:p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => handleQChange(e.target.value)} className="h-10 pl-9" placeholder="Search tasks on board…" />
          </div>
          <Select className="w-40" value={assigneeId} onChange={(e) => handleAssigneeChange(e.target.value)}>
            <option value="">Any assignee</option>
            <option value="unassigned">Unassigned</option>
            {workspaceMembers.map(m => (
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

      {selectedSprintId === "backlog" && (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-[color:var(--primary)]/20 bg-[color:var(--primary)]/5 text-sm text-[color:var(--primary)] gap-4 animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[color:var(--primary)] animate-pulse" />
            <span>
              Backlog status tasks are not shown on the Kanban board.
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => navigate("/app/unscheduled?filter=backlog")}
            className="text-xs shrink-0 bg-[color:var(--primary)] hover:bg-[color:var(--primary)]/90 text-white border-transparent"
          >
            View Backlog Tasks
          </Button>
        </div>
      )}

      <KanbanBoard
        projectId={currentProjectId}
        sprintId={resolvedSprintId}
        search={q}
        assigneeId={assigneeId}
        priority={priority}
        type={type}
        onCreateTask={(s) => { setDefStatus(s); setOpen(true); }}
      />

      <CreateTaskModal
        open={open}
        onClose={() => setOpen(false)}
        projectId={currentProjectId}
        defaultStatus={defStatus}
        defaultSprintId={resolvedSprintId}
      />
    </div>
  );
}
