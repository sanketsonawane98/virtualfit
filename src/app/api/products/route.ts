import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const gender = searchParams.get('gender')

    try {
        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                ...(category && { category }),
                ...(gender && { gender }),
            },
            take: 20,
        })

        return NextResponse.json({ products })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
