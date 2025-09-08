import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import InputMethodChoice from '@/components/onboarding/input-method-choice'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock auth store
jest.mock('@/stores/auth-store', () => ({
  useAuthStore: jest.fn(),
}))

const mockPush = jest.fn()
const mockUpdateProfile = jest.fn()

describe('InputMethodChoice', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: {
        id: 'test-user',
        email: 'test@example.com',
        businessName: 'Test Business',
      },
      updateProfile: mockUpdateProfile,
    })
  })

  it('renders choice selection UI correctly', () => {
    render(<InputMethodChoice />)
    
    expect(screen.getByText('Choose Your Input Method')).toBeInTheDocument()
    expect(screen.getByText('Manual Input')).toBeInTheDocument()
    expect(screen.getByText('Document Upload')).toBeInTheDocument()
  })

  it('shows correct descriptions for each method', () => {
    render(<InputMethodChoice />)
    
    expect(screen.getByText('Enter your business information step-by-step through guided forms')).toBeInTheDocument()
    expect(screen.getByText('Upload your financial documents and let AI extract the information')).toBeInTheDocument()
  })

  it('navigates to manual route when manual option is selected', async () => {
    render(<InputMethodChoice />)
    
    const manualCard = screen.getByText('Manual Input').closest('[role="button"]') || 
                       screen.getByText('Manual Input').closest('.cursor-pointer')
    
    fireEvent.click(manualCard!)
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding/manual')
    })
  })

  it('navigates to document upload route when document option is selected', async () => {
    render(<InputMethodChoice />)
    
    const documentCard = screen.getByText('Document Upload').closest('[role="button"]') || 
                         screen.getByText('Document Upload').closest('.cursor-pointer')
    
    fireEvent.click(documentCard!)
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding/document-upload')
    })
  })

  it('saves user preference when method is selected', async () => {
    render(<InputMethodChoice />)
    
    const manualCard = screen.getByText('Manual Input').closest('[role="button"]') || 
                       screen.getByText('Manual Input').closest('.cursor-pointer')
    
    fireEvent.click(manualCard!)
    
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({ inputMethod: 'manual' })
    })
  })

  it('calls onMethodSelect callback when provided', async () => {
    const mockCallback = jest.fn()
    render(<InputMethodChoice onMethodSelect={mockCallback} />)
    
    const documentCard = screen.getByText('Document Upload').closest('[role="button"]') || 
                         screen.getByText('Document Upload').closest('.cursor-pointer')
    
    fireEvent.click(documentCard!)
    
    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith('document_upload')
    })
  })

  it('shows loading state during preference saving', async () => {
    mockUpdateProfile.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(<InputMethodChoice />)
    
    const manualCard = screen.getByText('Manual Input').closest('[role="button"]') || 
                       screen.getByText('Manual Input').closest('.cursor-pointer')
    
    fireEvent.click(manualCard!)
    
    expect(screen.getByText('Saving preference...')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.queryByText('Saving preference...')).not.toBeInTheDocument()
    })
  })

  it('continues navigation even if preference saving fails', async () => {
    mockUpdateProfile.mockRejectedValue(new Error('Save failed'))
    
    render(<InputMethodChoice />)
    
    const manualCard = screen.getByText('Manual Input').closest('[role="button"]') || 
                       screen.getByText('Manual Input').closest('.cursor-pointer')
    
    fireEvent.click(manualCard!)
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding/manual')
    })
  })

  it('works when no user is logged in', async () => {
    ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: null,
      updateProfile: mockUpdateProfile,
    })
    
    render(<InputMethodChoice />)
    
    const manualCard = screen.getByText('Manual Input').closest('[role="button"]') || 
                       screen.getByText('Manual Input').closest('.cursor-pointer')
    
    fireEvent.click(manualCard!)
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding/manual')
    })
    
    expect(mockUpdateProfile).not.toHaveBeenCalled()
  })
})