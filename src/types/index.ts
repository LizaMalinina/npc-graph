// ==========================================
// Core Entity Types
// ==========================================

export type EntityType = 'character' | 'organisation'

// Aspect ratio preset for image cropping (portrait only)
export type AspectRatio = 'portrait'

// Image crop settings for zoom/pan on uploaded images
export interface CropSettings {
  zoom: number
  offsetX: number
  offsetY: number
  aspectRatio?: AspectRatio
}

// Character entity (replaces NPC)
export interface Character {
  id: string
  name: string
  title?: string | null
  description?: string | null
  imageUrl?: string | null
  imageCrop?: CropSettings | null
  faction?: string | null
  location?: string | null
  status: string
  tags?: string | null
  posX?: number | null
  posY?: number | null
  campaignId?: string | null
  createdAt: Date
  updatedAt: Date
  organisations?: Organisation[]
}

// Organisation entity (replaces Crew)
export interface Organisation {
  id: string
  name: string
  description?: string | null
  imageUrl?: string | null
  imageCrop?: CropSettings | null
  pinColor?: string | null
  posX?: number | null
  posY?: number | null
  campaignId?: string | null
  createdAt: Date
  updatedAt: Date
  members?: Character[]
  _count?: {
    members: number
  }
}

// Universal Relationship - supports relationships between any entity types
export interface UniversalRelationship {
  id: string
  fromEntityId: string
  fromEntityType: EntityType
  toEntityId: string
  toEntityType: EntityType
  type: string
  description?: string | null
  strength: number
  createdAt: Date
  updatedAt: Date
}

// ==========================================
// Campaign Types
// ==========================================

export interface Campaign {
  id: string
  slug: string
  name: string
  description?: string | null
  imageUrl?: string | null
  imageCrop?: CropSettings | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  characters?: Character[]
  organisations?: Organisation[]
  _count?: {
    characters: number
    organisations: number
  }
  /** Whether the current user can edit this campaign (set by API) */
  canEdit?: boolean
}

// ==========================================
// Graph Visualization Types
// ==========================================

export interface GraphNode {
  id: string
  name: string
  title?: string | null
  description?: string | null
  imageUrl?: string | null
  imageCrop?: CropSettings | null
  faction?: string | null
  location?: string | null
  status?: string
  tags?: string[]
  x?: number
  y?: number
  // Entity type for new domain model
  entityType: EntityType
  // Pin color (inherited from org for characters, selected for orgs)
  pinColor?: string | null
  // Organisation-specific: members (when expanded)
  members?: GraphNode[]
  // Character-specific: organisations they belong to
  organisations?: { id: string; name: string; pinColor?: string | null }[]
}

export interface GraphLink {
  id: string
  source: string
  sourceType: EntityType
  target: string
  targetType: EntityType
  type: string
  description?: string | null
  strength: number
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
  organisations?: Organisation[]
}

// ==========================================
// Node Position Types (for persisting positions)
// ==========================================

export interface NodePositionUpdate {
  nodeId: string
  entityType: EntityType
  posX: number
  posY: number
}

export interface NodePositionsPayload {
  positions: NodePositionUpdate[]
}

export interface FilterState {
  factions: string[]
  locations: string[]
  statuses: string[]
  relationshipTypes: string[]
  searchQuery: string
  viewMode: 'collapsed' | 'expanded'  // Show orgs as single node or with members
  showOrganisationsOnly: boolean
  showCharactersOnly: boolean
}

// ==========================================
// View Mode Types
// ==========================================

export type CharacterWebViewMode = 'characters' | 'organisations' | 'all'

// Type aliases for Character Web API
export type CharacterWebNode = GraphNode
export type CharacterWebLink = GraphLink
export type CharacterWebData = GraphData

// ==========================================
// Constants
// ==========================================

export type UserRole = 'viewer' | 'editor' | 'admin'

// Simplified relationship types: only 3 main types
export const RELATIONSHIP_TYPES = [
  'friendly',
  'hostile',
  'neutral',
] as const

export type RelationshipType = typeof RELATIONSHIP_TYPES[number]

export const CHARACTER_STATUSES = ['alive', 'dead', 'unknown'] as const

// Base colors for relationship types
export const RELATIONSHIP_COLORS: Record<string, string> = {
  friendly: '#22c55e',  // green
  hostile: '#ef4444',   // red
  neutral: '#6b7280',   // grey
}

// Sub-values for relationship types by entity type combination
// Format: [strength 1, strength 2, strength 3, strength 4, strength 5]
const RELATIONSHIP_SUB_VALUES = {
  // Character to Character
  'character-character': {
    friendly: ['Acquaintance', 'Colleague', 'Friend', 'Close Friend', 'Soulmate'],
    hostile: ['Annoyed by', 'Dislikes', 'Enemy', 'Bitter Rival', 'Sworn Enemy'],
    neutral: ['Heard of', 'Aware of', 'Knows of', 'Familiar with', 'Well Acquainted'],
  },
  // Organisation to Organisation
  'organisation-organisation': {
    friendly: ['Trading Partners', 'Allies', 'Close Allies', 'Strategic Partners', 'United Alliance'],
    hostile: ['Competitors', 'Rivals', 'Adversaries', 'Bitter Enemies', 'At War'],
    neutral: ['Aware of', 'Coexist', 'Neutral', 'Distant Relations', 'Arms Length'],
  },
  // Character to Organisation
  'character-organisation': {
    friendly: ['Sympathizer', 'Supporter', 'Ally', 'Devoted', 'Champion'],
    hostile: ['Distrusts', 'Opposes', 'Enemy', 'Hunts', 'Sworn to Destroy'],
    neutral: ['Heard of', 'Aware of', 'Knows of', 'Familiar with', 'Well Informed'],
  },
  // Organisation to Character
  'organisation-character': {
    friendly: ['Tolerates', 'Welcomes', 'Ally', 'Favored', 'Protects'],
    hostile: ['Suspicious of', 'Opposes', 'Target', 'Hunts', 'Seeks to Destroy'],
    neutral: ['Unaware of', 'Aware of', 'Knows of', 'Monitors', 'Watches Closely'],
  },
} as const

// Distinct color palettes for each strength level (1-5)
// Using hand-picked colors that are visually distinguishable
const FRIENDLY_COLORS = [
  '#cfe6b8', // 1: very light sage
  '#9fcd7a', // 2: light green  
  '#5fbf6a', // 3: medium green
  '#2f9e5f', // 4: bright green
  '#1f6f3f', // 5: dark forest green
] as const

const HOSTILE_COLORS = [
  '#f4d35e', // 1: pale yellow (slight hostility)
  '#f6a04d', // 2: orange
  '#e76f51', // 3: burnt sienna
  '#d62828', // 4: bright red
  '#7f1d1d', // 5: dark maroon (intense hostility)
] as const

/**
 * Get the color for a relationship based on type and strength
 * Strength ranges from 1-5
 * - Friendly: dark forest green to bright lime
 * - Hostile: dark maroon to bright coral
 * - Neutral: constant grey
 */
export function getRelationshipColor(type: string, strength: number): string {
  // Clamp strength to 1-5 and convert to 0-indexed
  const index = Math.max(0, Math.min(4, strength - 1))
  
  switch (type) {
    case 'friendly':
      return FRIENDLY_COLORS[index]
    case 'hostile':
      return HOSTILE_COLORS[index]
    case 'neutral':
    default:
      return '#6b7280'
  }
}

/**
 * Get the descriptive sub-value for a relationship based on type, strength, and entity types
 */
export function getRelationshipSubValue(
  type: string,
  strength: number,
  fromEntityType: EntityType,
  toEntityType: EntityType
): string {
  // Clamp strength to 1-5
  const clampedStrength = Math.max(1, Math.min(5, strength))
  const index = clampedStrength - 1 // Convert to 0-indexed
  
  // Build the key for entity type combination
  const key = `${fromEntityType}-${toEntityType}` as keyof typeof RELATIONSHIP_SUB_VALUES
  
  const subValues = RELATIONSHIP_SUB_VALUES[key]
  if (!subValues) {
    return type // Fallback to type name
  }
  
  const typeSubValues = subValues[type as keyof typeof subValues]
  if (!typeSubValues) {
    return type // Fallback to type name
  }
  
  return typeSubValues[index] || type}