import { render, screen, fireEvent } from '@testing-library/react'
import CharacterViewer from '@/components/CharacterViewer'
import { Character, Organisation } from '@/types'

describe('CharacterViewer Component', () => {
  const mockOnClose = jest.fn()
  
  const mockCharacter: Character = {
    id: 'char-1',
    name: 'Test Character',
    title: 'The Brave',
    description: 'A brave warrior who fights for justice.',
    faction: 'The Crown',
    location: 'Capital City',
    status: 'alive',
    tags: 'warrior, hero',
    imageUrl: 'https://example.com/image.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
    organisations: [{ id: 'org-1', name: 'Knights Guild' }] as Organisation[],
  }

  const mockOrganisations: Organisation[] = [
    { id: 'org-1', name: 'Knights Guild', createdAt: new Date(), updatedAt: new Date() },
    { id: 'org-2', name: 'Mages Circle', createdAt: new Date(), updatedAt: new Date() },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render character name', () => {
    render(
      <CharacterViewer
        character={mockCharacter}
        organisations={mockOrganisations}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText('Test Character')).toBeInTheDocument()
  })

  it('should render character title when present', () => {
    render(
      <CharacterViewer
        character={mockCharacter}
        organisations={mockOrganisations}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText('The Brave')).toBeInTheDocument()
  })

  it('should render character description', () => {
    render(
      <CharacterViewer
        character={mockCharacter}
        organisations={mockOrganisations}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText('A brave warrior who fights for justice.')).toBeInTheDocument()
  })

  it('should render faction when present', () => {
    render(
      <CharacterViewer
        character={mockCharacter}
        organisations={mockOrganisations}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText('The Crown')).toBeInTheDocument()
  })

  it('should render location when present', () => {
    render(
      <CharacterViewer
        character={mockCharacter}
        organisations={mockOrganisations}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText('Capital City')).toBeInTheDocument()
  })

  it('should render status', () => {
    render(
      <CharacterViewer
        character={mockCharacter}
        organisations={mockOrganisations}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText('ALIVE')).toBeInTheDocument()
  })

  it('should render organisation when character belongs to one', () => {
    render(
      <CharacterViewer
        character={mockCharacter}
        organisations={mockOrganisations}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText('Knights Guild')).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', () => {
    render(
      <CharacterViewer
        character={mockCharacter}
        organisations={mockOrganisations}
        onClose={mockOnClose}
      />
    )
    
    // Click the X button
    const closeButtons = screen.getAllByRole('button')
    const xButton = closeButtons.find(btn => btn.textContent === '✕')
    if (xButton) fireEvent.click(xButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should call onClose when Close button is clicked', () => {
    render(
      <CharacterViewer
        character={mockCharacter}
        organisations={mockOrganisations}
        onClose={mockOnClose}
      />
    )
    
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should call onClose when clicking backdrop', () => {
    render(
      <CharacterViewer
        character={mockCharacter}
        organisations={mockOrganisations}
        onClose={mockOnClose}
      />
    )
    
    // Click the backdrop (the outer div)
    const backdrop = screen.getByText('👤 Character Details').closest('.fixed')
    if (backdrop) fireEvent.click(backdrop)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should render tags when present', () => {
    render(
      <CharacterViewer
        character={mockCharacter}
        organisations={mockOrganisations}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText('warrior')).toBeInTheDocument()
    expect(screen.getByText('hero')).toBeInTheDocument()
  })

  it('should not render optional fields when not present', () => {
    const minimalCharacter: Character = {
      id: 'char-2',
      name: 'Minimal Character',
      status: 'alive',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    render(
      <CharacterViewer
        character={minimalCharacter}
        organisations={[]}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText('Minimal Character')).toBeInTheDocument()
    // These labels should not be present since there's no data
    expect(screen.queryByText('Title')).not.toBeInTheDocument()
    expect(screen.queryByText('Description')).not.toBeInTheDocument()
    expect(screen.queryByText('Faction')).not.toBeInTheDocument()
    expect(screen.queryByText('Location')).not.toBeInTheDocument()
  })
})
