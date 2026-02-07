/**
 * Node Positions API Tests
 * 
 * Tests for the node position persistence endpoint.
 * Following TDD: Write tests first, then implementation.
 * 
 * Note: These tests require a running server and proper auth mocking.
 * For unit testing, we focus on the logic and type validations.
 */

import { NodePositionUpdate, NodePositionsPayload, EntityType } from '@/types'

describe('Node Position Types', () => {
  describe('NodePositionUpdate', () => {
    it('should have required fields: nodeId, entityType, posX, posY', () => {
      // Arrange & Act
      const update: NodePositionUpdate = {
        nodeId: 'char-1',
        entityType: 'character',
        posX: 100,
        posY: 200,
      }

      // Assert
      expect(update.nodeId).toBe('char-1')
      expect(update.entityType).toBe('character')
      expect(update.posX).toBe(100)
      expect(update.posY).toBe(200)
    })

    it('should support both character and organisation entity types', () => {
      const characterUpdate: NodePositionUpdate = {
        nodeId: 'char-1',
        entityType: 'character',
        posX: 100,
        posY: 200,
      }

      const orgUpdate: NodePositionUpdate = {
        nodeId: 'org-1',
        entityType: 'organisation',
        posX: 300,
        posY: 400,
      }

      expect(characterUpdate.entityType).toBe('character')
      expect(orgUpdate.entityType).toBe('organisation')
    })
  })

  describe('NodePositionsPayload', () => {
    it('should contain an array of position updates', () => {
      // Arrange
      const payload: NodePositionsPayload = {
        positions: [
          { nodeId: 'char-1', entityType: 'character', posX: 100, posY: 200 },
          { nodeId: 'org-1', entityType: 'organisation', posX: 300, posY: 400 },
        ],
      }

      // Assert
      expect(payload.positions).toHaveLength(2)
      expect(payload.positions[0].nodeId).toBe('char-1')
      expect(payload.positions[1].nodeId).toBe('org-1')
    })

    it('should allow empty positions array', () => {
      const payload: NodePositionsPayload = {
        positions: [],
      }

      expect(payload.positions).toHaveLength(0)
    })
  })
})

describe('Position Validation Logic', () => {
  const validatePositionUpdate = (update: Partial<NodePositionUpdate>): string[] => {
    const errors: string[] = []
    
    if (!update.nodeId || typeof update.nodeId !== 'string') {
      errors.push('nodeId is required and must be a string')
    }
    
    if (!update.entityType || !['character', 'organisation'].includes(update.entityType)) {
      errors.push('entityType must be "character" or "organisation"')
    }
    
    if (typeof update.posX !== 'number' || isNaN(update.posX)) {
      errors.push('posX is required and must be a number')
    }
    
    if (typeof update.posY !== 'number' || isNaN(update.posY)) {
      errors.push('posY is required and must be a number')
    }
    
    return errors
  }

  it('should validate a correct position update', () => {
    const update: NodePositionUpdate = {
      nodeId: 'char-1',
      entityType: 'character',
      posX: 100,
      posY: 200,
    }
    
    expect(validatePositionUpdate(update)).toHaveLength(0)
  })

  it('should reject missing nodeId', () => {
    const errors = validatePositionUpdate({
      entityType: 'character',
      posX: 100,
      posY: 200,
    })
    
    expect(errors).toContain('nodeId is required and must be a string')
  })

  it('should reject invalid entityType', () => {
    const errors = validatePositionUpdate({
      nodeId: 'char-1',
      entityType: 'invalid' as EntityType,
      posX: 100,
      posY: 200,
    })
    
    expect(errors).toContain('entityType must be "character" or "organisation"')
  })

  it('should reject missing posX', () => {
    const errors = validatePositionUpdate({
      nodeId: 'char-1',
      entityType: 'character',
      posY: 200,
    })
    
    expect(errors).toContain('posX is required and must be a number')
  })

  it('should reject missing posY', () => {
    const errors = validatePositionUpdate({
      nodeId: 'char-1',
      entityType: 'character',
      posX: 100,
    })
    
    expect(errors).toContain('posY is required and must be a number')
  })

  it('should allow zero coordinates', () => {
    const update: NodePositionUpdate = {
      nodeId: 'char-1',
      entityType: 'character',
      posX: 0,
      posY: 0,
    }
    
    expect(validatePositionUpdate(update)).toHaveLength(0)
  })

  it('should allow negative coordinates', () => {
    const update: NodePositionUpdate = {
      nodeId: 'char-1',
      entityType: 'character',
      posX: -100,
      posY: -200,
    }
    
    expect(validatePositionUpdate(update)).toHaveLength(0)
  })
})

describe('Position Update Processing', () => {
  // Simulate the database update grouping logic
  const groupPositionsByEntityType = (positions: NodePositionUpdate[]) => {
    const characters: NodePositionUpdate[] = []
    const organisations: NodePositionUpdate[] = []
    
    for (const pos of positions) {
      if (pos.entityType === 'character') {
        characters.push(pos)
      } else if (pos.entityType === 'organisation') {
        organisations.push(pos)
      }
    }
    
    return { characters, organisations }
  }

  it('should separate character and organisation updates', () => {
    const positions: NodePositionUpdate[] = [
      { nodeId: 'char-1', entityType: 'character', posX: 100, posY: 200 },
      { nodeId: 'org-1', entityType: 'organisation', posX: 300, posY: 400 },
      { nodeId: 'char-2', entityType: 'character', posX: 500, posY: 600 },
    ]
    
    const { characters, organisations } = groupPositionsByEntityType(positions)
    
    expect(characters).toHaveLength(2)
    expect(organisations).toHaveLength(1)
  })

  it('should handle empty positions array', () => {
    const { characters, organisations } = groupPositionsByEntityType([])
    
    expect(characters).toHaveLength(0)
    expect(organisations).toHaveLength(0)
  })

  it('should handle only characters', () => {
    const positions: NodePositionUpdate[] = [
      { nodeId: 'char-1', entityType: 'character', posX: 100, posY: 200 },
    ]
    
    const { characters, organisations } = groupPositionsByEntityType(positions)
    
    expect(characters).toHaveLength(1)
    expect(organisations).toHaveLength(0)
  })

  it('should handle only organisations', () => {
    const positions: NodePositionUpdate[] = [
      { nodeId: 'org-1', entityType: 'organisation', posX: 100, posY: 200 },
    ]
    
    const { characters, organisations } = groupPositionsByEntityType(positions)
    
    expect(characters).toHaveLength(0)
    expect(organisations).toHaveLength(1)
  })
})
