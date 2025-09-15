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
  private static chartRenderer: ChartJSNodeCanvas | null = null

  private static getChartRenderer(): ChartJSNodeCanvas {
    if (!this.chartRenderer) {
      this.chartRenderer = new ChartJSNodeCanvas({
        width: 800,
        height: 400,
        backgroundColour: 'white'
      })
    }
    return this.chartRenderer
  }

  static async generateChart(chartData: ChartData): Promise<Buffer> {
    const brandColors = ['#b05730', '#9c87f5', '#ded8c4', '#dbd3f0', '#b4552d']

    const enhancedData = {
      ...chartData.data,
      datasets: chartData.data.datasets.map((dataset, index) => ({
        ...dataset,
        backgroundColor: dataset.backgroundColor || (
          chartData.type === 'doughnut' || chartData.type === 'pie'
            ? brandColors
            : brandColors[index % brandColors.length] + '20'
        ),
        borderColor: dataset.borderColor || brandColors[index % brandColors.length],
        borderWidth: dataset.borderWidth || 2
      }))
    }

    const configuration: ChartConfiguration = {
      type: chartData.type,
      data: enhancedData,
      options: {
        responsive: true,
        plugins: {
          title: {
            display: !!chartData.title,
            text: chartData.title,
            font: {
              size: 18,
              weight: 'bold',
              family: 'Inter'
            },
            color: '#3d3929',
            padding: 20
          },
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                size: 12,
                family: 'Inter'
              },
              color: '#3d3929',
              padding: 15,
              usePointStyle: true
            }
          }
        },
        scales: chartData.type === 'doughnut' || chartData.type === 'pie' ? undefined : {
          y: {
            beginAtZero: true,
            grid: {
              color: '#dad9d4',
              lineWidth: 1
            },
            ticks: {
              font: {
                size: 11,
                family: 'Inter'
              },
              color: '#83827d'
            }
          },
          x: {
            grid: {
              color: '#dad9d4',
              lineWidth: 1
            },
            ticks: {
              font: {
                size: 11,
                family: 'Inter'
              },
              color: '#83827d'
            }
          }
        },
        ...chartData.options
      }
    }

    return await this.getChartRenderer().renderToBuffer(configuration)
  }

  static async generateHTML(reportData: PDFReportData): Promise<string> {
    const { title, subtitle, author, date, sections, branding } = reportData

    const primaryColor = branding?.primaryColor || '#c96442'
    const secondaryColor = branding?.secondaryColor || '#e9e6dc'
    const backgroundColor = '#faf9f5'
    const foregroundColor = '#3d3929'
    const mutedColor = '#ede9de'
    const accentColor = '#83827d'

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
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400;1,600&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.65;
      color: ${foregroundColor};
      background: ${backgroundColor};
      font-size: 14px;
      letter-spacing: -0.01em;
    }
    
    .cover-page {
      background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}ee 50%, ${secondaryColor} 100%);
      color: white;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 80px 60px;
      page-break-after: always;
      position: relative;
      overflow: hidden;
    }

    .cover-page::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="1" fill="white" opacity="0.03"/><circle cx="80" cy="40" r="1" fill="white" opacity="0.02"/><circle cx="40" cy="80" r="1" fill="white" opacity="0.03"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
      opacity: 0.1;
    }

    .cover-page * {
      position: relative;
      z-index: 1;
    }

    .logo-placeholder {
      width: 80px;
      height: 80px;
      background: rgba(255, 255, 255, 0.15);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 16px;
      margin-bottom: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 700;
      backdrop-filter: blur(10px);
    }

    .cover-page h1 {
      font-family: 'Crimson Text', serif;
      font-size: 3.5rem;
      font-weight: 600;
      margin-bottom: 24px;
      letter-spacing: -0.02em;
      line-height: 1.1;
    }

    .cover-page .subtitle {
      font-size: 1.4rem;
      font-weight: 300;
      opacity: 0.9;
      margin-bottom: 40px;
      max-width: 600px;
      line-height: 1.4;
    }

    .cover-page .meta {
      font-size: 1rem;
      opacity: 0.8;
      font-weight: 400;
      background: rgba(255, 255, 255, 0.1);
      padding: 16px 32px;
      border-radius: 50px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .document-type {
      position: absolute;
      top: 40px;
      right: 40px;
      background: rgba(255, 255, 255, 0.2);
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      backdrop-filter: blur(10px);
    }
    
    .page-header {
      background: ${backgroundColor};
      border-bottom: 3px solid ${primaryColor};
      padding: 20px 0;
      margin-bottom: 40px;
    }

    .page-header h2 {
      font-size: 1.2rem;
      color: ${primaryColor};
      font-weight: 600;
      text-align: center;
      margin: 0;
    }

    .container {
      max-width: 840px;
      margin: 0 auto;
      padding: 0 50px;
    }

    .section {
      margin-bottom: 60px;
      page-break-inside: avoid;
      position: relative;
    }

    .section::before {
      content: '';
      position: absolute;
      left: -50px;
      top: 0;
      width: 4px;
      height: 100%;
      background: linear-gradient(to bottom, ${primaryColor}, transparent);
      opacity: 0.1;
    }

    .section-title {
      font-family: 'Crimson Text', serif;
      font-size: 2.2rem;
      font-weight: 600;
      color: ${primaryColor};
      margin-bottom: 24px;
      position: relative;
      padding-bottom: 16px;
      letter-spacing: -0.01em;
    }

    .section-title::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 60px;
      height: 3px;
      background: linear-gradient(90deg, ${primaryColor}, ${primaryColor}80);
      border-radius: 2px;
    }

    .section-content {
      font-size: 15px;
      line-height: 1.7;
      color: ${foregroundColor};
      text-align: justify;
      hyphens: auto;
    }

    .section-content p {
      margin-bottom: 16px;
    }

    .section-content p:last-child {
      margin-bottom: 0;
    }
    
    .executive-summary {
      background: linear-gradient(135deg, ${mutedColor}40, ${secondaryColor}20);
      border: 1px solid ${secondaryColor};
      border-left: 6px solid ${primaryColor};
      padding: 40px;
      margin: 40px 0;
      border-radius: 0 12px 12px 0;
      position: relative;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
    }

    .executive-summary::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 60px;
      height: 60px;
      background: ${primaryColor}10;
      border-radius: 0 12px 0 60px;
    }

    .executive-summary h3 {
      color: ${primaryColor};
      margin-bottom: 20px;
      font-size: 1.5rem;
      font-weight: 700;
      font-family: 'Crimson Text', serif;
      position: relative;
      z-index: 1;
    }

    .executive-summary .content {
      font-size: 15px;
      line-height: 1.7;
      color: ${foregroundColor};
      position: relative;
      z-index: 1;
    }
    
    .chart-container {
      text-align: center;
      margin: 50px 0;
      page-break-inside: avoid;
      background: ${backgroundColor};
      padding: 30px;
      border-radius: 16px;
      border: 1px solid ${secondaryColor};
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
    }

    .chart-container img {
      max-width: 100%;
      height: auto;
      border: 2px solid ${secondaryColor};
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      background: white;
    }

    .chart-title {
      font-family: 'Crimson Text', serif;
      font-weight: 600;
      font-size: 1.4rem;
      margin-bottom: 20px;
      color: ${primaryColor};
      letter-spacing: -0.01em;
    }
    
    .table-container {
      margin: 40px 0;
      overflow-x: auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      border: 1px solid ${secondaryColor};
    }

    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 14px;
      background: white;
    }

    th, td {
      padding: 16px 20px;
      text-align: left;
      border-bottom: 1px solid ${secondaryColor};
      vertical-align: middle;
    }

    th {
      background: linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd);
      color: white;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      position: relative;
    }

    th:first-child {
      border-top-left-radius: 12px;
    }

    th:last-child {
      border-top-right-radius: 12px;
    }

    tbody tr {
      transition: background-color 0.2s ease;
    }

    tbody tr:nth-child(even) {
      background: ${mutedColor}30;
    }

    tbody tr:hover {
      background: ${secondaryColor}50;
    }

    tbody tr:last-child td:first-child {
      border-bottom-left-radius: 12px;
    }

    tbody tr:last-child td:last-child {
      border-bottom-right-radius: 12px;
    }

    tbody tr:last-child td {
      border-bottom: none;
    }

    td {
      color: ${foregroundColor};
      line-height: 1.5;
    }

    .table-title {
      font-family: 'Crimson Text', serif;
      font-size: 1.4rem;
      font-weight: 600;
      color: ${primaryColor};
      margin-bottom: 16px;
      text-align: center;
    }
    
    .footer {
      margin-top: 80px;
      padding: 40px;
      background: linear-gradient(135deg, ${mutedColor}60, ${secondaryColor}40);
      border-top: 3px solid ${primaryColor};
      text-align: center;
      font-size: 13px;
      color: ${accentColor};
      border-radius: 16px 16px 0 0;
      position: relative;
    }

    .footer::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 4px;
      background: ${primaryColor};
      border-radius: 0 0 4px 4px;
    }

    .footer p {
      margin: 8px 0;
      line-height: 1.6;
    }

    .footer .company-info {
      font-weight: 600;
      color: ${foregroundColor};
      font-size: 14px;
    }

    .footer .generation-info {
      font-style: italic;
      opacity: 0.8;
    }
    
    @page {
      size: A4;
      margin: 20mm 15mm 25mm 15mm;
      @top-center {
        content: element(page-header);
        margin-bottom: 10mm;
      }
      @bottom-center {
        content: "Page " counter(page) " of " counter(pages);
        font-family: 'Inter', sans-serif;
        font-size: 10px;
        color: ${accentColor};
        margin-top: 10mm;
      }
    }

    @page:first {
      margin: 0;
      @top-center {
        content: none;
      }
      @bottom-center {
        content: none;
      }
    }

    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }

      body {
        font-size: 12px;
        line-height: 1.6;
      }

      .cover-page {
        page-break-after: always;
        height: 100vh;
      }

      .section {
        page-break-inside: avoid;
        orphans: 3;
        widows: 3;
      }

      .section-title {
        page-break-after: avoid;
        orphans: 3;
      }

      .chart-container {
        page-break-inside: avoid;
        orphans: 2;
        widows: 2;
      }

      .table-container {
        page-break-inside: avoid;
      }

      .executive-summary {
        page-break-inside: avoid;
        orphans: 3;
        widows: 3;
      }

      .footer {
        page-break-inside: avoid;
      }

      h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid;
        orphans: 3;
        widows: 3;
      }
    }
  </style>
</head>
<body>
  <div class="cover-page">
    <div class="document-type">Business Report</div>
    <div class="logo-placeholder">
      ${branding?.logoUrl ? `<img src="${branding.logoUrl}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain;" />` : 'LOGO'}
    </div>
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

  <div class="page-header" style="display: none;">
    <h2>${title}</h2>
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
              <div class="content">${section.content || ''}</div>
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
              <div class="table-container">
                ${section.title ? `<div class="table-title">${section.title}</div>` : ''}
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
    <p class="generation-info">This report was generated using advanced analytics and AI-powered insights.</p>
    <p class="company-info">© ${new Date().getFullYear()} Professional Business Analytics Platform</p>
    <p style="margin-top: 16px; font-size: 11px; opacity: 0.7;">
      Generated on ${date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })} at ${date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })}
    </p>
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
    
    // Return the API route URL for serving the file
    return `/api/reports/files/${filename}`
  }
}