'use client'

import { useState, useEffect } from 'react'
import ProductCard from '@/components/product-card'

export default function ProductsPage() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchProducts() {
            try {
                const res = await fetch('/api/products')
                const data = await res.json()
                setProducts(data.products || [])
            } catch (err) {
                console.error('Failed to fetch products', err)
            } finally {
                setLoading(false)
            }
        }
        fetchProducts()
    }, [])

    if (loading) return <div>Loading products...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Catalog</h1>
                {/* Filters could go here */}
            </div>

            {products.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    No products found. (Run seed or add products to DB)
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map((product: any) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    )
}
