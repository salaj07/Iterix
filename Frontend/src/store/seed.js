// Initial seed data: minimal demo so empty states are reachable
import { uid } from "@/lib/uid";

export const ROLES = {
  ADMIN: "ADMIN",
  TEAM_LEAD: "TEAM_LEAD",
  DEVELOPER: "DEVELOPER",
};

export const STATUSES = ["Backlog", "Todo", "In Progress", "In Review", "Done"];
export const KANBAN_STATUSES = ["Todo", "In Progress", "In Review", "Done"];

export const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

export const TASK_TYPES = ["Story", "Task", "Bug", "Epic"];

export const createSeed = (currentUser) => {
  if (!currentUser) return null;
  const orgId = uid();
  const projectId = uid();
  const sprintId = uid();
  const me = {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    avatarColor: currentUser.avatarColor,
    role: ROLES.ADMIN,
  };

  const lead = {
    id: uid(),
    name: "Maya Lindgren",
    email: "maya@Iterix.demo",
    avatarColor: "#A79277",
    role: ROLES.TEAM_LEAD,
  };
  const dev1 = {
    id: uid(),
    name: "Arjun Patel",
    email: "arjun@Iterix.demo",
    avatarColor: "#FF6044",
    role: ROLES.DEVELOPER,
  };
  const dev2 = {
    id: uid(),
    name: "Sofia Castro",
    email: "sofia@Iterix.demo",
    avatarColor: "#6b5b47",
    role: ROLES.DEVELOPER,
  };

  const members = [me, lead, dev1, dev2];

  const tasks = [
    {
      id: uid(), projectId, sprintId,
      title: "Design onboarding empty states",
      description: "Cover the 'no workspace yet' and 'no projects yet' screens with illustrations and CTAs.",
      type: "Story", priority: "High", points: 5,
      status: "Todo", assigneeId: dev2.id, reporterId: lead.id,
      labels: ["design", "onboarding"], dueDate: null,
      comments: [], history: [{ at: Date.now(), by: lead.id, type: "created" }],
      subtasks: [
        { id: uid(), title: "Empty workspace screen", done: true },
        { id: uid(), title: "Empty projects screen", done: false },
      ],
    },
    {
      id: uid(), projectId, sprintId,
      title: "Kanban drag-and-drop polish",
      description: "Smooth column-to-column drag with layout animations.",
      type: "Task", priority: "Medium", points: 3,
      status: "In Progress", assigneeId: dev1.id, reporterId: lead.id,
      labels: ["frontend"], dueDate: null,
      comments: [], history: [{ at: Date.now(), by: lead.id, type: "created" }],
      subtasks: [],
    },
    {
      id: uid(), projectId, sprintId,
      title: "Sprint velocity chart shows stale data",
      description: "When a sprint completes, the chart still references the previous range.",
      type: "Bug", priority: "Urgent", points: 2,
      status: "In Review", assigneeId: dev1.id, reporterId: me.id,
      labels: ["bug", "reports"], dueDate: null,
      comments: [], history: [{ at: Date.now(), by: dev1.id, type: "submitted_for_review" }],
      subtasks: [],
    },
    {
      id: uid(), projectId, sprintId: null,
      title: "Integrate notifications center",
      description: "Bell icon, unread badge, filterable list.",
      type: "Story", priority: "Medium", points: 5,
      status: "Backlog", assigneeId: null, reporterId: me.id,
      labels: ["frontend"], dueDate: null, comments: [], history: [], subtasks: [],
    },
    {
      id: uid(), projectId, sprintId,
      title: "Sign-in OTP keyboard navigation",
      description: "Auto-focus next box and support paste of 6-digit codes.",
      type: "Task", priority: "Low", points: 2,
      status: "Done", assigneeId: dev2.id, reporterId: lead.id,
      labels: ["auth"], dueDate: null, comments: [], history: [], subtasks: [],
    },
  ];

  return {
    org: {
      id: orgId,
      name: "Acme Studio",
      description: "Product, design and engineering for the modern web.",
      teamSize: "11-50",
      ownerId: me.id,
      logo: null,
    },
    members,
    project: {
      id: projectId,
      orgId,
      name: "Atlas Web Platform",
      key: "ATL",
      description: "Customer-facing dashboard rebuild.",
      teamLeadId: lead.id,
      memberIds: [me.id, lead.id, dev1.id, dev2.id],
      createdAt: Date.now(),
    },
    sprint: {
      id: sprintId,
      projectId,
      name: "Sprint 14 — Polish week",
      goal: "Smooth out the rough edges before launch.",
      status: "active",
      startDate: Date.now() - 5 * 86400000,
      endDate: Date.now() + 9 * 86400000,
    },
    tasks,
  };
};
