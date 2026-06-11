import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { Plus, Play, Check, Calendar } from "lucide-react";
import { GlassCard, Badge, Input, Label, Select, Textarea } from "@/components/common/Primitives";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import { formatDate } from "@/lib/format";
import { createSprint, startSprint, completeSprint } from "@/store/slices/sprintsSlice";
import { push as pushNotif } from "@/store/slices/notificationsSlice";

export default function Sprints() {
  const dispatch = useDispatch();
  const sprints = useSelector(s => s.sprints.sprints);
  const projects = useSelector(s => s.projects.projects);
  const tasks = useSelector(s => s.tasks.tasks);
  const members = useSelector(s => s.org.members);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ projectId: projects[0]?.id || "", name: "", goal: "", startDate: "", endDate: "" });

  const create = () => {
    if (!form.name.trim() || !form.projectId) return;
    dispatch(createSprint({
      projectId: form.projectId, name: form.name.trim(), goal: form.goal,
      startDate: form.startDate ? new Date(form.startDate).getTime() : Date.now(),
      endDate: form.endDate ? new Date(form.endDate).getTime() : Date.now() + 14 * 86400000,
    }));
    toast.success("Sprint created");
    setForm({ projectId: projects[0]?.id || "", name: "", goal: "", startDate: "", endDate: "" });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Sprints</h1>
          <p className="text-sm text-muted-foreground mt-1">Plan and run iterations across projects.</p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={!projects.length}><Plus size={16} /> New sprint</Button>
      </div>

      {sprints.length === 0 ? (
        <GlassCard className="py-16 text-center">
          <p className="text-sm text-muted-foreground">No sprints yet. Create one to start planning.</p>
        </GlassCard>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {sprints.map(s => {
            const proj = projects.find(p => p.id === s.projectId);
            const sTasks = tasks.filter(t => t.sprintId === s.id);
            const done = sTasks.filter(t => t.status === "Done").length;
            const points = sTasks.reduce((a, t) => a + (t.points || 0), 0);
            const pct = sTasks.length ? Math.round((done / sTasks.length) * 100) : 0;
            return (
              <GlassCard key={s.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] tracking-wider uppercase text-muted-foreground">{proj?.key} · {proj?.name}</div>
                    <h3 className="font-display font-bold text-lg mt-1">{s.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{s.goal}</p>
                  </div>
                  <Badge tone={s.status === "active" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : s.status === "completed" ? "bg-foreground/10 text-muted-foreground border-foreground/15" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}>
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
                    <Calendar size={11} /> {formatDate(s.startDate)} → {formatDate(s.endDate)} · {pct}%
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  {s.status === "planned" && <Button size="sm" onClick={() => { dispatch(startSprint(s.id)); members.forEach(m => dispatch(pushNotif({ userId: m.id, type: "sprint_started", title: "Sprint started", body: `${s.name} is now active.` }))); toast.success("Sprint started"); }}><Play size={14} /> Start</Button>}
                  {s.status === "active" && <Button size="sm" variant="outline" onClick={() => { dispatch(completeSprint(s.id)); toast.success("Sprint completed"); }}><Check size={14} /> Complete</Button>}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New sprint"
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create} disabled={!form.name.trim() || !form.projectId}>Create</Button></div>}>
        <div className="space-y-4">
          <div><Label>Project</Label><Select className="mt-1.5" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></div>
          <div><Label>Sprint name</Label><Input className="mt-1.5" autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sprint 15 — Onboarding polish" /></div>
          <div><Label>Goal</Label><Textarea className="mt-1.5" rows={2} value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start</Label><Input className="mt-1.5" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
            <div><Label>End</Label><Input className="mt-1.5" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function KV({ label, value }) {
  return <div className="rounded-[12px] bg-foreground/[0.03] py-2.5"><div className="text-base font-display font-bold">{value}</div><div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{label}</div></div>;
}
