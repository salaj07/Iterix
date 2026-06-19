# Backend (Node.js + Express API Server)

This folder contains the REST API server for Iterix, managing database storage, authentication, emails, and permissions.

---

## 🛠️ Technology Stack

* **Runtime:** Node.js (v18+)
* **Server Framework:** Express
* **Database Driver:** Mongoose (MongoDB)
* **Authentication:** JSON Web Tokens (JWT) stored in HTTP-Only cookies
* **Email Service:** Nodemailer + Brevo SMTP Relay (STARTTLS, Port 2525)
* **Testing:** Jest + MongoDB Memory Server + Supertest

---

## 🚀 Setup & Launch

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Configure Environment Variables:**
   Create a `.env` file in the `Backend` directory with the following variables:
   ```ini
   PORT=3000
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=your-random-jwt-secret-string
   JWT_EXPIRES_IN=7d
   
   # SMTP Configuration (Brevo example)
   EMAIL_HOST=smtp-relay.brevo.com
   EMAIL_PORT=2525
   EMAIL_SECURE=false
   EMAIL_USER=your-smtp-username
   EMAIL_PASS=your-smtp-master-password
   EMAIL_FROM=your-verified-sender-email@domain.com
   
   # Google OAuth configuration
   GOOGLE_CLIENT_ID=your-google-oauth-client-id
   ```
3. **Run Dev Server (with Nodemon):**
   ```bash
   npm run dev
   ```
4. **Run Backend Tests:**
   ```bash
   npm test
   ```

---

## 🛠️ CLI Administration Script

You can create workspaces and provision users directly from the command line without opening the frontend. Make sure your MongoDB instance is running, then execute:

```bash
node src/scripts/create-workspace.js "user@example.com" "New Workspace Name" "Optional Description"
```
*This will auto-create the user document if they don't exist yet and grant them ADMIN privileges over the workspace.*

---

## 📦 Key Directory Map

* **`src/app.js`**: Core Express configurations (Helmet, CORS, cookie parser, global error handler).
* **`src/routes`**: Route endpoints (Auth, Workspaces, Projects, Sprints, Tasks, Comments, Notifications).
* **`src/controller`**: Request parsing, validation middleware execution, and response mapping.
* **`src/services`**: Database models logic and transaction validation checks (RBAC validation lives here).
* **`src/middleware`**: Global middlewares (cookie JWT validation check, schema inputs validators).
* **`__tests__`**: Integration test cases for checking API routes integrity.
