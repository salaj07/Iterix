import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as taskApi from "@/services/task.api";
import * as commentApi from "@/services/comment.api";

/* ─── Mapping Helper ────────────────────────────────────────────────── */

const mapTaskFromBackend = (t) => {
  if (!t) return t;

  let status = "Backlog";
  if (t.workflowStage === "SPRINT") {
    if (t.status === "TODO") status = "Todo";
    else if (t.status === "IN_PROGRESS") status = "In Progress";
    else if (t.status === "IN_REVIEW") status = "In Review";
    else if (t.status === "DONE") status = "Done";
    else status = t.status || "Todo";
  } else if (t.workflowStage === "BACKLOG") {
    status = "Backlog";
  } else {
    status = t.status || "Backlog";
  }

  let priority = "Medium";
  if (t.priority === "LOW") priority = "Low";
  else if (t.priority === "MEDIUM") priority = "Medium";
  else if (t.priority === "HIGH") priority = "High";
  else if (t.priority === "CRITICAL") priority = "Urgent";
  else priority = t.priority || "Medium";

  const history = t.history ? t.history.map(h => ({
    ...h,
    at: typeof h.at === "number" ? h.at : new Date(h.at).getTime(),
    by: typeof h.by === "object" ? (h.by._id || h.by.id) : h.by
  })) : [];

  return {
    ...t,
    id: t.id || t._id,
    projectId: t.projectId || (t.project && (typeof t.project === "object" ? t.project._id || t.project.id : t.project)),
    sprintId: t.sprintId || (t.sprint && (typeof t.sprint === "object" ? t.sprint._id || t.sprint.id : t.sprint)),
    assigneeId: t.assigneeId || (t.assignee && (typeof t.assignee === "object" ? t.assignee._id || t.assignee.id : t.assignee)),
    reporterId: t.reporterId || t.createdBy,
    points: t.points !== undefined ? t.points : t.storyPoints,
    archived: t.archived !== undefined ? t.archived : t.isArchived,
    status,
    priority,
    history,
  };
};

/* ─── Async Thunks ────────────────────────────────────────────────────── */

/** Fetch all tasks for a project */
export const fetchProjectTasks = createAsyncThunk(
  "tasks/fetchByProject",
  async (projectId, { rejectWithValue }) => {
    try {
      const res = await taskApi.getProjectTasks(projectId);
      return res.data; // { success, data: [...tasks] }
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to load tasks" });
    }
  }
);

/** Create a new task */
export const createTaskAsync = createAsyncThunk(
  "tasks/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await taskApi.createTask(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to create task" });
    }
  }
);

/** Change task status */
export const changeTaskStatusAsync = createAsyncThunk(
  "tasks/changeStatus",
  async ({ taskId, status }, { rejectWithValue }) => {
    try {
      const res = await taskApi.changeTaskStatus(taskId, status);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to update status" });
    }
  }
);

/** Assign task to user */
export const assignTaskAsync = createAsyncThunk(
  "tasks/assign",
  async ({ taskId, assigneeId }, { rejectWithValue }) => {
    try {
      const res = await taskApi.assignTask(taskId, assigneeId);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to assign task" });
    }
  }
);

/** Move a task to a sprint */
export const moveToSprintAsync = createAsyncThunk(
  "tasks/moveToSprint",
  async ({ taskId, sprintId }, { rejectWithValue }) => {
    try {
      const res = await taskApi.moveToSprint(taskId, sprintId);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to move task to sprint" });
    }
  }
);

/** Approve a task */
export const approveTaskAsync = createAsyncThunk(
  "tasks/approve",
  async (taskId, { rejectWithValue }) => {
    try {
      const res = await taskApi.approveTask(taskId);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to approve task" });
    }
  }
);

/** Request changes on a task */
export const requestChangesAsync = createAsyncThunk(
  "tasks/requestChanges",
  async ({ taskId, note }, { rejectWithValue }) => {
    try {
      const res = await taskApi.requestChanges(taskId, note);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to request changes" });
    }
  }
);

/** Update task details */
export const updateTaskDetailsAsync = createAsyncThunk(
  "tasks/updateDetails",
  async ({ taskId, data }, { rejectWithValue }) => {
    try {
      const res = await taskApi.updateTaskDetails(taskId, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to update task details" });
    }
  }
);

/** Delete a task */
export const deleteTaskAsync = createAsyncThunk(
  "tasks/delete",
  async (taskId, { rejectWithValue }) => {
    try {
      await taskApi.deleteTask(taskId);
      return taskId;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to delete task" });
    }
  }
);

/** Fetch comments for a task from the backend */
export const fetchCommentsAsync = createAsyncThunk(
  "tasks/fetchComments",
  async (taskId, { rejectWithValue }) => {
    try {
      const res = await commentApi.getTaskComments(taskId);
      return { taskId, comments: res.data.data || [] };
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to load comments" });
    }
  }
);

/** Add a comment via the backend */
export const addCommentAsync = createAsyncThunk(
  "tasks/addComment",
  async ({ taskId, content }, { rejectWithValue }) => {
    try {
      const res = await commentApi.addComment(taskId, content);
      return { taskId, comment: res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to add comment" });
    }
  }
);

/* ─── Helper to replace a task in state ─────────────────────────────── */
const replaceTask = (state, updatedTask) => {
  if (!updatedTask) return;
  const mapped = mapTaskFromBackend(updatedTask);
  const idx = state.tasks.findIndex((t) => t.id === mapped.id || t._id === mapped.id);
  if (idx !== -1) {
    state.tasks[idx] = {
      subtasks: [],
      comments: [],
      history: [],
      ...state.tasks[idx],
      ...mapped,
    };
  } else {
    state.tasks.push({
      subtasks: [],
      comments: [],
      history: [],
      ...mapped,
    });
  }
};

/* ─── Slice ───────────────────────────────────────────────────────────── */
const slice = createSlice({
  name: "tasks",
  initialState: {
    tasks: [],
    loading: false,
    error: null,
  },
  reducers: {
    /** Synchronous local reducers — kept for optimistic UI and backwards compat */
    createTask: {
      reducer(state, { payload }) {
        const mapped = mapTaskFromBackend(payload);
        state.tasks.push({
          subtasks: [],
          comments: [],
          history: [],
          ...mapped,
        });
      },
      prepare(input) {
        return {
          payload: {
            id: `local-${Date.now()}`,
            createdAt: Date.now(),
            status: "Backlog",
            labels: [],
            comments: [],
            subtasks: [],
            history: [],
            attachments: [],
            ...input,
          },
        };
      },
    },
    seedTasks(state, { payload }) {
      payload.forEach((t) => {
        const id = t.id || t._id;
        if (!state.tasks.find((x) => x.id === id || x._id === id)) {
          state.tasks.push({
            subtasks: [],
            comments: [],
            history: [],
            ...mapTaskFromBackend({ ...t, id }),
          });
        }
      });
    },
    moveTask(state, { payload }) {
      const t = state.tasks.find((x) => x.id === payload.id || x._id === payload.id);
      if (t && t.status !== payload.status) {
        t.history = [...(t.history || []), { at: Date.now(), by: payload.by, type: "status_change", from: t.status, to: payload.status }];
        t.status = payload.status;
      }
    },
    updateTask(state, { payload }) {
      const id = payload.id || payload._id;
      const t = state.tasks.find((x) => x.id === id || x._id === id);
      if (t) Object.assign(t, mapTaskFromBackend({ ...t, ...payload, id }));
    },
    deleteTask(state, { payload }) {
      state.tasks = state.tasks.filter((t) => t.id !== payload && t._id !== payload);
    },
    addComment(state, { payload }) {
      const t = state.tasks.find((x) => x.id === payload.taskId || x._id === payload.taskId);
      if (t) {
        t.comments = [...(t.comments || []), { id: `c-${Date.now()}`, authorId: payload.authorId, text: payload.text, at: Date.now() }];
      }
    },
    addSubtask(state, { payload }) {
      const t = state.tasks.find((x) => x.id === payload.taskId || x._id === payload.taskId);
      if (t) t.subtasks = [...(t.subtasks || []), { id: `s-${Date.now()}`, title: payload.title, done: false }];
    },
    toggleSubtask(state, { payload }) {
      const t = state.tasks.find((x) => x.id === payload.taskId || x._id === payload.taskId);
      if (t) {
        const s = t.subtasks?.find((x) => x._id === payload.subtaskId || x.id === payload.subtaskId);
        if (s) s.done = !s.done;
      }
    },
    submitForReview(state, { payload }) {
      const t = state.tasks.find((x) => x.id === payload.id || x._id === payload.id);
      if (t) {
        t.status = "In Review";
        t.history = [...(t.history || []), { at: Date.now(), by: payload.by, type: "submitted_for_review" }];
      }
    },
    approveTask(state, { payload }) {
      const t = state.tasks.find((x) => x.id === payload.id || x._id === payload.id);
      if (t) {
        t.status = "Done";
        t.history = [...(t.history || []), { at: Date.now(), by: payload.by, type: "approved" }];
      }
    },
    rejectTask(state, { payload }) {
      const t = state.tasks.find((x) => x.id === payload.id || x._id === payload.id);
      if (t) {
        t.status = "In Progress";
        t.history = [...(t.history || []), { at: Date.now(), by: payload.by, type: "rejected", note: payload.note }];
        if (payload.note) {
          t.comments = [...(t.comments || []), { id: `c-${Date.now()}`, authorId: payload.by, text: `Review feedback: ${payload.note}`, at: Date.now() }];
        }
      }
    },
    archiveTask(state, { payload }) {
      const t = state.tasks.find((x) => x.id === payload.id || x._id === payload.id);
      if (t) {
        t.archived = true;
        t.archivedAt = Date.now();
        t.history = [...(t.history || []), { at: Date.now(), by: payload.by, type: "archived" }];
      }
    },
    unarchiveTask(state, { payload }) {
      const t = state.tasks.find((x) => x.id === payload.id || x._id === payload.id);
      if (t) {
        t.archived = false;
        t.archivedAt = null;
        t.history = [...(t.history || []), { at: Date.now(), by: payload.by, type: "unarchived" }];
      }
    },
  },
  extraReducers: (builder) => {
    /* fetchProjectTasks */
    builder
      .addCase(fetchProjectTasks.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProjectTasks.fulfilled, (state, { payload, meta }) => {
        state.loading = false;
        const projectId = meta.arg;
        const incoming = payload.data || [];
        const otherTasks = state.tasks.filter((t) => t.projectId !== projectId);
        const mappedIncoming = incoming.map((t) => ({
          subtasks: [],
          comments: [],
          history: [],
          ...mapTaskFromBackend(t),
        }));
        state.tasks = [...otherTasks, ...mappedIncoming];
      })
      .addCase(fetchProjectTasks.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload?.message;
      });

    /* createTask */
    builder
      .addCase(createTaskAsync.pending, (state) => { state.loading = true; })
      .addCase(createTaskAsync.fulfilled, (state, { payload }) => {
        state.loading = false;
        const task = payload.data;
        if (task) {
          state.tasks.push({
            subtasks: [],
            comments: [],
            history: [],
            ...mapTaskFromBackend(task),
          });
        }
      })
      .addCase(createTaskAsync.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload?.message;
      });

    /* changeStatus, assign, approve, requestChanges, moveToSprint — all replace the task */
    const replaceOnFulfilled = (state, { payload }) => {
      if (payload?.data) replaceTask(state, payload.data);
    };

    builder
      .addCase(changeTaskStatusAsync.fulfilled, replaceOnFulfilled)
      .addCase(assignTaskAsync.fulfilled, replaceOnFulfilled)
      .addCase(approveTaskAsync.fulfilled, replaceOnFulfilled)
      .addCase(requestChangesAsync.fulfilled, replaceOnFulfilled)
      .addCase(moveToSprintAsync.fulfilled, replaceOnFulfilled)
      .addCase(updateTaskDetailsAsync.fulfilled, replaceOnFulfilled)
      .addCase(deleteTaskAsync.fulfilled, (state, { payload: taskId }) => {
        state.tasks = state.tasks.filter((t) => t.id !== taskId && t._id !== taskId);
      });

    /* fetchCommentsAsync */
    builder.addCase(fetchCommentsAsync.fulfilled, (state, { payload }) => {
      const { taskId, comments } = payload;
      const t = state.tasks.find((x) => x.id === taskId || x._id === taskId);
      if (t) {
        t.comments = comments.map((c) => ({
          id: c._id || c.id,
          authorId: typeof c.user === "object" ? (c.user._id || c.user.id) : c.user,
          authorName: typeof c.user === "object" ? c.user.name : undefined,
          text: c.message,
          at: new Date(c.createdAt).getTime(),
        }));
      }
    });

    /* addCommentAsync */
    builder.addCase(addCommentAsync.fulfilled, (state, { payload }) => {
      const { taskId, comment: c } = payload;
      if (!c) return;
      const t = state.tasks.find((x) => x.id === taskId || x._id === taskId);
      if (t) {
        t.comments = [...(t.comments || []), {
          id: c._id || c.id,
          authorId: typeof c.user === "object" ? (c.user._id || c.user.id) : c.user,
          authorName: typeof c.user === "object" ? c.user.name : undefined,
          text: c.message,
          at: new Date(c.createdAt).getTime(),
        }];
      }
    });
  },
});

export const {
  createTask, seedTasks, moveTask, updateTask, deleteTask,
  addComment, addSubtask, toggleSubtask,
  submitForReview, approveTask, rejectTask,
  archiveTask, unarchiveTask,
} = slice.actions;
export default slice.reducer;
