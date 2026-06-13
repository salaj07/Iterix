import { useSelector } from "react-redux";
import { GlassCard } from "@/components/common/Primitives";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { STATUSES } from "@/store/seed";

const chartColor = "var(--primary)";
const gridColor = "color-mix(in oklab, currentColor 8%, transparent)";

export default function Reports() {
  const currentWorkspaceId = useSelector(s => s.workspace.currentWorkspaceId);
  const allProjects = useSelector(s => s.projects.projects);
  const projects = allProjects.filter(p => (p.workspace || p.workspaceId) === currentWorkspaceId);
  const projectIds = projects.map(p => p.id || p._id);

  const allTasks = useSelector(s => s.tasks.tasks);
  const tasks = allTasks.filter(t => projectIds.includes(t.projectId));

  const members = useSelector(s => s.org.members);

  const allSprints = useSelector(s => s.sprints.sprints);
  const sprints = allSprints.filter(s => projectIds.includes(s.projectId));

  const velocity = sprints.map((s, i) => ({
    name: `S${i + 1}`,
    points: tasks.filter(t => t.sprintId === s.id && t.status === "Done").reduce((a, t) => a + (t.points || 0), 0),
  }));
  if (velocity.length === 0) velocity.push({ name: "S1", points: 0 });

  const statusBreakdown = STATUSES.map(s => ({ name: s, count: tasks.filter(t => t.status === s).length }));

  const workload = members.map(m => ({
    name: m.name.split(" ")[0],
    open: tasks.filter(t => t.assigneeId === m.id && t.status !== "Done").length,
  }));

  // burndown — simple fake based on history
  const total = tasks.length || 1;
  const burndown = Array.from({ length: 8 }).map((_, i) => ({
    day: `D${i + 1}`,
    ideal: Math.round(total - (total / 7) * i),
    actual: Math.max(0, Math.round(total - (total / 8) * i - (Math.sin(i) * 0.5))),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Reports & analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">A calm view of how the team is performing.</p>
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
            <AreaChart data={burndown}>
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
            </AreaChart>
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
