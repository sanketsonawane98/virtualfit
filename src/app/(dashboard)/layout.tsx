import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = createServerComponentClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        redirect('/login')
    }

    return (
        <div className="flex h-screen w-full bg-gray-50/50 dark:bg-[#09090b]">
            {/* Sidebar */}
            <aside className="w-64 border-r border-gray-200 dark:border-white/10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl hidden md:flex flex-col">
                <div className="p-8">
                    <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                        VirtualFit
                    </h2>
                </div>

                <nav className="flex-1 space-y-1.5 px-4">
                    <div className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Menu
                    </div>

                    <Link href="/dashboard" className="block py-2.5 px-4 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-all duration-200">
                        Dashboard
                    </Link>

                    <Link href="/tryon" className="block py-2.5 px-4 text-sm font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-lg transition-all duration-200 group relative overflow-hidden">
                        <span className="relative z-10 flex items-center gap-2">
                            ✨ Try On
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-indigo-50 dark:from-blue-500/0 dark:to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Link>

                    <Link href="/upload" className="block py-2.5 px-4 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-all duration-200">
                        Upload Photo
                    </Link>

                    <Link href="/products" className="block py-2.5 px-4 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-all duration-200">
                        Catalog
                    </Link>

                    <Link href="/gallery" className="block py-2.5 px-4 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-all duration-200">
                        Gallery
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-white/10">
                    <div className="px-4 py-3 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200/50 dark:border-white/5">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate text-center font-medium">
                            {session.user.email}
                        </p>
                    </div>
                    <LogoutButton />
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto">
                <div className="h-full p-8 md:p-12 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
