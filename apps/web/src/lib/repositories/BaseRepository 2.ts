import { prisma } from '../prisma'

export abstract class BaseRepository<T, CreateData, UpdateData> {
  protected abstract tableName: string

  protected transformFromDb(dbRecord: any): T {
    return dbRecord as T
  }

  protected transformToDb(data: CreateData | UpdateData): any {
    return data
  }

  protected async findMany(where: any, options?: {
    orderBy?: any
    take?: number
    skip?: number
  }): Promise<T[]> {
    const records = await (prisma as any)[this.tableName].findMany({
      where,
      ...options
    })

    return records.map(record => this.transformFromDb(record))
  }

  protected async findUnique(where: any): Promise<T | null> {
    const record = await (prisma as any)[this.tableName].findUnique({ where })
    
    if (!record) return null
    return this.transformFromDb(record)
  }

  protected async create(data: CreateData): Promise<T> {
    const transformedData = this.transformToDb(data)
    const record = await (prisma as any)[this.tableName].create({
      data: transformedData
    })

    return this.transformFromDb(record)
  }

  protected async update(id: string, data: UpdateData): Promise<T> {
    const transformedData = this.transformToDb(data)
    const record = await (prisma as any)[this.tableName].update({
      where: { id },
      data: transformedData
    })

    return this.transformFromDb(record)
  }

  protected async delete(id: string): Promise<void> {
    await (prisma as any)[this.tableName].delete({
      where: { id }
    })
  }

  protected validateId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new Error(`Invalid ID provided: ${id}`)
    }
  }

  protected validateRequired(value: any, fieldName: string): void {
    if (value === undefined || value === null || value === '') {
      throw new Error(`${fieldName} is required`)
    }
  }
}