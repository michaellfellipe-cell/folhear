import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { system, message, maxTokens = 1500, cacheKey, model = 'haiku' } = await req.json()

    // Check cache first
    if (cacheKey) {
      const { data: cached } = await supabase
        .from('ai_cache')
        .select('response, expires_at')
        .eq('cache_key', cacheKey)
        .single()

      if (cached && new Date(cached.expires_at) > new Date()) {
        return NextResponse.json({ text: cached.response.text, cached: true })
      }
    }

    // Choose model: haiku for simple tasks, sonnet for complex
    const modelId = model === 'sonnet'
      ? 'claude-sonnet-4-6'
      : 'claude-haiku-4-5-20251001'

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: message }],
      }),
    })

    const data = await anthropicRes.json()
    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 500 })

    const text = (data.content || []).map((b: any) => b.text || '').join('')

    // Store in cache if cacheKey provided
    if (cacheKey) {
      await supabase.from('ai_cache').upsert({
        cache_key: cacheKey,
        response: { text },
        model: modelId,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'cache_key' })
    }

    return NextResponse.json({ text })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
