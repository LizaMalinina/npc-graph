import { render, screen, fireEvent } from '@testing-library/react'
import OrganisationViewer from '@/components/OrganisationViewer'
import { Organisation, GraphNode } from '@/types'

describe('OrganisationViewer Component', () => {
  const mockOnClose = jest.fn()
  const mockOnMemberClick = jest.fn()
  
  const mockOrganisation: Organisation = {
    id: 'org-1',
    name: 'Knights Guild',
    description: 'A guild of honorable knights protecting the realm.',
    pinColor: '#ff0000',
    imageUrl: 'https://example.com/org-image.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockMembers: GraphNode[] = [
    {
      id: 'char-1',
      name: 'Sir Galahad',
      title: 'Knight Commander',
      entityType: 'character',
      imageUrl: 'https://example.com/galahad.jpg',
    },
    {
      id: 'char-2',
      name: 'Lady Morgana',
      title: 'Knight',
      entityType: 'character',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render organisation name', () => {
    render(
      <OrganisationViewer
        organisation={mockOrganisation}
        members={[]}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText('Knights Guild')).toBeInTheDocument()
  })

  it('should render organisation description when present', () => {
    render(
      <OrganisationViewer
        organisation={mockOrganisation}
        members={[]}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText('A guild of honorable knights protecting the realm.')).toBeInTheDocument()
  })

  it('should render pin color when present', () => {
    render(
      <OrganisationViewer
        organisation={mockOrganisation}
        members={[]}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText('#ff0000')).toBeInTheDocument()
  })

  it('should render members list when present', () => {
    render(
      <OrganisationViewer
        organisation={mockOrganisation}
        members={mockMembers}
        onClose={mockOnClose}
        onMemberClick={mockOnMemberClick}
      />
    )
    
    expect(screen.getByText('Sir Galahad')).toBeInTheDocument()
    expect(screen.getByText('Knight Commander')).toBeInTheDocument()
    expect(screen.getByText('Lady Morgana')).toBeInTheDocument()
  })

  it('should show member count in header', () => {
    render(
      <OrganisationViewer
        organisation={mockOrganisation}
        members={mockMembers}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText('Members (2)')).toBeInTheDocument()
  })

  it('should call onMemberClick when member is clicked', () => {
    render(
      <OrganisationViewer
        organisation={mockOrganisation}
        members={mockMembers}
        onClose={mockOnClose}
        onMemberClick={mockOnMemberClick}
      />
    )
    
    fireEvent.click(screen.getByText('Sir Galahad'))
    
    expect(mockOnMemberClick).toHaveBeenCalledWith(mockMembers[0])
  })

  it('should call onClose when close button is clicked', () => {
    render(
      <OrganisationViewer
        organisation={mockOrganisation}
        members={[]}
        onClose={mockOnClose}
      />
    )
    
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should call onClose when clicking backdrop', () => {
    render(
      <OrganisationViewer
        organisation={mockOrganisation}
        members={[]}
        onClose={mockOnClose}
      />
    )
    
    // Click the backdrop (the outer div)
    const backdrop = screen.getByText('🏛️ Organisation Details').closest('.fixed')
    if (backdrop) fireEvent.click(backdrop)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should not show members section when no members', () => {
    render(
      <OrganisationViewer
        organisation={mockOrganisation}
        members={[]}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.queryByText(/Members/)).not.toBeInTheDocument()
  })

  it('should not render optional fields when not present', () => {
    const minimalOrg: Organisation = {
      id: 'org-2',
      name: 'Empty Guild',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    render(
      <OrganisationViewer
        organisation={minimalOrg}
        members={[]}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText('Empty Guild')).toBeInTheDocument()
    expect(screen.queryByText('Description')).not.toBeInTheDocument()
    expect(screen.queryByText('Pin Color')).not.toBeInTheDocument()
  })
})
