// Generate a placeholder avatar URL based on name
export function getPlaceholderAvatar(name: string, bgColor = '3A5F4B'): string {
  const seed = encodeURIComponent(name)
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=${bgColor}`
}

// Parse relationship ID to determine type and extract actual ID
export function parseRelationshipId(id: string): { type: 'organisation' | 'character'; actualId: string } {
  if (id.startsWith('org-rel-')) return { type: 'organisation', actualId: id.replace('org-rel-', '') }
  return { type: 'character', actualId: id }
}

// Get entity type from node ID
export function getEntityType(id: string): 'organisation' | 'character' {
  if (id.startsWith('org-')) return 'organisation'
  return 'character'
}
