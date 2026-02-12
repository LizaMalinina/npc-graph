'use client'

import { Organisation } from '@/types'

interface DetectiveLegendProps {
  onClose?: () => void
  organisations?: Organisation[]
  isMobile?: boolean
}

export default function DetectiveLegend({ onClose, organisations = [], isMobile = false }: DetectiveLegendProps) {
  // Filter to only orgs with pin colors and sort alphabetically
  const orgsWithColors = organisations
    .filter(org => org.pinColor)
    .sort((a, b) => a.name.localeCompare(b.name))
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={onClose}>
      <div className="bg-[#1a2f27] rounded-lg p-6 max-w-md max-h-[80vh] overflow-y-auto border border-[#3d5a4e] shadow-xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center mb-5 pb-3 border-b-2 border-[#3d5a4e]">
          <h3 className="text-xl font-bold text-[#b8860b]">📋 Legend</h3>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
          )}
        </div>
        
        {/* Organization pin colors */}
        <div className="mb-5">
          <h4 className="text-base font-bold text-[#a7f3d0] mb-3 uppercase tracking-wide">
            📌 Pin Colors
          </h4>
          <div className="flex flex-col gap-2 pl-2 bg-black/20 rounded-lg p-3 max-h-48 overflow-y-auto">
            {orgsWithColors.length > 0 ? (
              orgsWithColors.map(org => (
                <div key={org.id} className="flex items-center gap-3">
                  <div 
                    className="w-5 h-5 rounded-full border-2 border-white/40 shadow-md" 
                    style={{ backgroundColor: org.pinColor || '#9ca3af' }} 
                  />
                  <span className="text-gray-200 text-sm">🏛️ {org.name}</span>
                </div>
              ))
            ) : (
              <span className="text-gray-400 text-sm italic">No organisations yet</span>
            )}
            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-600">
              <div 
                className="w-5 h-5 rounded-full border-2 border-white/40 shadow-md" 
                style={{ backgroundColor: '#9ca3af' }} 
              />
              <span className="text-gray-400 text-sm">No organisation / Unknown</span>
            </div>
          </div>
        </div>

        {/* Status indicators */}
        <div className="mb-5">
          <h4 className="text-base font-bold text-[#a7f3d0] mb-3 uppercase tracking-wide">
            🎭 Status Indicators
          </h4>
          <div className="flex flex-col gap-2 pl-2 bg-black/20 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <span className="text-red-500 font-bold text-xl w-5 text-center">✕</span>
              <span className="text-gray-200 text-sm">Deceased</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-yellow-400 font-bold text-xl w-5 text-center">?</span>
              <span className="text-gray-200 text-sm">Unknown status</span>
            </div>
          </div>
        </div>

        {/* Interaction hints */}
        <div>
          <h4 className="text-base font-bold text-[#a7f3d0] mb-3 uppercase tracking-wide">
            💡 Tips
          </h4>
          <div className="bg-black/20 rounded-lg p-3">
            <ul className="text-gray-200 text-sm space-y-2">
              {isMobile ? (
                <>
                  <li>Drag photos to rearrange</li>
                  <li>Tap photo to see details</li>
                  <li>Long-press to multi-select</li>
                  <li>Drag background to pan</li>
                  <li>Pinch to zoom in/out</li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-2">
                    <span className="w-5 text-center">🖱️</span>
                    <span>Drag photos to rearrange</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 text-center">👆</span>
                    <span>Click photo to see details</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 text-center">⌨️</span>
                    <span>Ctrl+click to multi-select</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 text-center">🔍</span>
                    <span>Drag background to pan</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 text-center">🔄</span>
                    <span>Scroll to zoom in/out</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
