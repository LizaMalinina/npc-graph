# NPC Graph - Relationship Manager

A web application for managing and visualizing NPC (Non-Playable Character) relationships for tabletop RPG campaigns. Features an interactive graph visualization with filtering capabilities and role-based access control.

## Features

- 📊 **Interactive Graph Visualization** - D3-powered force-directed graph showing NPC relationships
- 🔍 **Advanced Filtering** - Filter by faction, location, status, and relationship types
- 👥 **NPC Management** - Add, edit, and delete NPCs with detailed information
- 🔗 **Relationship Management** - Create and manage relationships between NPCs with types and strengths
- 🔐 **Role-Based Access** - Viewer, Editor, and Admin roles (demo mode included)
- 💾 **Persistent Storage** - SQLite database for easy deployment and backup
- 🐳 **Docker Support** - Run everything in containers without local dependencies

## Quick Start with Docker (Recommended)

**Prerequisites:** Docker and Docker Compose installed

```bash
# Start the application
docker-compose up --build

# The app will be available at http://localhost:3000
```

The Docker container will automatically:
1. Install all dependencies
2. Set up the SQLite database
3. Seed sample data on first run
4. Start the development server with hot reload

## Manual Setup (Without Docker)

**Prerequisites:** Node.js 20+

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Create database and apply schema
npx prisma db push

# Seed sample data (optional)
npm run db:seed

# Start development server
npm run dev
```

## Project Structure

```
npc-graph/
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   │   ├── npcs/      # NPC CRUD operations
│   │   │   ├── relationships/  # Relationship CRUD
│   │   │   └── graph/     # Graph data endpoint
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Main page
│   ├── components/
│   │   ├── NpcGraph.tsx   # Force-directed graph
│   │   ├── FilterPanel.tsx
│   │   ├── NpcForm.tsx
│   │   ├── RelationshipForm.tsx
│   │   ├── NpcDetailPanel.tsx
│   │   └── Legend.tsx
│   ├── hooks/
│   │   └── useApi.ts      # React Query hooks
│   ├── lib/
│   │   └── prisma.ts      # Database client
│   └── types/
│       └── index.ts       # TypeScript types
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Sample data
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run docker:up` | Start with Docker |
| `npm run docker:down` | Stop Docker containers |

## API Endpoints

### NPCs
- `GET /api/npcs` - List all NPCs
- `POST /api/npcs` - Create new NPC
- `GET /api/npcs/:id` - Get NPC details
- `PUT /api/npcs/:id` - Update NPC
- `DELETE /api/npcs/:id` - Delete NPC

### Relationships
- `GET /api/relationships` - List all relationships
- `POST /api/relationships` - Create relationship
- `PUT /api/relationships/:id` - Update relationship
- `DELETE /api/relationships/:id` - Delete relationship

### Graph
- `GET /api/graph` - Get optimized graph data

## Relationship Types

| Type | Color | Description |
|------|-------|-------------|
| Friend | Green | Friendly relationship |
| Enemy | Red | Hostile relationship |
| Family | Purple | Family connection |
| Ally | Blue | Strategic alliance |
| Rival | Orange | Competitive relationship |
| Romantic | Pink | Romantic relationship |
| Business | Yellow | Business/trade relationship |
| Mentor | Teal | Teacher/student relationship |
| Servant | Gray | Service relationship |
| Unknown | Slate | Undefined relationship |

## User Roles

- **Viewer** - Can only view the graph and NPC details
- **Editor** - Can add, edit, and delete NPCs and relationships
- **Admin** - Full access (future: user management)

## Data Persistence

The SQLite database is stored in `prisma/dev.db`. When using Docker, this file is persisted via volume mount, so your data survives container restarts.

### Backup
```bash
# Simply copy the database file
cp prisma/dev.db prisma/backup.db
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite + Prisma ORM
- **Graph**: react-force-graph-2d (D3-based)
- **State**: TanStack Query (React Query)
- **Styling**: Tailwind CSS
- **Container**: Docker

## Future Enhancements

- [ ] Full authentication with NextAuth.js
- [ ] Session/Campaign management
- [ ] Export/Import data (JSON/CSV)
- [ ] Image upload for NPC portraits
- [ ] Collaborative real-time editing
- [ ] Advanced graph layouts
- [ ] Timeline view for relationship changes

## License

MIT
