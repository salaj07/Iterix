import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, FolderKanban, Calendar } from "lucide-react";
import Button from "@/components/common/Button";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import { fetchSprints } from "@/store/slices/sprintsSlice";
import { Select } from "@/components/common/Primitives";

export default function KanbanPage() {
  const dispatch = useDispatch();
  const currentWorkspaceId = useSelector(s => s.workspace.currentWorkspaceId);
  const currentProjectId = useSelector(s => s.projects.currentProjectId);
  const allProjects = useSelector(s => s.projects.projects) || [];
  const projects = allProjects.filter(p => p && (p.workspace === currentWorkspaceId || p.workspaceId === currentWorkspaceId));
  const currentProject = projects.find(p => p && (p.id === currentProjectId || p._id === currentProjectId));

  const allSprints = useSelector(s => s.sprints.sprints) || [];
  const sprints = allSprints.filter(s => s && s.projectId === currentProjectId);
  const activeSprint = sprints.find(s => s.status === "active");

  const [selectedSprintId, setSelectedSprintId] = useState(() => {
    if (currentProjectId) {
      const saved = localStorage.getItem(`Iterix-kanban-sprint-${currentProjectId}`);
      if (saved) return saved;
    }
    return "active";
  });
  const [open, setOpen] = useState(false);
  const [defStatus, setDefStatus] = useState("Backlog");

  useEffect(() => {
    if (currentProjectId) {
      dispatch(fetchSprints(currentProjectId));
    }
  }, [dispatch, currentProjectId]);

  // Sync / Auto-select active sprint on load, otherwise fallback to backlog
  useEffect(() => {
    if (!currentProjectId) return;
    const saved = localStorage.getItem(`Iterix-kanban-sprint-${currentProjectId}`);
    if (saved) {
      // If the saved sprint exists in the fetched list (or is 'backlog'), keep it
      const exists = saved === "backlog" || sprints.some(s => s.id === saved || s._id === saved);
      if (exists) {
        setSelectedSprintId(saved);
        return;
      }
    }
    if (activeSprint) {
      setSelectedSprintId(activeSprint.id);
    } else {
      setSelectedSprintId("backlog");
    }
  }, [activeSprint, currentProjectId, sprints.length]);

  const handleSprintChange = (val) => {
    setSelectedSprintId(val);
    if (currentProjectId) {
      localStorage.setItem(`Iterix-kanban-sprint-${currentProjectId}`, val);
    }
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

      <KanbanBoard
        projectId={currentProjectId}
        sprintId={resolvedSprintId}
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
