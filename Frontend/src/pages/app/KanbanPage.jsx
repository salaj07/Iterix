import { useState } from "react";
import { useSelector } from "react-redux";
import { Plus } from "lucide-react";
import Button from "@/components/common/Button";
import { Select } from "@/components/common/Primitives";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";

export default function KanbanPage() {
  const projects = useSelector(s => s.projects.projects);
  const [projId, setProjId] = useState(projects[0]?.id || "");
  const [open, setOpen] = useState(false);
  const [defStatus, setDefStatus] = useState("Backlog");

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Kanban</h1>
          <p className="text-sm text-muted-foreground mt-1">Drag tasks to update status.</p>
        </div>
        <div className="flex items-center gap-2">
          {projects.length > 1 && (
            <Select className="w-56" value={projId} onChange={(e) => setProjId(e.target.value)}>
              <option value="">All projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          )}
          <Button onClick={() => { setDefStatus("Todo"); setOpen(true); }}><Plus size={15} /> New task</Button>
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
