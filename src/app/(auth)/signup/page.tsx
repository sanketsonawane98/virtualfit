'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'

export default function SignupPage() {
    const supabase = createClientComponentClient()

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-md space-y-4 rounded-lg border p-6 shadow-lg bg-white dark:bg-zinc-950">
                <h1 className="text-2xl font-bold text-center">Create an Account</h1>
                <Auth
                    supabaseClient={supabase}
                    appearance={{
                        theme: ThemeSupa,
                        className: {
                            input: '!rounded-md !border !border-gray-300 !bg-white !px-3 !py-2 !text-black focus:!outline-none focus:!ring-2 focus:!ring-blue-500 dark:!bg-zinc-800 dark:!border-zinc-700 dark:!text-white',
                            label: '!text-sm !text-gray-700 dark:!text-gray-300 !mb-1 !block',
                            button: '!w-full !rounded-md !bg-zinc-900 !px-4 !py-2 !text-white hover:!bg-zinc-800 focus:!outline-none focus:!ring-2 focus:!ring-zinc-500 focus:!ring-offset-2 dark:!bg-white dark:!text-black dark:hover:!bg-gray-200',
                        }
                    }}
                    providers={['google']}
                    view="sign_up"
                    redirectTo={`${window.location.origin}/auth/callback`}
                />
                <p className="text-center text-sm text-gray-500">
                    Already have an account? <Link href="/login" className="underline">Login</Link>
                </p>
            </div>
        </div>
    )
}
