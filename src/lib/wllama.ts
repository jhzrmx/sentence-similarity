import { Wllama, WllamaError, type LoadModelConfig } from '@wllama/wllama'
import { assertValidGgufBlobs } from './ggufValidate'

/** Match installed @wllama/wllama version for CDN wasm */
const WLLAMA_VERSION = '2.3.7'

const WASM_PATHS = {
  'single-thread/wllama.wasm': `https://cdn.jsdelivr.net/npm/@wllama/wllama@${WLLAMA_VERSION}/src/single-thread/wllama.wasm`,
  'multi-thread/wllama.wasm': `https://cdn.jsdelivr.net/npm/@wllama/wllama@${WLLAMA_VERSION}/src/multi-thread/wllama.wasm`,
} as const

let singleton: Wllama | null = null

export function isGgufFileName(name: string): boolean {
  return /^.*\.gguf(?:\?.*)?$/i.test(name)
}

async function getInstance(): Promise<Wllama> {
  if (!singleton) {
    singleton = new Wllama(WASM_PATHS)
  }
  return singleton
}

const defaultLoadConfig: LoadModelConfig = {
  embeddings: true,
  n_ctx: 2048,
  n_batch: 512,
}

/**
 * Load embedding model from uploaded file(s). Replaces any previously loaded model.
 */
export async function loadModel(files: File[]): Promise<{ displayName: string }> {
  if (!files.length) {
    throw new Error('No model file selected')
  }
  for (const f of files) {
    if (!isGgufFileName(f.name)) {
      throw new Error(`Invalid file: "${f.name}" — expected a .gguf model`)
    }
  }

  await assertValidGgufBlobs(files)

  const w = await getInstance()
  if (w.isModelLoaded()) {
    await w.exit()
  }

  try {
    await w.loadModel(files, defaultLoadConfig)
  } catch (e) {
    const s = String(e)
    if (
      e instanceof RangeError ||
      s.includes('Invalid typed array') ||
      s.includes('Array buffer allocation failed')
    ) {
      throw new Error(
        'Model load failed: invalid memory request (usually corrupt or wrong file type). ' +
          'Use a real embedding GGUF binary — not a Git LFS pointer, HTML page, or chat-only model.'
      )
    }
    const msg =
      e instanceof WllamaError ? `${e.type}: ${e.message}` : s
    throw new Error(msg || 'Failed to load model')
  }

  let displayName = files.map((f) => f.name).join(' + ')
  try {
    const meta = w.getModelMetadata()
    const name = meta.meta['general.name']
    if (name) displayName = name
  } catch {
    /* use file names */
  }

  return { displayName }
}

export function isModelReady(): boolean {
  return singleton?.isModelLoaded() ?? false
}

/**
 * Embedding vector for one text (Wllama createEmbedding).
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const w = await getInstance()
  if (!w.isModelLoaded()) {
    throw new Error('No model loaded. Upload an embedding GGUF model first.')
  }
  const trimmed = text.trim()
  if (!trimmed) {
    throw new Error('Sentence cannot be empty')
  }
  try {
    return await w.createEmbedding(trimmed)
  } catch (e) {
    const msg =
      e instanceof WllamaError ? `${e.type}: ${e.message}` : String(e)
    throw new Error(msg || 'Embedding inference failed')
  }
}

export function getEmbeddingDimensions(): number | null {
  if (!singleton?.isModelLoaded()) return null
  try {
    return singleton.getLoadedContextInfo().n_embd
  } catch {
    return null
  }
}
