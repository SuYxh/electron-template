import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

export async function initMySQL(databaseUrl: string): Promise<void> {
  if (pool) {
    await pool.end()
  }

  try {
    const url = new URL(databaseUrl)
    
    pool = mysql.createPool({
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    })

    const connection = await pool.getConnection()
    connection.release()
    
    console.log('MySQL connected successfully')
  } catch (error) {
    console.error('Failed to connect to MySQL:', error)
    pool = null
    throw error
  }
}

export function getMySQLPool(): mysql.Pool {
  if (!pool) {
    throw new Error('MySQL not initialized')
  }
  return pool
}

export function isMySQLAvailable(): boolean {
  return pool !== null
}

export async function closeMySQL(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
