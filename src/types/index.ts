// Campaign types
export interface Campaign {
  id: string
  name: string
  description?: string | null
  imageUrl?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  crew?: Crew
  npcs?: Npc[]
  _count?: {
    npcs: number
  }
}

export interface Npc {
  id: string
  name: string
  title?: string | null
  description?: string | null
  imageUrl?: string | null
  faction?: string | null
  location?: string | null
  status: string
  tags?: string | null
  posX?: number | null
  posY?: number | null
  campaignId?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Relationship {
  id: string
  fromNpcId: string
  toNpcId: string
  type: string
  description?: string | null
  strength: number
  createdAt: Date
  updatedAt: Date
  fromNpc?: Npc
  toNpc?: Npc
}

// Crew types
export interface Crew {
  id: string
  name: string
  description?: string | null
  imageUrl?: string | null
  createdAt: Date
  updatedAt: Date
  members?: CrewMember[]
  _count?: {
    members: number
  }
}

export interface CrewMember {
  id: string
  crewId: string
  name: string
  title?: string | null
  imageUrl?: string | null
  description?: string | null
  createdAt: Date
  updatedAt: Date
  crew?: Crew
}

export interface CrewRelationship {
  id: string
  crewId: string
  toNpcId: string
  type: string
  description?: string | null
  strength: number
  createdAt: Date
  updatedAt: Date
  toNpc?: Npc
}

export interface CrewMemberRelationship {
  id: string
  crewMemberId: string
  toNpcId: string
  type: string
  description?: string | null
  strength: number
  createdAt: Date
  updatedAt: Date
  toNpc?: Npc
}

export interface GraphNode {
  id: string
  name: string
  title?: string | null
  description?: string | null
  imageUrl?: string | null
  faction?: string | null
  location?: string | null
  status?: string  // Optional for crews
  tags?: string[]
  x?: number
  y?: number
  // Crew-related properties
  nodeType?: 'npc' | 'crew' | 'crew-member'
  crewId?: string  // For crew members, reference to their crew
  members?: GraphNode[]  // For crews, their members (when expanded)
}

export interface GraphLink {
  id: string
  source: string
  target: string
  type: string
  description?: string | null
  strength: number
  // Crew-related properties
  linkSource?: 'npc' | 'crew' | 'crew-member'
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
  crews?: Crew[]  // Include crew data for reference
}

export interface FilterState {
  factions: string[]
  locations: string[]
  statuses: string[]
  relationshipTypes: string[]
  searchQuery: string
  crewViewMode: 'collapsed' | 'expanded'  // Show crew as single node or individual members
  showCrewMembersOnly: boolean  // Filter to show only crew members
  showNpcsOnly: boolean  // Filter to show only NPCs
}

export type UserRole = 'viewer' | 'editor' | 'admin'

export const RELATIONSHIP_TYPES = [
  'friend',
  'enemy', 
  'family',
  'ally',
  'rival',
  'romantic',
  'business',
  'mentor',
  'servant',
  'unknown'
] as const

export const NPC_STATUSES = ['alive', 'dead', 'unknown'] as const

export const RELATIONSHIP_COLORS: Record<string, string> = {
  friend: '#22c55e',    // green
  enemy: '#ef4444',     // red
  family: '#a855f7',    // purple
  ally: '#3b82f6',      // blue
  rival: '#f97316',     // orange
  romantic: '#ec4899',  // pink
  business: '#eab308',  // yellow
  mentor: '#14b8a6',    // teal
  servant: '#6b7280',   // gray
  unknown: '#94a3b8',   // slate
}
