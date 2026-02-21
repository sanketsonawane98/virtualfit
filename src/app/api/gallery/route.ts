import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
    try {
        const cookieStore = cookies()
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Find user in our DB
        const user = await prisma.user.findUnique({
            where: { supabaseId: session.user.id }
        })

        if (!user) {
            return NextResponse.json({ tryOns: [] })
        }

        const tryOns = await prisma.tryOn.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                userPhotoUrl: true,
                productImageUrl: true,
                resultUrl: true,
                status: true,
                createdAt: true,
            }
        })

        return NextResponse.json({ tryOns })
    } catch (error) {
        console.error('Gallery error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
