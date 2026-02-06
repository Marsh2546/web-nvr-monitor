import { Pool } from 'pg'

// Database connection configuration
const dbConfig = {
  host: import.meta.env.VITE_DB_HOST || 'localhost',
  port: parseInt(import.meta.env.VITE_DB_PORT || '5432'),
  database: import.meta.env.VITE_DB_NAME || 'cctv_nvr',
  user: import.meta.env.VITE_DB_USER || 'postgres',
  password: import.meta.env.VITE_DB_PASSWORD || 'password',
  ssl: import.meta.env.VITE_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
}

// Create connection pool
const pool = new Pool(dbConfig)

export interface DatabaseResult<T = any> {
  rows: T[]
  rowCount: number
  command: string
}

export class DatabaseService {
  static async query<T = any>(text: string, params?: any[]): Promise<DatabaseResult<T>> {
    const start = Date.now()
    try {
      const result = await pool.query(text, params)
      const duration = Date.now() - start
      console.log('Executed query', { text, duration, rows: result.rowCount })
      return result
    } catch (error) {
      console.error('Database query error', { text, error })
      throw error
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW() as current_time')
      return result.rows.length > 0
    } catch (error) {
      console.error('Database connection test failed:', error)
      return false
    }
  }

  static async close(): Promise<void> {
    await pool.end()
  }
}

// Export the pool for direct access if needed
export { pool }

// Export a simple query function for common usage
export const db = {
  query: DatabaseService.query.bind(DatabaseService),
  test: DatabaseService.testConnection.bind(DatabaseService),
  close: DatabaseService.close.bind(DatabaseService)
}
