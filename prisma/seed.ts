import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create sample NPCs
  const npcs = await Promise.all([
    prisma.npc.create({
      data: {
        name: 'Eldric Stormwind',
        title: 'The Archmage',
        description: 'A powerful wizard who leads the Mages Guild',
        faction: 'Mages Guild',
        location: 'Tower of Stars',
        status: 'alive',
        tags: 'magic,leader,quest-giver',
      },
    }),
    prisma.npc.create({
      data: {
        name: 'Kira Shadowblade',
        title: 'Assassin',
        description: 'A mysterious assassin with unknown allegiances',
        faction: 'Shadow Network',
        location: 'Unknown',
        status: 'alive',
        tags: 'stealth,dangerous,informant',
      },
    }),
    prisma.npc.create({
      data: {
        name: 'Tormund Ironforge',
        title: 'The Blacksmith',
        description: 'Master craftsman known for legendary weapons',
        faction: 'Craftsmen Guild',
        location: 'Ironforge District',
        status: 'alive',
        tags: 'merchant,crafter,friendly',
      },
    }),
    prisma.npc.create({
      data: {
        name: 'Lady Seraphina',
        title: 'Noble of House Valdris',
        description: 'An influential noble with political ambitions',
        faction: 'House Valdris',
        location: 'Castle Valdris',
        status: 'alive',
        tags: 'noble,politics,wealthy',
      },
    }),
    prisma.npc.create({
      data: {
        name: 'Grimjaw',
        title: 'The Orc Warlord',
        description: 'Former enemy, now an uneasy ally',
        faction: 'Bloodfang Clan',
        location: 'Northern Wastes',
        status: 'alive',
        tags: 'warrior,leader,former-enemy',
      },
    }),
    prisma.npc.create({
      data: {
        name: 'Brother Marcus',
        title: 'High Priest',
        description: 'Leader of the Temple of Light',
        faction: 'Temple of Light',
        location: 'Grand Cathedral',
        status: 'alive',
        tags: 'healer,religious,quest-giver',
      },
    }),
    prisma.npc.create({
      data: {
        name: 'Whisper',
        title: 'The Information Broker',
        description: 'Knows everything about everyone',
        faction: 'Shadow Network',
        location: 'The Undercity',
        status: 'alive',
        tags: 'informant,mysterious,neutral',
      },
    }),
    prisma.npc.create({
      data: {
        name: 'Captain Helena',
        title: 'City Guard Commander',
        description: 'Strict but fair leader of the city guard',
        faction: 'City Guard',
        location: 'Guard Barracks',
        status: 'alive',
        tags: 'military,lawful,quest-giver',
      },
    }),
    // Additional NPCs for faction comparison
    prisma.npc.create({
      data: {
        name: 'Lyra Moonwhisper',
        title: 'Enchantress',
        description: 'A young but talented enchanter at the Mages Guild',
        faction: 'Mages Guild',
        location: 'Tower of Stars',
        status: 'alive',
        tags: 'magic,enchanting,curious',
      },
    }),
    prisma.npc.create({
      data: {
        name: 'Sergeant Aldric',
        title: 'Guard Lieutenant',
        description: 'Helena\'s trusted second-in-command',
        faction: 'City Guard',
        location: 'Guard Barracks',
        status: 'alive',
        tags: 'military,loyal,patrol',
      },
    }),
    prisma.npc.create({
      data: {
        name: 'Theron Valdris',
        title: 'Heir of House Valdris',
        description: 'Lady Seraphina\'s ambitious younger brother',
        faction: 'House Valdris',
        location: 'Castle Valdris',
        status: 'alive',
        tags: 'noble,ambitious,schemer',
      },
    }),
  ])

  console.log(`Created ${npcs.length} NPCs`)

  // Create relationships
  const relationships = await Promise.all([
    // Eldric relationships
    prisma.relationship.create({
      data: {
        fromNpcId: npcs[0].id, // Eldric
        toNpcId: npcs[3].id,   // Lady Seraphina
        type: 'ally',
        description: 'Political alliance',
        strength: 7,
      },
    }),
    prisma.relationship.create({
      data: {
        fromNpcId: npcs[0].id, // Eldric
        toNpcId: npcs[5].id,   // Brother Marcus
        type: 'friend',
        description: 'Old friends from the academy',
        strength: 8,
      },
    }),
    prisma.relationship.create({
      data: {
        fromNpcId: npcs[0].id, // Eldric
        toNpcId: npcs[1].id,   // Kira
        type: 'rival',
        description: 'Distrust due to past incident',
        strength: 5,
      },
    }),
    // Kira relationships
    prisma.relationship.create({
      data: {
        fromNpcId: npcs[1].id, // Kira
        toNpcId: npcs[6].id,   // Whisper
        type: 'business',
        description: 'Regular information exchange',
        strength: 6,
      },
    }),
    prisma.relationship.create({
      data: {
        fromNpcId: npcs[1].id, // Kira
        toNpcId: npcs[7].id,   // Captain Helena
        type: 'enemy',
        description: 'Helena has been hunting Kira for years',
        strength: 9,
      },
    }),
    // Tormund relationships
    prisma.relationship.create({
      data: {
        fromNpcId: npcs[2].id, // Tormund
        toNpcId: npcs[4].id,   // Grimjaw
        type: 'friend',
        description: 'Bonded over shared respect for craftsmanship',
        strength: 6,
      },
    }),
    prisma.relationship.create({
      data: {
        fromNpcId: npcs[2].id, // Tormund
        toNpcId: npcs[7].id,   // Captain Helena
        type: 'ally',
        description: 'Supplies weapons to the guard',
        strength: 7,
      },
    }),
    // Lady Seraphina relationships
    prisma.relationship.create({
      data: {
        fromNpcId: npcs[3].id, // Lady Seraphina
        toNpcId: npcs[6].id,   // Whisper
        type: 'business',
        description: 'Uses Whisper for political intelligence',
        strength: 5,
      },
    }),
    prisma.relationship.create({
      data: {
        fromNpcId: npcs[3].id, // Lady Seraphina
        toNpcId: npcs[5].id,   // Brother Marcus
        type: 'rival',
        description: 'Competing for influence in the council',
        strength: 6,
      },
    }),
    // Grimjaw relationships
    prisma.relationship.create({
      data: {
        fromNpcId: npcs[4].id, // Grimjaw
        toNpcId: npcs[7].id,   // Captain Helena
        type: 'enemy',
        description: 'Past battles, tenuous peace',
        strength: 8,
      },
    }),
    // Brother Marcus relationships
    prisma.relationship.create({
      data: {
        fromNpcId: npcs[5].id, // Brother Marcus
        toNpcId: npcs[7].id,   // Captain Helena
        type: 'ally',
        description: 'Work together to maintain order',
        strength: 7,
      },
    }),
    // Whisper relationships
    prisma.relationship.create({
      data: {
        fromNpcId: npcs[6].id, // Whisper
        toNpcId: npcs[7].id,   // Captain Helena
        type: 'unknown',
        description: 'Complicated - mutual informants',
        strength: 4,
      },
    }),
    // New NPC relationships
    prisma.relationship.create({
      data: {
        fromNpcId: npcs[8].id, // Lyra Moonwhisper
        toNpcId: npcs[0].id,   // Eldric
        type: 'mentor',
        description: 'Eldric is training Lyra in advanced magic',
        strength: 8,
      },
    }),
    prisma.relationship.create({
      data: {
        fromNpcId: npcs[9].id, // Sergeant Aldric
        toNpcId: npcs[7].id,   // Captain Helena
        type: 'ally',
        description: 'Loyal subordinate and trusted friend',
        strength: 9,
      },
    }),
    prisma.relationship.create({
      data: {
        fromNpcId: npcs[10].id, // Theron Valdris
        toNpcId: npcs[3].id,    // Lady Seraphina
        type: 'family',
        description: 'Siblings with conflicting ambitions',
        strength: 7,
      },
    }),
    prisma.relationship.create({
      data: {
        fromNpcId: npcs[10].id, // Theron Valdris
        toNpcId: npcs[1].id,    // Kira
        type: 'business',
        description: 'Secret dealings unknown to his sister',
        strength: 5,
      },
    }),
  ])

  console.log(`Created ${relationships.length} relationships`)
  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
