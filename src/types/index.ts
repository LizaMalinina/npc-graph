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

export interface GraphNode {
  id: string
  name: string
  title?: string | null
  imageUrl?: string | null
  faction?: string | null
  location?: string | null
  status: string
  tags?: string[]
  x?: number
  y?: number
}

export interface GraphLink {
  id: string
  source: string
  target: string
  type: string
  description?: string | null
  strength: number
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

export interface FilterState {
  factions: string[]
  locations: string[]
  statuses: string[]
  relationshipTypes: string[]
  searchQuery: string
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
