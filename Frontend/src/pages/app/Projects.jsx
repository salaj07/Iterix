import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, FolderKanban } from "lucide-react";
import { GlassCard } from "@/components/common/Primitives";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import { Input, Label, Textarea, Select } from "@/components/common/Primitives";
import { createProject } from "@/store/slices/projectsSlice";
import { AvatarStack } from "@/components/common/Avatar";

export default function Projects() {
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user);
  const orgs = useSelector(s => s.org.orgs);
  const members = useSelector(s => s.org.members);
  const projects = useSelector(s => s.projects.projects);
  const tasks = useSelector(s => s.tasks.tasks);
  const sprints = useSelector(s => s.sprints.sprints);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", key: "", description: "", teamLeadId: "", memberIds: [] });

  const create = () => {
    if (!form.name.trim() || !form.key.trim()) return;
    const orgId = orgs[0]?.id;
    dispatch(createProject({
      orgId,
      name: form.name.trim(),
      key: form.key.toUpperCase().slice(0, 6),
      description: form.description,
      teamLeadId: form.teamLeadId || null,
      memberIds: form.memberIds.length ? form.memberIds : [user.id],
    }));
    toast.success("Project created");
    setForm({ name: "", key: "", description: "", teamLeadId: "", memberIds: [] });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">All projects across your organization.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={16} /> New project</Button>
      </div>

      {projects.length === 0 ? (
        <GlassCard className="py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-foreground/5 mx-auto flex items-center justify-center mb-4">
            <FolderKanban size={22} className="text-muted-foreground" />
          </div>
          <h3 className="font-display font-semibold text-lg">No projects yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Create your first project to start shipping.</p>
          <div className="mt-5"><Button onClick={() => setOpen(true)}><Plus size={16} /> Create project</Button></div>
        </GlassCard>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => {
            const lead = members.find(m => m.id === p.teamLeadId);
            const memberObjs = members.filter(m => p.memberIds.includes(m.id));
            const projTasks = tasks.filter(t => t.projectId === p.id);
            const done = projTasks.filter(t => t.status === "Done").length;
            const pct = projTasks.length ? Math.round((done / projTasks.length) * 100) : 0;
            const sprint = sprints.find(s => s.projectId === p.id && s.status === "active");
            return (
              <Link key={p.id} to={`/app/projects/${p.id}`}>
                <motion.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300 }} className="glass p-5 h-full">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] tracking-wider font-semibold text-muted-foreground">{p.key}</div>
                    {sprint && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">● {sprint.name.split("—")[0]?.trim()}</span>}
                  </div>
                  <h3 className="font-display text-lg font-bold mt-3">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description || "No description"}</p>
                  <div className="mt-4">
                    <div className="h-1.5 rounded-full bg-foreground/8 overflow-hidden">
                      <div className="h-full bg-[color:var(--primary)]" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1.5">{pct}% complete · {projTasks.length} tasks</div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">Lead: <span className="text-foreground">{lead?.name || "—"}</span></div>
                    <AvatarStack members={memberObjs} size={22} />
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create project"
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create} disabled={!form.name.trim() || !form.key.trim()}>Create</Button></div>}>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><Label>Name</Label><Input className="mt-1.5" autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Atlas Web Platform" /></div>
            <div><Label>Key</Label><Input className="mt-1.5" maxLength={6} value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase() })} placeholder="ATL" /></div>
          </div>
          <div><Label>Description</Label><Textarea className="mt-1.5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          <div><Label>Team Lead</Label>
            <Select className="mt-1.5" value={form.teamLeadId} onChange={(e) => setForm({ ...form, teamLeadId: e.target.value })}>
              <option value="">Select a Team Lead</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Members</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {members.map(m => {
                const on = form.memberIds.includes(m.id);
                return (
                  <button key={m.id} type="button"
                    onClick={() => setForm({ ...form, memberIds: on ? form.memberIds.filter(x => x !== m.id) : [...form.memberIds, m.id] })}
                    className={`px-2.5 py-1 rounded-full text-xs border ${on ? "bg-[color:var(--primary)]/15 border-[color:var(--primary)]/40 text-[color:var(--primary)]" : "border-border text-muted-foreground"}`}>
                    {m.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
