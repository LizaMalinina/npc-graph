'use client'

import { RELATIONSHIP_COLORS } from '@/types'

export default function DetectiveLegend() {
  return (
    <div className="detective-legend">
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
              <div className="pin-sample" style={{ backgroundColor: '#6366f1' }} />
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
            <li>👆 Tap photo to see details</li>
            <li>🔍 Tap background to deselect</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
