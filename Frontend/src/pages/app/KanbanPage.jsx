import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Plus } from "lucide-react";
import Button from "@/components/common/Button";
import { Select } from "@/components/common/Primitives";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";

export default function KanbanPage() {
  const currentWorkspaceId = useSelector(s => s.workspace.currentWorkspaceId);
  const allProjects = useSelector(s => s.projects.projects);
  const projects = allProjects.filter(p => (p.workspace || p.workspaceId) === currentWorkspaceId);

  const [projId, setProjId] = useState(() => {
    return localStorage.getItem(`Iterix-current-project-${currentWorkspaceId}`) || "";
  });
  const [open, setOpen] = useState(false);
  const [defStatus, setDefStatus] = useState("Backlog");

  // Sync selected project ID when the projects list updates (e.g. after switching workspace or reload)
  useEffect(() => {
    if (projects.length > 0) {
      const saved = localStorage.getItem(`Iterix-current-project-${currentWorkspaceId}`);
      if (saved && projects.some(p => p.id === saved)) {
        setProjId(saved);
      } else if (saved === "") {
        setProjId("");
      } else {
        const defaultId = projects[0]?.id || "";
        setProjId(defaultId);
        if (defaultId) {
          localStorage.setItem(`Iterix-current-project-${currentWorkspaceId}`, defaultId);
        }
      }
    } else {
      setProjId("");
    }
  }, [projects, currentWorkspaceId]);

  const handleProjectChange = (val) => {
    setProjId(val);
    localStorage.setItem(`Iterix-current-project-${currentWorkspaceId}`, val);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Kanban</h1>
          <p className="text-sm text-muted-foreground mt-1">Drag tasks to update status.</p>
        </div>
        <div className="flex items-center gap-2">
          {projects.length > 1 && (
            <Select className="w-56" value={projId} onChange={(e) => handleProjectChange(e.target.value)}>
              <option value="">All projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          )}
          <Button onClick={() => { setDefStatus("Todo"); setOpen(true); }} disabled={projects.length === 0}><Plus size={15} /> New task</Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="glass p-12 text-center text-sm text-muted-foreground">Create a project first to see your Kanban board.</div>
      ) : (
        <KanbanBoard projectId={projId || null} onCreateTask={(s) => { setDefStatus(s); setOpen(true); }} />
      )}

      <CreateTaskModal open={open} onClose={() => setOpen(false)} projectId={projId || projects[0]?.id} defaultStatus={defStatus} />
    </div>
  );
}
