# BrainBoard — Production-Grade Collaborative Retrospective & Brainstorming App

A real-time collaborative retrospective and brainstorming tool built for modern teams. Combines features from Trello, Jira Retrospectives, and Miro.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | TailwindCSS, shadcn/ui |
| State | Zustand |
| Drag & Drop | dnd-kit |
| Realtime | Socket.io client |
| Backend | Node.js, Express, TypeScript |
| WebSockets | Socket.io |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT (bcryptjs) |

## Features

- **Workspace management** — Create, join via invite link, switch workspaces
- **Board templates** — Starfish Retrospective, Six Thinking Hats, Pros & Cons, Custom
- **Realtime collaboration** — Changes sync instantly across all connected users
- **Drag & drop** — Cards within/between sections, sections horizontally
- **Voting** — One vote per user per card, toggle, realtime sync
- **Comments** — Thread comments on any card
- **Live presence** — See who's online on each board with avatar indicators
- **Full CRUD** — Boards, sections, cards all editable and deletable

---

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally
- npm or yarn

### 1. Clone and setup

```bash
git clone <your-repo-url>
cd brainstorm-ideaboard
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env — set your DATABASE_URL and a strong JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run dev
```

Backend runs on **http://localhost:4000**

### 3. Frontend setup

```bash
cd frontend
cp .env.local.example .env.local
# .env.local already points to localhost:4000 by default
npm install
npm run dev
```

Frontend runs on **http://localhost:3000**

---

## Docker (Full Stack)

```bash
# From the project root
docker-compose up --build
```

This starts:
- PostgreSQL on port 5432
- Backend API on port 4000
- Frontend on port 3000

---

## Environment Variables

### Backend `.env`

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/brainstorm_db"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=4000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Workspaces
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workspaces` | List workspaces |
| POST | `/api/workspaces` | Create workspace |
| POST | `/api/workspaces/join` | Join via invite code |

### Boards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boards/workspace/:id` | Get workspace boards |
| POST | `/api/boards` | Create board |
| GET | `/api/boards/:id` | Get board (with sections & cards) |
| PUT | `/api/boards/:id` | Update board |
| DELETE | `/api/boards/:id` | Delete board |
| POST | `/api/boards/:id/duplicate` | Duplicate board |

### Sections, Cards, Votes, Comments — see `backend/src/routes/`

---

## Socket.io Events

### Emitted by client
| Event | Payload |
|-------|---------|
| `board:join` | `{ boardId }` |
| `board:leave` | `{ boardId }` |
| `section:create` | `{ boardId, section }` |
| `section:update` | `{ boardId, section }` |
| `section:delete` | `{ boardId, sectionId }` |
| `section:reorder` | `{ boardId, orderedIds }` |
| `card:create` | `{ boardId, card }` |
| `card:update` | `{ boardId, card }` |
| `card:delete` | `{ boardId, cardId, sectionId }` |
| `card:move` | `{ boardId, card, fromSectionId, toSectionId }` |
| `card:reorder` | `{ boardId, sectionId, orderedIds }` |
| `vote:update` | `{ boardId, cardId, votesCount, votes }` |
| `comment:create` | `{ boardId, cardId, comment }` |

### Received by client
All events above with past tense suffix: `section:created`, `card:moved`, `vote:updated`, etc., plus:
- `user:join` — `{ user, activeUsers }`
- `user:leave` — `{ user, activeUsers }`
- `board:joined` — `{ boardId, activeUsers }`

---

## Database Schema

```
users → workspaces (many-to-many via workspace_members)
workspaces → boards → sections → cards
cards → votes (unique per user+card)
cards → comments
```

---

## Project Structure

```
brainstorm-ideaboard/
├── backend/
│   ├── prisma/schema.prisma
│   └── src/
│       ├── controllers/    # Business logic
│       ├── routes/         # Express routers
│       ├── socket/         # Socket.io handlers
│       ├── middleware/     # Auth middleware
│       ├── lib/            # Prisma client, JWT utils
│       └── index.ts        # Entry point
└── frontend/
    ├── app/                # Next.js App Router pages
    ├── components/
    │   ├── board/          # Board-level components
    │   ├── cards/          # Card components + modal
    │   ├── section/        # Section column with DnD
    │   ├── layout/         # Sidebar, header
    │   ├── providers/      # Auth, socket providers
    │   └── ui/             # shadcn/ui components
    ├── store/              # Zustand store
    ├── hooks/              # useSocket, useBoard
    ├── lib/                # API client, socket, utils
    └── types/              # TypeScript types
```
