import fs from 'fs'
import path from 'path'

const STORAGE_FILE = path.join(process.cwd(), '.tmp-progress.json')

interface StoredProgressEntry {
  id: string
  userId: string
  guideId: string
  stepId: string
  improvementCategory: string
  timeInvested: number
  moneyInvested: number
  aiValidationScore?: number
  evidence?: string[]
  manualValidation?: boolean
  completedAt?: Date
  createdAt: Date
  step: {
    title: string
  }
  guide: {
    title: string
  }
}

class ProgressStorage {
  private ensureStorageFile() {
    try {
      if (!fs.existsSync(STORAGE_FILE)) {
        fs.writeFileSync(STORAGE_FILE, JSON.stringify({}))
      }
    } catch (error) {
      console.error('Failed to ensure progress storage file:', error)
    }
  }

  private readStorage(): Record<string, StoredProgressEntry> {
    try {
      this.ensureStorageFile()
      const content = fs.readFileSync(STORAGE_FILE, 'utf8')
      return JSON.parse(content)
    } catch (error) {
      console.error('Failed to read progress storage:', error)
      return {}
    }
  }

  private writeStorage(data: Record<string, StoredProgressEntry>) {
    try {
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('Failed to write progress storage:', error)
    }
  }

  store(entry: StoredProgressEntry): void {
    const data = this.readStorage()
    data[entry.id] = entry
    this.writeStorage(data)
  }

  get(id: string): StoredProgressEntry | null {
    const data = this.readStorage()
    return data[id] || null
  }

  getByUserId(userId: string): StoredProgressEntry[] {
    const data = this.readStorage()
    return Object.values(data)
      .filter(entry => entry.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  getAll(): Record<string, StoredProgressEntry> {
    return this.readStorage()
  }
}

export const progressStorage = new ProgressStorage()