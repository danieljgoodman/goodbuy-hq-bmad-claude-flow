import puppeteer from 'puppeteer'
import { ChartJSNodeCanvas } from 'chartjs-node-canvas'
import { Chart, ChartConfiguration } from 'chart.js/auto'
import fs from 'fs/promises'
import path from 'path'

export interface ChartData {
  type: 'line' | 'bar' | 'doughnut' | 'pie'
  title: string
  data: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      backgroundColor?: string | string[]
      borderColor?: string
      borderWidth?: number
      fill?: boolean
    }[]
  }
  options?: any
}

export interface PDFSection {
  type: 'header' | 'text' | 'chart' | 'table' | 'executive-summary'
  title?: string
  content?: string
  chartData?: ChartData
  tableData?: {
    headers: string[]
    rows: string[][]
  }
}

export interface PDFReportData {
  title: string
  subtitle?: string
  author?: string
  date: Date
  sections: PDFSection[]
  branding?: {
    primaryColor: string
    secondaryColor: string
    logoUrl?: string
  }
}

export class PDFGenerationService {
  private static chartRenderer = new ChartJSNodeCanvas({
    width: 800,
    height: 400,
    backgroundColour: 'white'
  })

  static async generateChart(chartData: ChartData): Promise<Buffer> {
    const configuration: ChartConfiguration = {
      type: chartData.type,
      data: chartData.data,
      options: {
        responsive: true,
        plugins: {
          title: {
            display: !!chartData.title,
            text: chartData.title,
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: chartData.type === 'doughnut' || chartData.type === 'pie' ? undefined : {
          y: {
            beginAtZero: true,
            grid: {
              color: '#e5e7eb'
            }
          },
          x: {
            grid: {
              color: '#e5e7eb'
            }
          }
        },
        ...chartData.options
      }
    }

    return await this.chartRenderer.renderToBuffer(configuration)
  }

  static async generateHTML(reportData: PDFReportData): Promise<string> {
    const { title, subtitle, author, date, sections, branding } = reportData
    
    const primaryColor = branding?.primaryColor || '#3b82f6'
    const secondaryColor = branding?.secondaryColor || '#64748b'

    // Process sections and generate chart images
    const processedSections = await Promise.all(
      sections.map(async (section) => {
        if (section.type === 'chart' && section.chartData) {
          const chartBuffer = await this.generateChart(section.chartData)
          const chartBase64 = chartBuffer.toString('base64')
          return {
            ...section,
            chartImageData: `data:image/png;base64,${chartBase64}`
          }
        }
        return section
      })
    )

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: white;
    }
    
    .header {
      background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
      color: white;
      padding: 60px 40px;
      text-align: center;
      margin-bottom: 40px;
    }
    
    .header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 10px;
    }
    
    .header .subtitle {
      font-size: 1.2rem;
      opacity: 0.9;
      margin-bottom: 20px;
    }
    
    .header .meta {
      font-size: 0.9rem;
      opacity: 0.8;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 0 40px;
    }
    
    .section {
      margin-bottom: 50px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 1.8rem;
      font-weight: 600;
      color: ${primaryColor};
      margin-bottom: 20px;
      border-bottom: 2px solid ${primaryColor};
      padding-bottom: 10px;
    }
    
    .section-content {
      font-size: 1rem;
      line-height: 1.8;
      color: #374151;
    }
    
    .executive-summary {
      background: #f8fafc;
      border-left: 4px solid ${primaryColor};
      padding: 30px;
      margin: 30px 0;
      border-radius: 0 8px 8px 0;
    }
    
    .executive-summary h3 {
      color: ${primaryColor};
      margin-bottom: 15px;
      font-size: 1.3rem;
    }
    
    .chart-container {
      text-align: center;
      margin: 30px 0;
      page-break-inside: avoid;
    }
    
    .chart-container img {
      max-width: 100%;
      height: auto;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .chart-title {
      font-weight: 600;
      margin-bottom: 15px;
      color: ${secondaryColor};
    }
    
    .table-container {
      margin: 30px 0;
      overflow-x: auto;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }
    
    th, td {
      padding: 12px;
      text-align: left;
      border: 1px solid #e5e7eb;
    }
    
    th {
      background: ${primaryColor};
      color: white;
      font-weight: 600;
    }
    
    tbody tr:nth-child(even) {
      background: #f9fafb;
    }
    
    .footer {
      margin-top: 60px;
      padding: 30px;
      background: #f8fafc;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 0.8rem;
      color: #6b7280;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .section {
        page-break-inside: avoid;
      }
      
      .chart-container {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
    <div class="meta">
      ${author ? `Generated by ${author} • ` : ''}${date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}
    </div>
  </div>
  
  <div class="container">
    ${processedSections.map(section => {
      switch (section.type) {
        case 'header':
          return `
            <div class="section">
              <h2 class="section-title">${section.title || 'Section Header'}</h2>
              ${section.content ? `<div class="section-content">${section.content}</div>` : ''}
            </div>
          `
        
        case 'text':
          return `
            <div class="section">
              ${section.title ? `<h2 class="section-title">${section.title}</h2>` : ''}
              <div class="section-content">${section.content || ''}</div>
            </div>
          `
        
        case 'executive-summary':
          return `
            <div class="executive-summary">
              <h3>${section.title || 'Executive Summary'}</h3>
              <div>${section.content || ''}</div>
            </div>
          `
        
        case 'chart':
          return `
            <div class="section">
              <div class="chart-container">
                ${section.title ? `<div class="chart-title">${section.title}</div>` : ''}
                ${(section as any).chartImageData ? 
                  `<img src="${(section as any).chartImageData}" alt="${section.title || 'Chart'}" />` : 
                  '<div>Chart could not be generated</div>'
                }
              </div>
            </div>
          `
        
        case 'table':
          return `
            <div class="section">
              ${section.title ? `<h2 class="section-title">${section.title}</h2>` : ''}
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      ${section.tableData?.headers.map(header => `<th>${header}</th>`).join('') || ''}
                    </tr>
                  </thead>
                  <tbody>
                    ${section.tableData?.rows.map(row => 
                      `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
                    ).join('') || ''}
                  </tbody>
                </table>
              </div>
            </div>
          `
        
        default:
          return ''
      }
    }).join('')}
  </div>
  
  <div class="footer">
    <p>This report was generated using advanced analytics and AI-powered insights.</p>
    <p>© ${new Date().getFullYear()} Professional Business Analytics Platform</p>
  </div>
</body>
</html>
    `.trim()
  }

  static async generatePDF(reportData: PDFReportData): Promise<Buffer> {
    const html = await this.generateHTML(reportData)
    
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    try {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        printBackground: true,
        preferCSSPageSize: true
      })
      
      return pdfBuffer
    } finally {
      await browser.close()
    }
  }

  static async savePDF(pdfBuffer: Buffer, filename: string): Promise<string> {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'reports')
    
    // Ensure directory exists
    try {
      await fs.access(uploadsDir)
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true })
    }
    
    const filepath = path.join(uploadsDir, filename)
    await fs.writeFile(filepath, pdfBuffer)
    
    return `/uploads/reports/${filename}`
  }
}