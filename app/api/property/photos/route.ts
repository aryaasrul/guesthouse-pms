import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })

  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'Ukuran file maksimal 10MB' }, { status: 400 })
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Format harus JPG, PNG, atau WebP' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filename = `property_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`
  const path = `property/${filename}`

  const service = createServiceClient()
  const buffer = await file.arrayBuffer()

  const { error: uploadError } = await service.storage
    .from('property-photos')
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = service.storage
    .from('property-photos')
    .getPublicUrl(path)

  return NextResponse.json({ url: publicUrl }, { status: 201 })
}
