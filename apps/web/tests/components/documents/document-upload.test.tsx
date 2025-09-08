import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DocumentUpload, { DocumentUploadFile } from '@/components/documents/document-upload'

// Mock file for testing
const createMockFile = (name: string, size: number, type: string) => {
  const file = new File([''], name, { type })
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false,
  })
  return file
}

describe('DocumentUpload', () => {
  const mockOnUploadComplete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders upload area correctly', () => {
    render(<DocumentUpload onUploadComplete={mockOnUploadComplete} />)
    
    expect(screen.getByText('Upload Your Documents')).toBeInTheDocument()
    expect(screen.getByText('Drag and drop files here, or click to select files')).toBeInTheDocument()
    expect(screen.getByText('Supports: .pdf, .xlsx, .xls, .png, .jpg, .jpeg • Max 50MB per file')).toBeInTheDocument()
  })

  it('validates file size correctly', async () => {
    render(<DocumentUpload maxSize={1024} onUploadComplete={mockOnUploadComplete} />)
    
    const largeFile = createMockFile('large.pdf', 2048, 'application/pdf')
    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement
    
    Object.defineProperty(fileInput, 'files', {
      value: [largeFile],
      writable: false,
    })
    
    fireEvent.change(fileInput)
    
    await waitFor(() => {
      expect(screen.getByText(/File "large.pdf" is too large/)).toBeInTheDocument()
    })
  })

  it('validates file types correctly', async () => {
    render(<DocumentUpload acceptedTypes={['.pdf']} onUploadComplete={mockOnUploadComplete} />)
    
    const invalidFile = createMockFile('document.txt', 1024, 'text/plain')
    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement
    
    Object.defineProperty(fileInput, 'files', {
      value: [invalidFile],
      writable: false,
    })
    
    fireEvent.change(fileInput)
    
    await waitFor(() => {
      expect(screen.getByText(/File "document.txt" is not a supported format/)).toBeInTheDocument()
    })
  })

  it('categorizes files correctly', async () => {
    render(<DocumentUpload onUploadComplete={mockOnUploadComplete} />)
    
    const taxFile = createMockFile('tax_return_2023.pdf', 1024, 'application/pdf')
    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement
    
    Object.defineProperty(fileInput, 'files', {
      value: [taxFile],
      writable: false,
    })
    
    fireEvent.change(fileInput)
    
    await waitFor(() => {
      expect(screen.getByText('Tax Return')).toBeInTheDocument()
    })
  })

  it('handles file upload simulation', async () => {
    render(<DocumentUpload onUploadComplete={mockOnUploadComplete} />)
    
    const validFile = createMockFile('financial.pdf', 1024, 'application/pdf')
    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement
    
    Object.defineProperty(fileInput, 'files', {
      value: [validFile],
      writable: false,
    })
    
    fireEvent.change(fileInput)
    
    await waitFor(() => {
      expect(screen.getByText('Upload All (1)')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Upload All (1)'))
    
    await waitFor(() => {
      expect(screen.getByText('Uploading... 0%')).toBeInTheDocument()
    }, { timeout: 100 })
    
    await waitFor(() => {
      expect(screen.getByText('1 completed')).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('prevents duplicate file uploads', async () => {
    render(<DocumentUpload onUploadComplete={mockOnUploadComplete} />)
    
    const file1 = createMockFile('document.pdf', 1024, 'application/pdf')
    const file2 = createMockFile('document.pdf', 1024, 'application/pdf')
    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement
    
    // First upload
    Object.defineProperty(fileInput, 'files', {
      value: [file1],
      writable: false,
    })
    fireEvent.change(fileInput)
    
    // Second upload of same file
    Object.defineProperty(fileInput, 'files', {
      value: [file2],
      writable: false,
    })
    fireEvent.change(fileInput)
    
    await waitFor(() => {
      expect(screen.getByText(/File "document.pdf" is already selected/)).toBeInTheDocument()
    })
  })

  it('allows file removal', async () => {
    render(<DocumentUpload onUploadComplete={mockOnUploadComplete} />)
    
    const validFile = createMockFile('document.pdf', 1024, 'application/pdf')
    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement
    
    Object.defineProperty(fileInput, 'files', {
      value: [validFile],
      writable: false,
    })
    
    fireEvent.change(fileInput)
    
    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument()
    })
    
    const removeButton = screen.getByRole('button', { name: /remove/i }) || 
                        screen.getByLabelText(/remove/i) ||
                        document.querySelector('[data-testid="remove-file"]') ||
                        screen.getByText('×').closest('button')
    
    if (removeButton) {
      fireEvent.click(removeButton)
      
      await waitFor(() => {
        expect(screen.queryByText('document.pdf')).not.toBeInTheDocument()
      })
    }
  })

  it('dismisses error messages', async () => {
    render(<DocumentUpload maxSize={1024} onUploadComplete={mockOnUploadComplete} />)
    
    const largeFile = createMockFile('large.pdf', 2048, 'application/pdf')
    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement
    
    Object.defineProperty(fileInput, 'files', {
      value: [largeFile],
      writable: false,
    })
    
    fireEvent.change(fileInput)
    
    await waitFor(() => {
      expect(screen.getByText(/File "large.pdf" is too large/)).toBeInTheDocument()
    })
    
    // Find and click dismiss button
    const errorAlert = screen.getByText(/File "large.pdf" is too large/).closest('[role="alert"]')
    const dismissButton = errorAlert?.querySelector('button')
    
    if (dismissButton) {
      fireEvent.click(dismissButton)
      
      await waitFor(() => {
        expect(screen.queryByText(/File "large.pdf" is too large/)).not.toBeInTheDocument()
      })
    }
  })

  it('calls onUploadComplete with completed files', async () => {
    render(<DocumentUpload onUploadComplete={mockOnUploadComplete} />)
    
    const validFile = createMockFile('document.pdf', 1024, 'application/pdf')
    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement
    
    Object.defineProperty(fileInput, 'files', {
      value: [validFile],
      writable: false,
    })
    
    fireEvent.change(fileInput)
    
    await waitFor(() => {
      expect(screen.getByText('Upload All (1)')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Upload All (1)'))
    
    await waitFor(() => {
      expect(mockOnUploadComplete).toHaveBeenCalled()
    }, { timeout: 5000 })
    
    const callArgs = mockOnUploadComplete.mock.calls[0][0] as DocumentUploadFile[]
    expect(callArgs).toHaveLength(1)
    expect(callArgs[0].file.name).toBe('document.pdf')
    expect(callArgs[0].uploadStatus).toBe('completed')
  })
})