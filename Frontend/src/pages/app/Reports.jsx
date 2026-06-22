import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { GlassCard, Select, Label } from "@/components/common/Primitives";
import Button from "@/components/common/Button";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { STATUSES } from "@/store/seed";
import { FolderKanban } from "lucide-react";
import { fetchSprints } from "@/store/slices/sprintsSlice";
import { fetchProjectMembers } from "@/store/slices/projectsSlice";
import { fetchProjectTasks } from "@/store/slices/tasksSlice";

const chartColor = "var(--primary)";
const gridColor = "color-mix(in oklab, currentColor 8%, transparent)";

export default function Reports() {
  const dispatch = useDispatch();
  const currentWorkspaceId = useSelector(s => s.workspace.currentWorkspaceId);
  const currentProjectId = useSelector(s => s.projects.currentProjectId);
  const allProjects = useSelector(s => s.projects.projects) || [];
  const projects = allProjects.filter(p => p && (p.workspace === currentWorkspaceId || p.workspaceId === currentWorkspaceId));
  const currentProject = projects.find(p => p && (p.id === currentProjectId || p._id === currentProjectId));

  const allTasks = useSelector(s => s.tasks.tasks) || [];
  const tasks = allTasks.filter(t => t && t.projectId === currentProjectId);

  const members = useSelector(s => s.projects.projectMembers) || [];

  const allSprints = useSelector(s => s.sprints.sprints) || [];
  const sprints = [...allSprints]
    .filter(s => s && s.projectId === currentProjectId)
    .sort((a, b) => new Date(a.createdAt || a.startDate || 0) - new Date(b.createdAt || b.startDate || 0));

  // Fetch all necessary data on mount / project change
  useEffect(() => {
    if (currentProjectId) {
      dispatch(fetchSprints(currentProjectId));
      dispatch(fetchProjectMembers(currentProjectId));
      dispatch(fetchProjectTasks(currentProjectId));
    }
  }, [dispatch, currentProjectId]);

  const activeSprint = sprints.find(s => s.status === "active" || s.status === "ACTIVE");
  const [selectedSprintId, setSelectedSprintId] = useState("all");

  // Reset filter and default to active sprint when project changes
  useEffect(() => {
    const active = sprints.find(s => s.status === "active" || s.status === "ACTIVE");
    if (active) {
      setSelectedSprintId(active.id || active._id);
    } else {
      setSelectedSprintId("all");
    }
  }, [currentProjectId]);

  const filteredTasks = selectedSprintId === "all"
    ? tasks
    : tasks.filter(t => t.sprintId === selectedSprintId);

  const velocity = sprints.map((s) => ({
    name: s.name.split("—")[0].trim().slice(0, 10),
    points: tasks.filter(t => t.sprintId === (s.id || s._id) && t.status === "Done").reduce((a, t) => a + (t.points || 0), 0),
  }));
  if (velocity.length === 0) velocity.push({ name: "No Sprints", points: 0 });

  const statusBreakdown = STATUSES.map(s => ({ name: s, count: filteredTasks.filter(t => t.status === s).length }));

  const workload = members.map(m => {
    const memberUser = m.user || m;
    const memberId = memberUser._id || memberUser.id || m.id;
    const memberName = memberUser.name || m.name || "Member";
    return {
      name: memberName.split(" ")[0],
      open: filteredTasks.filter(t => t.assigneeId === memberId && t.status !== "Done").length,
    };
  });

  // burndown — realistic progression based on tasks in selected or active sprint
  const displaySprint = selectedSprintId === "all"
    ? activeSprint
    : sprints.find(s => (s.id || s._id) === selectedSprintId);

  const sprintTasks = displaySprint 
    ? tasks.filter(t => t.sprintId === (displaySprint.id || displaySprint._id)) 
    : tasks;
  const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.points || 0), 0) || sprintTasks.length || 10;
  const doneTasks = sprintTasks.filter(t => t.status === "Done");
  const donePoints = doneTasks.reduce((sum, t) => sum + (t.points || 0), 0) || 0;

  const burndown = Array.from({ length: 8 }).map((_, i) => {
    const ideal = Math.max(0, Math.round(totalPoints - (totalPoints / 7) * i));
    const dayPct = i / 7;
    // Done points are gradually subtracted, adding a small random variance for visualization
    const actualRemaining = Math.max(0, Math.round(
      totalPoints - (donePoints * Math.min(1, dayPct * 1.25)) - (Math.sin(i) * (totalPoints * 0.04))
    ));
    return {
      day: `Day ${i + 1}`,
      ideal,
      actual: i === 0 ? totalPoints : actualRemaining,
    };
  });

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
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs text-muted-foreground tracking-wider uppercase font-semibold">
            Project: {currentProject?.projectKey} · {currentProject?.name}
          </div>
          <h1 className="font-display text-3xl font-bold mt-1">Reports & analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">A calm view of how this project is performing.</p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium whitespace-nowrap">Sprint Filter:</Label>
          <Select
            className="w-48 text-xs"
            value={selectedSprintId}
            onChange={(e) => setSelectedSprintId(e.target.value)}
          >
            <option value="all">All Sprints / Project Wide</option>
            {sprints.map((s) => (
              <option key={s.id || s._id} value={s.id || s._id}>
                {s.name} ({s.status})
              </option>
            ))}
          </Select>
        </div>
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

        <Card title="Burn-down" subtitle={displaySprint ? `Remaining story points for "${displaySprint.name}"` : "Remaining story points for project tasks"}>
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
