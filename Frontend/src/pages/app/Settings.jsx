import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { toast } from "sonner";
import { Moon, Sun, Trash2, AlertTriangle } from "lucide-react";
import { GlassCard, Input, Label, Textarea } from "@/components/common/Primitives";
import Button from "@/components/common/Button";
import Avatar from "@/components/common/Avatar";
import Modal from "@/components/common/Modal";
import { setTheme } from "@/store/slices/themeSlice";
import { updateProfile } from "@/store/slices/authSlice";
import { clearWorkspaceDataAsync } from "@/store/slices/workspaceSlice";
import { deleteProjectAsync } from "@/store/slices/projectsSlice";

function ProjectRow({ p, onDelete, canDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/40 last:border-0 animate-fade-in">
      <div className="min-w-0 flex-1">
        <span className="font-semibold text-xs text-foreground truncate block">{p.name}</span>
        <span className="text-[10px] text-muted-foreground block mt-0.5">Key: {p.key}</span>
      </div>
      <div className="shrink-0 ml-2">
        {!canDelete ? (
          <span className="text-[10px] text-muted-foreground italic">Lead/Admin only</span>
        ) : confirmDelete ? (
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="danger"
              className="h-7 text-[11px] px-2 py-0"
              onClick={() => { onDelete(p); setConfirmDelete(false); }}
            >
              Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px] px-2 py-0"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px] border-red-500/20 hover:bg-red-500/10 text-red-500"
            onClick={() => setConfirmDelete(true)}
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}

export default function Settings() {
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user);
  const orgs = useSelector(s => s.org.orgs);
  const theme = useSelector(s => s.theme.mode);
  const org = orgs[0];

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  // Workspace and projects selectors
  const workspaces = useSelector(s => s.workspace.workspaces) || [];
  const currentWorkspaceId = useSelector(s => s.workspace.currentWorkspaceId);
  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId || w._id === currentWorkspaceId);
  const workspaceRole = currentWorkspace?.role || "DEVELOPER";
  const isWorkspaceAdmin = workspaceRole === "ADMIN";

  const allProjects = useSelector(s => s.projects.projects) || [];
  const workspaceProjects = allProjects.filter(p => (p.workspace || p.workspaceId) === currentWorkspaceId);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const isLeadOfProject = (project) => {
    return String(project.teamLeadId) === String(user?.id) || 
           String(project.createdBy) === String(user?.id) || 
           project.memberRole === "TEAM_LEAD";
  };
  const canDeleteProject = (project) => {
    return isWorkspaceAdmin || isLeadOfProject(project);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile, organization, and appearance.</p>
      </div>

      <GlassCard>
        <h3 className="font-display font-semibold mb-4">Profile</h3>
        <div className="flex items-center gap-4 mb-5">
          <Avatar name={name} color={user?.avatarColor} size={56} />
          <div className="text-sm text-muted-foreground">Avatar is generated from your initials.</div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Name</Label><Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Email</Label><Input className="mt-1.5" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        </div>
        <div className="mt-5">
          <Button onClick={() => { dispatch(updateProfile({ name, email })); toast.success("Profile updated"); }}>Save changes</Button>
        </div>
      </GlassCard>

      {org && (
        <GlassCard>
          <h3 className="font-display font-semibold mb-4">Organization</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Name</Label><Input className="mt-1.5" defaultValue={org.name} disabled /></div>
            <div><Label>Team size</Label><Input className="mt-1.5" defaultValue={org.teamSize} disabled /></div>
            <div className="sm:col-span-2"><Label>Description</Label><Textarea className="mt-1.5" defaultValue={org.description} disabled /></div>
          </div>
        </GlassCard>
      )}

      <GlassCard>
        <h3 className="font-display font-semibold mb-4">Appearance</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "light", label: "Light", icon: Sun },
            { id: "dark", label: "Dark", icon: Moon },
          ].map(({ id, label, icon: Ic }) => (
            <button key={id} onClick={() => dispatch(setTheme(id))}
              className={`p-4 rounded-[14px] border text-left ${theme === id ? "border-[color:var(--primary)] bg-[color:var(--primary)]/8" : "border-border hover:bg-foreground/5"}`}>
              <Ic size={18} className="mb-2 text-[color:var(--primary)]" />
              <div className="font-medium text-sm">{label}</div>
              <div className="text-xs text-muted-foreground">{id === "dark" ? "#121313 + coral accents" : "#FFF2E1 + warm taupe"}</div>
            </button>
          ))}
        </div>
      </GlassCard>

      {isWorkspaceAdmin ? (
        <GlassCard>
          <h3 className="font-display font-semibold mb-1 text-red-500">Danger zone</h3>
          <p className="text-xs text-muted-foreground mb-4">Wipe all workspace projects, boards, and task data while keeping the workspace structure.</p>
          <Button variant="danger" onClick={() => setConfirmModalOpen(true)}>
            <Trash2 size={15} /> Reset workspace data
          </Button>
        </GlassCard>
      ) : (
        <GlassCard>
          <h3 className="font-display font-semibold mb-1 text-muted-foreground">Danger zone</h3>
          <p className="text-xs text-muted-foreground">Only workspace admins can access workspace reset tools.</p>
        </GlassCard>
      )}

      <Modal
        open={confirmModalOpen}
        onClose={() => { setConfirmModalOpen(false); setConfirmText(""); }}
        title="Reset Workspace Data"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="shrink-0 mt-0.5" size={16} />
            <div className="text-xs">
              <span className="font-bold">This action is highly destructive and irreversible.</span> It will permanently delete all projects, sprints, tasks, comments, and project memberships within the workspace <span className="font-bold">"{currentWorkspace?.name}"</span>.
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground font-semibold">ALTERNATIVE: DELETE SPECIFIC PROJECTS</Label>
            <p className="text-[11px] text-muted-foreground leading-normal">To minimize loss of other work, consider deleting individual projects instead:</p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto border border-border/50 rounded-xl p-2.5 bg-foreground/[0.01]">
              {workspaceProjects.length === 0 ? (
                <div className="text-xs text-muted-foreground py-3 text-center">No projects in this workspace.</div>
              ) : (
                workspaceProjects.map(p => (
                  <ProjectRow
                    key={p.id}
                    p={p}
                    canDelete={canDeleteProject(p)}
                    onDelete={async (proj) => {
                      const res = await dispatch(deleteProjectAsync(proj.id));
                      if (deleteProjectAsync.fulfilled.match(res)) {
                        toast.success(`Project "${proj.name}" deleted successfully`);
                      } else {
                        toast.error(res.payload?.message || "Failed to delete project");
                      }
                    }}
                  />
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">CONFIRM FULL RESET</Label>
            <p className="text-[11px] text-muted-foreground leading-normal">
              To perform a full reset, type the workspace name <span className="font-bold text-foreground">"{currentWorkspace?.name}"</span> below to confirm:
            </p>
            <Input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder={currentWorkspace?.name}
              className="h-10 text-sm bg-foreground/[0.02] w-full mt-1"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setConfirmModalOpen(false); setConfirmText(""); }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={confirmText !== currentWorkspace?.name}
              onClick={async () => {
                const res = await dispatch(clearWorkspaceDataAsync(currentWorkspaceId));
                if (clearWorkspaceDataAsync.fulfilled.match(res)) {
                  toast.success("All workspace data has been cleared!");
                  setConfirmModalOpen(false);
                  setConfirmText("");
                } else {
                  toast.error(res.payload?.message || "Failed to clear workspace data");
                }
              }}
            >
              Clear Workspace Data
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
