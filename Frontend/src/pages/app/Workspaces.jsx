import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Building2, Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { GlassCard } from "@/components/common/Primitives";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import { Input, Label } from "@/components/common/Primitives";
import { fetchWorkspaces, createWorkspaceAsync, setCurrentWorkspace } from "@/store/slices/workspaceSlice";

export default function Workspaces() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { workspaces, currentWorkspaceId, loading } = useSelector((s) => s.workspace);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const WorkspaceSkeleton = () => (
    <div className="glass p-5 h-[154px] animate-pulse flex flex-col justify-between text-left">
      <div className="flex justify-between items-start">
        <div className="w-11 h-11 rounded-[12px] bg-foreground/10" />
      </div>
      <div>
        <div className="h-5 w-32 bg-foreground/10 rounded" />
        <div className="h-3.5 w-24 bg-foreground/10 rounded mt-2" />
      </div>
    </div>
  );

  // Fetch workspaces from API on mount
  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    const result = await dispatch(createWorkspaceAsync({ name: name.trim() }));
    if (createWorkspaceAsync.fulfilled.match(result)) {
      toast.success("Workspace created");
      setName("");
      setOpen(false);
    } else {
      toast.error(result.payload?.message || "Failed to create workspace");
    }
    setCreating(false);
  };

  const switchWorkspace = (ws) => {
    dispatch(setCurrentWorkspace(ws._id || ws.id));
    toast.success(`Switched to ${ws.name}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Workspaces</h1>
          <p className="text-sm text-muted-foreground mt-1">Switch between organizations.</p>
        </div>
      </div>

      {loading && workspaces.length === 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <WorkspaceSkeleton />
          <WorkspaceSkeleton />
          <WorkspaceSkeleton />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws) => {
            const id = ws._id || ws.id;
            return (
              <motion.button
                key={id} whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300 }}
                onClick={() => switchWorkspace(ws)}
                className={`text-left glass p-5 ${id === currentWorkspaceId ? "ring-2 ring-[color:var(--primary)]/40" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-[12px] bg-[color:var(--primary)]/15 text-[color:var(--primary)] flex items-center justify-center font-display font-bold">
                    {ws.name.slice(0, 1)}
                  </div>
                  {id === currentWorkspaceId && (
                    <span className="text-[11px] text-[color:var(--primary)] flex items-center gap-1 font-medium">
                      <Check size={13} /> current
                    </span>
                  )}
                </div>
                <div className="font-display font-semibold mt-3.5">{ws.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Created {new Date(ws.createdAt || Date.now()).toLocaleDateString()}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Workspace Creation"
        footer={
          <div className="flex justify-end">
            <Button onClick={() => setOpen(false)}>Close</Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-1">
            <Building2 size={24} />
          </div>
          <h3 className="font-semibold text-base text-foreground">Workspace Creation Restricted</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Only the community manager can provision new workspaces or assign administrator rights on the platform.
          </p>
          <div className="p-3 border border-dashed border-border rounded-lg text-xs text-muted-foreground bg-foreground/[0.01]">
            If you need an additional workspace or admin permissions for your developer group, please contact the community manager directly.
          </div>
        </div>
      </Modal>
    </div>
  );
}
