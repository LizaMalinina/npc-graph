'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// All images use portrait aspect ratio (3:4)
export type AspectRatio = 'portrait'

export interface CropSettings {
  zoom: number
  offsetX: number
  offsetY: number
  aspectRatio?: AspectRatio
}

interface ImageCropperProps {
  imageUrl: string
  onChange: (settings: CropSettings) => void
  onCancel: () => void
  initialCropSettings?: CropSettings
}

const DEFAULT_CROP_SETTINGS: CropSettings = {
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  aspectRatio: 'portrait',
}

const MIN_ZOOM = 0.5
const MAX_ZOOM = 4

// Portrait crop area (3:4 aspect ratio)
const CROP_DIMENSIONS = { width: 75, height: 100 }

export default function ImageCropper({
  imageUrl,
  onChange,
  onCancel,
  initialCropSettings,
}: ImageCropperProps) {
  const [zoom, setZoom] = useState(initialCropSettings?.zoom ?? DEFAULT_CROP_SETTINGS.zoom)
  const [offset, setOffset] = useState({
    x: initialCropSettings?.offsetX ?? DEFAULT_CROP_SETTINGS.offsetX,
    y: initialCropSettings?.offsetY ?? DEFAULT_CROP_SETTINGS.offsetY,
  })
  // Always portrait - no user selection
  const aspectRatio: AspectRatio = 'portrait'
  
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const lastPinchDistance = useRef<number | null>(null)
  const lastOffset = useRef({ x: 0, y: 0 })
  
  // Clamp offset to reasonable bounds (allow generous movement for positioning)
  const clampOffset = useCallback((newOffset: { x: number; y: number }) => {
    // Allow up to 40% movement in any direction
    const maxOffset = 40
    return {
      x: Math.max(-maxOffset, Math.min(maxOffset, newOffset.x)),
      y: Math.max(-maxOffset, Math.min(maxOffset, newOffset.y)),
    }
  }, [])

  // Mouse handlers for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY }
    lastOffset.current = { ...offset }
  }, [offset])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return
    
    const containerRect = containerRef.current.getBoundingClientRect()
    const dx = ((e.clientX - dragStart.current.x) / containerRect.width) * 100
    const dy = ((e.clientY - dragStart.current.y) / containerRect.height) * 100
    
    const newOffset = {
      x: lastOffset.current.x + dx,
      y: lastOffset.current.y + dy,
    }
    
    setOffset(clampOffset(newOffset))
  }, [clampOffset])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
  }, [])

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch gesture
      const distance = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      )
      lastPinchDistance.current = distance
    } else if (e.touches.length === 1) {
      // Drag gesture
      isDragging.current = true
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      lastOffset.current = { ...offset }
    }
  }, [offset])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDistance.current !== null) {
      // Pinch to zoom
      e.preventDefault()
      const distance = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      )
      const scale = distance / lastPinchDistance.current
      lastPinchDistance.current = distance
      
      setZoom(prev => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev * scale)))
    } else if (e.touches.length === 1 && isDragging.current && containerRef.current) {
      // Pan
      const containerRect = containerRef.current.getBoundingClientRect()
      const dx = ((e.touches[0].clientX - dragStart.current.x) / containerRect.width) * 100
      const dy = ((e.touches[0].clientY - dragStart.current.y) / containerRect.height) * 100
      
      const newOffset = {
        x: lastOffset.current.x + dx,
        y: lastOffset.current.y + dy,
      }
      
      setOffset(clampOffset(newOffset))
    }
  }, [clampOffset])

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false
    lastPinchDistance.current = null
  }, [])

  // Handle zoom slider change
  const handleZoomChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseFloat(e.target.value)
    setZoom(newZoom)
    // Re-clamp offset when zoom changes
    setOffset(prev => clampOffset(prev))
  }, [clampOffset])

  // Confirm and send settings
  const handleConfirm = useCallback(() => {
    onChange({
      zoom,
      offsetX: offset.x,
      offsetY: offset.y,
      aspectRatio,
    })
  }, [onChange, zoom, offset, aspectRatio])

  // Global mouse up handler
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDragging.current = false
    }
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[300]" onClick={onCancel}>
      <div 
        className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white mb-4">Adjust Image</h3>
        
        {/* Image preview with crop area - portrait aspect ratio (3:4) */}
        <div className="relative mb-4">
          <div 
            ref={containerRef}
            data-testid="image-container"
            className="relative w-full aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden cursor-move touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Image */}
            <img
              src={imageUrl}
              alt="Crop preview"
              className="absolute w-full h-full object-cover pointer-events-none select-none"
              style={{
                transform: `scale(${zoom}) translate(${offset.x / zoom}%, ${offset.y / zoom}%)`,
                transformOrigin: 'center',
              }}
              draggable={false}
            />
            
            {/* Portrait crop overlay - always visible */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Semi-transparent overlay */}
              <div className="absolute inset-0 bg-black/40" />
              {/* Visible crop area (portrait 3:4) */}
              <div 
                data-testid="crop-area"
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-transparent"
                style={{
                  width: `${CROP_DIMENSIONS.width}%`,
                  height: `${CROP_DIMENSIONS.height}%`,
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
                  border: '2px solid white',
                  borderRadius: '4px',
                }}
              />
            </div>
            
            {/* Drag hint */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              Drag to move
            </div>
          </div>
        </div>
        
        {/* Zoom slider */}
        <div className="mb-6">
          <label htmlFor="zoom-slider" className="block text-sm font-medium text-gray-300 mb-2">
            Zoom: {zoom.toFixed(1)}x
          </label>
          <input
            id="zoom-slider"
            aria-label="Zoom"
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step="0.1"
            value={zoom}
            onChange={handleZoomChange}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
        
        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
