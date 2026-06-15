import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { Plus, Mail, Trash2, FolderKanban, Users } from "lucide-react";
import { GlassCard, Badge, Input, Label, Select } from "@/components/common/Primitives";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import Avatar from "@/components/common/Avatar";
import { roleLabel, roleTone, formatRelative } from "@/lib/format";
import { inviteMemberAsync, acceptInvitationAsync, fetchWorkspaceInvitations, fetchMembers, updateMemberRoleAsync, removeMemberAsync } from "@/store/slices/orgSlice";
import { fetchProjectMembers, addProjectMemberAsync, removeProjectMemberAsync, updateProjectMemberRoleAsync } from "@/store/slices/projectsSlice";
import { ROLES } from "@/store/seed";

export default function Teams() {
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user);
  
  // Workspace Members & Invites
  const workspaceMembers = useSelector(s => s.org.members) || [];
  const invitations = useSelector(s => s.org.invitations) || [];
  const currentWorkspaceId = useSelector(s => s.workspace.currentWorkspaceId);
  const myWorkspaceMember = workspaceMembers.find(m => m && m.id === user?.id) || { ...user, role: ROLES.DEVELOPER };
  const isWorkspaceAdmin = myWorkspaceMember.role === ROLES.ADMIN;

  // Project Members
  const currentProjectId = useSelector(s => s.projects.currentProjectId);
  const allProjects = useSelector(s => s.projects.projects) || [];
  const currentProject = allProjects.find(p => p && (p.id === currentProjectId || p._id === currentProjectId)) || null;
  const projectMembers = useSelector(s => s.projects.projectMembers) || [];

  const projectMemberMe = projectMembers.find(pm => {
    if (!pm) return false;
    const memberUser = pm.user || pm;
    const memberId = memberUser._id || memberUser.id || pm.id;
    return String(memberId) === String(user?.id);
  });
  const isProjectLead = projectMemberMe?.role === "TEAM_LEAD";
  const canManageProjectMembers = isWorkspaceAdmin || isProjectLead;

  // Local state toggles
  const [viewMode, setViewMode] = useState("project"); // "project" or "workspace"
  const [inviteOpen, setInviteOpen] = useState(false);
  const [wsInviteForm, setWsInviteForm] = useState({ name: "", email: "", role: ROLES.DEVELOPER });

  const [addProjMemOpen, setAddProjMemOpen] = useState(false);
  const [projMemForm, setProjMemForm] = useState({ userId: "", role: "DEVELOPER" });

  useEffect(() => {
    if (currentWorkspaceId) {
      dispatch(fetchWorkspaceInvitations(currentWorkspaceId));
    }
  }, [dispatch, currentWorkspaceId]);

  useEffect(() => {
    if (currentProjectId) {
      dispatch(fetchProjectMembers(currentProjectId));
    }
  }, [dispatch, currentProjectId]);

  // Workspace Invite
  const sendWsInvite = async () => {
    if (!wsInviteForm.name.trim() || !wsInviteForm.email.trim() || !currentWorkspaceId) return;
    const result = await dispatch(
      inviteMemberAsync({
        workspaceId: currentWorkspaceId,
        email: wsInviteForm.email.trim(),
        role: wsInviteForm.role,
      })
    );
    if (inviteMemberAsync.fulfilled.match(result)) {
      toast.success(`Invitation sent to ${wsInviteForm.email}`);
    } else {
      toast.error(result.payload?.message || "Failed to send invitation");
    }
    setWsInviteForm({ name: "", email: "", role: ROLES.DEVELOPER });
    setInviteOpen(false);
  };

  const acceptWsInvite = async (id) => {
    const result = await dispatch(acceptInvitationAsync(id));
    if (acceptInvitationAsync.fulfilled.match(result)) {
      toast.success("Invitation accepted successfully!");
      if (currentWorkspaceId) {
        dispatch(fetchMembers(currentWorkspaceId));
      }
    } else {
      toast.error(result.payload?.message || "Failed to accept invitation");
    }
  };

  // Project Member Assignment
  const handleAddProjectMember = async () => {
    if (!projMemForm.userId || !currentProjectId) {
      toast.error("Please select a workspace member to add");
      return;
    }
    const res = await dispatch(addProjectMemberAsync({
      projectId: currentProjectId,
      userId: projMemForm.userId,
      role: projMemForm.role
    }));

    if (addProjectMemberAsync.fulfilled.match(res)) {
      toast.success("Member assigned to project");
      dispatch(fetchProjectMembers(currentProjectId));
      setProjMemForm({ userId: "", role: "DEVELOPER" });
      setAddProjMemOpen(false);
    } else {
      toast.error(res.payload?.message || "Failed to assign member to project");
    }
  };

  // Computed Assignable Workspace members (Workspace members not in current project)
  const projectMemberUserIds = projectMembers.map(pm => {
    const mu = pm.user || pm;
    return mu._id || mu.id || pm.id;
  });
  const assignableWorkspaceMembers = workspaceMembers.filter(m => !projectMemberUserIds.includes(m.id));

  // If no project is selected, force viewing Workspace Members
  const activeViewMode = currentProjectId ? viewMode : "workspace";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          {currentProject && activeViewMode === "project" && (
            <div className="text-xs text-muted-foreground tracking-wider uppercase font-semibold mb-1">
              Project: {currentProject?.projectKey} · {currentProject?.name}
            </div>
          )}
          <h1 className="font-display text-3xl font-bold">
            {activeViewMode === "project" ? "Project Team" : "Workspace Members"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeViewMode === "project" 
              ? `${projectMembers.length} member(s) assigned to this project.` 
              : `${workspaceMembers.length} member(s) inside this workspace.`}
          </p>
        </div>

        <div className="flex gap-2">
          {/* Toggle between project and workspace view */}
          {currentProjectId && (
            <Button variant="outline" onClick={() => setViewMode(v => v === "project" ? "workspace" : "project")}>
              {activeViewMode === "project" ? "Manage Workspace Members" : "Back to Project Team"}
            </Button>
          )}

          {activeViewMode === "project" && canManageProjectMembers && (
            <Button onClick={() => {
              if (assignableWorkspaceMembers.length === 0) {
                toast.info("All workspace members are already added to this project.");
                return;
              }
              setProjMemForm(f => ({ ...f, userId: assignableWorkspaceMembers[0]?.id || "" }));
              setAddProjMemOpen(true);
            }}>
              <Plus size={16} /> Assign Project Member
            </Button>
          )}

          {activeViewMode === "workspace" && isWorkspaceAdmin && (
            <Button onClick={() => setInviteOpen(true)}><Plus size={16} /> Invite to Workspace</Button>
          )}
        </div>
      </div>

      {/* Main List */}
      {activeViewMode === "project" ? (
        <GlassCard className="p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground grid grid-cols-12 gap-3">
            <div className="col-span-5">Member</div>
            <div className="col-span-3 hidden md:block">Email</div>
            <div className="col-span-3 md:col-span-2">Project Role</div>
            <div className="col-span-4 md:col-span-2 text-right">Actions</div>
          </div>
          {projectMembers.map(m => {
            const memberUser = m.user || m;
            const mId = memberUser._id || memberUser.id || m.id;
            const mName = memberUser.name || m.name || "Member";
            const mEmail = memberUser.email || m.email || "";

            return (
              <div key={mId} className="px-5 py-3 grid grid-cols-12 gap-3 items-center border-b border-border last:border-b-0 hover:bg-foreground/[0.02]">
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  <Avatar name={mName} color={m.avatarColor} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{mName}</div>
                    <div className="text-xs text-muted-foreground md:hidden truncate">{mEmail}</div>
                  </div>
                </div>
                <div className="col-span-3 hidden md:block text-sm text-muted-foreground truncate">{mEmail}</div>
                <div className="col-span-3 md:col-span-2">
                  {canManageProjectMembers && mId !== user?.id ? (
                    <Select
                      value={m.role}
                      onChange={async (e) => {
                        const newRole = e.target.value;
                        const res = await dispatch(updateProjectMemberRoleAsync({ projectId: currentProjectId, userId: mId, role: newRole }));
                        if (updateProjectMemberRoleAsync.fulfilled.match(res)) {
                          toast.success("Project role updated");
                          dispatch(fetchProjectMembers(currentProjectId));
                        } else {
                          toast.error(res.payload?.message || "Failed to update project role");
                        }
                      }}
                      className="h-8 text-xs py-0"
                    >
                      <option value="TEAM_LEAD">Team Lead</option>
                      <option value="DEVELOPER">Developer</option>
                    </Select>
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground px-2 py-1">
                      {m.role === "TEAM_LEAD" ? "Project Lead" : "Developer"}
                    </span>
                  )}
                </div>
                <div className="col-span-4 md:col-span-2 text-right">
                  {canManageProjectMembers && mId !== user?.id && (
                    <button
                      onClick={async () => {
                        const res = await dispatch(removeProjectMemberAsync({ projectId: currentProjectId, userId: mId }));
                        if (removeProjectMemberAsync.fulfilled.match(res)) {
                          toast.success("Member removed from project");
                          dispatch(fetchProjectMembers(currentProjectId));
                        } else {
                          toast.error(res.payload?.message || "Failed to remove member");
                        }
                      }}
                      className="p-1.5 rounded-md hover:bg-foreground/5 text-muted-foreground"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {projectMembers.length === 0 && (
            <div className="py-20 text-center text-sm text-muted-foreground">
              No team members assigned to this project yet.
            </div>
          )}
        </GlassCard>
      ) : (
        /* Workspace Members View */
        <>
          <GlassCard className="p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground grid grid-cols-12 gap-3">
              <div className="col-span-5">Member</div>
              <div className="col-span-3 hidden md:block">Email</div>
              <div className="col-span-3 md:col-span-2">Workspace Role</div>
              <div className="col-span-4 md:col-span-2 text-right">Actions</div>
            </div>
            {workspaceMembers.map(m => (
              <div key={m.id} className="px-5 py-3 grid grid-cols-12 gap-3 items-center border-b border-border last:border-b-0 hover:bg-foreground/[0.02]">
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  <Avatar name={m.name} color={m.avatarColor} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{m.name}</div>
                    <div className="text-xs text-muted-foreground md:hidden truncate">{m.email}</div>
                  </div>
                </div>
                <div className="col-span-3 hidden md:block text-sm text-muted-foreground truncate">{m.email}</div>
                <div className="col-span-3 md:col-span-2">
                  {isWorkspaceAdmin && m.id !== user?.id ? (
                    <Select
                      value={m.role}
                      onChange={async (e) => {
                        const newRole = e.target.value;
                        const res = await dispatch(updateMemberRoleAsync({ workspaceId: currentWorkspaceId, memberId: m.id, role: newRole }));
                        if (updateMemberRoleAsync.fulfilled.match(res)) {
                          toast.success("Member role updated");
                        } else {
                          toast.error(res.payload?.message || "Failed to update role");
                        }
                      }}
                      className="h-8 text-xs py-0"
                    >
                      <option value={ROLES.ADMIN}>Admin</option>
                      <option value={ROLES.TEAM_LEAD}>Team Lead</option>
                      <option value={ROLES.DEVELOPER}>Developer</option>
                    </Select>
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground px-2 py-1">{roleLabel(m.role)}</span>
                  )}
                </div>
                <div className="col-span-4 md:col-span-2 text-right">
                  {isWorkspaceAdmin && m.id !== user?.id && (
                    <button
                      onClick={async () => {
                        const res = await dispatch(removeMemberAsync({ workspaceId: currentWorkspaceId, memberId: m.id }));
                        if (removeMemberAsync.fulfilled.match(res)) {
                          toast.success("Member removed from workspace");
                        } else {
                          toast.error(res.payload?.message || "Failed to remove member");
                        }
                      }}
                      className="p-1.5 rounded-md hover:bg-foreground/5 text-muted-foreground"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </GlassCard>

          {/* Invitations list */}
          <GlassCard>
            <h3 className="font-display font-semibold mb-3 flex items-center gap-2"><Mail size={15} /> Invitations</h3>
            {invitations.filter(inv => inv && inv.status === "pending").length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No pending invitations.</p>
            ) : (
              <ul className="divide-y divide-border -mx-2">
                {invitations.filter(inv => inv && inv.status === "pending").map(inv => (
                  <li key={inv.id} className="px-2 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-foreground/5 flex items-center justify-center text-muted-foreground"><Mail size={14} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{inv.name} — <span className="text-muted-foreground">{inv.email}</span></div>
                      <div className="text-xs text-muted-foreground">Sent {formatRelative(inv.sentAt)} · {roleLabel(inv.role)}</div>
                    </div>
                    <Badge tone="bg-amber-500/10 text-amber-500 border-amber-500/20">
                      {inv.status}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => acceptWsInvite(inv.id)}>Simulate accept</Button>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </>
      )}

      {/* Modal: Invite Workspace Member */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite a member"
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button><Button onClick={sendWsInvite} disabled={!wsInviteForm.name.trim() || !wsInviteForm.email.trim()}>Send invitation</Button></div>}>
        <div className="space-y-4">
          <div><Label>Name</Label><Input className="mt-1.5" autoFocus value={wsInviteForm.name} onChange={(e) => setWsInviteForm({ ...wsInviteForm, name: e.target.value })} /></div>
          <div><Label>Email</Label><Input className="mt-1.5" type="email" value={wsInviteForm.email} onChange={(e) => setWsInviteForm({ ...wsInviteForm, email: e.target.value })} /></div>
          <div><Label>Role</Label>
            <Select className="mt-1.5" value={wsInviteForm.role} onChange={(e) => setWsInviteForm({ ...wsInviteForm, role: e.target.value })}>
              <option value={ROLES.ADMIN}>Admin</option>
              <option value={ROLES.TEAM_LEAD}>Team Lead</option>
              <option value={ROLES.DEVELOPER}>Developer</option>
            </Select>
          </div>
        </div>
      </Modal>

      {/* Modal: Assign Workspace Member to Project */}
      <Modal open={addProjMemOpen} onClose={() => setAddProjMemOpen(false)} title="Assign Team Member to Project"
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setAddProjMemOpen(false)}>Cancel</Button><Button onClick={handleAddProjectMember} disabled={!projMemForm.userId}>Assign Member</Button></div>}>
        <div className="space-y-4">
          <div>
            <Label>Select Workspace Member</Label>
            <Select className="mt-1.5" value={projMemForm.userId} onChange={(e) => setProjMemForm({ ...projMemForm, userId: e.target.value })}>
              {assignableWorkspaceMembers.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Project Role</Label>
            <Select className="mt-1.5" value={projMemForm.role} onChange={(e) => setProjMemForm({ ...projMemForm, role: e.target.value })}>
              <option value="DEVELOPER">Developer</option>
              <option value="TEAM_LEAD">Project Lead</option>
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
