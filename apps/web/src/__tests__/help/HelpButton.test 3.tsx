import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HelpButton } from '../../components/help/interactive/HelpButton'

// Mock the icon components
vi.mock('lucide-react', () => ({
  HelpCircle: () => <div data-testid="help-circle-icon" />,
  Search: () => <div data-testid="search-icon" />,
  BookOpen: () => <div data-testid="book-open-icon" />,
  PlayCircle: () => <div data-testid="play-circle-icon" />,
  MessageCircle: () => <div data-testid="message-circle-icon" />,
  ExternalLink: () => <div data-testid="external-link-icon" />,
  Star: () => <div data-testid="star-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Zap: () => <div data-testid="zap-icon" />
}))

describe('HelpButton', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rendering', () => {
    it('should render help button with default props', () => {
      render(<HelpButton />)
      
      const helpButton = screen.getByRole('button')
      expect(helpButton).toBeInTheDocument()
      expect(screen.getByTestId('help-circle-icon')).toBeInTheDocument()
    })

    it('should apply correct size classes', () => {
      const { rerender } = render(<HelpButton size="sm" />)
      let helpButton = screen.getByRole('button')
      expect(helpButton).toHaveClass('h-8', 'w-8')

      rerender(<HelpButton size="lg" />)
      helpButton = screen.getByRole('button')
      expect(helpButton).toHaveClass('h-12', 'w-12')
    })

    it('should apply correct position classes', () => {
      const { rerender } = render(<HelpButton position="fixed" />)
      let container = screen.getByRole('button').parentElement
      expect(container).toHaveClass('fixed', 'bottom-6', 'right-6', 'z-50')

      rerender(<HelpButton position="relative" />)
      container = screen.getByRole('button').parentElement
      expect(container).toHaveClass('relative')
    })

    it('should apply correct variant styles', () => {
      const { rerender } = render(<HelpButton variant="outline" />)
      let helpButton = screen.getByRole('button')
      expect(helpButton).toHaveAttribute('class', expect.stringContaining('outline'))

      rerender(<HelpButton variant="ghost" />)
      helpButton = screen.getByRole('button')
      expect(helpButton).toHaveAttribute('class', expect.stringContaining('ghost'))
    })
  })

  describe('help panel interaction', () => {
    it('should open help panel when button is clicked', async () => {
      render(<HelpButton />)
      
      const helpButton = screen.getByRole('button')
      await user.click(helpButton)

      expect(screen.getByText('Help Center')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search help articles...')).toBeInTheDocument()
    })

    it('should close help panel when backdrop is clicked (fixed position)', async () => {
      render(<HelpButton position="fixed" />)
      
      const helpButton = screen.getByRole('button')
      await user.click(helpButton)

      expect(screen.getByText('Help Center')).toBeInTheDocument()

      // Click backdrop
      const backdrop = document.querySelector('.bg-black.bg-opacity-25')
      expect(backdrop).toBeInTheDocument()
      
      fireEvent.click(backdrop!)

      await waitFor(() => {
        expect(screen.queryByText('Help Center')).not.toBeInTheDocument()
      })
    })

    it('should display context information when provided', async () => {
      render(<HelpButton context="Business Valuation" />)
      
      const helpButton = screen.getByRole('button')
      await user.click(helpButton)

      expect(screen.getByText('Context:')).toBeInTheDocument()
      expect(screen.getByText('Business Valuation')).toBeInTheDocument()
    })
  })

  describe('tabs functionality', () => {
    beforeEach(async () => {
      render(<HelpButton />)
      const helpButton = screen.getByRole('button')
      await user.click(helpButton)
    })

    it('should have search tab active by default', () => {
      const searchTab = screen.getByRole('tab', { name: /search/i })
      expect(searchTab).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByPlaceholderText('Search help articles...')).toBeInTheDocument()
    })

    it('should switch to tour tab when clicked', async () => {
      const tourTab = screen.getByRole('tab', { name: /tour/i })
      await user.click(tourTab)

      expect(tourTab).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByText('Interactive Tour')).toBeInTheDocument()
      expect(screen.getByText('Start Tour')).toBeInTheDocument()
    })

    it('should switch to support tab when clicked', async () => {
      const supportTab = screen.getByRole('tab', { name: /support/i })
      await user.click(supportTab)

      expect(supportTab).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByText('Need Personal Help?')).toBeInTheDocument()
      expect(screen.getByText('Start Chat')).toBeInTheDocument()
      expect(screen.getByText('Create Ticket')).toBeInTheDocument()
    })
  })

  describe('search functionality', () => {
    beforeEach(async () => {
      render(<HelpButton />)
      const helpButton = screen.getByRole('button')
      await user.click(helpButton)
    })

    it('should load contextual help content on open', async () => {
      await waitFor(() => {
        expect(screen.getByText('Understanding Business Valuation')).toBeInTheDocument()
        expect(screen.getByText('Interpreting Health Scores')).toBeInTheDocument()
        expect(screen.getByText('Implementing AI Recommendations')).toBeInTheDocument()
      })
    })

    it('should filter content when searching', async () => {
      const searchInput = screen.getByPlaceholderText('Search help articles...')
      
      await user.type(searchInput, 'valuation')

      await waitFor(() => {
        expect(screen.getByText('Understanding Business Valuation')).toBeInTheDocument()
        expect(screen.queryByText('Interpreting Health Scores')).not.toBeInTheDocument()
      })
    })

    it('should show loading state during search', async () => {
      const searchInput = screen.getByPlaceholderText('Search help articles...')
      
      await user.type(searchInput, 'test')

      // Loading spinner should appear briefly
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('should display article metadata correctly', async () => {
      await waitFor(() => {
        // Check for difficulty badges
        expect(screen.getByText('beginner')).toBeInTheDocument()
        expect(screen.getByText('intermediate')).toBeInTheDocument()
        expect(screen.getByText('advanced')).toBeInTheDocument()

        // Check for view counts
        expect(screen.getByText('1250 views')).toBeInTheDocument()
        expect(screen.getByText('890 views')).toBeInTheDocument()
        expect(screen.getByText('650 views')).toBeInTheDocument()

        // Check for premium indicator
        expect(screen.getByTestId('star-icon')).toBeInTheDocument()
      })
    })
  })

  describe('tour functionality', () => {
    beforeEach(async () => {
      render(<HelpButton context="Dashboard" />)
      const helpButton = screen.getByRole('button')
      await user.click(helpButton)
      
      const tourTab = screen.getByRole('tab', { name: /tour/i })
      await user.click(tourTab)
    })

    it('should start tour when button is clicked', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      const startTourButton = screen.getByText('Start Tour')
      await user.click(startTourButton)

      expect(consoleSpy).toHaveBeenCalledWith('Starting guided tour for context:', 'Dashboard')
      
      // Panel should close after starting tour
      await waitFor(() => {
        expect(screen.queryByText('Help Center')).not.toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })
  })

  describe('support functionality', () => {
    beforeEach(async () => {
      render(<HelpButton />)
      const helpButton = screen.getByRole('button')
      await user.click(helpButton)
      
      const supportTab = screen.getByRole('tab', { name: /support/i })
      await user.click(supportTab)
    })

    it('should open support chat when button is clicked', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      const startChatButton = screen.getByText('Start Chat')
      await user.click(startChatButton)

      expect(consoleSpy).toHaveBeenCalledWith('Opening support for context:', undefined)

      consoleSpy.mockRestore()
    })

    it('should create ticket when button is clicked', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      const createTicketButton = screen.getByText('Create Ticket')
      await user.click(createTicketButton)

      expect(consoleSpy).toHaveBeenCalledWith('Create ticket')

      consoleSpy.mockRestore()
    })
  })

  describe('quick links', () => {
    beforeEach(async () => {
      render(<HelpButton />)
      const helpButton = screen.getByRole('button')
      await user.click(helpButton)
    })

    it('should open knowledge base when clicked', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      const kbLink = screen.getByText('Knowledge Base')
      await user.click(kbLink)

      expect(consoleSpy).toHaveBeenCalledWith('Open knowledge base')

      consoleSpy.mockRestore()
    })

    it('should open video tutorials when clicked', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      const videoLink = screen.getByText('Video Tutorials')
      await user.click(videoLink)

      expect(consoleSpy).toHaveBeenCalledWith('Open video tutorials')

      consoleSpy.mockRestore()
    })
  })

  describe('article interaction', () => {
    beforeEach(async () => {
      render(<HelpButton />)
      const helpButton = screen.getByRole('button')
      await user.click(helpButton)
    })

    it('should open article when clicked', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      await waitFor(() => {
        const article = screen.getByText('Understanding Business Valuation')
        expect(article).toBeInTheDocument()
      })

      const articleElement = screen.getByText('Understanding Business Valuation').closest('.p-3')
      expect(articleElement).toBeInTheDocument()
      
      await user.click(articleElement!)

      expect(consoleSpy).toHaveBeenCalledWith('Open article:', 'help_1')

      // Panel should close after clicking article
      await waitFor(() => {
        expect(screen.queryByText('Help Center')).not.toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<HelpButton />)
      
      const helpButton = screen.getByRole('button')
      await user.click(helpButton)

      const tabs = screen.getAllByRole('tab')
      expect(tabs).toHaveLength(3)

      const tabpanels = screen.getAllByRole('tabpanel')
      expect(tabpanels).toHaveLength(1) // Only active tab panel is rendered
    })

    it('should support keyboard navigation', async () => {
      render(<HelpButton />)
      
      const helpButton = screen.getByRole('button')
      
      // Focus and activate with keyboard
      helpButton.focus()
      fireEvent.keyDown(helpButton, { key: 'Enter' })

      expect(screen.getByText('Help Center')).toBeInTheDocument()
    })
  })
})