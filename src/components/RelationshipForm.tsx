'use client'

import { useState } from 'react'
import { GraphNode, GraphLink, RELATIONSHIP_TYPES, EntityType, getRelationshipSubValue, getRelationshipColor } from '@/types'

interface RelationshipFormProps {
  nodes: GraphNode[]
  existingLinks?: GraphLink[]
  relationship?: GraphLink | null
  preselectedFromId?: string | null
  onSubmit: (data: {
    fromEntityId: string
    fromEntityType: EntityType
    toEntityId: string
    toEntityType: EntityType
    type: string
    description?: string
    strength: number
  }) => void
  onCancel: () => void
  onDelete?: () => void
}

export default function RelationshipForm({
  nodes,
  existingLinks = [],
  relationship,
  preselectedFromId,
  onSubmit,
  onCancel,
  onDelete,
}: RelationshipFormProps) {
  // Find the preselected node to get its entity type
  const preselectedNode = preselectedFromId ? nodes.find(n => n.id === preselectedFromId) : null
  
  const [formData, setFormData] = useState({
    fromEntityId: relationship?.source || preselectedFromId || '',
    fromEntityType: (relationship?.sourceType || preselectedNode?.entityType || 'character') as EntityType,
    toEntityId: relationship?.target || '',
    toEntityType: (relationship?.targetType || 'character') as EntityType,
    type: relationship?.type || 'friendly',
    description: relationship?.description || '',
    strength: relationship?.strength || 3,
  })

  // Get nodes that already have a connection with the selected "from" node
  // Excludes the current relationship being edited so it can keep its connection
  const getConnectedNodeIds = (nodeId: string): Set<string> => {
    const connected = new Set<string>()
    existingLinks.forEach(link => {
      // Skip the relationship being edited
      if (relationship && link.id === relationship.id) return
      
      const sourceId = typeof link.source === 'object' ? (link.source as { id: string }).id : link.source
      const targetId = typeof link.target === 'object' ? (link.target as { id: string }).id : link.target
      if (sourceId === nodeId) connected.add(targetId)
      if (targetId === nodeId) connected.add(sourceId)
    })
    return connected
  }

  // Get available nodes for "To" dropdown (exclude self and already connected)
  const availableToNodes = nodes.filter(n => {
    if (n.id === formData.fromEntityId) return false
    if (!formData.fromEntityId) return true
    const connectedIds = getConnectedNodeIds(formData.fromEntityId)
    return !connectedIds.has(n.id)
  })

  // Get available nodes for "From" dropdown (when changing from, exclude nodes that are fully connected)
  const availableFromNodes = nodes

  const handleFromChange = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    setFormData(prev => ({
      ...prev,
      fromEntityId: nodeId,
      fromEntityType: node?.entityType || 'character',
    }))
  }

  const handleToChange = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    setFormData(prev => ({
      ...prev,
      toEntityId: nodeId,
      toEntityType: node?.entityType || 'character',
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.fromEntityId === formData.toEntityId) {
      alert('Cannot create a relationship with the same entity')
      return
    }
    onSubmit({
      fromEntityId: formData.fromEntityId,
      fromEntityType: formData.fromEntityType,
      toEntityId: formData.toEntityId,
      toEntityType: formData.toEntityType,
      type: formData.type,
      description: formData.description || undefined,
      strength: formData.strength,
    })
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'strength' ? parseInt(value) : value,
    }))
  }

  const getNodeIcon = (node: GraphNode) => {
    return node.entityType === 'organisation' ? '🏛️' : '👤'
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200]" onClick={onCancel}>
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-4">
          {relationship ? 'Edit Relationship' : 'Create New Relationship'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              From *
            </label>
            <select
              name="fromEntityId"
              value={formData.fromEntityId}
              onChange={(e) => handleFromChange(e.target.value)}
              required
              disabled={!!relationship}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Select a character or organisation</option>
              {nodes.map(node => (
                <option key={node.id} value={node.id}>
                  {getNodeIcon(node)} {node.name} {node.title ? `(${node.title})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              To *
            </label>
            <select
              name="toEntityId"
              value={formData.toEntityId}
              onChange={(e) => handleToChange(e.target.value)}
              required
              disabled={!!relationship}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Select a character or organisation</option>
              {availableToNodes.map(node => (
                <option key={node.id} value={node.id}>
                  {getNodeIcon(node)} {node.name} {node.title ? `(${node.title})` : ''}
                </option>
              ))}
            </select>
            {formData.fromEntityId && availableToNodes.length === 0 && (
              <p className="text-xs text-yellow-400 mt-1">All entities already have connections with this one.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Relationship Type *
            </label>
            <div className="flex gap-2">
              {RELATIONSHIP_TYPES.map(type => {
                const color = getRelationshipColor(type, 3)
                const isSelected = formData.type === type
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type }))}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors border-2 ${
                      isSelected 
                        ? 'text-white' 
                        : 'text-gray-300 bg-gray-700 border-gray-600 hover:border-gray-500'
                    }`}
                    style={isSelected ? { 
                      backgroundColor: color, 
                      borderColor: color,
                    } : undefined}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              placeholder="Optional details about this relationship..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Strength: {formData.strength}/5
            </label>
            {/* Show sub-value based on strength */}
            <div 
              className="text-sm font-medium mb-2 px-2 py-1 rounded inline-block"
              style={{ 
                backgroundColor: getRelationshipColor(formData.type, formData.strength) + '40',
                color: getRelationshipColor(formData.type, formData.strength),
              }}
            >
              {getRelationshipSubValue(
                formData.type, 
                formData.strength, 
                formData.fromEntityType, 
                formData.toEntityType
              )}
            </div>
            <input
              type="range"
              name="strength"
              min="1"
              max="5"
              value={formData.strength}
              onChange={handleChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Weak</span>
              <span>Strong</span>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              {relationship ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>

          {relationship && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            >
              Delete Relationship
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
