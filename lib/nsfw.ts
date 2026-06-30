const UNSAFE = new Set(['LIKELY', 'VERY_LIKELY'])

export async function isSafeImage(buffer: Buffer): Promise<boolean> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY
  if (!apiKey) return true

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

    if (!res.ok) return true

    const data = await res.json()
    const s = data.responses?.[0]?.safeSearchAnnotation
    if (!s) return true

    return !UNSAFE.has(s.adult) && !UNSAFE.has(s.violence)
  } catch (err) {
    console.error('[nsfw] Vision API error, allowing image:', err)
    return true
  }
}
