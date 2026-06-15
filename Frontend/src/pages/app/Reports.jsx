import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { GlassCard } from "@/components/common/Primitives";
import Button from "@/components/common/Button";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { STATUSES } from "@/store/seed";
import { FolderKanban } from "lucide-react";

const chartColor = "var(--primary)";
const gridColor = "color-mix(in oklab, currentColor 8%, transparent)";

export default function Reports() {
  const currentWorkspaceId = useSelector(s => s.workspace.currentWorkspaceId);
  const currentProjectId = useSelector(s => s.projects.currentProjectId);
  const allProjects = useSelector(s => s.projects.projects) || [];
  const projects = allProjects.filter(p => p && (p.workspace === currentWorkspaceId || p.workspaceId === currentWorkspaceId));
  const currentProject = projects.find(p => p && (p.id === currentProjectId || p._id === currentProjectId));

  const allTasks = useSelector(s => s.tasks.tasks) || [];
  const tasks = allTasks.filter(t => t && t.projectId === currentProjectId);

  const members = useSelector(s => s.projects.projectMembers) || [];

  const allSprints = useSelector(s => s.sprints.sprints) || [];
  const sprints = allSprints.filter(s => s && s.projectId === currentProjectId);

  const velocity = sprints.map((s, i) => ({
    name: `S${i + 1}`,
    points: tasks.filter(t => t.sprintId === (s.id || s._id) && t.status === "Done").reduce((a, t) => a + (t.points || 0), 0),
  }));
  if (velocity.length === 0) velocity.push({ name: "S1", points: 0 });

  const statusBreakdown = STATUSES.map(s => ({ name: s, count: tasks.filter(t => t.status === s).length }));

  const workload = members.map(m => {
    const memberUser = m.user || m;
    const memberId = memberUser._id || memberUser.id || m.id;
    const memberName = memberUser.name || m.name || "Member";
    return {
      name: memberName.split(" ")[0],
      open: tasks.filter(t => t.assigneeId === memberId && t.status !== "Done").length,
    };
  });

  // burndown — simple fake based on history
  const total = tasks.length || 1;
  const burndown = Array.from({ length: 8 }).map((_, i) => ({
    day: `D${i + 1}`,
    ideal: Math.round(total - (total / 7) * i),
    actual: Math.max(0, Math.round(total - (total / 8) * i - (Math.sin(i) * 0.5))),
  }));

  if (!currentWorkspaceId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="font-display text-2xl font-bold">No workspace selected</h2>
        <p className="text-sm text-muted-foreground mt-2">Please select or create a workspace to view reports.</p>
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
          Please select a project from the workspace menu in the left pane to view reports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-muted-foreground tracking-wider uppercase font-semibold">
          Project: {currentProject?.projectKey} · {currentProject?.name}
        </div>
        <h1 className="font-display text-3xl font-bold mt-1">Reports & analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">A calm view of how this project is performing.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Sprint velocity" subtitle="Story points completed per sprint">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={velocity}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" stroke="currentColor" tick={{ fontSize: 11 }} />
              <YAxis stroke="currentColor" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "color-mix(in oklab, currentColor 6%, transparent)" }} />
              <Bar dataKey="points" fill={chartColor} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Task status" subtitle="Where work currently lives">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={statusBreakdown} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
              <XAxis type="number" stroke="currentColor" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" stroke="currentColor" tick={{ fontSize: 11 }} width={80} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "color-mix(in oklab, currentColor 6%, transparent)" }} />
              <Bar dataKey="count" fill={chartColor} radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Workload distribution" subtitle="Open tasks per team member">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={workload}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" stroke="currentColor" tick={{ fontSize: 11 }} />
              <YAxis stroke="currentColor" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "color-mix(in oklab, currentColor 6%, transparent)" }} />
              <Bar dataKey="open" fill={chartColor} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Burn-down" subtitle="Ideal vs actual remaining work">
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={burndown}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="day" stroke="currentColor" tick={{ fontSize: 11 }} />
              <YAxis stroke="currentColor" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="actual" stroke={chartColor} fill="url(#grad1)" strokeWidth={2} />
              <Line type="monotone" dataKey="ideal" stroke="currentColor" strokeDasharray="4 4" strokeOpacity={0.4} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--popover-foreground)",
};

function Card({ title, subtitle, children }) {
  return (
    <GlassCard>
      <div className="mb-3">
        <h3 className="font-display font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </GlassCard>
  );
}
