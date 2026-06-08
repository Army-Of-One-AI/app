# Army Of One AI

Army Of One AI is an AI-oriented project management application for turning work into organized projects, tasks, documents, epics, sprints, comments, and inbox notifications.

The current product is workspace and project centered. Users sign in, enter a workspace, create projects, manage task boards, review project summaries, organize delivery work through epics and sprints, maintain supporting documents, and collaborate through task comments and mentions.

## Repository Structure

```text
.
+-- api/      # NestJS backend API
`-- client/   # Next.js frontend application
```

## Backend

The backend lives in `api/` and is built with NestJS, Prisma, and PostgreSQL.

Main responsibilities:

- Google OAuth authentication and JWT cookie sessions
- Workspace, project, member, and role management
- Task creation, updates, archive/unarchive, activity logs, and assignment
- Project documents
- Project epics
- Sprint planning and lifecycle actions
- Threaded task comments with mentions
- Inbox notifications
- Email and analytics support modules

Important backend modules:

- `auth`
- `users`
- `workspaces`
- `projects`
- `tasks`
- `documents`
- `project-epics`
- `sprints`
- `task-comments`
- `inbox-items`
- `permissions`
- `emails`
- `click-house`

The main domain models are defined in `api/prisma/schema.prisma`. Core models include `Workspace`, `User`, `Project`, `ProjectMember`, `Task`, `Document`, `Epic`, `Sprint`, `TaskComment`, `InboxItem`, and `WorkspaceInvite`.

## Frontend

The frontend lives in `client/` and is built with Next.js App Router, React, Tailwind CSS, React Query, Axios, and shared UI components.

Main user-facing areas:

- Login and onboarding
- Workspace creation
- Workspace dashboard
- Project list
- Project overview
- Project summary
- Kanban-style task board
- Epics
- Sprints
- Project documents
- Inbox
- Workspace settings
- Member management
- Profile settings

Important frontend folders:

- `client/app`: route structure and pages
- `client/features`: feature-specific API calls, hooks, and types
- `client/shared`: shared UI, providers, hooks, styles, and API client

The frontend currently uses React Query as the active data-fetching layer. Redux is present in the project but is not wired into the root provider.

## Product Flow

A typical user flow is:

1. Sign in with Google.
2. The API stores the session in an HTTP-only `access_token` cookie.
3. The app loads the current user from `/auth/me`.
4. If the user has a workspace, they are routed to that workspace's projects page.
5. If not, they are routed to create a new workspace.
6. Inside a workspace, users create and manage projects.
7. Inside a project, users manage tasks, epics, sprints, documents, comments, members, and summary views.

## Permissions

The app uses role-based access control.

Workspace roles:

- `Owner`
- `Admin`
- `Member`

Project roles:

- `Owner`
- `Product_Owner`
- `Project_Manager`
- `Tech_Lead`
- `Designer`
- `Developer`
- `QC`
- `DevOps`
- `Member`

Backend guards enforce workspace and project permissions around protected routes.

## Local Development

Install dependencies separately for each app.

```bash
cd api
pnpm install
```

```bash
cd client
pnpm install
```

Run the backend:

```bash
cd api
pnpm start:dev
```

Run the frontend:

```bash
cd client
pnpm dev
```

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

## Environment

The backend expects environment variables for database access, auth, frontend redirects, JWT signing, email, and optional infrastructure.

Common variables include:

- `DATABASE_URL`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `FRONTEND_URL`
- `PORT`
- `REDIS_HOST`
- `REDIS_PORT`

The frontend uses:

- `NEXT_PUBLIC_API_URL`

## Current Direction

Army Of One AI is currently shaped as an AI-powered project management platform. Documents and generated planning artifacts are supporting objects, while projects, tasks, boards, epics, sprints, and team collaboration are the primary product surface.
