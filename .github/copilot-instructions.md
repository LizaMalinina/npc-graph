# Copilot Instructions for npc-graph

This document defines the rules and protocols for working in this repository.

## Project Overview

- **Framework**: Next.js with App Router
- **Language**: TypeScript
- **Database**: Prisma ORM (SQLite for dev, PostgreSQL for production)
- **Styling**: Tailwind CSS

## Code Style & Conventions

### General

- Use TypeScript for all new files
- Prefer functional components with hooks
- Use async/await over .then() chains
- Keep files focused and single-purpose

### Naming Conventions

- Components: PascalCase (e.g., `NpcForm.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useApi.ts`)
- API routes: lowercase with hyphens (e.g., `crew-members/`)
- Types: PascalCase, defined in `src/types/index.ts`

### File Organization

- Components go in `src/components/`
- Feature-specific components go in subdirectories (e.g., `detective/`)
- API routes follow Next.js App Router conventions in `src/app/api/`
- Shared utilities go in `src/lib/`
- Custom hooks go in `src/hooks/`

## Development Rules

### Docker Environment

All development and test execution **must be done within Docker containers**.

- Use `docker-compose` to manage the development environment
- Run all commands (npm, tests, migrations, etc.) inside the app container
- You do not need explicit permission to start, rebuild, update, restart, or stop Docker containers in this project

### Before Making Changes

1. Understand the existing patterns in the codebase
2. Check related files for consistency
3. Review types in `src/types/index.ts`
4. **Check if changes affect multiple files that must stay in sync:**
   - `prisma/schema.prisma` ↔ `prisma/schema.postgres.prisma`
   - `src/types/index.ts` ↔ `src/hooks/useApi.ts` (when adding new fields)
   - `Dockerfile` ↔ `Dockerfile.prod` (when changing build steps)

### When Creating API Routes

- Follow RESTful conventions
- Use proper HTTP methods (GET, POST, PUT, DELETE)
- Return appropriate status codes
- Handle errors gracefully with try/catch

### When Working with Prisma

- Schema changes go in `prisma/schema.prisma`
- PostgreSQL-specific schema in `prisma/schema.postgres.prisma`
- **CRITICAL: Any change to `schema.prisma` MUST also be applied to `schema.postgres.prisma`** - these schemas must stay in sync
- Run migrations after schema changes
- Update seed data in `prisma/seed.ts` if needed

### Production Build Verification

- **CRITICAL: After any schema, type, or significant code changes, verify the production build:**
  ```bash
  docker build -f Dockerfile.prod -t npc-graph-test .
  ```
- Local tests use SQLite; production uses PostgreSQL - both must work
- The production Dockerfile (`Dockerfile.prod`) uses `schema.postgres.prisma`
- Never assume passing local tests means production will build successfully

### When Creating Components

- Use React Query for data fetching (via `useApi` hook)
- Keep components reusable when possible
- Co-locate component-specific styles

## Test-Driven Development (TDD)

### Core Principle

All changes **must start with tests**. Follow the Red-Green-Refactor cycle:

1. **Red**: Write a failing test that defines the expected behavior
2. **Green**: Implement the minimum code to make the test pass
3. **Refactor**: Clean up the code while keeping tests green

### TDD Rules

1. **Tests as Specifications**
   - Write tests that are readable by humans
   - Tests should serve as living documentation of system behavior
   - Use descriptive test names that explain the expected behavior
   - Practice "programming by intention" — write what you want, then make it work

2. **One Test at a Time**
   - Add only one test before implementing
   - See the test fail before writing implementation code
   - Never write multiple failing tests at once

3. **No Magic Numbers**
   - Never use constant/magic numbers directly in tests
   - Use variables with descriptive names
   - Generate test values through randomization where appropriate
   - Example: Use `const expectedCount = Math.floor(Math.random() * 10) + 1` instead of hardcoded `5`

4. **Test Execution**
   - Run unit tests after every relevant change
   - Run integration tests after larger changes or feature completion
   - All tests must pass before considering work complete

## Validation

- Verify TypeScript compiles without errors
- Check for lint errors before committing

## Git Workflow

- Write clear, descriptive commit messages
- Keep commits focused on single changes

## Additional Notes

<!-- Add project-specific notes here as needed -->

---

## Domain Model Specification: Character Web

### Entities

| Entity | Description |
|--------|-------------|
| **Character** | A person/NPC in the world (replaces "NPC") |
| **Organisation** | A group, faction, guild, etc. (replaces "Crew") |

### Relationships

- **Character ↔ Character**: Characters can have relationships with other characters
- **Organisation ↔ Organisation**: Organisations can have relationships with other organisations
- **Character ↔ Organisation**: Characters can belong to or have relationships with organisations (many-to-many)

### Membership

- A Character can be a member of 0 or more Organisations
- An Organisation can have 0 or more Character members

### UI Views

1. **Characters** — Shows only characters and their relationships
2. **Orgs** — Shows only organisations and their relationships
3. **All** — Shows all entities and all relationships

### Selection Behavior

- **Single selection**: Bio panel appears on the side showing details
- **Multi-selection**: "Apply" button highlights; clicking it filters the web to show only selected items and their direct connections

