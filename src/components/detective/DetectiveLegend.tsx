'use client'

import { RELATIONSHIP_COLORS } from '@/types'

interface DetectiveLegendProps {
  onClose: () => void
}

export default function DetectiveLegend({ onClose }: DetectiveLegendProps) {
  return (
    <div className="detective-legend">
      <div className="legend-header">
        <h3>🏷️ Case Legend</h3>
        <button onClick={onClose} className="close-btn">✕</button>
      </div>

      <div className="legend-content">
        {/* Pin colors */}
        <div className="legend-section">
          <h4>📌 Pin Colors (Status)</h4>
          <div className="legend-items">
            <div className="legend-item">
              <div className="pin-sample" style={{ backgroundColor: '#fbbf24' }} />
              <span>Alive</span>
            </div>
            <div className="legend-item">
              <div className="pin-sample" style={{ backgroundColor: '#dc2626' }} />
              <span>Deceased</span>
            </div>
            <div className="legend-item">
              <div className="pin-sample" style={{ backgroundColor: '#94a3b8' }} />
              <span>Unknown</span>
            </div>
          </div>
        </div>

        {/* String colors */}
        <div className="legend-section">
          <h4>🧵 String Colors (Relationships)</h4>
          <div className="legend-items string-items">
            {Object.entries(RELATIONSHIP_COLORS).map(([type, color]) => (
              <div key={type} className="legend-item">
                <div className="string-sample" style={{ backgroundColor: color }} />
                <span className="capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Interaction hints */}
        <div className="legend-section hints">
          <h4>💡 Tips</h4>
          <ul className="hint-list">
            <li>🖱️ Drag photos to rearrange</li>
            <li>👆 Click photo to see details</li>
            <li>🔍 Click background to deselect</li>
            <li>✨ Hover to reveal names</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
