// POSSIBLE counts as unsafe for adult; LIKELY/VERY_LIKELY for violence
const UNSAFE_ADULT    = new Set(['POSSIBLE', 'LIKELY', 'VERY_LIKELY'])
const UNSAFE_VIOLENCE = new Set(['LIKELY', 'VERY_LIKELY'])

export async function isSafeImage(buffer: Buffer): Promise<boolean> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY
  if (!apiKey) {
    console.warn('[nsfw] GOOGLE_VISION_API_KEY not set — skipping check')
    return true
  }

  try {
    const res = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: buffer.toString('base64') },
            features: [{ type: 'SAFE_SEARCH_DETECTION', maxResults: 1 }],
          }],
        }),
      }
    )

    if (!res.ok) {
      const text = await res.text()
      console.error('[nsfw] Vision API HTTP error:', res.status, text)
      return true
    }

    const data = await res.json()
    const s = data.responses?.[0]?.safeSearchAnnotation
    if (!s) {
      console.warn('[nsfw] Vision API returned no safeSearchAnnotation')
      return true
    }

    console.log(`[nsfw] adult=${s.adult} violence=${s.violence} racy=${s.racy}`)

    const safe = !UNSAFE_ADULT.has(s.adult) && !UNSAFE_VIOLENCE.has(s.violence)
    if (!safe) console.log('[nsfw] image REJECTED')
    return safe
  } catch (err) {
    console.error('[nsfw] Vision API error, allowing image:', err)
    return true
  }
}
