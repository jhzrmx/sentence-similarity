const GGUF_MAGIC = 'GGUF'

/**
 * Reject obvious non-GGUF inputs before Wllama runs (avoids RangeError / huge allocations
 * when the parser reads garbage from HTML, Git LFS pointers, etc.).
 */
export const assertValidGgufBlobs = async (
  blobs: Blob[],
  label = 'model'
): Promise<void> => {
  for (let i = 0; i < blobs.length; i++) {
    const blob = blobs[i]
    const name = blob instanceof File ? blob.name : `${label} part ${i + 1}`

    if (blob.size < 64) {
      throw new Error(
        `"${name}" is too small (${blob.size} B) to be a GGUF file.`
      )
    }
    if (blob.size > 2_100_000_000) {
      throw new Error(
        `"${name}" is larger than ~2GB — browsers cannot load it as one file.`
      )
    }

    const head = new Uint8Array(await blob.slice(0, 128).arrayBuffer())
    const asText = new TextDecoder('utf-8', { fatal: false }).decode(head)

    if (asText.startsWith('version https://git-lfs.github.com')) {
      throw new Error(
        `"${name}" is a Git LFS pointer, not the real GGUF. Run \`git lfs pull\` or download the full .gguf binary.`
      )
    }
    if (asText.trimStart().startsWith('<!DOCTYPE') || asText.trimStart().startsWith('<html')) {
      throw new Error(
        `"${name}" looks like HTML (404 page?). Use the real GGUF binary, not a web page.`
      )
    }

    const magic = String.fromCharCode(head[0], head[1], head[2], head[3])
    if (magic !== GGUF_MAGIC) {
      throw new Error(
        `"${name}" is not valid GGUF (missing "GGUF" magic). ` +
          `For "Load sample", place the full all-MiniLM-L6-v2 Q4 GGUF in public/assets/models/.`
      )
    }
  }
}

export const assertResponseNotHtml = (res: Response, context: string): void => {
  const ct = (res.headers.get('content-type') || '').toLowerCase()
  if (ct.includes('text/html')) {
    throw new Error(
      `${context}: server returned HTML instead of binary. Put the real .gguf in public/assets/models/.`
    )
  }
}
