import { PrismaClient } from '@prisma/client'
import { WidgetConfiguration, DashboardWidget } from '@/types'

export class WidgetConfigurationRepository {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async createWidgetConfiguration(
    data: Omit<WidgetConfiguration, 'id' | 'updatedAt'>
  ): Promise<WidgetConfiguration> {
    const result = await this.prisma.widgetConfiguration.create({
      data: {
        userId: data.userId,
        dashboardId: data.dashboard_id,
        widgets: data.widgets,
        layout: data.layout,
        isDefault: data.is_default,
        sharedWith: data.shared_with
      }
    })

    return this.mapToWidgetConfiguration(result)
  }

  async getWidgetConfigurationsByUserId(userId: string): Promise<WidgetConfiguration[]> {
    const results = await this.prisma.widgetConfiguration.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    })

    return results.map(this.mapToWidgetConfiguration)
  }

  async getWidgetConfiguration(userId: string, dashboardId: string): Promise<WidgetConfiguration | null> {
    const result = await this.prisma.widgetConfiguration.findUnique({
      where: {
        userId_dashboardId: {
          userId,
          dashboardId
        }
      }
    })

    return result ? this.mapToWidgetConfiguration(result) : null
  }

  async getDefaultWidgetConfiguration(userId: string): Promise<WidgetConfiguration | null> {
    const result = await this.prisma.widgetConfiguration.findFirst({
      where: {
        userId,
        isDefault: true
      }
    })

    return result ? this.mapToWidgetConfiguration(result) : null
  }

  async updateWidgetConfiguration(
    userId: string,
    dashboardId: string,
    updates: Partial<Pick<WidgetConfiguration, 'widgets' | 'layout' | 'is_default' | 'shared_with'>>
  ): Promise<WidgetConfiguration> {
    const result = await this.prisma.widgetConfiguration.update({
      where: {
        userId_dashboardId: {
          userId,
          dashboardId
        }
      },
      data: {
        ...(updates.widgets && { widgets: updates.widgets }),
        ...(updates.layout && { layout: updates.layout }),
        ...(updates.is_default !== undefined && { isDefault: updates.is_default }),
        ...(updates.shared_with && { sharedWith: updates.shared_with })
      }
    })

    return this.mapToWidgetConfiguration(result)
  }

  async deleteWidgetConfiguration(userId: string, dashboardId: string): Promise<void> {
    await this.prisma.widgetConfiguration.delete({
      where: {
        userId_dashboardId: {
          userId,
          dashboardId
        }
      }
    })
  }

  async setDefaultConfiguration(userId: string, dashboardId: string): Promise<WidgetConfiguration> {
    // First, unset any existing default
    await this.prisma.widgetConfiguration.updateMany({
      where: {
        userId,
        isDefault: true
      },
      data: {
        isDefault: false
      }
    })

    // Then set the new default
    const result = await this.prisma.widgetConfiguration.update({
      where: {
        userId_dashboardId: {
          userId,
          dashboardId
        }
      },
      data: {
        isDefault: true
      }
    })

    return this.mapToWidgetConfiguration(result)
  }

  async addWidget(
    userId: string,
    dashboardId: string,
    widget: DashboardWidget
  ): Promise<WidgetConfiguration> {
    const existing = await this.getWidgetConfiguration(userId, dashboardId)
    
    if (!existing) {
      throw new Error('Dashboard configuration not found')
    }

    const updatedWidgets = [...existing.widgets, widget]

    return this.updateWidgetConfiguration(userId, dashboardId, {
      widgets: updatedWidgets
    })
  }

  async removeWidget(
    userId: string,
    dashboardId: string,
    widgetId: string
  ): Promise<WidgetConfiguration> {
    const existing = await this.getWidgetConfiguration(userId, dashboardId)
    
    if (!existing) {
      throw new Error('Dashboard configuration not found')
    }

    const updatedWidgets = existing.widgets.filter(w => w.id !== widgetId)

    return this.updateWidgetConfiguration(userId, dashboardId, {
      widgets: updatedWidgets
    })
  }

  async updateWidget(
    userId: string,
    dashboardId: string,
    widgetId: string,
    updates: Partial<DashboardWidget>
  ): Promise<WidgetConfiguration> {
    const existing = await this.getWidgetConfiguration(userId, dashboardId)
    
    if (!existing) {
      throw new Error('Dashboard configuration not found')
    }

    const updatedWidgets = existing.widgets.map(w => 
      w.id === widgetId ? { ...w, ...updates } : w
    )

    return this.updateWidgetConfiguration(userId, dashboardId, {
      widgets: updatedWidgets
    })
  }

  async getSharedConfigurations(userId: string): Promise<WidgetConfiguration[]> {
    const results = await this.prisma.widgetConfiguration.findMany({
      where: {
        sharedWith: {
          has: userId
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return results.map(this.mapToWidgetConfiguration)
  }

  private mapToWidgetConfiguration(data: any): WidgetConfiguration {
    return {
      id: data.id,
      userId: data.userId,
      dashboard_id: data.dashboardId,
      widgets: data.widgets,
      layout: data.layout,
      is_default: data.isDefault,
      shared_with: data.sharedWith,
      updatedAt: data.updatedAt
    }
  }
}