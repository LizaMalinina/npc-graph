// Generate a placeholder avatar URL based on name
export function getPlaceholderAvatar(name: string, bgColor = '3A5F4B'): string {
  const seed = encodeURIComponent(name)
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=${bgColor}`
}

// Parse relationship ID to determine type and extract actual ID
export function parseRelationshipId(id: string): { type: 'crew' | 'member' | 'npc'; actualId: string } {
  if (id.startsWith('crew-rel-')) return { type: 'crew', actualId: id.replace('crew-rel-', '') }
  if (id.startsWith('member-rel-')) return { type: 'member', actualId: id.replace('member-rel-', '') }
  return { type: 'npc', actualId: id }
}

// Get entity type from node ID
export function getEntityType(id: string): 'crew' | 'crew-member' | 'npc' {
  if (id.startsWith('crew-')) return 'crew'
  if (id.startsWith('member-')) return 'crew-member'
  return 'npc'
}
