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
  const user = useSelector(s => s.auth.user);
  const members = useSelector(s => s.org.members);
  const me = members.find(m => m.id === user?.id) || { ...user, role: ROLES.ADMIN };
  const currentWorkspaceId = useSelector(s => s.workspace.currentWorkspaceId);
  const allProjects = useSelector(s => s.projects.projects);
  const projects = allProjects.filter(p => (p.workspace || p.workspaceId) === currentWorkspaceId);
  const projectIds = projects.map(p => p.id || p._id);

  const allSprints = useSelector(s => s.sprints.sprints);
  const sprints = allSprints.filter(s => projectIds.includes(s.projectId));

  const allTasks = useSelector(s => s.tasks.tasks);
  const tasks = allTasks.filter(t => projectIds.includes(t.projectId));

  const workspaces = useSelector(s => s.workspace.workspaces);
  const myInvitations = useSelector(s => s.org.myInvitations || []);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchMyInvitations());
  }, [dispatch]);

  const myTasks = tasks.filter(t => t.assigneeId === user?.id);
  const activeSprints = sprints.filter(s => s.status === "active");
  const completedTasks = tasks.filter(t => t.status === "Done").length;
  const hasWorkspace = workspaces.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <span>Hi {user?.name?.split(" ")[0]} 👋</span>
            <Badge tone={roleTone(me.role)}>{roleLabel(me.role)}</Badge>
          </div>
          <h1 className="font-display text-3xl font-bold mt-2">Here's your day at a glance</h1>
        </div>
        <div className="flex gap-2">
          {hasWorkspace && <Link to="/app/projects"><Button variant="outline">All projects <ArrowUpRight size={15} /></Button></Link>}
          <Button onClick={() => navigate("/onboarding")}><Plus size={15} /> Create workspace</Button>
        </div>
      </div>

      {/* Quick actions — always visible, more prominent when empty */}
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


      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat icon={FolderKanban} label="Active Projects" value={projects.length} />
        <Stat icon={Flame} label="Active Sprints" value={activeSprints.length} />
        <Stat icon={ListChecks} label="Total Tasks" value={tasks.length} />
        <Stat icon={CheckCheck} label="Completed" value={completedTasks} />
        <Stat icon={Users} label="Team Members" value={members.length} />
      </div>

      {/* Role-specific blocks */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <GlassCard>
            <Header title="My tasks" subtitle="Items assigned to you" />
            {myTasks.length === 0 ? (
              <Empty text="No tasks assigned to you yet." />
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
            <Header title="Active projects" subtitle="Where the team is shipping right now" />
            {projects.length === 0 ? <Empty text="No projects yet. Create one to get started." /> : (
              <div className="grid sm:grid-cols-2 gap-3">
                {projects.slice(0, 4).map(p => {
                  const lead = members.find(m => m.id === p.teamLeadId);
                  const memberObjs = members.filter(m => p.memberIds?.includes(m.id));
                  const projTasks = tasks.filter(t => t.projectId === p.id);
                  const done = projTasks.filter(t => t.status === "Done").length;
                  const pct = projTasks.length ? Math.round((done / projTasks.length) * 100) : 0;
                  return (
                    <Link key={p.id} to={`/app/projects/${p.id}`}>
                      <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }} className="glass-flat p-4 h-full">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground font-semibold tracking-wider">{p.key}</span>
                          <AvatarStack members={memberObjs} size={22} max={3} />
                        </div>
                        <div className="font-semibold mt-2">{p.name}</div>
                        <div className="text-xs text-muted-foreground mt-1 truncate">Lead: {lead?.name || "Unassigned"}</div>
                        <div className="mt-3">
                          <div className="h-1.5 rounded-full bg-foreground/8 overflow-hidden">
                            <div className="h-full bg-[color:var(--primary)]" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1.5">{pct}% complete</div>
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>

        <div className="space-y-5">
          <GlassCard>
            <Header title="Workload" subtitle="Open tasks per member" />
            <div className="space-y-3">
              {members.map(m => {
                const count = tasks.filter(t => t.assigneeId === m.id && t.status !== "Done").length;
                const pct = Math.min(100, count * 15);
                return (
                  <div key={m.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2 min-w-0"><Avatar name={m.name} color={m.avatarColor} size={20} /><span className="truncate">{m.name}</span></div>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-foreground/8 overflow-hidden">
                      <div className="h-full bg-[color:var(--primary)]/70" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {members.length === 0 && <Empty text="No team members yet" />}
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
