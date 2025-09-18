import type { BusinessData, Evaluation } from '@/types/evaluation'

export class EvaluationService {
  private static baseUrl = '/api/evaluations'

  static async createEvaluation(businessData: BusinessData, userId?: string): Promise<Evaluation> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ businessData, userId }),
      })

      if (!response.ok) {
        throw new Error(`Failed to create evaluation: ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      console.error('EvaluationService.createEvaluation error:', error)
      throw error
    }
  }

  static async getEvaluation(id: string): Promise<Evaluation | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Failed to get evaluation: ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      console.error('EvaluationService.getEvaluation error:', error)
      throw error
    }
  }

  static async getUserEvaluations(userId: string): Promise<Evaluation[]> {
    try {
      const response = await fetch(`${this.baseUrl}?userId=${userId}`)

      if (!response.ok) {
        throw new Error(`Failed to get user evaluations: ${response.statusText}`)
      }

      const data = await response.json()

      // Ensure we always return an array
      if (Array.isArray(data)) {
        return data
      } else if (data && typeof data === 'object' && Array.isArray(data.evaluations)) {
        // Handle case where API returns { evaluations: [...] }
        return data.evaluations
      } else {
        console.warn('Unexpected response format from getUserEvaluations:', data)
        return []
      }
    } catch (error) {
      console.error('EvaluationService.getUserEvaluations error:', error)
      throw error
    }
  }

  static async updateEvaluation(id: string, updates: Partial<Evaluation>): Promise<Evaluation> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error(`Failed to update evaluation: ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      console.error('EvaluationService.updateEvaluation error:', error)
      throw error
    }
  }

  static async deleteEvaluation(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Failed to delete evaluation: ${response.statusText}`)
      }
    } catch (error) {
      console.error('EvaluationService.deleteEvaluation error:', error)
      throw error
    }
  }

  // Helper methods for business calculations
  static calculateNetProfit(revenue: number, expenses: number): number {
    return revenue - expenses
  }

  static calculateProfitMargin(revenue: number, netProfit: number): number {
    return revenue > 0 ? (netProfit / revenue) * 100 : 0
  }

  static calculateNetWorth(assets: number, liabilities: number): number {
    return assets - liabilities
  }

  static calculateDebtToAssetRatio(assets: number, liabilities: number): number {
    return assets > 0 ? (liabilities / assets) * 100 : 0
  }

  static calculateRevenuePerEmployee(revenue: number, employeeCount: number): number {
    return employeeCount > 0 ? revenue / employeeCount : 0
  }

  static calculateRevenuePerCustomer(revenue: number, customerCount: number): number {
    return customerCount > 0 ? revenue / customerCount : 0
  }

  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  static formatPercentage(value: number, decimals = 1): string {
    return `${value.toFixed(decimals)}%`
  }
}