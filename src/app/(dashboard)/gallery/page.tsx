'use client'

import { useState, useEffect } from 'react'

export default function GalleryPage() {
    const [tryOns, setTryOns] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchGallery() {
            try {
                const res = await fetch('/api/gallery')
                if (!res.ok) return
                const data = await res.json()
                setTryOns(data.tryOns || [])
            } catch (err) {
                console.error('Failed to fetch gallery', err)
            } finally {
                setLoading(false)
            }
        }
        fetchGallery()
    }, [])

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400 space-y-4">
            <svg className="w-8 h-8 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            <p className="animate-pulse font-medium">Loading your gallery...</p>
        </div>
    )

    return (
        <div className="space-y-10 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Your Lookbook</h1>
                    <p className="text-gray-500 dark:text-gray-400">All your virtual try-on generations in one place.</p>
                </div>
                <a href="/tryon" className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors active:scale-95 shadow-lg shadow-blue-500/20">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    New Try-On
                </a>
            </div>

            {tryOns.length === 0 ? (
                <div className="glass dark:bg-zinc-900/30 rounded-3xl p-12 text-center border-dashed border-2 dark:border-zinc-800/80 max-w-2xl mx-auto mt-12">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-4xl">
                        ✨
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Your gallery is empty</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
                        You haven't generated any virtual try-ons yet. Start mixing and matching outfits now!
                    </p>
                    <a href="/tryon" className="inline-flex items-center justify-center px-8 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:scale-105 transition-transform shadow-xl">
                        Create Your First Look
                    </a>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-500">
                    {tryOns.map((item: any) => (
                        <div key={item.id} className="glass-card rounded-2xl overflow-hidden group hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">

                            {/* Image Container with Hover Reveal */}
                            <div className="relative aspect-[3/4] bg-gray-100 dark:bg-zinc-900/50 overflow-hidden">
                                {item.resultUrl ? (
                                    <>
                                        {/* Result Image (Front) */}
                                        <img src={item.resultUrl} alt="Try-On Result" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0" />

                                        {/* Original Garment Image (Revealed on hover) */}
                                        <div className="absolute inset-0 w-full h-full p-6 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white dark:bg-zinc-950">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Original Garment</p>
                                            <img src={item.productImageUrl} alt="Original Garment" className="w-full h-full object-contain filter drop-shadow-xl" />
                                        </div>

                                        {/* Badge */}
                                        <div className="absolute top-3 right-3 opacity-100 group-hover:opacity-0 transition-opacity">
                                            <span className="px-2.5 py-1 text-xs font-semibold bg-black/50 text-white backdrop-blur-md rounded-full shadow-sm">
                                                Generated
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3">
                                        <svg className="w-8 h-8 animate-spin opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                        <span className="text-sm font-medium capitalize animate-pulse">{item.status}...</span>
                                    </div>
                                )}
                            </div>

                            {/* Card Footer */}
                            <div className="p-4 border-t border-gray-100 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-950/50">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 hidden sm:block">
                                        {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                    {item.resultUrl && (
                                        <a
                                            href={item.resultUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-full"
                                        >
                                            View Full
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
