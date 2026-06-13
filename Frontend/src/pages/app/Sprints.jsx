import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { Plus, Play, Check, Calendar, Loader2 } from "lucide-react";
import { GlassCard, Badge, Input, Label, Select, Textarea } from "@/components/common/Primitives";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import { formatDate } from "@/lib/format";
import { fetchSprints, createSprintAsync, startSprintAsync, completeSprintAsync } from "@/store/slices/sprintsSlice";

export default function Sprints() {
  const dispatch = useDispatch();
  const currentWorkspaceId = useSelector((s) => s.workspace.currentWorkspaceId);
  const allProjects = useSelector((s) => s.projects.projects);
  const projects = allProjects.filter((p) => (p.workspace || p.workspaceId) === currentWorkspaceId);

  const { sprints: allSprints, loading } = useSelector((s) => s.sprints);
  const projectIds = projects.map((p) => p.id || p._id);
  const sprints = allSprints
    .filter((s) => projectIds.includes(s.projectId))
    .sort((a, b) => new Date(b.createdAt || b.startDate || 0) - new Date(a.createdAt || a.startDate || 0));

  const allTasks = useSelector((s) => s.tasks.tasks);
  const tasks = allTasks.filter((t) => projectIds.includes(t.projectId));

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const firstProjectId = projects[0]?._id || projects[0]?.id || "";
  const [form, setForm] = useState({
    projectId: "",
    name: "",
    goal: "",
    startDate: "",
    endDate: "",
  });

  // When projects load or switch workspace, update the default projectId in the form
  useEffect(() => {
    setForm((f) => ({ ...f, projectId: firstProjectId }));
  }, [firstProjectId]);

  // Fetch sprints for the first project of the workspace on mount or workspace change
  useEffect(() => {
    if (firstProjectId) {
      dispatch(fetchSprints(firstProjectId));
    }
  }, [dispatch, firstProjectId]);

  const create = async () => {
    if (!form.name.trim() || !form.projectId) return;
    if (!form.startDate || !form.endDate) {
      toast.error("Please set start and end dates");
      return;
    }
    setCreating(true);
    const result = await dispatch(
      createSprintAsync({
        projectId: form.projectId,
        name: form.name.trim(),
        goal: form.goal,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      })
    );
    if (createSprintAsync.fulfilled.match(result)) {
      toast.success("Sprint created");
      setForm({ projectId: firstProjectId, name: "", goal: "", startDate: "", endDate: "" });
      setOpen(false);
    } else {
      const errors = result.payload?.errors;
      toast.error(errors?.map((e) => e.message).join(", ") || result.payload?.message || "Failed to create sprint");
    }
    setCreating(false);
  };

  const handleStart = async (sprint) => {
    const id = sprint._id || sprint.id;
    const result = await dispatch(startSprintAsync(id));
    if (startSprintAsync.fulfilled.match(result)) {
      toast.success("Sprint started");
    } else {
      toast.error(result.payload?.message || "Failed to start sprint");
    }
  };

  const handleComplete = async (sprint) => {
    const id = sprint._id || sprint.id;
    const result = await dispatch(completeSprintAsync(id));
    if (completeSprintAsync.fulfilled.match(result)) {
      toast.success("Sprint completed");
    } else {
      toast.error(result.payload?.message || "Failed to complete sprint");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Sprints</h1>
          <p className="text-sm text-muted-foreground mt-1">Plan and run iterations across projects.</p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={!projects.length}>
          <Plus size={16} /> New sprint
        </Button>
      </div>

      {loading && sprints.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      ) : sprints.length === 0 ? (
        <GlassCard className="py-16 text-center">
          <p className="text-sm text-muted-foreground">No sprints yet. Create one to start planning.</p>
        </GlassCard>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {sprints.map((s) => {
            const id = s._id || s.id;
            const proj = projects.find((p) => (p._id || p.id) === s.projectId);
            const sTasks = tasks.filter((t) => t.sprintId === id);
            const done = sTasks.filter((t) => t.status === "Done").length;
            const points = sTasks.reduce((a, t) => a + (t.points || 0), 0);
            const pct = sTasks.length ? Math.round((done / sTasks.length) * 100) : 0;
            return (
              <GlassCard key={id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] tracking-wider uppercase text-muted-foreground">
                      {proj?.key} · {proj?.name}
                    </div>
                    <h3 className="font-display font-bold text-lg mt-1">{s.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{s.goal}</p>
                  </div>
                  <Badge tone={
                    s.status === "active"
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : s.status === "completed"
                      ? "bg-foreground/10 text-muted-foreground border-foreground/15"
                      : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  }>
                    {s.status}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <KV label="Tasks" value={sTasks.length} />
                  <KV label="Points" value={points} />
                  <KV label="Done" value={`${done}/${sTasks.length}`} />
                </div>

                <div className="mt-4">
                  <div className="h-1.5 rounded-full bg-foreground/8 overflow-hidden">
                    <div className="h-full bg-[color:var(--primary)]" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1.5">
                    <Calendar size={11} />
                    {formatDate(s.startDate)} → {formatDate(s.endDate)} · {pct}%
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  {s.status === "planned" && (
                    <Button size="sm" onClick={() => handleStart(s)}>
                      <Play size={14} /> Start
                    </Button>
                  )}
                  {s.status === "active" && (
                    <Button size="sm" variant="outline" onClick={() => handleComplete(s)}>
                      <Check size={14} /> Complete
                    </Button>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New sprint"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={!form.name.trim() || !form.projectId || creating}>
              {creating ? <Loader2 className="animate-spin" size={14} /> : null}
              Create
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Project</Label>
            <Select className="mt-1.5" value={form.projectId} onChange={(e) => {
              setForm({ ...form, projectId: e.target.value });
              dispatch(fetchSprints(e.target.value));
            }}>
              {projects.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Sprint name</Label>
            <Input className="mt-1.5" autoFocus value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Sprint 1 — MVP" />
          </div>
          <div>
            <Label>Goal</Label>
            <Textarea className="mt-1.5" rows={2} value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start</Label>
              <Input className="mt-1.5" type="date" value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <Label>End</Label>
              <Input className="mt-1.5" type="date" value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function KV({ label, value }) {
  return (
    <div className="rounded-[12px] bg-foreground/[0.03] py-2.5">
      <div className="text-base font-display font-bold">{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{label}</div>
    </div>
  );
}
