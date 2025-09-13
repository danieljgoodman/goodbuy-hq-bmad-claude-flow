import fs from 'fs'
import path from 'path'

const STORAGE_FILE = path.join(process.cwd(), '.tmp-value-impacts.json')

interface StoredValueImpact {
  id: string
  userId: string
  progressEntryId: string
  baselineValuation: number
  updatedValuation: number
  valuationIncrease: number
  impactPercentage: number
  confidenceScore: number
  improvementCategory: string
  roi: number
  timeToValue: number
  calculatedAt: Date
  createdAt: Date
}

class ValueImpactStorage {
  private ensureStorageFile() {
    try {
      if (!fs.existsSync(STORAGE_FILE)) {
        fs.writeFileSync(STORAGE_FILE, JSON.stringify({}))
      }
    } catch (error) {
      console.error('Failed to ensure value impact storage file:', error)
    }
  }

  private readStorage(): Record<string, StoredValueImpact> {
    try {
      this.ensureStorageFile()
      const content = fs.readFileSync(STORAGE_FILE, 'utf8')
      return JSON.parse(content)
    } catch (error) {
      console.error('Failed to read value impact storage:', error)
      return {}
    }
  }

  private writeStorage(data: Record<string, StoredValueImpact>) {
    try {
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('Failed to write value impact storage:', error)
    }
  }

  store(impact: StoredValueImpact): void {
    const data = this.readStorage()
    data[impact.id] = impact
    this.writeStorage(data)
  }

  get(id: string): StoredValueImpact | null {
    const data = this.readStorage()
    return data[id] || null
  }

  getByUserId(userId: string): StoredValueImpact[] {
    const data = this.readStorage()
    return Object.values(data)
      .filter(impact => impact.userId === userId)
      .sort((a, b) => new Date(b.calculatedAt).getTime() - new Date(a.calculatedAt).getTime())
  }

  getByProgressEntryId(progressEntryId: string): StoredValueImpact[] {
    const data = this.readStorage()
    return Object.values(data)
      .filter(impact => impact.progressEntryId === progressEntryId)
      .sort((a, b) => new Date(b.calculatedAt).getTime() - new Date(a.calculatedAt).getTime())
  }

  getAll(): Record<string, StoredValueImpact> {
    return this.readStorage()
  }
}

export const valueImpactStorage = new ValueImpactStorage()