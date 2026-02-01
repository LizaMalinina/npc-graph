import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create a campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: 'The Realm of Eldoria',
      slug: 'the-realm-of-eldoria',
      description: 'A fantasy world of magic, intrigue, and adventure',
      isActive: true,
    },
  })

  console.log(`Created campaign: ${campaign.name}`)

  // Create organisations
  const heroesOrg = await prisma.organisation.create({
    data: {
      name: 'The Heroes of Eldoria',
      description: 'The adventuring party exploring the realm',
      campaignId: campaign.id,
    },
  })

  const magesGuild = await prisma.organisation.create({
    data: {
      name: 'Mages Guild',
      description: 'An ancient order of powerful wizards',
      campaignId: campaign.id,
    },
  })

  const shadowNetwork = await prisma.organisation.create({
    data: {
      name: 'Shadow Network',
      description: 'A secretive organization of spies and assassins',
      campaignId: campaign.id,
    },
  })

  console.log('Created organisations')

  // Create characters
  const characters = await Promise.all([
    prisma.character.create({
      data: {
        name: 'Eldric Stormwind',
        title: 'The Archmage',
        description: 'A powerful wizard who leads the Mages Guild',
        faction: 'Mages Guild',
        location: 'Tower of Stars',
        status: 'alive',
        tags: 'magic,leader,quest-giver',
        campaignId: campaign.id,
        organisations: { connect: { id: magesGuild.id } },
      },
    }),
    prisma.character.create({
      data: {
        name: 'Kira Shadowblade',
        title: 'Assassin',
        description: 'A mysterious assassin with unknown allegiances',
        faction: 'Shadow Network',
        location: 'Unknown',
        status: 'alive',
        tags: 'stealth,dangerous,informant',
        campaignId: campaign.id,
        organisations: { connect: { id: shadowNetwork.id } },
      },
    }),
    prisma.character.create({
      data: {
        name: 'Tormund Ironforge',
        title: 'The Blacksmith',
        description: 'Master craftsman known for legendary weapons',
        faction: 'Craftsmen Guild',
        location: 'Ironforge District',
        status: 'alive',
        tags: 'merchant,crafter,friendly',
        campaignId: campaign.id,
      },
    }),
    prisma.character.create({
      data: {
        name: 'Lady Seraphina',
        title: 'Noble of House Valdris',
        description: 'An influential noble with political ambitions',
        faction: 'House Valdris',
        location: 'Castle Valdris',
        status: 'alive',
        tags: 'noble,politics,wealthy',
        campaignId: campaign.id,
      },
    }),
    prisma.character.create({
      data: {
        name: 'Grimjaw',
        title: 'The Orc Warlord',
        description: 'Former enemy, now an uneasy ally',
        faction: 'Bloodfang Clan',
        location: 'Northern Wastes',
        status: 'alive',
        tags: 'warrior,leader,former-enemy',
        campaignId: campaign.id,
      },
    }),
    prisma.character.create({
      data: {
        name: 'Brother Marcus',
        title: 'High Priest',
        description: 'Leader of the Temple of Light',
        faction: 'Temple of Light',
        location: 'Grand Cathedral',
        status: 'alive',
        tags: 'healer,religious,quest-giver',
        campaignId: campaign.id,
      },
    }),
    prisma.character.create({
      data: {
        name: 'Aria Goldleaf',
        title: 'Elven Ranger',
        description: 'A skilled tracker and protector of the forest',
        faction: 'Woodland Guardians',
        location: 'Whispering Woods',
        status: 'alive',
        tags: 'nature,archer,scout',
        campaignId: campaign.id,
        organisations: { connect: { id: heroesOrg.id } },
      },
    }),
    prisma.character.create({
      data: {
        name: 'Thane Rockbreaker',
        title: 'Dwarven Warrior',
        description: 'A mighty warrior from the mountain kingdoms',
        faction: 'Mountain Clans',
        location: 'Stonehall Keep',
        status: 'alive',
        tags: 'warrior,loyal,brave',
        campaignId: campaign.id,
        organisations: { connect: { id: heroesOrg.id } },
      },
    }),
  ])

  console.log(`Created ${characters.length} characters`)

  // Create relationships using UniversalRelationship
  await Promise.all([
    // Character to character relationships
    prisma.universalRelationship.create({
      data: {
        fromEntityId: characters[0].id, // Eldric
        fromEntityType: 'character',
        toEntityId: characters[1].id, // Kira
        toEntityType: 'character',
        type: 'rival',
        description: 'Long-standing rivalry over magical artifacts',
        strength: 7,
      },
    }),
    prisma.universalRelationship.create({
      data: {
        fromEntityId: characters[0].id, // Eldric
        fromEntityType: 'character',
        toEntityId: characters[5].id, // Brother Marcus
        toEntityType: 'character',
        type: 'ally',
        description: 'Allies in the fight against dark magic',
        strength: 8,
      },
    }),
    prisma.universalRelationship.create({
      data: {
        fromEntityId: characters[2].id, // Tormund
        fromEntityType: 'character',
        toEntityId: characters[3].id, // Lady Seraphina
        toEntityType: 'character',
        type: 'business',
        description: 'Crafts weapons for House Valdris',
        strength: 6,
      },
    }),
    prisma.universalRelationship.create({
      data: {
        fromEntityId: characters[4].id, // Grimjaw
        fromEntityType: 'character',
        toEntityId: characters[6].id, // Aria
        toEntityType: 'character',
        type: 'enemy',
        description: 'Former battlefield enemies, now uneasy allies',
        strength: 4,
      },
    }),
    // Organisation to organisation relationships
    prisma.universalRelationship.create({
      data: {
        fromEntityId: magesGuild.id,
        fromEntityType: 'organisation',
        toEntityId: shadowNetwork.id,
        toEntityType: 'organisation',
        type: 'enemy',
        description: 'The Guild hunts Shadow Network operatives',
        strength: 9,
      },
    }),
    // Organisation to character relationships
    prisma.universalRelationship.create({
      data: {
        fromEntityId: heroesOrg.id,
        fromEntityType: 'organisation',
        toEntityId: characters[0].id, // Eldric
        toEntityType: 'character',
        type: 'ally',
        description: 'The heroes work closely with the Archmage',
        strength: 7,
      },
    }),
  ])

  console.log('Created relationships')

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
