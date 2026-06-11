import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Search, Filter, Plus, ArrowRight, Trash2 } from "lucide-react";
import Button from "@/components/common/Button";
import { Input, Select, Badge, GlassCard } from "@/components/common/Primitives";
import Avatar from "@/components/common/Avatar";
import { openTask } from "@/store/slices/uiSlice";
import { moveTask, deleteTask, updateTask } from "@/store/slices/tasksSlice";
import { priorityTone, typeTone } from "@/lib/format";
import { PRIORITIES, TASK_TYPES } from "@/store/seed";
import { can, ACTIONS } from "@/lib/rbac";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";

export default function Backlog() {
  const dispatch = useDispatch();
  const tasks = useSelector(s => s.tasks.tasks);
  const projects = useSelector(s => s.projects.projects);
  const sprints = useSelector(s => s.sprints.sprints);
  const members = useSelector(s => s.org.members);
  const user = useSelector(s => s.auth.user);
  const me = members.find(m => m.id === user?.id);
  const role = me?.role;

  const [q, setQ] = useState("");
  const [priority, setPriority] = useState("");
  const [type, setType] = useState("");
  const [projId, setProjId] = useState("");
  const [open, setOpen] = useState(false);

  const backlog = useMemo(() => tasks.filter(t => {
    if (t.status !== "Backlog") return false;
    if (projId && t.projectId !== projId) return false;
    if (priority && t.priority !== priority) return false;
    if (type && t.type !== type) return false;
    if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [tasks, q, priority, type, projId]);

  const addToSprint = (t) => {
    const active = sprints.find(s => s.projectId === t.projectId && s.status === "active");
    if (!active) return;
    dispatch(updateTask({ id: t.id, sprintId: active.id }));
    dispatch(moveTask({ id: t.id, status: "Todo", by: user?.id }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Backlog</h1>
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
          <Select className="w-40" value={projId} onChange={(e) => setProjId(e.target.value)}>
            <option value="">All projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
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
              <div className="col-span-5">Title</div>
              <div className="col-span-1">Type</div>
              <div className="col-span-1">Priority</div>
              <div className="col-span-1">Pts</div>
              <div className="col-span-2">Project</div>
              <div className="col-span-1">Assignee</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            {backlog.map((t) => {
              const assignee = members.find(m => m.id === t.assigneeId);
              const project = projects.find(p => p.id === t.projectId);
              return (
                <motion.div
                  key={t.id}
                  whileHover={{ backgroundColor: "rgba(255,96,68,0.04)" }}
                  className="grid grid-cols-12 gap-3 px-4 py-3 items-center"
                >
                  <button onClick={() => dispatch(openTask(t.id))} className="col-span-12 md:col-span-5 text-left text-sm font-medium hover:text-[color:var(--primary)] truncate">
                    {t.title}
                  </button>
                  <div className="col-span-3 md:col-span-1"><Badge tone={typeTone(t.type)} className="border-transparent">{t.type}</Badge></div>
                  <div className="col-span-3 md:col-span-1"><Badge tone={priorityTone(t.priority)}>{t.priority}</Badge></div>
                  <div className="col-span-2 md:col-span-1 text-sm text-muted-foreground">{t.points ?? "—"}</div>
                  <div className="col-span-4 md:col-span-2 text-xs text-muted-foreground truncate">{project?.name || "—"}</div>
                  <div className="col-span-4 md:col-span-1">
                    {assignee ? <div className="flex items-center gap-2"><Avatar size={20} name={assignee.name} color={assignee.avatarColor} /><span className="text-xs truncate hidden lg:inline">{assignee.name.split(" ")[0]}</span></div> : <span className="text-xs text-muted-foreground">—</span>}
                  </div>
                  <div className="col-span-8 md:col-span-1 flex justify-end gap-1">
                    {can(role, ACTIONS.MOVE_TASK_ANY) && (
                      <button onClick={() => addToSprint(t)} title="Add to active sprint"
                        className="p-1.5 rounded-md hover:bg-foreground/5 text-muted-foreground hover:text-[color:var(--primary)]">
                        <ArrowRight size={15} />
                      </button>
                    )}
                    {can(role, ACTIONS.DELETE_TASK) && (
                      <button onClick={() => dispatch(deleteTask(t.id))} title="Delete"
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

      <CreateTaskModal open={open} onClose={() => setOpen(false)} projectId={projId || projects[0]?.id} defaultStatus="Backlog" />
    </div>
  );
}
