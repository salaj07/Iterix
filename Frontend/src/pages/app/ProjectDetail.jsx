import { useParams, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import { setCurrentProjectId, updateProjectAsync, fetchProjectMembers, addProjectMemberAsync, removeProjectMemberAsync, updateProjectMemberRoleAsync } from "@/store/slices/projectsSlice";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Clock, RotateCcw, Archive, Loader2, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { GlassCard, Badge, Input, Label, Textarea, Select } from "@/components/common/Primitives";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import Avatar from "@/components/common/Avatar";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import { roleLabel, roleTone, formatDate, priorityTone, typeTone, formatRelative } from "@/lib/format";
import { openTask } from "@/store/slices/uiSlice";
import { unarchiveTask, updateTaskDetailsAsync } from "@/store/slices/tasksSlice";
import { cn } from "@/lib/utils";

export default function ProjectDetail() {
  const { id } = useParams();
  const project = useSelector(s => (s.projects.projects || []).find(p => p && (p.id === id || p._id === id)));
  const members = useSelector(s => s.org.members || []);
  const projectMembers = useSelector(s => s.projects.projectMembers || []);
  const sprints = useSelector(s => (s.sprints.sprints || []).filter(s => s && s.projectId === id));
  const tasks = useSelector(s => (s.tasks.tasks || []).filter(t => t && t.projectId === id));
  const activeTasks = tasks.filter(t => t && !t.archived);
  const dispatch = useDispatch();
  const [tab, setTab] = useState("overview");
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState("Backlog");

  useEffect(() => {
    if (id) {
      dispatch(setCurrentProjectId(id));
      dispatch(fetchProjectMembers(id));
    }
  }, [dispatch, id]);

  const user = useSelector(s => s.auth.user);
  const myWorkspaceMember = members.find(m => m && m.id === user?.id);
  const isWorkspaceAdmin = myWorkspaceMember?.role === "ADMIN";
  const myProjectMember = projectMembers.find(pm => pm && (pm.id === user?.id || pm.userId === user?.id || (pm.user && pm.user._id === user?.id)));
  const isProjectLead = project && (
    project.memberRole === "TEAM_LEAD" ||
    myProjectMember?.role === "TEAM_LEAD" ||
    String(project.teamLeadId) === String(user?.id) ||
    String(project.createdBy) === String(user?.id)
  );
  const canEditProject = isWorkspaceAdmin || isProjectLead;

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", key: "", description: "" });
  const [updating, setUpdating] = useState(false);

  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("DEVELOPER");
  const [memberLoading, setMemberLoading] = useState(false);

  const availableWorkspaceMembers = members.filter(m => {
    const inProject = projectMembers.some(pm => (pm.id || pm.userId || pm.user?._id || pm.user) === m.id);
    return !inProject;
  });

  useEffect(() => {
    if (project) {
      setEditForm({
        name: project.name || "",
        key: project.key || project.projectKey || "",
        description: project.description || "",
      });
    }
  }, [project]);

  const handleSaveProject = async () => {
    if (!editForm.name.trim() || !editForm.key.trim()) {
      toast.error("Name and key are required");
      return;
    }
    setUpdating(true);
    const result = await dispatch(updateProjectAsync({
      projectId: id,
      data: {
        name: editForm.name.trim(),
        key: editForm.key.trim().toUpperCase(),
        description: editForm.description.trim()
      }
    }));
    if (updateProjectAsync.fulfilled.match(result)) {
      toast.success("Project updated successfully!");
      setEditOpen(false);
    } else {
      toast.error(result.payload?.message || "Failed to update project");
    }
    setUpdating(false);
  };

  if (!project) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Project not found.</p>
        <Link to="/app/projects" className="mt-4 inline-block"><Button variant="outline"><ArrowLeft size={15} /> Back to projects</Button></Link>
      </div>
    );
  }

  const lead = members.find(m => m.id === project.teamLeadId);
  const memberObjs = members.filter(m => project.memberIds?.includes(m.id));
  const activeSprint = sprints.find(s => s.status === "active");

  return (
    <div className="space-y-6">
      <Link to="/app/projects" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><ArrowLeft size={13}/> Projects</Link>
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs tracking-wider font-semibold text-muted-foreground">{project.key}</div>
          <h1 className="font-display text-3xl font-bold mt-1">{project.name}</h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">{project.description || "No description"}</p>
        </div>
        <div className="flex items-center gap-2">
          {canEditProject && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>Edit project</Button>
          )}
          {project?.memberRole !== "VIEWER" && (
            <Button variant="outline" onClick={() => { setCreateStatus("Backlog"); setCreateOpen(true); }}><Plus size={15}/> New task</Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-3">
        <Mini label="Tasks" value={activeTasks.length} />
        <Mini label="Completed" value={activeTasks.filter(t => t.status === "Done").length} />
        <Mini label="Story points" value={activeTasks.reduce((a, t) => a + (t.points || 0), 0)} />
        <Mini label="Active sprint" value={activeSprint ? activeSprint.name.split("—")[0]?.trim() : "—"} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
        {[
          { id: "overview", label: "Overview" },
          { id: "board", label: "Board" },
          { id: "backlog", label: "Backlog" },
          { id: "timeline", label: "Timeline" },
          { id: "history", label: "History" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("relative px-4 py-2.5 text-sm font-medium whitespace-nowrap", tab === t.id ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {t.label}
            {tab === t.id && <motion.span layoutId="proj-tab" className="absolute bottom-0 left-2 right-2 h-[2px] bg-[color:var(--primary)] rounded-full" />}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold">Team</h3>
                {canEditProject && (
                  <Button variant="ghost" size="xs" onClick={() => setMembersModalOpen(true)}>Manage</Button>
                )}
              </div>
              <div className="space-y-2.5">
                {memberObjs.map(m => (
                  <div key={m.id} className="flex items-center gap-3">
                    <Avatar name={m.name} color={m.avatarColor} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{m.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{m.email}</div>
                    </div>
                    <Badge tone={roleTone(m.role)} className="ml-auto">{roleLabel(m.role)}</Badge>
                  </div>
                ))}
              </div>
            </GlassCard>
            <GlassCard>
              <h3 className="font-display font-semibold mb-3">Recent tasks</h3>
              <ul className="space-y-1">
                {activeTasks.slice(0, 6).map(t => (
                  <li key={t.id}>
                    <button onClick={() => dispatch(openTask(t.id))} className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-foreground/5 text-left">
                      <Badge tone={typeTone(t.type)} className="border-transparent">{t.type}</Badge>
                      <span className="text-sm truncate flex-1">{t.title}</span>
                      <Badge tone={priorityTone(t.priority)} className="hidden sm:inline-flex">{t.priority}</Badge>
                    </button>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
          <div className="space-y-5">
            <GlassCard>
              <h3 className="font-display font-semibold mb-3">Project lead</h3>
              {lead ? (
                <div className="flex items-center gap-3">
                  <Avatar name={lead.name} color={lead.avatarColor} size={38} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{lead.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{lead.email}</div>
                  </div>
                </div>
              ) : <p className="text-sm text-muted-foreground">No lead assigned</p>}
            </GlassCard>
            <GlassCard>
              <h3 className="font-display font-semibold mb-3">Active sprint</h3>
              {activeSprint ? (
                <div>
                  <div className="font-medium text-sm">{activeSprint.name}</div>
                  <p className="text-xs text-muted-foreground mt-1">{activeSprint.goal}</p>
                  <div className="text-xs text-muted-foreground mt-2">{formatDate(activeSprint.startDate)} → {formatDate(activeSprint.endDate)}</div>
                </div>
              ) : <p className="text-sm text-muted-foreground">No active sprint</p>}
            </GlassCard>
          </div>
        </div>
      )}

      {tab === "board" && (
        <KanbanBoard projectId={id} onCreateTask={(status) => { setCreateStatus(status); setCreateOpen(true); }} />
      )}

      {tab === "backlog" && (
        <GlassCard className="p-0 overflow-hidden">
          <ul className="divide-y divide-border">
            {activeTasks.filter(t => t.status === "Backlog").map(t => (
              <li key={t.id}>
                <button onClick={() => dispatch(openTask(t.id))} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-foreground/5 text-left">
                  <Badge tone={typeTone(t.type)} className="border-transparent">{t.type}</Badge>
                  <span className="text-sm flex-1 truncate">{t.title}</span>
                  {t.points != null && <Badge>{t.points} pts</Badge>}
                  <Badge tone={priorityTone(t.priority)}>{t.priority}</Badge>
                </button>
              </li>
            ))}
            {activeTasks.filter(t => t.status === "Backlog").length === 0 && (
              <li className="py-12 text-center text-sm text-muted-foreground">Backlog is empty.</li>
            )}
          </ul>
        </GlassCard>
      )}

      {tab === "timeline" && (
        <GlassCard>
          <ul className="space-y-3">
            {activeTasks.slice().sort((a, b) => (b.history.slice(-1)[0]?.at || 0) - (a.history.slice(-1)[0]?.at || 0)).map(t => (
              <li key={t.id} className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock size={13} className="text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">{t.status} · {formatRelative(t.history.slice(-1)[0]?.at || t.createdAt)}</div>
                </div>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      {tab === "history" && (
        <GlassCard className="p-0 overflow-hidden">
          {tasks.filter(t => t.archived).length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <Archive size={22} className="text-muted-foreground/60" />
              No archived tasks yet. Completed tasks you archive will appear here.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {tasks.filter(t => t.archived).slice().sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0)).map(t => (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-foreground/5">
                  <button onClick={() => dispatch(openTask(t.id))} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <Badge tone={typeTone(t.type)} className="border-transparent">{t.type}</Badge>
                    <span className="text-sm truncate flex-1">{t.title}</span>
                    <Badge tone={priorityTone(t.priority)} className="hidden sm:inline-flex">{t.priority}</Badge>
                    <span className="text-xs text-muted-foreground hidden md:inline">archived {formatRelative(t.archivedAt || 0)}</span>
                  </button>
                  <button
                    onClick={() => {
                      dispatch(unarchiveTask({ id: t.id }));
                      dispatch(updateTaskDetailsAsync({ taskId: t.id, data: { archived: false } }));
                      toast.success("Restored to board");
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-foreground/5 hover:bg-foreground/10 text-muted-foreground"
                    title="Restore to board"
                  >
                    <RotateCcw size={12} /> Restore
                  </button>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      )}
      <CreateTaskModal open={createOpen} onClose={() => setCreateOpen(false)} projectId={id} defaultStatus={createStatus} />

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit project"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProject} disabled={!editForm.name.trim() || updating}>
              {updating ? <Loader2 className="animate-spin" size={14} /> : null}
              Save changes
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label>Name</Label>
              <Input className="mt-1.5" autoFocus value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Project Name" />
            </div>
            <div>
              <Label>Key</Label>
              <Input className="mt-1.5" maxLength={10} value={editForm.key}
                onChange={(e) => setEditForm({ ...editForm, key: e.target.value.toUpperCase() })}
                placeholder="KEY" />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea className="mt-1.5" value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} />
          </div>
        </div>
      </Modal>

      <Modal open={membersModalOpen} onClose={() => setMembersModalOpen(false)} title="Manage Project Members" size="md">
        <div className="space-y-6">
          {/* Add member section */}
          <GlassCard className="p-4 space-y-4">
            <h4 className="font-display font-semibold text-sm">Add member to project</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Select Member</Label>
                <Select className="mt-1.5 w-full text-xs" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
                  <option value="">Choose a member…</option>
                  {availableWorkspaceMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Project Role</Label>
                <Select className="mt-1.5 w-full text-xs" value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                  <option value="DEVELOPER">Developer / Team Member</option>
                  <option value="TEAM_LEAD">Team Lead</option>
                </Select>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <Button size="sm" disabled={!selectedUserId || memberLoading} onClick={async () => {
                setMemberLoading(true);
                const res = await dispatch(addProjectMemberAsync({ projectId: id, userId: selectedUserId, role: selectedRole }));
                if (addProjectMemberAsync.fulfilled.match(res)) {
                  toast.success("Member added to project");
                  setSelectedUserId("");
                  dispatch(fetchProjectMembers(id));
                } else {
                  toast.error(res.payload?.message || "Failed to add member");
                }
                setMemberLoading(false);
              }}>
                Add member
              </Button>
            </div>
          </GlassCard>

          {/* Current members list */}
          <div className="space-y-3">
            <h4 className="font-display font-semibold text-sm px-1">Current Members ({projectMembers.length})</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto border border-border/40 rounded-xl p-2 bg-foreground/[0.01]">
              {projectMembers.map(pm => {
                const memberId = pm.id || pm.userId || pm.user?._id || pm.user;
                const name = pm.name || pm.user?.name || "Unknown";
                const email = pm.email || pm.user?.email || "";
                const avatarColor = pm.avatarColor || pm.user?.avatarColor;
                
                return (
                  <div key={memberId} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-foreground/5">
                    <Avatar name={name} color={avatarColor} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate">{name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{email}</div>
                    </div>
                    
                    {/* Role select */}
                    <Select
                      className="w-32 h-8 text-[11px]"
                      value={pm.role}
                      onChange={async (e) => {
                        const newRole = e.target.value;
                        const res = await dispatch(updateProjectMemberRoleAsync({ projectId: id, userId: memberId, role: newRole }));
                        if (updateProjectMemberRoleAsync.fulfilled.match(res)) {
                          toast.success("Role updated successfully");
                          dispatch(fetchProjectMembers(id));
                        } else {
                          toast.error(res.payload?.message || "Failed to update role");
                        }
                      }}
                    >
                      <option value="DEVELOPER">Developer</option>
                      <option value="TEAM_LEAD">Team Lead</option>
                    </Select>

                    {/* Remove button */}
                    <button
                      className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                      onClick={async () => {
                        if (window.confirm(`Are you sure you want to remove ${name} from this project?`)) {
                          const res = await dispatch(removeProjectMemberAsync({ projectId: id, userId: memberId }));
                          if (removeProjectMemberAsync.fulfilled.match(res)) {
                            toast.success("Member removed from project");
                            dispatch(fetchProjectMembers(id));
                          } else {
                            toast.error(res.payload?.message || "Failed to remove member");
                          }
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Mini({ label, value }) {
  return <GlassCard className="p-4">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="font-display text-xl font-bold mt-1">{value}</div>
  </GlassCard>;
}
