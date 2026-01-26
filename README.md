# NPC Graph - Relationship Manager

A web application for managing and visualizing NPC (Non-Playable Character) relationships for tabletop RPG campaigns. Features a detective board-style visualization, campaign management, and crew/party tracking.

## Features

- 🗺️ **Campaign Management** - Organize NPCs and relationships by campaign
- 🕵️ **Detective Board** - Investigation board with draggable photo nodes and yarn connections
- 👥 **Built-in Crew System** - Each campaign includes a party/crew with customizable members
- 🔍 **Advanced Filtering** - Filter by faction, location, status, and relationship types
- 👤 **NPC Management** - Add, edit, and delete NPCs with detailed information
- 🔗 **Relationship Tracking** - Create relationships between NPCs with types and strengths
- 🔐 **Role-Based Access** - Viewer, Editor, and Admin roles
- 💾 **Persistent Storage** - SQLite (local) or PostgreSQL (production)
- 🐳 **Docker Support** - Run everything in containers
- ☁️ **Azure Deployment** - Ready for Azure Container Apps
- 📸 **Image Upload** - Azure Blob Storage integration for NPC portraits

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string (pooled) | Yes (prod) |
| `DIRECT_URL` | PostgreSQL direct connection for migrations | Yes (prod) |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Blob Storage connection | For images |
| `AZURE_STORAGE_CONTAINER_NAME` | Blob container name (default: `npc-images`) | For images |
| `NODE_ENV` | Environment (`development` / `production`) | No |

## Architecture

```mermaid
graph TB
    subgraph Client
        UI[React UI]
        RQ[React Query]
    end
    
    subgraph "Next.js App"
        API[API Routes]
        Pages[Pages]
    end
    
    subgraph Database
        DB[(SQLite/PostgreSQL)]
    end
    
    UI --> RQ
    RQ --> API
    Pages --> API
    API --> DB
```

## Data Model

```mermaid
erDiagram
    Campaign ||--o| Crew : has
    Campaign ||--o{ Npc : contains
    Crew ||--o{ CrewMember : has
    Crew ||--o{ CrewRelationship : has
    CrewMember ||--o{ CrewMemberRelationship : has
    Npc ||--o{ Relationship : from
    Npc ||--o{ Relationship : to
    
    Campaign {
        string id PK
        string name
        string description
        boolean isActive
    }
    
    Crew {
        string id PK
        string name
        string campaignId FK
    }
    
    CrewMember {
        string id PK
        string name
        string title
        string crewId FK
    }
    
    Npc {
        string id PK
        string name
        string title
        string faction
        string location
        string status
        string campaignId FK
    }
    
    Relationship {
        string id PK
        string fromNpcId FK
        string toNpcId FK
        string type
        int strength
    }
```

## Quick Start with Docker

```bash
# Start the application (development with SQLite)
docker-compose up --build

# The app will be available at http://localhost:3000
```

## Production Docker Build

```bash
# Build production image (uses PostgreSQL)
docker build -f Dockerfile.prod -t npc-graph:latest .

# Run with external PostgreSQL database
docker run --rm \
  -e DATABASE_URL="postgresql://user:pass@host/db" \
  -e NODE_ENV=production \
  -p 3000:3000 \
  npc-graph:latest

# Test locally with Neon database
docker run --rm \
  -e DATABASE_URL="postgresql://...@neon.tech/neondb?sslmode=require" \
  -p 3000:3000 \
  npc-graph:latest
```

## Azure Deployment

Deploy to Azure Container Apps using the provided scripts:

### PowerShell (Windows)
```powershell
.\scripts\deploy-azure.ps1
```

### Bash (Linux/Mac)
```bash
chmod +x scripts/deploy-azure.sh
./scripts/deploy-azure.sh
```

### What the script does:
1. Creates Azure Resource Group
2. Creates Azure Container Registry (ACR)
3. Builds and pushes Docker image to ACR
4. Creates Container Apps environment
5. Deploys the container app with external ingress

### Post-deployment configuration:
```bash
az containerapp update --name npc-graph --resource-group npc-graph-rg --set-env-vars \
  DATABASE_URL='your-neon-connection-string' \
  AZURE_STORAGE_CONNECTION_STRING='your-storage-connection-string' \
  AZURE_STORAGE_CONTAINER_NAME='npc-images'
```

## CI/CD Pipelines

The project uses GitHub Actions for continuous deployment:

### Automatic Deployment to Dev/Staging

Pushing to `main` branch automatically triggers the build and deploy workflow:
- Builds Docker image with commit SHA as tag
- Pushes to Azure Container Registry (`npcgraphcr.azurecr.io`)
- Deploys to `npc-graph` container app (dev/staging environment)

### Manual Promotion to Production

To deploy a tested image to production:

1. **Get the commit SHA** of the version you want to deploy:
   ```bash
   # Get the latest commit SHA from main branch
   git rev-parse origin/main
   ```
   This returns the full 40-character SHA like `0959421a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e`

2. **Trigger the promote-to-prod workflow**:
   - Go to GitHub → Actions → "Promote to Production"
   - Click "Run workflow"
   - Paste the full commit SHA as the image tag
   - Click "Run workflow"

3. The workflow will deploy the existing image to `npc-graph-prod` container app

> **Note:** Only deploy commit SHAs that have successfully passed the dev deployment. The image must already exist in the container registry.

## User Flow

```mermaid
flowchart LR
    A[Landing Page] --> B{Has Campaigns?}
    B -->|No| C[Create Campaign]
    B -->|Yes| D[Select Campaign]
    C --> E[Campaign Board]
    D --> E
    E --> F[Add NPCs]
    E --> G[Add Connections]
    E --> H[Manage Crew]
    F --> E
    G --> E
    H --> E
```

## Project Structure

```
npc-graph/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── campaigns/      # Campaign CRUD
│   │   │   ├── npcs/           # NPC CRUD
│   │   │   ├── relationships/  # Relationship CRUD
│   │   │   ├── crews/          # Crew management
│   │   │   └── graph/          # Graph data endpoint
│   │   ├── campaign/[id]/      # Campaign board page
│   │   ├── layout.tsx
│   │   └── page.tsx            # Campaign selection
│   ├── components/
│   │   ├── detective/
│   │   │   ├── CampaignBoard.tsx     # Main board with campaign context
│   │   │   ├── DetectiveBoard.tsx    # Draggable photo board
│   │   │   ├── DetectiveFilterPanel.tsx
│   │   │   ├── DetectiveLegend.tsx
│   │   │   └── DetectiveNpcPanel.tsx
│   │   ├── NpcForm.tsx
│   │   ├── RelationshipForm.tsx
│   │   └── Providers.tsx
│   ├── hooks/
│   │   └── useApi.ts           # React Query hooks
│   ├── lib/
│   │   └── prisma.ts
│   └── types/
│       └── index.ts
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts
├── Dockerfile              # Development Docker
├── Dockerfile.prod         # Production Docker (multi-stage)
├── docker-compose.yml      # Local development
├── docker-compose.postgres.yml  # Local PostgreSQL dev
├── scripts/
│   ├── deploy-azure.ps1    # Windows deployment
│   └── deploy-azure.sh     # Linux/Mac deployment
└── package.json
```

## API Endpoints

### Campaigns
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | List all campaigns |
| POST | `/api/campaigns` | Create campaign (with crew) |
| GET | `/api/campaigns/:id` | Get campaign details |
| PUT | `/api/campaigns/:id` | Update campaign |
| DELETE | `/api/campaigns/:id` | Delete campaign |
| GET | `/api/campaigns/:id/graph` | Get campaign graph data |

### NPCs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/npcs` | List all NPCs |
| POST | `/api/npcs` | Create NPC |
| GET | `/api/npcs/:id` | Get NPC details |
| PUT | `/api/npcs/:id` | Update NPC |
| DELETE | `/api/npcs/:id` | Delete NPC |

### Relationships
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/relationships` | List relationships |
| POST | `/api/relationships` | Create relationship |
| PUT | `/api/relationships/:id` | Update relationship |
| DELETE | `/api/relationships/:id` | Delete relationship |

### Crews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/crews` | List all crews |
| GET | `/api/crews/:id` | Get crew details |
| PUT | `/api/crews/:id` | Update crew |
| DELETE | `/api/crews/:id` | Delete crew |
| POST | `/api/crews/:id/members` | Add crew member |

### Crew Relationships
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/crew-relationships` | List crew relationships |
| POST | `/api/crew-relationships` | Create crew relationship |

### Crew Member Relationships
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/crew-member-relationships` | List member relationships |
| POST | `/api/crew-member-relationships` | Create member relationship |

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload image to Azure Blob Storage |

## Relationship Types

| Type | Color | Description |
|------|-------|-------------|
| Friend | 🟢 Green | Friendly relationship |
| Enemy | 🔴 Red | Hostile relationship |
| Family | 🟣 Purple | Family connection |
| Ally | 🔵 Blue | Strategic alliance |
| Rival | 🟠 Orange | Competitive relationship |
| Romantic | 💗 Pink | Romantic relationship |
| Business | 🟡 Yellow | Business/trade |
| Mentor | 🩵 Teal | Teacher/student |
| Servant | ⚫ Gray | Service relationship |

## Tech Stack

- **Framework**: Next.js 16 (App Router with Turbopack)
- **Database**: SQLite (dev) / PostgreSQL (prod) + Prisma ORM
- **State**: TanStack Query (React Query)
- **Styling**: Tailwind CSS + Custom detective theme
- **Container**: Docker

## Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Create database
npx prisma db push

# Seed sample data
npm run db:seed

# Start dev server
npm run dev
```

## Future Enhancements

- [ ] Full authentication with NextAuth.js
- [ ] Export/Import data (JSON/CSV)
- [x] Image upload for NPC portraits
- [ ] Collaborative real-time editing
- [ ] Timeline view for relationship changes
- [ ] Mobile-responsive design and touch support
- [ ] Zoom in/out controls for board navigation
- [x] Campaign management system
- [x] Detective board visualization
- [x] Crew management with members
- [x] Crew member navigation

## License

MIT
