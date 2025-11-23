import 'dotenv/config'

import { Prisma, PrismaClient } from "../app/generated/prisma/client";

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.POSTGRES_PRISMA_URL || '';

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false,
    },
})

const adapter = new PrismaPg(pool)

export const prisma = new PrismaClient({
    adapter,
});