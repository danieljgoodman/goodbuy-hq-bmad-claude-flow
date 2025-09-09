export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export class EmailService {
  /**
   * Send notification email
   */
  static async sendNotificationEmail(
    toEmail: string,
    subject: string,
    message: string,
    actionUrl?: string
  ): Promise<{ success: boolean; messageId?: string }> {
    try {
      // In production, would integrate with SendGrid, AWS SES, or similar
      // For now, we'll simulate the email sending
      
      const emailTemplate = this.generateNotificationEmailTemplate(
        subject,
        message,
        actionUrl
      )

      // Mock email sending - in production would call actual email service
      console.log('Sending email to:', toEmail)
      console.log('Subject:', emailTemplate.subject)
      console.log('Template:', emailTemplate.html.substring(0, 200) + '...')

      // Simulate email delivery delay
      await new Promise(resolve => setTimeout(resolve, 100))

      return {
        success: true,
        messageId: `mock_email_${Date.now()}`
      }
    } catch (error) {
      console.error('Error sending notification email:', error)
      return { success: false }
    }
  }

  /**
   * Send opportunity alert email
   */
  static async sendOpportunityAlert(
    toEmail: string,
    opportunityTitle: string,
    opportunityDescription: string,
    priority: string,
    actionUrl: string
  ): Promise<{ success: boolean; messageId?: string }> {
    try {
      const template = this.generateOpportunityEmailTemplate(
        opportunityTitle,
        opportunityDescription,
        priority,
        actionUrl
      )

      // Mock sending - in production would use actual email service
      console.log('Sending opportunity alert to:', toEmail)
      
      return {
        success: true,
        messageId: `opportunity_email_${Date.now()}`
      }
    } catch (error) {
      console.error('Error sending opportunity alert:', error)
      return { success: false }
    }
  }

  /**
   * Send reminder email
   */
  static async sendReminderEmail(
    toEmail: string,
    reminderTitle: string,
    reminderDetails: string,
    actionUrl: string
  ): Promise<{ success: boolean; messageId?: string }> {
    try {
      const template = this.generateReminderEmailTemplate(
        reminderTitle,
        reminderDetails,
        actionUrl
      )

      // Mock sending - in production would use actual email service
      console.log('Sending reminder to:', toEmail)
      
      return {
        success: true,
        messageId: `reminder_email_${Date.now()}`
      }
    } catch (error) {
      console.error('Error sending reminder email:', error)
      return { success: false }
    }
  }

  /**
   * Generate notification email template
   */
  private static generateNotificationEmailTemplate(
    subject: string,
    message: string,
    actionUrl?: string
  ): EmailTemplate {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      padding: 30px 20px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background: white;
      padding: 30px 20px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .footer {
      background: #f8fafc;
      padding: 20px;
      border: 1px solid #e5e7eb;
      border-top: none;
      border-radius: 0 0 8px 8px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
    }
    .button {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 500;
    }
    .button:hover {
      background: #2563eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 Business Intelligence Update</h1>
  </div>
  <div class="content">
    <h2>${subject}</h2>
    <p>${message}</p>
    ${actionUrl ? `
      <p>
        <a href="${actionUrl}" class="button">Take Action</a>
      </p>
    ` : ''}
  </div>
  <div class="footer">
    <p>This email was sent from your Business Analytics Platform.</p>
    <p>To manage your notification preferences, <a href="/settings/notifications">click here</a>.</p>
  </div>
</body>
</html>
    `.trim()

    const text = `
${subject}

${message}

${actionUrl ? `Take action: ${actionUrl}` : ''}

This email was sent from your Business Analytics Platform.
To manage your notification preferences, visit your settings.
    `.trim()

    return { subject, html, text }
  }

  /**
   * Generate opportunity alert email template
   */
  private static generateOpportunityEmailTemplate(
    title: string,
    description: string,
    priority: string,
    actionUrl: string
  ): EmailTemplate {
    const priorityEmoji = {
      urgent: '🚨',
      high: '⚡',
      medium: '💡',
      low: '💭'
    }[priority] || '💡'

    const subject = `${priorityEmoji} New Business Opportunity Detected: ${title}`

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 30px 20px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .priority-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .urgent { background: #ef4444; }
    .high { background: #f59e0b; }
    .medium { background: #3b82f6; }
    .low { background: #6b7280; }
    .content {
      background: white;
      padding: 30px 20px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .button {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="priority-badge ${priority}">${priority.toUpperCase()} PRIORITY</div>
    <h1>${priorityEmoji} Opportunity Detected</h1>
  </div>
  <div class="content">
    <h2>${title}</h2>
    <p>${description}</p>
    <p>Our AI analysis has identified this as a ${priority} priority opportunity for your business improvement initiatives.</p>
    <p>
      <a href="${actionUrl}" class="button">View Opportunity Details</a>
    </p>
  </div>
</body>
</html>
    `.trim()

    const text = `
${subject}

${title}
Priority: ${priority.toUpperCase()}

${description}

Our AI analysis has identified this as a ${priority} priority opportunity for your business improvement initiatives.

View details: ${actionUrl}
    `.trim()

    return { subject, html, text }
  }

  /**
   * Generate reminder email template
   */
  private static generateReminderEmailTemplate(
    title: string,
    details: string,
    actionUrl: string
  ): EmailTemplate {
    const subject = `⏰ Reminder: ${title}`

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 30px 20px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background: white;
      padding: 30px 20px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .button {
      display: inline-block;
      background: #f59e0b;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>⏰ Friendly Reminder</h1>
  </div>
  <div class="content">
    <h2>${title}</h2>
    <p>${details}</p>
    <p>Don't let your momentum slow down! Continuing your improvement initiatives will help maximize your business value.</p>
    <p>
      <a href="${actionUrl}" class="button">Continue Progress</a>
    </p>
  </div>
</body>
</html>
    `.trim()

    const text = `
${subject}

${title}

${details}

Don't let your momentum slow down! Continuing your improvement initiatives will help maximize your business value.

Continue progress: ${actionUrl}
    `.trim()

    return { subject, html, text }
  }

  /**
   * Send welcome email for new premium subscribers
   */
  static async sendWelcomeEmail(
    toEmail: string,
    userName: string
  ): Promise<{ success: boolean; messageId?: string }> {
    try {
      const subject = '🎉 Welcome to Premium Business Intelligence!'
      
      const message = `Welcome ${userName}! Your premium subscription is now active and you have access to advanced analytics, AI insights, and professional reports.`
      
      const template = this.generateNotificationEmailTemplate(
        subject,
        message,
        '/analytics'
      )

      // Mock sending
      console.log('Sending welcome email to:', toEmail)
      
      return {
        success: true,
        messageId: `welcome_email_${Date.now()}`
      }
    } catch (error) {
      console.error('Error sending welcome email:', error)
      return { success: false }
    }
  }
}