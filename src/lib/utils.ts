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

// Generate URL-friendly slug from name
export function generateSlug(name: string, maxLength = 50): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, maxLength) // Limit length
}
