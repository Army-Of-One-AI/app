# Service Flow

This document describes the intended API flow for creating and organizing data in the AI Project Management backend.

## 1. Authenticate With Google

Users are created through Google OAuth only. There is no email/password signup.

Start login:

```http
GET /auth/google
```

Google redirects back to:

```http
GET /auth/google/callback
```

On callback, the backend:

1. Reads the Google profile email.
2. Finds an existing `User` by email, or creates a new `User`.
3. Creates or stores Google profile details in `UserInfo`.
4. Marks the user as active.
5. Generates a JWT access token.
6. Redirects to:

```text
FRONTEND_URL/auth/callback?access_token=<token>
```

Use the token for all protected API requests:

```http
Authorization: Bearer <access_token>
```

Check the current user:

```http
GET /auth/me
GET /users/me
```

## 2. Create A Workspace

A workspace is the top-level container. Create this before teams, projects, tasks, or documents.

```http
POST /workspaces
```

Example body:

```json
{
  "name": "Acme Product Team",
  "slug": "acme-product-team",
  "logo_url": "https://example.com/logo.png"
}
```

When a workspace is created, the current user is automatically added as a `WorkspaceMember` with role `Owner`.

Useful next calls:

```http
GET /workspaces
GET /workspaces/:workspaceId
GET /workspaces/:workspaceId/members
```

## 3. Add Workspace Members

Users must be workspace members before they can be added to teams or projects in that workspace.

```http
POST /workspaces/:workspaceId/members
```

Example body:

```json
{
  "user_id": "user-uuid",
  "role": "Member"
}
```

Workspace roles:

```text
Owner, Admin, Member
```

Permission notes:

- `Owner` and `Admin` can add normal members.
- Only `Owner` can assign or change `Owner` and `Admin` roles.
- Only `Owner` can delete a workspace.

## 4. Create Teams

Teams belong to a workspace. They are optional for project membership, but useful for organizing people.

```http
POST /workspaces/:workspaceId/teams
```

Example body:

```json
{
  "name": "Platform Engineering",
  "slug": "platform-engineering",
  "description": "Core backend and infrastructure team",
  "icon_url": "https://example.com/team-icon.png"
}
```

When a team is created, the creator is added as a `TeamMember` with role `Leader`.

Useful next calls:

```http
GET /workspaces/:workspaceId/teams
GET /teams/:teamId
GET /teams/:teamId/members
```

## 5. Add Team Members

A user must already be a workspace member before being added to a team.

```http
POST /teams/:teamId/members
```

Example body:

```json
{
  "user_id": "user-uuid",
  "role": "Member"
}
```

Team roles:

```text
Leader, Member
```

Permission notes:

- Workspace `Owner` and `Admin` can create or delete teams.
- Team `Leader` can update team details and manage team members.

## 6. Create A Project

Projects belong directly to a workspace, not to a team.

```http
POST /workspaces/:workspaceId/projects
```

Example body:

```json
{
  "name": "AI Sprint Planner",
  "slug": "ai-sprint-planner",
  "description": {
    "summary": "Plan and track AI-assisted delivery work"
  }
}
```

When a project is created, the current user is automatically added as a `ProjectMember` with role `Owner`.

Useful next calls:

```http
GET /workspaces/:workspaceId/projects
GET /projects/:projectId
GET /projects/:projectId/members
```

## 7. Add Project Members

Project members can come from different teams, but they must already be workspace members.

```http
POST /projects/:projectId/members
```

Example body:

```json
{
  "user_id": "user-uuid",
  "role": "Developer"
}
```

Project roles:

```text
Owner, ProductOwner, ProjectManager, TechLead, Designer, Developer, QC, DevOps, Member
```

Permission notes:

- `Owner`, `ProductOwner`, and `ProjectManager` can update project details and manage members.
- Only `Owner` can delete a project.

## 8. Create Tasks

Tasks belong to a project. The creator is always the current authenticated user.

```http
POST /projects/:projectId/tasks
```

Example body:

```json
{
  "title": "Design kanban task drag and drop",
  "description": {
    "text": "Support status lanes and ordering."
  },
  "status": "Todo",
  "priority": "High",
  "estimate": 8,
  "due_date": "2026-06-30T00:00:00.000Z",
  "assignee_id": "user-uuid",
  "position": 1000
}
```

Before assigning a task, the assignee must already be a project member.

Useful task calls:

```http
GET /projects/:projectId/tasks
GET /tasks/:taskId
PATCH /tasks/:taskId
PATCH /tasks/:taskId/status
PATCH /tasks/:taskId/assignee
PATCH /tasks/:taskId/position
DELETE /tasks/:taskId
```

Task statuses:

```text
Backlog, Todo, InProgress, Review, Done, Canceled
```

Task priorities:

```text
Low, Medium, High, Urgent
```

Permission notes:

- `Owner`, `ProductOwner`, `ProjectManager`, and `TechLead` can create, update, and delete tasks.
- The assigned user can update task status.
- `position` is used for kanban drag-and-drop ordering.

## 9. Create Documents

Documents belong to a project. The creator is always the current authenticated user.

```http
POST /projects/:projectId/documents
```

Example body:

```json
{
  "title": "Project Brief",
  "slug": "project-brief",
  "content": {
    "markdown": "# Project Brief\nGoals and scope..."
  },
  "status": "Draft"
}
```

Useful document calls:

```http
GET /projects/:projectId/documents
GET /documents/:documentId
PATCH /documents/:documentId
PATCH /documents/:documentId/status
DELETE /documents/:documentId
```

Document statuses:

```text
Draft, Published, Archived
```

Permission notes:

- Only project members can read project documents.
- `Owner`, `ProductOwner`, `ProjectManager`, and `TechLead` can create, update, and delete documents.

## Recommended Creation Order

Use this order for a new organization setup:

1. Authenticate with Google.
2. Read the current user with `GET /users/me`.
3. Create a workspace with `POST /workspaces`.
4. Add workspace members with `POST /workspaces/:workspaceId/members`.
5. Create teams with `POST /workspaces/:workspaceId/teams`.
6. Add team members with `POST /teams/:teamId/members`.
7. Create a project with `POST /workspaces/:workspaceId/projects`.
8. Add project members with `POST /projects/:projectId/members`.
9. Create tasks with `POST /projects/:projectId/tasks`.
10. Create documents with `POST /projects/:projectId/documents`.

## Minimal Happy Path

For a single-user setup, the shortest useful flow is:

1. `GET /auth/google`
2. `GET /auth/me`
3. `POST /workspaces`
4. `POST /workspaces/:workspaceId/projects`
5. `POST /projects/:projectId/tasks`
6. `POST /projects/:projectId/documents`

Teams and member management can be added later.
