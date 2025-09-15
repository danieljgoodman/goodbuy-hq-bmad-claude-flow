import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    // Security check - only allow PDF files and prevent directory traversal
    if (!filename.endsWith('.pdf') || filename.includes('..') || filename.includes('/')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    const filePath = path.join(process.cwd(), 'public', 'uploads', 'reports', filename)

    try {
      // Check if file exists
      await fs.access(filePath)

      // Read the file
      const fileBuffer = await fs.readFile(filePath)

      // Return the PDF file with appropriate headers
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'Content-Length': fileBuffer.length.toString()
        }
      })
    } catch (fileError) {
      console.error('File access error:', fileError)
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Error serving PDF file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}