/**
 * Character Web Database Schema Tests
 * 
 * These tests verify that the Prisma schema correctly models
 * the Character Web domain with Characters, Organisations, and 
 * their relationships.
 * 
 * Note: These are integration tests that require a running database.
 */

import { PrismaClient } from '@prisma/client'

// Will be populated once schema is migrated
const prisma = new PrismaClient()

beforeAll(async () => {
  // Clean up test data before running tests
  await prisma.$connect()
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('Character Database Entity', () => {
  const testCampaignId = `test-campaign-${Math.random().toString(36).substring(7)}`
  let createdCampaignId: string

  beforeAll(async () => {
    // Create a test campaign
    const campaign = await prisma.campaign.create({
      data: {
        slug: testCampaignId,
        name: 'Test Campaign for Character Tests',
      },
    })
    createdCampaignId = campaign.id
  })

  afterAll(async () => {
    // Clean up: delete test campaign (cascades to related entities)
    await prisma.campaign.delete({
      where: { id: createdCampaignId },
    })
  })

  it('should create a Character with required fields', async () => {
    const randomName = `Test Character ${Math.floor(Math.random() * 10000)}`
    
    const character = await prisma.character.create({
      data: {
        name: randomName,
        campaignId: createdCampaignId,
      },
    })

    expect(character.id).toBeDefined()
    expect(character.name).toBe(randomName)
    expect(character.campaignId).toBe(createdCampaignId)
    expect(character.createdAt).toBeInstanceOf(Date)
    expect(character.updatedAt).toBeInstanceOf(Date)

    // Clean up
    await prisma.character.delete({ where: { id: character.id } })
  })

  it('should create a Character with optional descriptive fields', async () => {
    const randomTitle = `Title ${Math.floor(Math.random() * 100)}`
    const randomDescription = `Description ${Math.random().toString(36)}`
    const randomFaction = `Faction ${Math.floor(Math.random() * 10)}`
    const randomLocation = `Location ${Math.floor(Math.random() * 10)}`

    const character = await prisma.character.create({
      data: {
        name: 'Character with Details',
        title: randomTitle,
        description: randomDescription,
        faction: randomFaction,
        location: randomLocation,
        status: 'alive',
        tags: 'warrior,noble',
        campaignId: createdCampaignId,
      },
    })

    expect(character.title).toBe(randomTitle)
    expect(character.description).toBe(randomDescription)
    expect(character.faction).toBe(randomFaction)
    expect(character.location).toBe(randomLocation)
    expect(character.status).toBe('alive')
    expect(character.tags).toBe('warrior,noble')

    // Clean up
    await prisma.character.delete({ where: { id: character.id } })
  })

  it('should store graph position for layout persistence', async () => {
    const randomPosX = Math.random() * 1000
    const randomPosY = Math.random() * 1000

    const character = await prisma.character.create({
      data: {
        name: 'Positioned Character',
        posX: randomPosX,
        posY: randomPosY,
        campaignId: createdCampaignId,
      },
    })

    expect(character.posX).toBeCloseTo(randomPosX)
    expect(character.posY).toBeCloseTo(randomPosY)

    // Clean up
    await prisma.character.delete({ where: { id: character.id } })
  })
})

describe('Organisation Database Entity', () => {
  let createdCampaignId: string

  beforeAll(async () => {
    const testCampaignSlug = `test-campaign-org-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const campaign = await prisma.campaign.create({
      data: {
        slug: testCampaignSlug,
        name: 'Test Campaign for Organisation Tests',
      },
    })
    createdCampaignId = campaign.id
  })

  afterAll(async () => {
    try {
      if (createdCampaignId) {
        await prisma.campaign.delete({
          where: { id: createdCampaignId },
        })
      }
    } catch {
      // Campaign may already be deleted
    }
  })

  it('should create an Organisation with required fields', async () => {
    const randomName = `Test Organisation ${Math.floor(Math.random() * 10000)}`
    
    const organisation = await prisma.organisation.create({
      data: {
        name: randomName,
        campaignId: createdCampaignId,
      },
    })

    expect(organisation.id).toBeDefined()
    expect(organisation.name).toBe(randomName)
    expect(organisation.campaignId).toBe(createdCampaignId)

    // Clean up
    await prisma.organisation.delete({ where: { id: organisation.id } })
  })

  it('should create an Organisation with optional fields', async () => {
    const randomDescription = `Description ${Math.random().toString(36)}`

    const organisation = await prisma.organisation.create({
      data: {
        name: 'Organisation with Details',
        description: randomDescription,
        imageUrl: 'https://example.com/org.jpg',
        campaignId: createdCampaignId,
      },
    })

    expect(organisation.description).toBe(randomDescription)
    expect(organisation.imageUrl).toBe('https://example.com/org.jpg')

    // Clean up
    await prisma.organisation.delete({ where: { id: organisation.id } })
  })
})

describe('Character-Organisation Membership', () => {
  let campaignId: string
  let characterId: string
  let organisationId: string

  beforeAll(async () => {
    // Use unique slug to avoid conflicts
    const testCampaignSlug = `test-campaign-member-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    const campaign = await prisma.campaign.create({
      data: {
        slug: testCampaignSlug,
        name: 'Test Campaign for Membership Tests',
      },
    })
    campaignId = campaign.id

    const character = await prisma.character.create({
      data: {
        name: 'Member Character',
        campaignId,
      },
    })
    characterId = character.id

    const organisation = await prisma.organisation.create({
      data: {
        name: 'Parent Organisation',
        campaignId,
      },
    })
    organisationId = organisation.id
  })

  afterAll(async () => {
    try {
      if (campaignId) {
        await prisma.campaign.delete({
          where: { id: campaignId },
        })
      }
    } catch {
      // Campaign may already be deleted or not exist
    }
  })

  it('should allow a Character to be a member of an Organisation', async () => {
    // Create membership relationship
    await prisma.character.update({
      where: { id: characterId },
      data: {
        organisations: {
          connect: { id: organisationId },
        },
      },
    })

    // Verify membership
    const characterWithOrgs = await prisma.character.findUnique({
      where: { id: characterId },
      include: { organisations: true },
    })

    expect(characterWithOrgs?.organisations).toHaveLength(1)
    expect(characterWithOrgs?.organisations[0].id).toBe(organisationId)

    // Verify from organisation side
    const orgWithMembers = await prisma.organisation.findUnique({
      where: { id: organisationId },
      include: { members: true },
    })

    expect(orgWithMembers?.members).toHaveLength(1)
    expect(orgWithMembers?.members[0].id).toBe(characterId)
  })
})

describe('UniversalRelationship Database Entity', () => {
  let campaignId: string
  let char1Id: string
  let char2Id: string
  let org1Id: string

  beforeAll(async () => {
    const testCampaignSlug = `test-campaign-rel-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const campaign = await prisma.campaign.create({
      data: {
        slug: testCampaignSlug,
        name: 'Test Campaign for Relationship Tests',
      },
    })
    campaignId = campaign.id

    const char1 = await prisma.character.create({
      data: { name: 'Character 1', campaignId },
    })
    char1Id = char1.id

    const char2 = await prisma.character.create({
      data: { name: 'Character 2', campaignId },
    })
    char2Id = char2.id

    const org1 = await prisma.organisation.create({
      data: { name: 'Organisation 1', campaignId },
    })
    org1Id = org1.id
  })

  afterAll(async () => {
    try {
      if (campaignId) {
        await prisma.campaign.delete({
          where: { id: campaignId },
        })
      }
    } catch {
      // Campaign may already be deleted
    }
  })

  it('should create a Character-to-Character relationship', async () => {
    const randomStrength = Math.floor(Math.random() * 10) + 1

    const relationship = await prisma.universalRelationship.create({
      data: {
        fromEntityId: char1Id,
        fromEntityType: 'character',
        toEntityId: char2Id,
        toEntityType: 'character',
        type: 'friend',
        strength: randomStrength,
      },
    })

    expect(relationship.fromEntityType).toBe('character')
    expect(relationship.toEntityType).toBe('character')
    expect(relationship.strength).toBe(randomStrength)

    // Clean up
    await prisma.universalRelationship.delete({ where: { id: relationship.id } })
  })

  it('should create a Character-to-Organisation relationship', async () => {
    const relationship = await prisma.universalRelationship.create({
      data: {
        fromEntityId: char1Id,
        fromEntityType: 'character',
        toEntityId: org1Id,
        toEntityType: 'organisation',
        type: 'ally',
        strength: 7,
      },
    })

    expect(relationship.fromEntityType).toBe('character')
    expect(relationship.toEntityType).toBe('organisation')

    // Clean up
    await prisma.universalRelationship.delete({ where: { id: relationship.id } })
  })

  it('should create an Organisation-to-Organisation relationship', async () => {
    const org2 = await prisma.organisation.create({
      data: { name: 'Organisation 2', campaignId },
    })

    const relationship = await prisma.universalRelationship.create({
      data: {
        fromEntityId: org1Id,
        fromEntityType: 'organisation',
        toEntityId: org2.id,
        toEntityType: 'organisation',
        type: 'rival',
        strength: 9,
      },
    })

    expect(relationship.fromEntityType).toBe('organisation')
    expect(relationship.toEntityType).toBe('organisation')

    // Clean up
    await prisma.universalRelationship.delete({ where: { id: relationship.id } })
    await prisma.organisation.delete({ where: { id: org2.id } })
  })
})
