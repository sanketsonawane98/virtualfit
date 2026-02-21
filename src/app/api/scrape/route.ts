import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { url } = await request.json()

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 })
        }

        // Fetch the page HTML
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            redirect: 'follow',
        })

        if (!res.ok) {
            return NextResponse.json({ error: `Failed to fetch page (${res.status})` }, { status: 400 })
        }

        const html = await res.text()

        // Extract product image using multiple strategies
        let imageUrl = extractProductImage(html, url)

        if (!imageUrl) {
            return NextResponse.json({ error: 'Could not find product image on this page' }, { status: 404 })
        }

        // Ensure absolute URL
        if (imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl
        } else if (imageUrl.startsWith('/')) {
            const urlObj = new URL(url)
            imageUrl = urlObj.origin + imageUrl
        }

        return NextResponse.json({ imageUrl })

    } catch (error: any) {
        console.error('Scrape error:', error)
        return NextResponse.json({ error: error.message || 'Failed to scrape URL' }, { status: 500 })
    }
}

function extractProductImage(html: string, sourceUrl: string): string | null {
    // Strategy 1: Open Graph image (og:image) — most reliable for product pages
    const ogMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i)
        || html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i)
    if (ogMatch?.[1]) return ogMatch[1]

    // Strategy 2: Twitter card image
    const twitterMatch = html.match(/<meta\s+(?:property|name)=["']twitter:image["']\s+content=["']([^"']+)["']/i)
        || html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']twitter:image["']/i)
    if (twitterMatch?.[1]) return twitterMatch[1]

    // Strategy 3: Amazon-specific — look for main product image
    if (sourceUrl.includes('amazon') || sourceUrl.includes('amzn')) {
        // Amazon landingImage or imgTagWrapperId
        const amazonMatch = html.match(/"hiRes"\s*:\s*"([^"]+)"/i)
            || html.match(/"large"\s*:\s*"([^"]+)"/i)
            || html.match(/id=["']landingImage["'][^>]*src=["']([^"']+)["']/i)
            || html.match(/id=["']imgBlkFront["'][^>]*src=["']([^"']+)["']/i)
        if (amazonMatch?.[1]) return amazonMatch[1]
    }

    // Strategy 4: Flipkart-specific
    if (sourceUrl.includes('flipkart')) {
        const flipkartMatch = html.match(/<img[^>]*class=["'][^"']*_396cs4[^"']*["'][^>]*src=["']([^"']+)["']/i)
            || html.match(/<img[^>]*src=["'](https:\/\/rukminim[^"']+)["']/i)
        if (flipkartMatch?.[1]) return flipkartMatch[1]
    }

    // Strategy 5: Myntra-specific
    if (sourceUrl.includes('myntra')) {
        const myntraMatch = html.match(/<img[^>]*class=["'][^"']*image-grid-image[^"']*["'][^>]*src=["']([^"']+)["']/i)
        if (myntraMatch?.[1]) return myntraMatch[1]
    }

    // Strategy 6: JSON-LD structured data (Schema.org Product)
    const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
    for (const match of jsonLdMatches) {
        try {
            const data = JSON.parse(match[1])
            const product = Array.isArray(data) ? data.find((d: any) => d['@type'] === 'Product') : (data['@type'] === 'Product' ? data : null)
            if (product?.image) {
                const img = Array.isArray(product.image) ? product.image[0] : product.image
                if (typeof img === 'string') return img
                if (img?.url) return img.url
            }
        } catch { /* skip invalid JSON-LD */ }
    }

    // Strategy 7: First large image in the page (fallback)
    const imgMatches = html.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*/gi)
    for (const match of imgMatches) {
        const src = match[1]
        // Skip tiny icons, tracking pixels, logos
        if (src.includes('sprite') || src.includes('icon') || src.includes('logo') ||
            src.includes('pixel') || src.includes('1x1') || src.includes('data:image') ||
            src.includes('svg') || src.length < 20) continue
        // Prefer larger product-like images
        if (src.includes('product') || src.includes('img') || src.match(/\.(jpg|jpeg|png|webp)/i)) {
            return src
        }
    }

    return null
}
