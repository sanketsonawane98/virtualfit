'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

export default function TryOnPage() {
    // User photo state
    const [userPhoto, setUserPhoto] = useState<File | null>(null)
    const [userPhotoPreview, setUserPhotoPreview] = useState<string | null>(null)
    const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)

    // Garment state
    const [garmentInputUrl, setGarmentInputUrl] = useState('')
    const [scrapedImageUrl, setScrapedImageUrl] = useState<string | null>(null)   // raw scraped
    const [garmentImageUrl, setGarmentImageUrl] = useState<string | null>(null)   // after extraction
    const [garmentDescription, setGarmentDescription] = useState('')
    const [scraping, setScraping] = useState(false)
    const [extracting, setExtracting] = useState(false)

    // Try-on state
    const [generating, setGenerating] = useState(false)
    const [resultUrl, setResultUrl] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [status, setStatus] = useState('')

    const fileInputRef = useRef<HTMLInputElement>(null)

    // Handle user photo selection + preview
    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUserPhoto(file)
        setUserPhotoUrl(null)
        setError(null)
        const reader = new FileReader()
        reader.onloadend = () => setUserPhotoPreview(reader.result as string)
        reader.readAsDataURL(file)
    }

    // Upload photo to Supabase Storage
    const handleUploadPhoto = async () => {
        if (!userPhoto) return
        setUploading(true)
        setError(null)
        try {
            const formData = new FormData()
            formData.append('photo', userPhoto)
            const res = await fetch('/api/upload', { method: 'POST', body: formData })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Upload failed')
            setUserPhotoUrl(data.url)
        } catch (err: any) {
            setError(`Upload failed: ${err.message}`)
        } finally {
            setUploading(false)
        }
    }

    // Step 1: Scrape image from URL
    // Step 2: Auto-extract just the garment from it
    const handleScrapeAndExtract = async () => {
        if (!garmentInputUrl) return

        setScraping(true)
        setError(null)
        setScrapedImageUrl(null)
        setGarmentImageUrl(null)

        try {
            let imageUrl = garmentInputUrl

            // If not a direct image URL, scrape it
            if (!/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(garmentInputUrl)) {
                const scrapeRes = await fetch('/api/scrape', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: garmentInputUrl }),
                })
                const scrapeData = await scrapeRes.json()
                if (!scrapeRes.ok) throw new Error(scrapeData.error || 'Could not extract image from page')
                imageUrl = scrapeData.imageUrl
            }

            setScrapedImageUrl(imageUrl)
            setScraping(false)

            // Use the scraped image directly — IDM-VTON is trained on in-shop images
            // (model wearing garment on white background) and handles them correctly.
            // Background removal was causing pose bleed into the try-on result.
            setGarmentImageUrl(imageUrl)
            setStatus('✅ Garment image ready!')

        } catch (err: any) {
            setError(err.message || 'Failed to process garment URL')
        } finally {
            setScraping(false)
            setExtracting(false)
        }
    }

    // Generate try-on
    const handleGenerateTryOn = async () => {
        if (!userPhotoUrl) { setError('Please upload your photo first'); return }
        if (!garmentImageUrl) { setError('Please extract the garment image first'); return }

        setGenerating(true)
        setError(null)
        setResultUrl(null)
        setStatus('Connecting to AI model...')

        try {
            const res = await fetch('/api/tryon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userPhotoUrl,
                    garmentImageUrl,
                    garmentDescription: garmentDescription || 'clothing item',
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Try-on generation failed')
            setResultUrl(data.resultUrl)
            setStatus('')
        } catch (err: any) {
            setError(err.message)
            setStatus('')
        } finally {
            setGenerating(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center md:text-left space-y-2">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">Virtual Try-On</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl">Upload your photo and paste a product link to see how it looks on you.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                {/* Step 1: User Photo */}
                <div className="space-y-5">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm">1</span>
                            Your Photo
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload a clear, full-body or half-body photo.</p>
                    </div>

                    <div
                        className="glass dark:bg-zinc-900/50 rounded-2xl p-2 cursor-pointer border border-dashed border-gray-300 dark:border-zinc-700 hover:border-blue-500 transition-all duration-300 group"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                        {userPhotoPreview ? (
                            <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden shadow-inner">
                                <Image src={userPhotoPreview} alt="Your photo" fill className="object-cover transition-transform group-hover:scale-105 duration-500" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white font-medium px-4 py-2 rounded-full bg-black/50 backdrop-blur-md">Change Photo</span>
                                </div>
                            </div>
                        ) : (
                            <div className="py-16 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 mb-4 rounded-full bg-blue-50 dark:bg-zinc-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                    📷
                                </div>
                                <p className="text-blue-600 dark:text-blue-400 font-medium">Click to upload photo</p>
                                <p className="text-xs text-gray-400 mt-2">JPEG or PNG, up to 10MB</p>
                            </div>
                        )}
                    </div>

                    {userPhoto && !userPhotoUrl && (
                        <button onClick={handleUploadPhoto} disabled={uploading}
                            className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black py-3 px-4 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 font-semibold shadow-sm transition-all duration-200 active:scale-[0.98]">
                            {uploading ? 'Uploading securely...' : 'Confirm Upload'}
                        </button>
                    )}
                    {userPhotoUrl && (
                        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-3 text-sm text-emerald-700 dark:text-emerald-400 animate-in fade-in zoom-in duration-300">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Photo uploaded and ready
                        </div>
                    )}
                </div>

                {/* Step 2: Garment */}
                <div className="space-y-5">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-sm">2</span>
                            The Garment
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Paste any product page URL from your favorite store.</p>
                    </div>

                    <div className="glass dark:bg-zinc-900/50 p-5 rounded-2xl border dark:border-zinc-800 space-y-4 shadow-sm">
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                    </div>
                                    <input
                                        type="url"
                                        placeholder="https://myntra.com/... or image link"
                                        value={garmentInputUrl}
                                        onChange={(e) => { setGarmentInputUrl(e.target.value); setScrapedImageUrl(null); setGarmentImageUrl(null); setStatus('') }}
                                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-shadow"
                                    />
                                </div>
                                <button onClick={handleScrapeAndExtract} disabled={!garmentInputUrl || scraping || extracting}
                                    className="px-5 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 font-semibold whitespace-nowrap transition-all duration-200 active:scale-[0.98]">
                                    {scraping ? 'Extracting...' : 'Extract'}
                                </button>
                            </div>

                            <input type="text" placeholder="Optional: Describe it (e.g., 'red polo shirt')"
                                value={garmentDescription}
                                onChange={(e) => setGarmentDescription(e.target.value)}
                                className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-shadow"
                            />
                        </div>

                        {/* Progress states */}
                        {scraping && (
                            <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500 animate-pulse">
                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                Analyzing product page...
                            </div>
                        )}
                        {status && !scraping && !extracting && (
                            <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400 py-2">{status}</div>
                        )}

                        {/* Garment Preview */}
                        {garmentImageUrl && (
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Extracted Garment</p>
                                <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden aspect-square relative shadow-inner">
                                    <img src={garmentImageUrl} alt="Garment" className="w-full h-full object-contain p-4" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Generate Button Wrapper */}
            <div className="pt-8 flex flex-col items-center">
                <div className="w-full max-w-sm relative group">
                    <div className={`absolute -inset-1 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 ${generating ? 'bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 animate-gradient opacity-100' : 'bg-gradient-to-r from-zinc-600 to-zinc-400 dark:from-zinc-400 dark:to-zinc-600'}`}></div>
                    <button onClick={handleGenerateTryOn}
                        disabled={generating || !userPhotoUrl || !garmentImageUrl}
                        className="relative w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl disabled:opacity-90 disabled:cursor-not-allowed font-bold text-lg shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden">
                        {generating ? (
                            <span className="flex items-center justify-center gap-3">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Generating Magic...</span>
                            </span>
                        ) : '✨ Generate Virtual Fit'}
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-4 tracking-wide uppercase font-semibold">Powered by IDM-VTON on fal.ai</p>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
                    ⚠️ {error}
                </div>
            )}

            {/* Result Modal / Section */}
            {resultUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-zinc-950 border dark:border-zinc-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full mx-auto shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">✨ Your New Look</h2>
                            <button onClick={() => setResultUrl(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="rounded-2xl overflow-hidden bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-inner max-h-[60vh] flex items-center justify-center">
                            <img src={resultUrl} alt="Try-on result" className="max-w-full max-h-full object-contain" />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 mt-8">
                            <a href={resultUrl} target="_blank" rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-semibold hover:opacity-90 transition-opacity">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Download High-Res
                            </a>
                            <button onClick={() => { setResultUrl(null); setGarmentInputUrl(''); setScrapedImageUrl(null); setGarmentImageUrl(null); setGarmentDescription(''); }}
                                className="flex-1 flex items-center justify-center py-3 border border-gray-300 dark:border-zinc-700 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                                Try Another Outfit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
