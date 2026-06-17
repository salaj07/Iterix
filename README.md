# Iterix

Iterix is a modern, collaborative SaaS project management tool designed for agile teams. It features real-time Kanban boards with drag-and-drop support, task priority sorting, sprint planning/tracking, multi-workspace routing, and role-based access controls (RBAC).

---

## 📁 Project Structure

The codebase is split into three main directories:

* **`/Frontend`**: The user interface built using Vite, React, Redux Toolkit, Tailwind CSS, and Framer Motion.
* **`/Backend`**: The REST API service built using Node.js, Express, Mongoose (MongoDB), and Nodemailer (SMTP relay).
* **`/docs`**: Project specifications, security audit findings, and product roadmaps.

---

## 🚀 Quick Start (Local Development)

To run the entire application locally, you will need to start both the backend and frontend services.

### 1. Start the Backend
Navigate to the `Backend` folder, install dependencies, configure environment variables, and start the development server:
```bash
cd Backend
npm install
# Configure your .env file
npm run dev
```
*For detailed setup, configuration options, and running tests, see the [Backend README](Backend/README.md).*

### 2. Start the Frontend
Navigate to the `Frontend` folder, install dependencies, configure environment variables, and start the Vite development server:
```bash
cd Frontend
npm install
# Configure your .env file
npm run dev
```
*For detailed styling guides, state slices, and page mapping, see the [Frontend README](Frontend/README.md).*

---

## 📖 Additional Documentation

Detailed planning, security profiles, and development roadmaps are located in the [docs/](docs/) directory:
* **[RBAC Implementation Plan](docs/rbac_implementation_plan.md)**: Role-Based Access Control specifications and permission matrix.
* **[Database Schema](docs/database_schema.md)**: Detailed Mongoose database schema and entity relationships (ERD).
* **[Developer Handover](docs/developer_handover.md)**: Architecture guide, authentication lifecycles, and hand-off details.
* **[Future Roadmap](docs/future_feature_roadmap.md)**: Conceptual specifications for future agile analytics, socket collaboration, and alerts.
