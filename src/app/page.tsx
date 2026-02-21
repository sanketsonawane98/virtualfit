import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#09090b] text-black dark:text-white relative overflow-hidden">

      {/* Background Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-40 dark:opacity-20 blur-[100px] bg-gradient-to-b from-blue-400/30 via-violet-400/20 to-transparent dark:from-blue-600/20 dark:via-violet-600/10"></div>
      <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] pointer-events-none opacity-30 dark:opacity-20 blur-[120px] bg-indigo-500/20 rounded-full"></div>
      <div className="absolute top-1/3 -left-1/4 w-[600px] h-[600px] pointer-events-none opacity-20 dark:opacity-10 blur-[100px] bg-blue-500/30 rounded-full"></div>

      <header className="px-6 py-6 flex items-center justify-between relative z-10 max-w-7xl mx-auto w-full">
        <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'var(--font-geist-sans)' }}>
          Virtual<span className="text-blue-600 dark:text-blue-500">Fit</span>
        </h1>
        <nav className="space-x-2 sm:space-x-4">
          <Link href="/login" className="px-5 py-2.5 text-sm font-medium hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">Login</Link>
          <Link href="/signup" className="px-5 py-2.5 text-sm font-bold bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-zinc-900/20 dark:shadow-white/10">Get Started</Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 sm:py-32 relative z-10">

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 text-sm font-semibold mb-8 border border-blue-200/50 dark:border-blue-500/20 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="flex h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse"></span>
          Powered by latest IDM-VTON AI
        </div>

        <h2 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.1] text-balance max-w-5xl" style={{ fontFamily: 'var(--font-geist-sans)' }}>
          Try On Clothes <br />
          <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent animate-gradient">
            Instantly.
          </span>
        </h2>

        <p className="text-xl sm:text-2xl text-gray-500 dark:text-gray-400 max-w-2xl mb-12 text-balance leading-relaxed">
          Upload your photo, paste a product link, and see how the latest fashion looks on you with photorealistic AI technology.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-6">
          <Link href="/signup" className="flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full text-lg font-bold hover:scale-105 active:scale-95 transition-transform shadow-2xl shadow-zinc-900/20 dark:shadow-white/20">
            Start Free Trial
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
          <Link href="/products" className="px-8 py-4 bg-white/50 dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-full text-lg font-bold hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
            View Live Demo
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full px-4">

          <div className="glass dark:bg-zinc-900/40 p-10 rounded-[2rem] text-left border dark:border-zinc-800/50 hover:-translate-y-2 transition-transform duration-500">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 border border-blue-200/50 dark:border-blue-500/20">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 tracking-tight">1. Upload Photo</h3>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">Take a full body or half body photo and upload it securely to our platform.</p>
          </div>

          <div className="glass dark:bg-zinc-900/40 p-10 rounded-[2rem] text-left border dark:border-zinc-800/50 hover:-translate-y-2 transition-transform duration-500 delay-100">
            <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-6 border border-violet-200/50 dark:border-violet-500/20">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 tracking-tight">2. Paste Any Link</h3>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">Found an outfit you like online? Just paste the product URL from any major retailer.</p>
          </div>

          <div className="glass dark:bg-zinc-900/40 p-10 rounded-[2rem] text-left border dark:border-zinc-800/50 hover:-translate-y-2 transition-transform duration-500 delay-200">
            <div className="w-14 h-14 rounded-2xl bg-fuchsia-100 dark:bg-fuchsia-900/30 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-400 mb-6 border border-fuchsia-200/50 dark:border-fuchsia-500/20">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 tracking-tight">3. Pure Magic</h3>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">Our advanced diffusion model blends the garment seamlessly onto your body shape.</p>
          </div>

        </div>
      </main>

      <footer className="py-8 text-center text-sm font-medium text-gray-500 dark:text-gray-500 border-t border-gray-100 dark:border-zinc-900 relative z-10 w-full bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md">
        <p>Built with Next.js, Tailwind, and IDM-VTON.</p>
      </footer>
    </div>
  )
}
