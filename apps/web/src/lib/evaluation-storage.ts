import fs from 'fs'
import path from 'path'

const STORAGE_FILE = path.join(process.cwd(), '.tmp-evaluations.json')

interface StoredEvaluation {
  id: string
  userId: string
  businessData: any
  valuations: any
  healthScore: number | null
  confidenceScore: number | null
  opportunities: any[]
  status: string
  createdAt: string
  updatedAt: string
}

class EvaluationStorage {
  private ensureStorageFile() {
    try {
      if (!fs.existsSync(STORAGE_FILE)) {
        fs.writeFileSync(STORAGE_FILE, JSON.stringify({}))
      }
    } catch (error) {
      console.error('Failed to ensure storage file:', error)
    }
  }

  private readStorage(): Record<string, StoredEvaluation> {
    try {
      this.ensureStorageFile()
      const content = fs.readFileSync(STORAGE_FILE, 'utf8')
      return JSON.parse(content)
    } catch (error) {
      console.error('Failed to read storage:', error)
      return {}
    }
  }

  private writeStorage(data: Record<string, StoredEvaluation>) {
    try {
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('Failed to write storage:', error)
    }
  }

  store(evaluation: StoredEvaluation): void {
    console.log('🗃️ STORING evaluation:', evaluation.id, 'userId:', evaluation.userId)
    const data = this.readStorage()
    data[evaluation.id] = evaluation
    this.writeStorage(data)
    console.log('🗃️ STORED successfully. Total:', Object.keys(data).length)
  }

  get(id: string): StoredEvaluation | null {
    console.log('🗃️ GETTING evaluation:', id)
    const data = this.readStorage()
    const evaluation = data[id] || null
    console.log('🗃️ FOUND evaluation:', !!evaluation)
    return evaluation
  }

  getByUserId(userId: string): StoredEvaluation[] {
    console.log('🗃️ GETTING evaluations for userId:', userId)
    const data = this.readStorage()
    const evaluations = Object.values(data).filter(storedEvaluation => storedEvaluation.userId === userId)
    console.log('🗃️ FOUND evaluations for user:', evaluations.length)
    
    // DEBUG: Log all evaluations and their userIds
    console.log('🗃️ DEBUG: All evaluations in storage:')
    for (const [id, storedEvaluation] of Object.entries(data)) {
      console.log(`  - ID: ${id}, userId: "${storedEvaluation.userId}"`)
    }
    
    return evaluations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  update(id: string, updates: Partial<StoredEvaluation>): StoredEvaluation | null {
    console.log('🗃️ UPDATING evaluation:', id, 'with updates:', Object.keys(updates))
    const data = this.readStorage()
    const existing = data[id]
    
    if (!existing) {
      console.log('🗃️ Evaluation not found for update:', id)
      return null
    }
    
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    data[id] = updated
    this.writeStorage(data)
    console.log('🗃️ UPDATED successfully:', id)
    
    return updated
  }

  delete(id: string): boolean {
    console.log('🗃️ DELETING evaluation:', id)
    const data = this.readStorage()
    const deleted = delete data[id]
    
    if (deleted) {
      this.writeStorage(data)
      console.log('🗃️ DELETED successfully:', id)
    }
    
    return deleted
  }

  getAll(): Record<string, StoredEvaluation> {
    return this.readStorage()
  }
}

export const evaluationStorage = new EvaluationStorage()