import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { fetchMyInvitations } from "@/store/slices/orgSlice";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowUpRight, FolderKanban, ListChecks, CheckCheck, Users,
  Activity, Flame, Plus, UserPlus, Boxes, Mail,
} from "lucide-react";
import { GlassCard, Badge } from "@/components/common/Primitives";
import Avatar, { AvatarStack } from "@/components/common/Avatar";
import Button from "@/components/common/Button";
import { ROLES } from "@/store/seed";
import { roleLabel, roleTone, formatRelative, priorityTone } from "@/lib/format";
import { openTask } from "@/store/slices/uiSlice";

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector(s => s.auth.user);
  const currentWorkspaceId = useSelector(s => s.workspace.currentWorkspaceId);
  const workspaces = useSelector(s => s.workspace.workspaces) || [];
  const currentWs = workspaces.find(w => w && (w.id === currentWorkspaceId || w._id === currentWorkspaceId));
  const workspaceRole = currentWs?.role || "DEVELOPER";

  const allProjects = useSelector(s => s.projects.projects) || [];
  const projects = allProjects.filter(p => p && (p.workspace === currentWorkspaceId || p.workspaceId === currentWorkspaceId));
  
  const currentProjectId = useSelector(s => s.projects.currentProjectId);
  const currentProject = projects.find(p => p && (p.id === currentProjectId || p._id === currentProjectId));

  const allSprints = useSelector(s => s.sprints.sprints) || [];
  const sprints = allSprints.filter(s => s && s.projectId === currentProjectId);

  const allTasks = useSelector(s => s.tasks.tasks) || [];
  const tasks = allTasks.filter(t => t && t.projectId === currentProjectId);

  const projectMembers = useSelector(s => s.projects.projectMembers) || [];
  const myInvitations = useSelector(s => s.org.myInvitations) || [];

  useEffect(() => {
    dispatch(fetchMyInvitations());
  }, [dispatch]);

  const myTasks = tasks.filter(t => t.assigneeId === user?.id && t.status !== "Done");
  const activeSprints = sprints.filter(s => s.status === "active");
  const completedTasks = tasks.filter(t => t.status === "Done").length;
  const hasWorkspace = workspaces.length > 0;

  if (!currentWorkspaceId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[color:var(--primary)]/10 text-[color:var(--primary)] flex items-center justify-center mb-6">
          <Boxes size={28} />
        </div>
        <h2 className="font-display text-2xl font-bold">No workspace selected</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Please select or create a workspace to view your dashboard.
        </p>
        <div className="mt-6">
          <Button onClick={() => navigate("/onboarding")}><Plus size={15} /> Create workspace</Button>
        </div>
      </div>
    );
  }

  if (!currentProjectId) {
    return (
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <span>Hi {user?.name?.split(" ")[0]} 👋</span>
              <Badge tone={roleTone(workspaceRole)}>{roleLabel(workspaceRole)}</Badge>
            </div>
            <h1 className="font-display text-3xl font-bold mt-2">Here's your day at a glance</h1>
          </div>
          <div className="flex gap-2">
            {workspaceRole === "ADMIN" && (
              <Link to="/app/projects">
                <Button><Plus size={15} /> Create project</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction icon={Plus} title="Create Workspace" desc="Spin up a new home for your team." onClick={() => navigate("/onboarding")} accent />
          <QuickAction icon={UserPlus} title="Join Workspace" desc="Use an invite code to join an existing team." onClick={() => toast.info("Ask your admin to send you an invite link.")} />
          <QuickAction icon={Boxes} title="Browse Workspaces" desc={hasWorkspace ? `${workspaces.length} workspace${workspaces.length>1?"s":""} available` : "You have no workspaces yet"} onClick={() => navigate("/app/workspaces")} />
          <QuickAction
            icon={Mail}
            title="Invitations"
            desc={myInvitations.length > 0 ? `${myInvitations.length} pending invitation${myInvitations.length > 1 ? "s" : ""}` : "No pending invitations"}
            onClick={() => {
              if (myInvitations.length > 0) {
                navigate("/onboarding");
              } else {
                toast.info("No pending invitations.");
              }
            }}
            accent={myInvitations.length > 0}
          />
        </div>

        <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-[color:var(--primary)]/10 text-[color:var(--primary)] flex items-center justify-center mb-6">
            <FolderKanban size={28} />
          </div>
          <h2 className="font-display text-2xl font-bold">No project selected</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            Please select a project from the workspace menu in the left pane, or navigate to Projects to create a new one.
          </p>
          <div className="mt-6 flex gap-2">
            <Link to="/app/projects">
              <Button variant="outline">Go to Projects</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <span>Hi {user?.name?.split(" ")[0]} 👋</span>
            <Badge tone={roleTone(workspaceRole)}>{roleLabel(workspaceRole)}</Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-1.5 tracking-wider uppercase font-semibold">
            Project: {currentProject?.projectKey} · {currentProject?.name}
          </div>
          <h1 className="font-display text-3xl font-bold mt-1">Here's your day at a glance</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/app/projects"><Button variant="outline">All projects <ArrowUpRight size={15} /></Button></Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Flame} label="Active Sprints" value={activeSprints.length} />
        <Stat icon={ListChecks} label="Total Tasks" value={tasks.length} />
        <Stat icon={CheckCheck} label="Completed" value={completedTasks} />
        <Stat icon={Users} label="Project Team" value={projectMembers.length} />
      </div>

      {/* Role-specific blocks */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <GlassCard>
            <Header title="My tasks" subtitle="Open items assigned to you in this project" />
            {myTasks.length === 0 ? (
              <Empty text="No open tasks assigned to you in this project." />
            ) : (
              <ul className="divide-y divide-border -mx-2">
                {myTasks.slice(0, 6).map(t => (
                  <li key={t.id}>
                    <button onClick={() => dispatch(openTask(t.id))} className="w-full px-2 py-3 hover:bg-foreground/5 rounded-lg flex items-center gap-3 text-left">
                      <span className={`w-1.5 h-8 rounded-full ${statusBar(t.status)}`} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{t.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                          <span>{t.status}</span>
                          {t.points != null && <span>· {t.points} pts</span>}
                        </div>
                      </div>
                      <Badge tone={priorityTone(t.priority)} className="hidden sm:inline-flex">{t.priority}</Badge>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>

          <GlassCard>
            <Header title="Project info" />
            <div className="glass-flat p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground font-semibold tracking-wider">{currentProject?.projectKey}</span>
                <AvatarStack members={projectMembers} size={22} max={5} />
              </div>
              <div className="font-semibold text-lg mt-2">{currentProject?.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{currentProject?.description || "No description provided."}</div>
              <div className="mt-4">
                <div className="h-1.5 rounded-full bg-foreground/8 overflow-hidden">
                  <div className="h-full bg-[color:var(--primary)]" style={{ width: `${tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0}%` }} />
                </div>
                <div className="text-[10px] text-muted-foreground mt-1.5">{tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0}% complete</div>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-5">
          <GlassCard>
            <Header title="Project workload" subtitle="Open tasks per project member" />
            <div className="space-y-3">
              {projectMembers.map(m => {
                const memberUser = m.user || m;
                const memberId = memberUser._id || memberUser.id || m.id;
                const memberName = memberUser.name || m.name || "Member";
                const count = tasks.filter(t => t.assigneeId === memberId && t.status !== "Done").length;
                const pct = Math.min(100, count * 15);
                return (
                  <div key={memberId}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={memberName} color={m.avatarColor} size={20} />
                        <span className="truncate">{memberName}</span>
                      </div>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-foreground/8 overflow-hidden">
                      <div className="h-full bg-[color:var(--primary)]/70" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {projectMembers.length === 0 && <Empty text="No project members yet" />}
            </div>
          </GlassCard>

          <GlassCard>
            <Header title="Recent activity" />
            <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {tasks.slice(0, 5).flatMap(t => t.history.slice(-1).map(h => ({ ...h, taskTitle: t.title, taskId: t.id }))).slice(0, 6).map((h, i) => (
                <li key={i} className="flex gap-3 text-xs">
                  <div className="w-7 h-7 rounded-full bg-foreground/5 flex items-center justify-center shrink-0"><Activity size={13} className="text-muted-foreground" /></div>
                  <div className="min-w-0">
                    <div className="text-foreground truncate">{h.taskTitle}</div>
                    <div className="text-muted-foreground">{formatRelative(h.at)}</div>
                  </div>
                </li>
              ))}
              {tasks.length === 0 && <Empty text="No activity yet" />}
            </ul>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-[10px] bg-[color:var(--primary)]/10 text-[color:var(--primary)] flex items-center justify-center">
            <Icon size={16} />
          </div>
        </div>
        <div className="text-2xl font-display font-bold">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </GlassCard>
    </motion.div>
  );
}

function QuickAction({ icon: Icon, title, desc, onClick, accent }) {
  return (
    <motion.button
      whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`text-left glass p-4 rounded-[16px] group flex gap-3 items-start ${accent ? "ring-1 ring-[color:var(--primary)]/30" : ""}`}
    >
      <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${accent ? "bg-[color:var(--primary)] text-white" : "bg-[color:var(--primary)]/10 text-[color:var(--primary)]"}`}>
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{desc}</div>
      </div>
    </motion.button>
  );
}

function Header({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h3 className="font-display font-semibold">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function Empty({ text }) { return <div className="py-8 text-center text-sm text-muted-foreground">{text}</div>; }

function statusBar(s) {
  return {
    "Backlog": "bg-foreground/20", "Todo": "bg-blue-500",
    "In Progress": "bg-amber-500", "In Review": "bg-violet-500", "Done": "bg-emerald-500",
  }[s];
}
