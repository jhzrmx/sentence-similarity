import { assertResponseNotHtml, assertValidGgufBlobs } from './ggufValidate'

/** Served from `public/assets/models/` (Vite root) */
export const SAMPLE_MODEL_FILENAME = 'all-MiniLM-L6-v2-Q4_K_M.gguf'
export const SAMPLE_MODEL_URL = `${import.meta.env.BASE_URL}assets/models/${SAMPLE_MODEL_FILENAME}`

export async function fetchSampleModelFile(
  onProgress?: (loaded: number, total: number | null) => void
): Promise<File> {
  const res = await fetch(SAMPLE_MODEL_URL)
  if (!res.ok) {
    throw new Error(
      `Sample model not found (${res.status}). Place ${SAMPLE_MODEL_FILENAME} in public/assets/models/`
    )
  }
  assertResponseNotHtml(res, 'Sample model')
  const total = res.headers.get('content-length')
    ? Number(res.headers.get('content-length'))
    : null
  const body = res.body
  if (!body) {
    const blob = await res.blob()
    onProgress?.(blob.size, blob.size)
    const file = new File([blob], SAMPLE_MODEL_FILENAME, {
      type: 'application/octet-stream',
    })
    await assertValidGgufBlobs([file], 'sample')
    return file
  }
  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let loaded = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) {
      chunks.push(value)
      loaded += value.length
      onProgress?.(loaded, total)
    }
  }
  const blob = new Blob(chunks as BlobPart[], {
    type: 'application/octet-stream',
  })
  const file = new File([blob], SAMPLE_MODEL_FILENAME, {
    type: 'application/octet-stream',
  })
  await assertValidGgufBlobs([file], 'sample')
  return file
}
