import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const dbUrl = process.env.DATABASE_URL

if (!dbUrl) {
  console.error("❌ CRITICAL: DATABASE_URL is completely missing from your Next.js server runtime environment variables!")
}

// 1. Safe initialization layout
const pool = new Pool({ 
  connectionString: dbUrl || "postgresql://dummy:dummy@localhost:5432/dummy" 
})

// 2. Wrap it with the Prisma Pg driver adapter configuration
const adapter = new PrismaPg(pool)

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// 3. Explicitly pass the adapter into the instantiation object
export const prisma =
  globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
