'use client'

import { useState } from 'react'
import { GraphNode, GraphLink, RELATIONSHIP_TYPES } from '@/types'

interface RelationshipFormProps {
  nodes: GraphNode[]
  relationship?: GraphLink | null
  onSubmit: (data: {
    fromNpcId: string
    toNpcId: string
    type: string
    description?: string
    strength: number
  }) => void
  onCancel: () => void
  onDelete?: () => void
}

export default function RelationshipForm({
  nodes,
  relationship,
  onSubmit,
  onCancel,
  onDelete,
}: RelationshipFormProps) {
  const [formData, setFormData] = useState({
    fromNpcId: relationship?.source || '',
    toNpcId: relationship?.target || '',
    type: relationship?.type || 'friend',
    description: relationship?.description || '',
    strength: relationship?.strength || 5,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.fromNpcId === formData.toNpcId) {
      alert('Cannot create a relationship with the same NPC')
      return
    }
    onSubmit(formData)
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

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200]" onClick={onCancel}>
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-4">
          {relationship ? 'Edit Relationship' : 'Create New Relationship'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              From NPC *
            </label>
            <select
              name="fromNpcId"
              value={formData.fromNpcId}
              onChange={handleChange}
              required
              disabled={!!relationship}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Select an NPC</option>
              {nodes.map(node => (
                <option key={node.id} value={node.id}>
                  {node.name} {node.title ? `(${node.title})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              To NPC *
            </label>
            <select
              name="toNpcId"
              value={formData.toNpcId}
              onChange={handleChange}
              required
              disabled={!!relationship}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Select an NPC</option>
              {nodes
                .filter(n => n.id !== formData.fromNpcId)
                .map(node => (
                  <option key={node.id} value={node.id}>
                    {node.name} {node.title ? `(${node.title})` : ''}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Relationship Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {RELATIONSHIP_TYPES.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
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
              Strength: {formData.strength}
            </label>
            <input
              type="range"
              name="strength"
              min="1"
              max="10"
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
