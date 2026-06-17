# Iterix Project Extension & Future Roadmap

This roadmap lists high-value features, structural improvements, and academic enhancements that future developer teams can build to extend the Iterix project.

---

## 📊 1. Sprint Velocity & Burndown Charts
* **Objective:** Enable teams to monitor their sprint progress and calculate team velocity across sprints.
* **Backend Changes:** 
  * Add a logging model to track task movement in and out of the "Done" state.
  * Implement an endpoint `/api/reports/projects/:id/burndown` to compute historical remaining story points day-by-day.
* **Frontend Changes:**
  * Integrate a charting library (like `Chart.js` or `Recharts`).
  * Add a **Reports** tab displaying a classic sprint burndown chart (ideal vs. actual completion slopes).

---

## ⚡ 2. Real-Time Collaboration (WebSockets)
* **Objective:** Allow team members to see Kanban card movements and comment additions instantly without refreshing.
* **Backend Changes:**
  * Set up `socket.io` alongside the Express HTTP server.
  * Emit events when tasks are moved (`task:moved`), updated (`task:updated`), or comments are added (`comment:added`) within a specific project room.
* **Frontend Changes:**
  * Configure a WebSocket client listener.
  * Dispatch Redux actions (e.g. `updateTaskStatusLocally`) on socket triggers to dynamically update the Kanban board state.

---

## 🔔 3. Real-Time/Email Notification Alerts
* **Objective:** Notify developers when they are assigned a task, mentioned in comments, or when their tasks are reviewed.
* **Backend Changes:**
  * Implement an event dispatcher inside `task.service.js` and `comment.service.js`.
  * Trigger email alerts via the established SMTP relay (Nodemailer/Brevo) to the assignee.
* **Frontend Changes:**
  * Build a notification popover in the top header displaying the user's unread notifications.
  * Add a settings page toggle to opt-out of email alerts.

---

## 📋 4. Subtasks & Checklists
* **Objective:** Allow developers to break down large tasks into smaller, checkable subtasks.
* **Backend Changes:**
  * Add a `subtasks` array field to `task.model.js`:
    ```javascript
    subtasks: [{
      title: String,
      isCompleted: Boolean
    }]
    ```
  * Update task controllers to support updating individual checklist items.
* **Frontend Changes:**
  * Update `TaskDetailModal.jsx` to render checklist items with inline checkboxes, add-buttons, and progress bars.
