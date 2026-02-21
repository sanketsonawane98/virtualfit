'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'

export default function ProductDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [product, setProduct] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [tryOnLoading, setTryOnLoading] = useState(false)

    // Mock fetch product detail (API for detail not implemented yet, reusing list logic briefly or just stub)
    // Actually API route for list returns all, we should implement detail route or filter client side for MVP?
    // Let's implement fetch from /api/products?id=... if supported or just mock.
    // ARCHITECTURE.md had /api/products/:id but I didn't implement dynamic route for API.
    // I only implemented GET /api/products.
    // I'll update API route later. For now, let's fetch list and find.

    useEffect(() => {
        async function fetchProduct() {
            try {
                const res = await fetch(`/api/products`) // Ineffecient but MVP
                const data = await res.json()
                const found = data.products?.find((p: any) => p.id === params.id)
                setProduct(found)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        if (params.id) fetchProduct()
    }, [params.id])

    const handleTryOn = async () => {
        setTryOnLoading(true)
        try {
            // Get user photo? Handled by API retrieval of user profile
            const res = await fetch('/api/tryon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: product.id }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            alert(`Try-on started! ID: ${data.tryOnId}`)
            router.push('/gallery')
        } catch (err: any) {
            alert(`Error: ${err.message}`)
        } finally {
            setTryOnLoading(false)
        }
    }

    if (loading) return <div>Loading...</div>
    if (!product) return <div>Product not found</div>

    return (
        <div className="grid md:grid-cols-2 gap-8">
            <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                {product.imageUrl && (
                    <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                )}
            </div>

            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">{product.name}</h1>
                    <p className="text-gray-500 capitalize">{product.gender} • {product.category}</p>
                </div>

                <p className="text-lg">{product.description || 'No description available.'}</p>

                <div className="pt-6 border-t">
                    <button
                        onClick={handleTryOn}
                        disabled={tryOnLoading}
                        className="w-full bg-black text-white text-lg py-4 rounded-lg hover:bg-gray-800 disabled:opacity-50"
                    >
                        {tryOnLoading ? 'Processing...' : 'Virtual Try-On'}
                    </button>
                    <p className="text-xs text-gray-400 mt-2 text-center">
                        Requires uploaded photo and available credits.
                    </p>
                </div>
            </div>
        </div>
    )
}
