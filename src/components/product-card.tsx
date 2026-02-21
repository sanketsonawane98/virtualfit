import Link from 'next/link'
import Image from 'next/image'

interface Product {
    id: string
    name: string
    category: string
    imageUrl: string
    gender: string
}

export default function ProductCard({ product }: { product: Product }) {
    return (
        <Link href={`/products/${product.id}`} className="group block border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative aspect-[3/4] bg-gray-100">
                {product.imageUrl ? (
                    <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                )}
            </div>
            <div className="p-4">
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <p className="text-sm text-gray-500 capitalize">{product.gender} • {product.category}</p>
            </div>
        </Link>
    )
}
