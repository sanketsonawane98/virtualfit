import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Client, handle_file } from '@gradio/client'

export async function POST(request: Request) {
    let imageUrl: string | null = null

    try {
        const body = await request.json()
        imageUrl = body.imageUrl

        if (!imageUrl) {
            return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
        }

        const hfToken = process.env.HF_TOKEN

        console.log('[extract-garment] Starting for:', imageUrl)

        // Use not-lain/background-removal — 2.7k likes, actively running on ZeroGPU
        const client = await Client.connect(
            "not-lain/background-removal",
            hfToken ? { hf_token: hfToken as `hf_${string}` } : {}
        )

        console.log('[extract-garment] Connected to not-lain/background-removal')

        // The space accepts an image and returns background-removed PNG
        const result = await client.predict("/image", {
            image: handle_file(imageUrl),
        })

        console.log('[extract-garment] Result:', JSON.stringify(result.data).slice(0, 300))

        const outputData = result.data as any[]

        if (!outputData || outputData.length === 0) {
            return NextResponse.json({ garmentUrl: imageUrl, segmented: false, reason: 'no_output' })
        }

        // Log full result to debug the exact format
        console.log('[extract-garment] Full result data:', JSON.stringify(outputData, null, 2).slice(0, 500))

        // Result could be:
        // [FileData] -- single image
        // [[FileData, FileData]] -- array with original + removed
        // { url, path } directly
        // string (URL)
        let processedUrl: string | null = null

        const extractUrl = (item: any): string | null => {
            if (!item) return null
            if (typeof item === 'string') return item
            if (item.url) return item.url
            if (item.path) return item.path
            // Sometimes it's wrapped in another array
            if (Array.isArray(item)) return extractUrl(item[0])
            return null
        }

        // not-lain returns [removed_bg_image] or [original, removed_bg]
        if (Array.isArray(outputData[0])) {
            // Nested array — take last item (the processed one)
            const inner = outputData[0]
            processedUrl = extractUrl(inner[inner.length - 1])
        } else {
            processedUrl = extractUrl(outputData[outputData.length - 1])
        }

        if (!processedUrl) {
            console.log('[extract-garment] No URL in result:', JSON.stringify(outputData).slice(0, 300))
            return NextResponse.json({ garmentUrl: imageUrl, segmented: false, reason: 'no_url', detail: JSON.stringify(outputData).slice(0, 200) })
        }

        console.log('[extract-garment] Got processed URL:', processedUrl)

        // Fetch and upload to Supabase for a stable public URL
        const imgRes = await fetch(processedUrl)
        if (!imgRes.ok) {
            return NextResponse.json({ garmentUrl: processedUrl, segmented: true })
        }

        const processedBuffer = await imgRes.arrayBuffer()
        const cookieStore = cookies()
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

        const fileName = `garment_${Date.now()}.png`
        const { error: uploadError } = await supabase.storage
            .from('user-photos')
            .upload(fileName, processedBuffer, { contentType: 'image/png', upsert: false })

        if (uploadError) {
            console.error('[extract-garment] Upload error:', uploadError)
            return NextResponse.json({ garmentUrl: processedUrl, segmented: true })
        }

        const { data: urlData } = supabase.storage.from('user-photos').getPublicUrl(fileName)
        console.log('[extract-garment] ✅ Success:', urlData.publicUrl)

        return NextResponse.json({ garmentUrl: urlData.publicUrl, segmented: true })

    } catch (error: any) {
        console.error('[extract-garment] Exception:', error?.message || error)
        return NextResponse.json({
            garmentUrl: imageUrl,
            segmented: false,
            reason: 'exception',
            detail: error?.message
        })
    }
}
