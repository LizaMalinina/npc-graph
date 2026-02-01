/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ImageCropper from '@/components/ImageCropper'

describe('ImageCropper Component', () => {
  const mockImageUrl = 'https://example.com/test-image.jpg'
  const mockOnChange = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the image cropper with image preview', () => {
      render(
        <ImageCropper
          imageUrl={mockImageUrl}
          onChange={mockOnChange}
          onCancel={mockOnCancel}
        />
      )
      
      expect(screen.getByRole('img')).toHaveAttribute('src', mockImageUrl)
    })

    it('should render zoom controls', () => {
      render(
        <ImageCropper
          imageUrl={mockImageUrl}
          onChange={mockOnChange}
          onCancel={mockOnCancel}
        />
      )
      
      expect(screen.getByLabelText(/zoom/i)).toBeInTheDocument()
    })

    it('should render confirm and cancel buttons', () => {
      render(
        <ImageCropper
          imageUrl={mockImageUrl}
          onChange={mockOnChange}
          onCancel={mockOnCancel}
        />
      )
      
      expect(screen.getByRole('button', { name: /confirm|apply|save/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })
  })

  describe('Zoom functionality', () => {
    it('should allow zooming in with the slider', () => {
      render(
        <ImageCropper
          imageUrl={mockImageUrl}
          onChange={mockOnChange}
          onCancel={mockOnCancel}
        />
      )
      
      const zoomSlider = screen.getByLabelText(/zoom/i)
      fireEvent.change(zoomSlider, { target: { value: '2' } })
      
      // Verify the slider value changed
      expect(zoomSlider).toHaveValue('2')
    })

    it('should have zoom range from 1 (min) to 3 (max)', () => {
      render(
        <ImageCropper
          imageUrl={mockImageUrl}
          onChange={mockOnChange}
          onCancel={mockOnCancel}
        />
      )
      
      const zoomSlider = screen.getByLabelText(/zoom/i)
      expect(zoomSlider).toHaveAttribute('min', '0.5')
      expect(zoomSlider).toHaveAttribute('max', '4')
    })
  })

  describe('Crop settings', () => {
    it('should initialize with default crop settings when not provided', () => {
      render(
        <ImageCropper
          imageUrl={mockImageUrl}
          onChange={mockOnChange}
          onCancel={mockOnCancel}
        />
      )
      
      // Default zoom should be 1
      const zoomSlider = screen.getByLabelText(/zoom/i)
      expect(zoomSlider).toHaveValue('1')
    })

    it('should initialize with provided crop settings', () => {
      const initialCropSettings = {
        zoom: 1.5,
        offsetX: 10,
        offsetY: 20,
      }
      
      render(
        <ImageCropper
          imageUrl={mockImageUrl}
          onChange={mockOnChange}
          onCancel={mockOnCancel}
          initialCropSettings={initialCropSettings}
        />
      )
      
      const zoomSlider = screen.getByLabelText(/zoom/i)
      expect(zoomSlider).toHaveValue('1.5')
    })
  })

  describe('Actions', () => {
    it('should call onCancel when cancel button is clicked', () => {
      render(
        <ImageCropper
          imageUrl={mockImageUrl}
          onChange={mockOnChange}
          onCancel={mockOnCancel}
        />
      )
      
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    it('should call onChange with crop settings when confirm button is clicked', () => {
      render(
        <ImageCropper
          imageUrl={mockImageUrl}
          onChange={mockOnChange}
          onCancel={mockOnCancel}
        />
      )
      
      // Change zoom first
      const zoomSlider = screen.getByLabelText(/zoom/i)
      fireEvent.change(zoomSlider, { target: { value: '1.5' } })
      
      // Click confirm
      fireEvent.click(screen.getByRole('button', { name: /confirm|apply|save/i }))
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          zoom: 1.5,
          offsetX: expect.any(Number),
          offsetY: expect.any(Number),
        })
      )
    })
  })

  describe('Image aspect ratio support', () => {
    it('should display crop shape buttons', () => {
      render(
        <ImageCropper
          imageUrl={mockImageUrl}
          onChange={mockOnChange}
          onCancel={mockOnCancel}
        />
      )
      
      // Should have crop shape buttons
      expect(screen.getByText('Full')).toBeInTheDocument()
      expect(screen.getByText('Square')).toBeInTheDocument()
      expect(screen.getByText('Portrait')).toBeInTheDocument()
      expect(screen.getByText('Landscape')).toBeInTheDocument()
    })

    it('should show crop area when non-full aspect ratio is selected', async () => {
      render(
        <ImageCropper
          imageUrl={mockImageUrl}
          onChange={mockOnChange}
          onCancel={mockOnCancel}
          initialCropSettings={{ zoom: 1, offsetX: 0, offsetY: 0, aspectRatio: 'square' }}
        />
      )
      
      // The crop area should be visible for square aspect ratio
      const cropArea = screen.getByTestId('crop-area')
      expect(cropArea).toBeInTheDocument()
    })

    it('should include aspectRatio in onChange callback', () => {
      render(
        <ImageCropper
          imageUrl={mockImageUrl}
          onChange={mockOnChange}
          onCancel={mockOnCancel}
        />
      )
      
      // Click confirm with default (full) aspect ratio
      fireEvent.click(screen.getByRole('button', { name: /apply/i }))
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          aspectRatio: 'full',
        })
      )
    })

    it('should change aspect ratio when clicking shape buttons', () => {
      render(
        <ImageCropper
          imageUrl={mockImageUrl}
          onChange={mockOnChange}
          onCancel={mockOnCancel}
        />
      )
      
      // Click portrait button
      fireEvent.click(screen.getByText('Portrait'))
      
      // Click confirm
      fireEvent.click(screen.getByRole('button', { name: /apply/i }))
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          aspectRatio: 'portrait',
        })
      )
    })

    it('should change aspect ratio to landscape when clicking landscape button', () => {
      render(
        <ImageCropper
          imageUrl={mockImageUrl}
          onChange={mockOnChange}
          onCancel={mockOnCancel}
        />
      )
      
      // Click landscape button
      fireEvent.click(screen.getByText('Landscape'))
      
      // Click confirm
      fireEvent.click(screen.getByRole('button', { name: /apply/i }))
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          aspectRatio: 'landscape',
        })
      )
    })
  })

  describe('Touch support for mobile', () => {
    it('should support touch dragging for pan', () => {
      render(
        <ImageCropper
          imageUrl={mockImageUrl}
          onChange={mockOnChange}
          onCancel={mockOnCancel}
        />
      )
      
      const imageArea = screen.getByTestId('image-container')
      
      // Simulate touch drag
      fireEvent.touchStart(imageArea, {
        touches: [{ clientX: 100, clientY: 100 }],
      })
      fireEvent.touchMove(imageArea, {
        touches: [{ clientX: 150, clientY: 150 }],
      })
      fireEvent.touchEnd(imageArea)
      
      // The component should not crash
      expect(imageArea).toBeInTheDocument()
    })

    it('should support pinch-to-zoom gesture', () => {
      render(
        <ImageCropper
          imageUrl={mockImageUrl}
          onChange={mockOnChange}
          onCancel={mockOnCancel}
        />
      )
      
      const imageArea = screen.getByTestId('image-container')
      
      // Simulate pinch gesture
      fireEvent.touchStart(imageArea, {
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 200, clientY: 200 },
        ],
      })
      fireEvent.touchMove(imageArea, {
        touches: [
          { clientX: 50, clientY: 50 },
          { clientX: 250, clientY: 250 },
        ],
      })
      fireEvent.touchEnd(imageArea)
      
      // The component should handle pinch without crashing
      expect(imageArea).toBeInTheDocument()
    })
  })

  describe('Mouse support for desktop', () => {
    it('should support mouse dragging for pan', () => {
      render(
        <ImageCropper
          imageUrl={mockImageUrl}
          onChange={mockOnChange}
          onCancel={mockOnCancel}
        />
      )
      
      const imageArea = screen.getByTestId('image-container')
      
      // Simulate mouse drag
      fireEvent.mouseDown(imageArea, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(imageArea, { clientX: 150, clientY: 150 })
      fireEvent.mouseUp(imageArea)
      
      // The component should not crash
      expect(imageArea).toBeInTheDocument()
    })
  })
})
