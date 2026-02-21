import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get('photo') as File

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        const cookieStore = cookies()
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${session.user.id}_${Date.now()}.${fileExt}`
        const { data, error } = await supabase.storage
            .from('user-photos')
            .upload(fileName, file)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const { data: { publicUrl } } = supabase.storage
            .from('user-photos')
            .getPublicUrl(fileName)

        // Update user profile with photo URL
        // TODO: Update Prisma User record

        return NextResponse.json({ url: publicUrl })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
