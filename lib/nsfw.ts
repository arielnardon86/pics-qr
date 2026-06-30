import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-cpu'
import sharp from 'sharp'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NsfwModel = any

let modelPromise: Promise<NsfwModel> | null = null

async function getModel(): Promise<NsfwModel> {
  if (!modelPromise) {
    modelPromise = (async () => {
      await tf.setBackend('cpu')
      await tf.ready()
      const nsfwjs = await import('nsfwjs')
      return nsfwjs.load()
    })()
  }
  return modelPromise
}

// Call at server startup so the model is ready before the first upload
export function warmupNsfw() {
  getModel().catch(err => console.error('[nsfw] warmup failed:', err))
}

export async function isSafeImage(buffer: Buffer): Promise<boolean> {
  try {
    const { data } = await sharp(buffer)
      .resize(224, 224)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const m = await getModel()
    const tensor = tf.tensor3d(new Uint8Array(data), [224, 224, 3])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const predictions: Array<{ className: string; probability: number }> = await m.classify(tensor)
    tensor.dispose()

    const porn    = predictions.find(p => p.className === 'Porn')?.probability    ?? 0
    const hentai  = predictions.find(p => p.className === 'Hentai')?.probability  ?? 0
    return (porn + hentai) < 0.5
  } catch (err) {
    // Fail open: if the check crashes, don't block legitimate uploads
    console.error('[nsfw] check failed, allowing image:', err)
    return true
  }
}
