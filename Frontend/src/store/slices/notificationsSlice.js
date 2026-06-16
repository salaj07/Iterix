import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as notificationApi from "@/services/notification.api";

/* ─── Async Thunks ────────────────────────────────────────────────────── */

/** Fetch all notifications for the logged-in user */
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await notificationApi.getNotifications();
      return res.data; // { success, data: [...notifications] }
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to load notifications" });
    }
  }
);

/** Mark one notification as read */
export const markReadAsync = createAsyncThunk(
  "notifications/markRead",
  async (notificationId, { rejectWithValue }) => {
    try {
      const res = await notificationApi.markAsRead(notificationId);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to mark as read" });
    }
  }
);

/** Mark all notifications as read */
export const markAllReadAsync = createAsyncThunk(
  "notifications/markAllRead",
  async (_, { rejectWithValue }) => {
    try {
      const res = await notificationApi.markAllAsRead();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to mark all as read" });
    }
  }
);

/** Delete a notification */
export const deleteNotificationAsync = createAsyncThunk(
  "notifications/delete",
  async (notificationId, { rejectWithValue }) => {
    try {
      await notificationApi.deleteNotification(notificationId);
      return notificationId;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to delete notification" });
    }
  }
);

/* ─── Slice ───────────────────────────────────────────────────────────── */
const slice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    /** Push a locally generated notification (e.g. from WebSocket in future) */
    push(state, { payload }) {
      state.items.unshift(payload);
    },
    /** Local mark-read (synchronous, no API call) */
    markRead(state, { payload }) {
      const n = state.items.find((i) => (i._id || i.id) === payload);
      if (n) n.read = true;
    },
    /** Local mark-all-read */
    markAllRead(state) {
      state.items.forEach((i) => { i.read = true; });
    },
    clearAll(state) {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    /* fetchNotifications */
    builder
      .addCase(fetchNotifications.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchNotifications.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.items = (payload.data || []).map(n => ({
          ...n,
          read: n.isRead !== undefined ? n.isRead : n.read,
          id: n.id || n._id,
        }));
      })
      .addCase(fetchNotifications.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload?.message;
      });

    /* markRead */
    builder
      .addCase(markReadAsync.fulfilled, (state, { payload }) => {
        const updated = payload.data;
        if (!updated) return;
        const mapped = {
          ...updated,
          read: updated.isRead !== undefined ? updated.isRead : updated.read,
          id: updated.id || updated._id,
        };
        const idx = state.items.findIndex((i) => i._id === mapped._id || i.id === mapped.id);
        if (idx !== -1) state.items[idx] = mapped;
      });

    /* markAllRead */
    builder
      .addCase(markAllReadAsync.fulfilled, (state) => {
        state.items.forEach((i) => { i.read = true; });
      });

    /* deleteNotification */
    builder
      .addCase(deleteNotificationAsync.fulfilled, (state, { payload: deletedId }) => {
        state.items = state.items.filter((i) => i._id !== deletedId);
      });
  },
});

export const { push, markRead, markAllRead, clearAll } = slice.actions;
export default slice.reducer;
