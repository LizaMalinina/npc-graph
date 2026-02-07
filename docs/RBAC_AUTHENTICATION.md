# RBAC & Authentication Architecture

## Overview

This document describes the Role-Based Access Control (RBAC) and authentication implementation for NPC Graph using Microsoft Entra External ID with NextAuth.js.

## Why Microsoft Entra External ID?

- **No PII stored locally**: Microsoft handles all user identity management
- **Simple integration**: Works seamlessly with NextAuth.js
- **Cost-effective**: Free tier includes 50,000 monthly active users
- **Enterprise-ready**: Built-in MFA, social logins, custom branding
- **Azure ecosystem**: Integrates well with existing Azure Blob Storage
- **Modern solution**: Replaces the deprecated Azure AD B2C

## Roles & Permissions

| Role     | View Campaigns | Edit Campaigns | Manage Nodes | Persist Node Positions | Manage Users |
|----------|----------------|----------------|--------------|------------------------|--------------|
| Viewer   | ✅ All         | ❌             | ❌            | ❌ (local only)        | ❌           |
| Editor   | ✅ All         | ✅ Assigned    | ✅ Assigned   | ✅ Assigned            | ❌           |
| Admin    | ✅ All         | ✅ All         | ✅ All        | ✅ All                 | ✅           |

### Role Details

#### Viewer (Default)
- Can view all campaigns without logging in
- Can move nodes locally (not persisted between sessions)
- No authentication required

#### Editor
- Requires login via Azure AD B2C
- Can edit campaigns they created or were assigned to
- Node position changes are persisted globally
- Can create new campaigns (becomes editor of their own campaigns)

#### Admin
- Full access to all campaigns
- Can assign editors to campaigns
- Can manage user roles
- All node position changes are persisted

## Database Schema Changes

### New: CampaignEditor (Join Table)
```prisma
model CampaignEditor {
  id         String   @id @default(cuid())
  campaignId String
  userId     String
  createdAt  DateTime @default(now())
  campaign   Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  
  @@unique([campaignId, userId])
}
```

### Updated: Campaign
```prisma
model Campaign {
  // ... existing fields
  creatorId  String?          // Entra user ID who created
  editors    CampaignEditor[] // Many-to-many with users
}
```

### Updated: User Model (Microsoft Entra External ID integration)
```prisma
model User {
  id            String   @id @default(cuid())
  azureId       String   @unique   // Microsoft Entra object ID (field name kept for compatibility)
  email         String   @unique
  name          String?
  role          String   @default("viewer") // viewer, editor, admin
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

## Node Position Persistence

### Behavior
1. **Viewers**: Positions are stored in localStorage, cleared on session end
2. **Editors/Admins**: Positions are saved to database via API on drag end
3. **Loading priority**: Database positions > Default layout calculation

### API Endpoint
```
PATCH /api/campaigns/:id/positions
Body: {
  positions: {
    [nodeId: string]: { x: number, y: number, entityType: 'character' | 'organisation' }
  }
}
```

## NextAuth.js Configuration

### Environment Variables
```env
# Microsoft Entra External ID
ENTRA_TENANT_ID=your-tenant-id
ENTRA_CLIENT_ID=your-client-id
ENTRA_CLIENT_SECRET=your-client-secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

### Auth Flow
1. User clicks "Sign In" → Redirected to Microsoft Entra
2. User authenticates (email/password, social, etc.)
3. Entra returns tokens → NextAuth creates session
4. Role fetched from local User table (by entraId)
5. Session includes user role for client-side permission checks

## UI Changes

### Desktop
- User avatar/login button in top-right corner
- Role badge shown when logged in
- "Admin Panel" link for admins

### Mobile
- Login button in hamburger menu
- Persistent auth state indicator

## File Structure

```
src/
  app/
    api/
      auth/
        [...nextauth]/
          route.ts       # NextAuth handler
      campaigns/
        [id]/
          positions/
            route.ts     # Node position persistence
  auth.ts                # NextAuth configuration
  lib/
    auth.ts              # Auth utilities
  components/
    AuthButton.tsx       # Login/logout button
    UserMenu.tsx         # User dropdown menu
  hooks/
    useAuth.ts           # Auth hook wrapper
```

## Security Considerations

1. **API Routes**: All mutating endpoints check session and role
2. **Campaign Editing**: Verify user is admin OR is assigned editor
3. **Position Updates**: Only editors/admins can persist positions
4. **User Management**: Only admins can modify roles
