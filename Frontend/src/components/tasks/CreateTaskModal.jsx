import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import { Input, Label, Select, Textarea } from "@/components/common/Primitives";
import { createTaskAsync } from "@/store/slices/tasksSlice";
import * as projectApi from "@/services/project.api";
import { PRIORITIES, TASK_TYPES, STATUSES } from "@/store/seed";
import { openTask } from "@/store/slices/uiSlice";
import { toast } from "sonner";

export default function CreateTaskModal({ open, onClose, projectId, defaultStatus = "Backlog", defaultSprintId = undefined }) {
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user);
  const projects = useSelector(s => s.projects.projects);
  const sprints = useSelector(s => s.sprints.sprints);
  const members = useSelector(s => s.org.members);
  const me = members.find(m => m.id === user?.id);
  const [type, setType] = useState("Task");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [points, setPoints] = useState(3);
  const [status, setStatus] = useState(defaultStatus);
  const [assigneeId, setAssigneeId] = useState("");
  const [proj, setProj] = useState(projectId || projects[0]?.id || "");
  const [sprintId, setSprintId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [projectMembers, setProjectMembers] = useState([]);

  const projectSprints = sprints.filter(s => s && s.projectId === proj);
  const selectedProject = projects.find(p => p.id === proj);
  const isDeveloper = selectedProject && selectedProject.memberRole === "DEVELOPER";
  const isMeAdmin = me?.role === "ADMIN";
  const isMeLead = selectedProject?.teamLeadId === user?.id || selectedProject?.createdBy === user?.id || (
    projectMembers.some(x => x.id === user?.id && x.role === "TEAM_LEAD")
  );
  const isDevRestricted = isDeveloper && !isMeAdmin && !isMeLead;

  useEffect(() => {
    if (open) {
      setStatus(defaultStatus);
      setType("Task");
      setTitle("");
      setDescription("");
      setPriority("Medium");
      setPoints(3);
      setAssigneeId("");
      setProj(projectId || projects[0]?.id || "");
      setDueDate("");

      // Default to passed defaultSprintId, or active sprint of the selected project, or backlog
      const activeSprint = sprints.find(s => s.projectId === (projectId || projects[0]?.id) && s.status === "active");
      if (defaultSprintId !== undefined) {
        setSprintId(defaultSprintId === "backlog" ? "" : defaultSprintId);
      } else {
        setSprintId(activeSprint?.id || "");
      }
    }
  }, [open, defaultStatus, projectId, projects, defaultSprintId, sprints]);

  // Sync sprint default when project dropdown is manually changed in the modal
  useEffect(() => {
    if (open && proj) {
      const activeSprint = sprints.find(s => s.projectId === proj && s.status === "active");
      setSprintId(activeSprint?.id || "");
    }
  }, [proj, open, sprints]);

  // Fetch project members when modal is opened or selected project changes
  useEffect(() => {
    let active = true;
    if (open && proj) {
      projectApi.getProjectMembers(proj)
        .then(res => {
          if (active) {
            const fetchedMembers = res.data?.data || res.data || [];
            const mapped = fetchedMembers.map(pm => {
              const memberUser = pm.user || pm;
              const userId = pm.id || pm.userId || memberUser._id || memberUser.id || pm.user;
              const name = pm.name || memberUser.name || "Unknown";
              const email = pm.email || memberUser.email || "";
              return { id: String(userId), name, email, role: pm.role };
            }).filter(m => m.id);
            setProjectMembers(mapped);
          }
        })
        .catch(err => {
          console.error("Failed to load project members", err);
          if (active) {
            setProjectMembers([]);
          }
        });
    } else {
      setProjectMembers([]);
    }
    return () => {
      active = false;
    };
  }, [open, proj]);

  const submit = async () => {
    if (!title.trim() || !proj) return;
    const result = await dispatch(createTaskAsync({
      title: title.trim(), description, type, priority,
      points: Number(points), status,
      projectId: proj, sprintId: sprintId || null,
      assigneeId: assigneeId || null, reporterId: user.id,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    }));

    if (createTaskAsync.fulfilled.match(result)) {
      const createdTask = result.payload?.data;
      const taskCode = createdTask?.taskCode || "Task";
      toast.success(`${taskCode} created successfully`, {
        action: {
          label: "Open Details",
          onClick: () => dispatch(openTask(createdTask._id || createdTask.id))
        }
      });
    } else {
      toast.error(result.payload?.message || "Failed to create task");
    }

    setTitle(""); setDescription(""); setAssigneeId("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Create task" size="md"
      footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={!title.trim() || !proj}>Create task</Button></div>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Type</Label><Select className="mt-1.5" value={type} onChange={(e) => setType(e.target.value)}>{TASK_TYPES.map(t => <option key={t}>{t}</option>)}</Select></div>
          <div><Label>Status</Label><Select className="mt-1.5" value={status} onChange={(e) => setStatus(e.target.value)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</Select></div>
        </div>
        <div><Label>Title</Label><Input className="mt-1.5" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short, action-oriented summary" /></div>
        <div><Label>Description</Label><Textarea className="mt-1.5" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Add context, links, acceptance criteria…" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Project</Label><Select className="mt-1.5" value={proj} onChange={(e) => setProj(e.target.value)}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></div>
          <div>
            <Label>Sprint</Label>
            <Select className="mt-1.5" value={sprintId} onChange={(e) => setSprintId(e.target.value)}>
              <option value="">Backlog / Unscheduled</option>
              {projectSprints.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Assignee</Label>
            <Select className="mt-1.5" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              <option value="">Unassigned</option>
              {isDeveloper && (!isMeAdmin || isMeLead) ? (
                <option value={user?.id}>{user?.name} (You)</option>
              ) : (
                projectMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)
              )}
            </Select>
          </div>
          <div>
            <Label>Priority</Label>
            <Select className="mt-1.5" disabled={isDevRestricted} value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </Select>
          </div>
          <div>
            <Label>Story points</Label>
            <Input className="mt-1.5" type="number" disabled={isDevRestricted} min={0} value={points} onChange={(e) => setPoints(e.target.value)} />
          </div>
          <div>
            <Label>Due date</Label>
            <Input className="mt-1.5" type="date" disabled={isDevRestricted} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
