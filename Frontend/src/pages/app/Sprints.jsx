import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { Plus, Play, Check, Calendar, Loader2, FolderKanban, Trash2 } from "lucide-react";
import { GlassCard, Badge, Input, Label, Textarea } from "@/components/common/Primitives";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import { formatDate, priorityTone } from "@/lib/format";
import { fetchSprints, createSprintAsync, startSprintAsync, completeSprintAsync, deleteSprintAsync } from "@/store/slices/sprintsSlice";
import { fetchProjectMembers } from "@/store/slices/projectsSlice";
import { openTask } from "@/store/slices/uiSlice";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Sprints() {
  const dispatch = useDispatch();
  const currentWorkspaceId = useSelector((s) => s.workspace.currentWorkspaceId);
  const currentProjectId = useSelector((s) => s.projects.currentProjectId);
  const allProjects = useSelector((s) => s.projects.projects) || [];
  const projects = allProjects.filter((p) => p && (p.workspace === currentWorkspaceId || p.workspaceId === currentWorkspaceId));
  const currentProject = projects.find(p => p && (p.id === currentProjectId || p._id === currentProjectId));

  const { sprints: allSprints, loading } = useSelector((s) => s.sprints);
  const sprints = (allSprints || [])
    .filter((s) => s && s.projectId === currentProjectId)
    .sort((a, b) => new Date(b.createdAt || b.startDate || 0) - new Date(a.createdAt || a.startDate || 0));

  const activeSprints = sprints.filter((s) => s.status === "active");
  const plannedSprints = sprints.filter((s) => s.status === "planned");
  const completedSprints = sprints.filter((s) => s.status === "completed");

  const [activeTab, setActiveTab] = useState("active");

  const SprintSkeleton = () => (
    <div className="glass p-5 h-44 animate-pulse flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center">
          <div className="h-5 w-32 bg-foreground/10 rounded" />
          <div className="h-6 w-16 bg-foreground/10 rounded-[10px]" />
        </div>
        <div className="h-3 w-40 bg-foreground/10 rounded mt-2" />
      </div>
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <div className="h-3 w-16 bg-foreground/10 rounded" />
          <div className="h-3 w-8 bg-foreground/10 rounded" />
        </div>
        <div className="w-full bg-foreground/5 h-2 rounded-full" />
      </div>
    </div>
  );

  const allTasks = useSelector((s) => s.tasks.tasks) || [];
  const tasks = allTasks.filter((t) => t && t.projectId === currentProjectId);

  const orgMembers = useSelector((s) => s.org.members || []);
  const projectMembers = useSelector((s) => s.projects.projectMembers || []);

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [viewingSprint, setViewingSprint] = useState(null);
  const [form, setForm] = useState({
    name: "",
    goal: "",
    startDate: "",
    endDate: "",
  });

  // Fetch sprints and members for the selected project when it changes
  useEffect(() => {
    if (currentProjectId) {
      dispatch(fetchSprints(currentProjectId));
      dispatch(fetchProjectMembers(currentProjectId));
    }
  }, [dispatch, currentProjectId]);

  const user = useSelector(s => s.auth.user);
  const myWorkspaceMember = orgMembers.find(m => m && m.id === user?.id);
  const isWorkspaceAdmin = myWorkspaceMember?.role === "ADMIN";
  const myProjectMember = projectMembers.find(pm => pm && (pm.id === user?.id || pm.userId === user?.id || (pm.user && pm.user._id === user?.id)));
  const isProjectLead = currentProject && (
    currentProject.memberRole === "TEAM_LEAD" ||
    myProjectMember?.role === "TEAM_LEAD" ||
    String(currentProject.teamLeadId) === String(user?.id) ||
    String(currentProject.createdBy) === String(user?.id)
  );
  const canManageSprints = isWorkspaceAdmin || isProjectLead;

  const create = async () => {
    if (!form.name.trim() || !currentProjectId) return;
    if (!form.startDate || !form.endDate) {
      toast.error("Please set start and end dates");
      return;
    }
    setCreating(true);
    const result = await dispatch(
      createSprintAsync({
        projectId: currentProjectId,
        name: form.name.trim(),
        goal: form.goal,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      })
    );
    if (createSprintAsync.fulfilled.match(result)) {
      toast.success("Sprint created");
      setForm({ name: "", goal: "", startDate: "", endDate: "" });
      setOpen(false);
      setActiveTab("planned"); // switch to planned tab after creating a sprint
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
      setActiveTab("active"); // switch to active tab when started
    } else {
      toast.error(result.payload?.message || "Failed to start sprint");
    }
  };

  const handleComplete = async (sprint) => {
    const id = sprint._id || sprint.id;
    const result = await dispatch(completeSprintAsync(id));
    if (completeSprintAsync.fulfilled.match(result)) {
      toast.success("Sprint completed");
      setActiveTab("completed"); // switch to history tab when completed
    } else {
      toast.error(result.payload?.message || "Failed to complete sprint");
    }
  };

  const handleDelete = async (sprint) => {
    if (!window.confirm(`Are you sure you want to delete "${sprint.name}"? Any active tasks assigned to this sprint will be moved back to the backlog.`)) {
      return;
    }
    const id = sprint._id || sprint.id;
    const result = await dispatch(deleteSprintAsync(id));
    if (deleteSprintAsync.fulfilled.match(result)) {
      toast.success("Sprint deleted successfully");
    } else {
      toast.error(result.payload?.message || "Failed to delete sprint");
    }
  };

  if (!currentWorkspaceId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="font-display text-2xl font-bold">No workspace selected</h2>
        <p className="text-sm text-muted-foreground mt-2">Please select or create a workspace to view sprints.</p>
      </div>
    );
  }

  if (!currentProjectId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-2xl">
        <div className="w-16 h-16 rounded-2xl bg-[color:var(--primary)]/10 text-[color:var(--primary)] flex items-center justify-center mb-6">
          <FolderKanban size={28} />
        </div>
        <h2 className="font-display text-2xl font-bold">No project selected</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Please select a project from the workspace menu in the left pane to view its sprints.
        </p>
      </div>
    );
  }

  let displayedSprints = [];
  let emptyMessage = "";
  if (activeTab === "active") {
    displayedSprints = activeSprints;
    emptyMessage = "No active sprint. Start a planned sprint from the Planned Sprints tab to kick it off.";
  } else if (activeTab === "planned") {
    displayedSprints = plannedSprints;
    emptyMessage = "No planned sprints. Click 'New sprint' to create one.";
  } else if (activeTab === "completed") {
    displayedSprints = completedSprints;
    emptyMessage = "No completed sprints yet.";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs text-muted-foreground tracking-wider uppercase font-semibold">
            Project: {currentProject?.projectKey} · {currentProject?.name}
          </div>
          <h1 className="font-display text-3xl font-bold mt-1">Sprints</h1>
          <p className="text-sm text-muted-foreground mt-1">Plan and run iterations for this project.</p>
        </div>
        {canManageSprints && (
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> New sprint
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
        {[
          { id: "active", label: "Active Sprint", count: activeSprints.length },
          { id: "planned", label: "Planned Sprints", count: plannedSprints.length },
          { id: "completed", label: "Sprint History", count: completedSprints.length },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={cn("relative px-4 py-2.5 text-sm font-medium whitespace-nowrap flex items-center gap-1.5", activeTab === t.id ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
            <span>{t.label}</span>
            <span className="text-[10px] text-muted-foreground bg-foreground/5 rounded-full px-1.5 font-normal">{t.count}</span>
            {activeTab === t.id && <motion.span layoutId="sprints-tab-bar" className="absolute bottom-0 left-2 right-2 h-[2px] bg-[color:var(--primary)] rounded-full" />}
          </button>
        ))}
      </div>

      {loading && sprints.length === 0 ? (
        <div className="grid lg:grid-cols-2 gap-4">
          <SprintSkeleton />
          <SprintSkeleton />
        </div>
      ) : displayedSprints.length === 0 ? (
        <GlassCard className="py-16 text-center">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </GlassCard>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {displayedSprints.map((s) => {
            const id = s._id || s.id;
            const sTasks = tasks.filter((t) => t.sprintId === id);
            const done = sTasks.filter((t) => t.status === "Done").length;
            const points = sTasks.reduce((a, t) => a + (t.points || 0), 0);
            const pct = sTasks.length ? Math.round((done / sTasks.length) * 100) : 0;
            return (
              <GlassCard key={id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
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

                <div className="mt-4 flex gap-2 items-center justify-between">
                  <div className="flex gap-2">
                    {s.status === "planned" && canManageSprints && (
                      <Button size="sm" onClick={() => handleStart(s)}>
                        <Play size={14} /> Start
                      </Button>
                    )}
                    {s.status === "active" && canManageSprints && (
                      <Button size="sm" variant="outline" onClick={() => handleComplete(s)}>
                        <Check size={14} /> Complete
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setViewingSprint(s)}>
                      View Tasks
                    </Button>
                  </div>
                  {canManageSprints && (
                    <button
                      onClick={() => handleDelete(s)}
                      className="p-1.5 rounded-md hover:bg-foreground/5 text-muted-foreground hover:text-red-500 transition-colors"
                      title="Delete Sprint"
                    >
                      <Trash2 size={15} />
                    </button>
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
            <Button onClick={create} disabled={!form.name.trim() || creating}>
              {creating ? <Loader2 className="animate-spin" size={14} /> : null}
              Create
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Project</Label>
            <Input className="mt-1.5 bg-foreground/5 cursor-not-allowed" readOnly value={currentProject?.name || ""} />
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

      {/* Modal: View Sprint Tasks & Details */}
      <Modal
        open={!!viewingSprint}
        onClose={() => setViewingSprint(null)}
        title={viewingSprint ? `Sprint: ${viewingSprint.name}` : ""}
        footer={
          <div className="flex justify-end">
            <Button onClick={() => setViewingSprint(null)}>Close</Button>
          </div>
        }
      >
        {viewingSprint && (() => {
          const sTasks = tasks.filter(t => t.sprintId === (viewingSprint._id || viewingSprint.id));
          return (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Goal</Label>
                <div className="text-sm font-medium mt-1 p-3 rounded-lg bg-foreground/[0.03] border border-border">
                  {viewingSprint.goal || <span className="text-muted-foreground italic">No goal defined for this sprint.</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <Label className="text-muted-foreground uppercase tracking-wider">Duration</Label>
                  <div className="mt-1 font-medium">{formatDate(viewingSprint.startDate)} → {formatDate(viewingSprint.endDate)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground uppercase tracking-wider">Status</Label>
                  <div className="mt-1"><Badge className="capitalize">{viewingSprint.status}</Badge></div>
                </div>
              </div>
              
              <div className="border-t border-border pt-4">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-2 block">Tasks ({sTasks.length})</Label>
                {sTasks.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">No tasks assigned to this sprint.</div>
                ) : (
                  <div className="mt-2 divide-y divide-border border border-border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    {sTasks.map(t => (
                      <div
                        key={t.id}
                        onClick={() => {
                          setViewingSprint(null);
                          dispatch(openTask(t.id));
                        }}
                        className="p-3 flex items-center justify-between gap-3 text-sm hover:bg-foreground/[0.02] cursor-pointer transition-colors"
                      >
                        <div className="font-medium truncate">{t.title}</div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge tone={priorityTone(t.priority)}>{t.priority}</Badge>
                          <Badge className="text-[10px] capitalize">{t.status.toLowerCase()}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
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
