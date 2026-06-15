import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, FolderKanban, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/common/Primitives";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import { Input, Label, Textarea } from "@/components/common/Primitives";
import { fetchProjects, createProjectAsync } from "@/store/slices/projectsSlice";
import { AvatarStack } from "@/components/common/Avatar";

export default function Projects() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { projects, loading } = useSelector((s) => s.projects);
  const currentWorkspaceId = useSelector((s) => s.workspace.currentWorkspaceId);
  const workspaces = useSelector((s) => s.workspace.workspaces);
  const currentWs = workspaces.find((w) => w.id === currentWorkspaceId || w._id === currentWorkspaceId);
  const isWorkspaceAdmin = currentWs?.role === "ADMIN";
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", key: "", description: "" });

  // Fetch projects from API on mount
  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const create = async () => {
    if (!form.name.trim()) return;
    if (!currentWorkspaceId) {
      toast.error("Please select a workspace first");
      return;
    }
    setCreating(true);
    const result = await dispatch(
      createProjectAsync({
        name: form.name.trim(),
        key: form.key.toUpperCase().slice(0, 10) || form.name.slice(0, 3).toUpperCase(),
        description: form.description,
        workspaceId: currentWorkspaceId,
      })
    );
    if (createProjectAsync.fulfilled.match(result)) {
      toast.success("Project created");
      setForm({ name: "", key: "", description: "" });
      setOpen(false);
    } else {
      const errors = result.payload?.errors;
      if (errors?.length) {
        toast.error(errors.map((e) => e.message).join(", "));
      } else {
        toast.error(result.payload?.message || "Failed to create project");
      }
    }
    setCreating(false);
  };

  const filteredProjects = projects.filter(
    (p) => (p.workspace || p.workspaceId) === currentWorkspaceId
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">All projects across your workspace.</p>
        </div>
        {isWorkspaceAdmin && <Button onClick={() => setOpen(true)}><Plus size={16} /> New project</Button>}
      </div>

      {loading && filteredProjects.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      ) : filteredProjects.length === 0 ? (
        <GlassCard className="py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-foreground/5 mx-auto flex items-center justify-center mb-4">
            <FolderKanban size={22} className="text-muted-foreground" />
          </div>
          <h3 className="font-display font-semibold text-lg">No projects yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Create your first project to start shipping.</p>
          {isWorkspaceAdmin && <div className="mt-5"><Button onClick={() => setOpen(true)}><Plus size={16} /> Create project</Button></div>}
        </GlassCard>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => {
            const id = p._id || p.id;
            return (
              <Link key={id} to={`/app/projects/${id}`}>
                <motion.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300 }} className="glass p-5 h-full">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] tracking-wider font-semibold text-muted-foreground">{p.key}</div>
                  </div>
                  <h3 className="font-display text-lg font-bold mt-3">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description || "No description"}</p>
                  <div className="mt-4 text-[11px] text-muted-foreground">
                    Created {new Date(p.createdAt || Date.now()).toLocaleDateString()}
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create project"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={!form.name.trim() || creating}>
              {creating ? <Loader2 className="animate-spin" size={14} /> : null}
              Create
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label>Name</Label>
              <Input className="mt-1.5" autoFocus value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Atlas Web Platform" />
            </div>
            <div>
              <Label>Key</Label>
              <Input className="mt-1.5" maxLength={10} value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase() })}
                placeholder="ATL" />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea className="mt-1.5" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
