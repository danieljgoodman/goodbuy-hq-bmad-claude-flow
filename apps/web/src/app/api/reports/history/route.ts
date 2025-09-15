import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat } from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const reportsDir = path.join(process.cwd(), 'public', 'uploads', 'reports')

    try {
      const files = await readdir(reportsDir)
      const reportHistory = []

      for (const file of files) {
        if (file.endsWith('.pdf')) {
          const filePath = path.join(reportsDir, file)
          const stats = await stat(filePath)

          // Extract metadata from filename (assuming format: report_userId_timestamp.pdf)
          const filenameParts = file.replace('.pdf', '').split('_')
          const userId = filenameParts.length > 1 ? filenameParts[1] : 'unknown'
          const timestamp = filenameParts.length > 2 ? filenameParts[2] : Date.now().toString()

          reportHistory.push({
            id: file.replace('.pdf', ''),
            title: `Report - ${new Date(parseInt(timestamp)).toLocaleDateString()}`,
            reportType: 'professional',
            generatedAt: new Date(stats.mtime).toISOString(),
            fileUrl: `/api/reports/files/${file}`,
            pageCount: Math.floor(Math.random() * 10) + 5, // Placeholder page count
            fileSize: stats.size
          })
        }
      }

      // Sort by creation date (newest first)
      reportHistory.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())

      return NextResponse.json(reportHistory)
    } catch (dirError) {
      // Directory doesn't exist or is empty
      return NextResponse.json([])
    }
  } catch (error) {
    console.error('Error loading report history:', error)
    return NextResponse.json(
      { error: 'Failed to load report history' },
      { status: 500 }
    )
  }
}