/**
 * Migration script to generate slugs for existing campaigns
 * 
 * PRODUCTION USAGE:
 * 
 * Option 1 - Run inside the production container:
 *   docker exec -it <container-name> npx tsx scripts/migrate-production-slugs.ts
 * 
 * Option 2 - Run locally with production DATABASE_URL:
 *   # PowerShell:
 *   $env:DATABASE_URL = "postgresql://...your-neon-connection-string..."
 *   npx prisma generate --schema=prisma/schema.postgres.prisma
 *   npx tsx scripts/migrate-production-slugs.ts
 * 
 *   # Bash:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/migrate-production-slugs.ts
 * 
 * LOCAL USAGE (SQLite):
 *   docker-compose exec app npx tsx scripts/migrate-production-slugs.ts
 * 
 * NOTE: Run `npx prisma generate` after applying the migration to update the client!
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Log which database we're connecting to
const dbUrl = process.env.DATABASE_URL || 'unknown'
const isPostgres = dbUrl.includes('postgresql') || dbUrl.includes('postgres')
console.log('📍 Database:', isPostgres ? 'PostgreSQL' : 'SQLite')
console.log('📍 URL prefix:', dbUrl.substring(0, 30) + '...')
console.log('')

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 50) // Limit length
}

interface CampaignRow {
  id: string
  name: string
  slug: string | null
}

async function findCampaignBySlug(slug: string): Promise<CampaignRow | null> {
  const results = await prisma.$queryRawUnsafe<CampaignRow[]>(
    `SELECT id, name, slug FROM "Campaign" WHERE slug = $1`,
    slug
  )
  return results[0] || null
}

async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug
  let counter = 1
  
  while (true) {
    const existing = await findCampaignBySlug(slug)
    if (!existing || existing.id === excludeId) {
      break
    }
    slug = `${baseSlug}-${counter}`
    counter++
  }
  
  return slug
}

async function main() {
  console.log('🔄 Starting slug migration for existing campaigns...\n')

  // Find all campaigns using raw query (works regardless of Prisma client version)
  const campaigns = await prisma.$queryRawUnsafe<CampaignRow[]>(
    `SELECT id, name, slug FROM "Campaign"`
  )

  console.log(`Found ${campaigns.length} campaigns to process\n`)

  let updated = 0
  let skipped = 0

  for (const campaign of campaigns) {
    // Skip if campaign already has a valid slug
    if (campaign.slug && campaign.slug.length > 0) {
      console.log(`⏭️  Skipping "${campaign.name}" - already has slug: ${campaign.slug}`)
      skipped++
      continue
    }

    // Generate a unique slug from the campaign name
    const baseSlug = generateSlug(campaign.name) || 'campaign'
    const uniqueSlug = await ensureUniqueSlug(baseSlug, campaign.id)

    // Update the campaign with the new slug using raw query
    await prisma.$executeRawUnsafe(
      `UPDATE "Campaign" SET slug = $1 WHERE id = $2`,
      uniqueSlug,
      campaign.id
    )

    console.log(`✅ Updated "${campaign.name}" -> slug: ${uniqueSlug}`)
    updated++
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✨ Migration complete!`)
  console.log(`   Updated: ${updated} campaigns`)
  console.log(`   Skipped: ${skipped} campaigns (already had slugs)`)
  console.log('='.repeat(50))
}

main()
  .catch((error) => {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
