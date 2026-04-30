import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const prefix = (formData.get('prefix') as string) || 'upload'

  if (!file) {
    return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
  }

  const maxSize = 10 * 1024 * 1024 // 10 MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'Ukuran file maksimal 10MB' }, { status: 400 })
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Format file tidak didukung. Gunakan JPG, PNG, atau PDF.' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const path = `bookings/${filename}`

  const supabase = createServiceClient()
  const arrayBuffer = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('booking-uploads')
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('booking-uploads')
    .getPublicUrl(path)

  return NextResponse.json({ url: publicUrl }, { status: 201 })
}
