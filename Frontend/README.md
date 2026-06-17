# Frontend (Vite + React UI Client)

This folder contains the client-side user interface of Iterix, designed with a premium glassmorphic dark-theme design.

---

## 🛠️ Technology Stack

* **Framework/Bundler:** Vite + React (JavaScript, JSX)
* **State Management:** Redux Toolkit (Thunks, Slices)
* **Styling:** CSS variables + custom UI primitives (utilizing custom glassmorphism effects)
* **Animations:** Framer Motion (for smooth layout page transitions and skeletons)
* **Icons:** Lucide React
* **Authentication Provider:** `@react-oauth/google` (Google OAuth 2.0 Integration)

---

## 🚀 Setup & Launch

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Configure Environment Variables:**
   Create a `.env` file in this directory and specify your Google Client ID:
   ```ini
   VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
   ```
3. **Run Development Server:**
   ```bash
   npm run dev
   ```
   *The client will start on `http://localhost:5173`.*

---

## 📦 Key Directory Map

* **`src/components`**: Shared components, including layout (`AppShell`, `Sidebar`, `Topbar`) and agile features (`KanbanBoard`, `TaskDetailModal`, `CreateTaskModal`).
* **`src/pages`**: Views loaded by the router (`Dashboard`, `Projects`, `Sprints`, `Workspaces`, `Teams`, `Settings`, `Login`, `OtpVerify`, `Onboarding`).
* **`src/store`**: Redux Toolkit slices (`authSlice`, `workspaceSlice`, `projectsSlice`, `tasksSlice`, `sprintsSlice`, `uiSlice`).
* **`src/services`**: API endpoints layer mapped to the backend router.
* **`src/styles.css`**: Global design system variables and styling classes.
