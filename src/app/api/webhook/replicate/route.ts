import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { id, status, output, error } = body

        // Verify signature if possible (TODO)

        // Find job by replicateId
        // Update status

        // Validating presence of properties to avoid errors if body is different
        if (!id) {
            return NextResponse.json({ message: 'Invalid payload' }, { status: 400 })
        }

        console.log(`Webhook received for ${id}: ${status}`)

        // TODO: Update Prisma record
        // await prisma.tryOn.update(...)

        return NextResponse.json({ message: 'Webhook processed' })
    } catch (error) {
        console.error('Webhook error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
