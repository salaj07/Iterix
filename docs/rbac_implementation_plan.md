# Role-Based Access Control (RBAC) Implementation Plan

This plan outlines the phased implementation of strict workspace-level and project-level role permissions for Iterix.

---

## 📋 Phase 1 & 2: Backend Core Authorization & Collaborative Task Rules
We will update the backend services to enforce the correct role permissions.

### 1. Workspace Admin Bypass
Update `project.service.js`, `sprint.service.js`, and `task.service.js` to ensure any user with workspace role `ADMIN` has full access to all project actions, bypassing the requirement of being explicitly added as a `ProjectMember`.

### 2. Scoped Project Lead (`TEAM_LEAD`) Checks
Ensure `TEAM_LEAD` can only manage sprints, backlog, project settings, and project membership for projects they are assigned to.

### 3. Collaborative Task Creation & Assignment Rules
In `task.service.js`:
* Allow **any** project member to create tasks.
* If a `DEVELOPER` (Team Member) creates a task, validate that the `assigneeId` is either their own user ID or left `null` (unassigned). Prevent them from assigning tasks to other members.
* Ensure a `DEVELOPER` can only change the status (move) tasks that are assigned to them.

---

## 📋 Phase 3: Frontend UI Scoping & RBAC Alignment
We will update the frontend code to reflect these rules visually.

### 1. Align `rbac.js` Matrix
Update the `rbac.js` matrix to match our three roles: `ADMIN`, `TEAM_LEAD` (Project Lead), and `DEVELOPER` (Team Member).

### 2. Scoped Dropdowns and Action Buttons
* **Task Creation Form**: In the task modal, if the current user is a `DEVELOPER`, restrict the assignee selection dropdown to only their name and "Unassigned".
* **Teams Page**:
  * Restrict member role updates and deletion to workspace `ADMIN`s.
  * Prevent changing the role of the workspace owner.
* **Board & Backlog Pages**: Disable drag-and-drop or status changes for tasks not assigned to the user if they are a `DEVELOPER`.

---

## 📋 Phase 4: Left-Pane Workspace & Root-Level Project Selection

We reorganized the application layout and member management flow to adopt a Notion-like hierarchy:

### 1. Left-Pane Workspace Selector
* Moved the workspace dropdown selector from the Topbar to the top of the Sidebar.
* Standardized it to render a clean workspace list, "Create Workspace" action, and a compact workspace-letter mini icon when collapsed.

### 2. Root-Level Project Selector
* Added a Project Select dropdown in the left pane directly below the workspace selector.
* Stores the selected project in `state.projects.currentProjectId` in the Redux store.
* Dynamically filters Dashboard, Kanban Board, Backlog, Sprints, Project Members (formerly Teams), and Reports pages to show data specific to the selected project context.
* Restricts project creation controls (`New project` buttons) to Workspace Admins (`ADMIN` role), hiding them for Project Leads and Developers.
* Renders a clean glassmorphic "No Project Selected" banner on project-specific views if no active project context exists.

### 3. Project Team Assignment
* Implemented backend APIs for project member management:
  * `POST /api/projects/:projectId/members`: Adds a workspace member to a project as `TEAM_LEAD` or `DEVELOPER`.
  * `PATCH /api/projects/:projectId/members/:userId`: Updates a project member's role.
  * `DELETE /api/projects/:projectId/members/:userId`: Soft-deletes a project membership.
* Updated the Teams page (`Teams.jsx`) to display the selected project's members.
* Integrated a modal to add/remove project members from the pool of active workspace members.
* Restructured task creation and detail modal assignees to query project members instead of general workspace members.
