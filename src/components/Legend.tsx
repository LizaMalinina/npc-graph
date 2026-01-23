'use client'

import { RELATIONSHIP_COLORS } from '@/types'

export default function Legend() {
  return (
    <div className="bg-gray-800 rounded-lg p-4 text-white">
      <h3 className="font-semibold mb-3">Legend</h3>
      
      <div className="space-y-4">
        {/* Node Status */}
        <div>
          <p className="text-sm text-gray-400 mb-2">NPC Status</p>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs">Alive</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-500" />
              <span className="text-xs">Dead</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-slate-400" />
              <span className="text-xs">Unknown</span>
            </div>
          </div>
        </div>

        {/* Relationship Types */}
        <div>
          <p className="text-sm text-gray-400 mb-2">Relationships</p>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(RELATIONSHIP_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div
                  className="w-4 h-1 rounded"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
