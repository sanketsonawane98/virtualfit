import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { Client, handle_file } from '@gradio/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
    try {
        // Authenticate user
        const cookieStore = cookies()
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { userPhotoUrl, garmentImageUrl, garmentDescription } = await request.json()

        if (!userPhotoUrl || !garmentImageUrl) {
            return NextResponse.json({ error: 'Both user photo and garment image are required' }, { status: 400 })
        }

        console.log('Connecting to HuggingFace IDM-VTON space...')

        // Connect to HuggingFace Space
        const hfToken = process.env.HF_TOKEN
        const client = await Client.connect("yisol/IDM-VTON",
            hfToken ? { hf_token: hfToken as `hf_${string}` } : {}
        )

        console.log('Connected! Calling /tryon endpoint...')
        console.log('User photo URL:', userPhotoUrl)
        console.log('Garment URL:', garmentImageUrl)

        // Use handle_file to pass URLs directly — avoids fetching blobs manually
        const result = await client.predict("/tryon", {
            dict: {
                background: handle_file(userPhotoUrl),
                layers: [],
                composite: null
            },
            garm_img: handle_file(garmentImageUrl),
            garment_des: garmentDescription || "clothing item",
            is_checked: true,
            is_checked_crop: false,
            denoise_steps: 30,
            seed: 42,
        })

        console.log('Result received:', JSON.stringify(result.data).slice(0, 200))

        // Result contains the output image data
        const outputData = result.data as any[]

        if (!outputData || outputData.length === 0) {
            return NextResponse.json({ error: 'Failed to generate try-on result' }, { status: 500 })
        }

        // The first output is the result image (FileData with url)
        const resultImage = outputData[0]
        const resultUrl = resultImage?.url || resultImage?.path

        if (!resultUrl) {
            console.error('No URL in result:', resultImage)
            return NextResponse.json({ error: 'No result image returned' }, { status: 500 })
        }

        // Save TryOn record to database
        let user = await prisma.user.findUnique({
            where: { supabaseId: session.user.id }
        })

        if (!user) {
            user = await prisma.user.create({
                data: {
                    supabaseId: session.user.id,
                    email: session.user.email!,
                    name: session.user.user_metadata?.full_name || null,
                }
            })
        }

        // Create TryOn record
        const tryOn = await prisma.tryOn.create({
            data: {
                user: { connect: { id: user.id } },
                userPhotoUrl: userPhotoUrl,
                productImageUrl: garmentImageUrl,
                resultUrl: resultUrl,
                status: 'completed',
                completedAt: new Date(),
            }
        })

        return NextResponse.json({
            tryOnId: tryOn.id,
            resultUrl: resultUrl,
            status: 'completed',
        })

    } catch (error: any) {
        console.error('Try-on error full:', error)
        const message = error?.message || error?.toString() || 'Failed to generate try-on'
        return NextResponse.json({
            error: message
        }, { status: 500 })
    }
}
