import { createSignal, Show } from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import { ModelLoader, type ModelStatus } from './components/ModelLoader'
import { SentenceInput, type CompareField } from './components/SentenceInput'
import {
  SimilarityResult,
  type ComparisonResultRow,
} from './components/SimilarityResult'
import {
  cosineSimilarity,
  cosineToUnitInterval,
  interpretSimilarity,
} from './lib/similarity'
import { fetchSampleModelFile } from './lib/sampleModel'
import {
  getEmbedding,
  getEmbeddingDimensions,
  loadModel,
} from './lib/wllama'

function newCompareField(): CompareField {
  return { id: crypto.randomUUID(), value: '' }
}

const App = () => {
  const [modelStatus, setModelStatus] = createSignal<ModelStatus>('idle')
  const [modelName, setModelName] = createSignal('')
  const [modelError, setModelError] = createSignal('')
  const [sampleLoadHint, setSampleLoadHint] = createSignal<string | null>(null)

  const [targetSentence, setTargetSentence] = createSignal('')
  const [compareFields, setCompareFields] = createStore<CompareField[]>([
    newCompareField(),
    newCompareField(),
  ])

  const [computing, setComputing] = createSignal(false)
  const [computeError, setComputeError] = createSignal('')

  const [resultTarget, setResultTarget] = createSignal('')
  const [resultRows, setResultRows] = createSignal<ComparisonResultRow[] | null>(
    null
  )
  const [embeddingDim, setEmbeddingDim] = createSignal<number | null>(null)
  const [hasResult, setHasResult] = createSignal(false)

  const embCache = new Map<string, number[]>()
  let cachedTargetText = ''
  let cachedTargetEmb: number[] | null = null

  const clearEmbeddingCache = () => {
    embCache.clear()
    cachedTargetText = ''
    cachedTargetEmb = null
  }

  const addCompareField = () => {
    setCompareFields(compareFields.length, newCompareField())
  }

  const removeCompareField = (id: string) => {
    const idx = compareFields.findIndex((f) => f.id === id)
    if (idx < 0) return
    if (compareFields.length <= 1) {
      setCompareFields(0, 'value', '')
      return
    }
    setCompareFields(
      produce((draft) => {
        draft.splice(idx, 1)
      })
    )
  }

  const updateCompareField = (id: string, value: string) => {
    const idx = compareFields.findIndex((f) => f.id === id)
    if (idx >= 0) setCompareFields(idx, 'value', value)
  }

  const handleFiles = async (files: File[]) => {
    setSampleLoadHint(null)
    setModelError('')
    setModelStatus('loading')
    setModelName('')
    setHasResult(false)
    setComputeError('')
    setResultRows(null)
    try {
      const { displayName } = await loadModel(files)
      setModelName(displayName)
      setModelStatus('ready')
      setEmbeddingDim(getEmbeddingDimensions())
      clearEmbeddingCache()
    } catch (e) {
      setModelStatus('error')
      setModelError(e instanceof Error ? e.message : String(e))
    }
  }

  const handleLoadSample = async () => {
    setSampleLoadHint(null)
    setModelError('')
    setModelStatus('loading')
    setModelName('')
    setHasResult(false)
    setComputeError('')
    setResultRows(null)
    try {
      const file = await fetchSampleModelFile((loaded, total) => {
        if (total != null && total > 0) {
          setSampleLoadHint(
            `Downloading sample… ${Math.min(100, Math.round((100 * loaded) / total))}%`
          )
        } else {
          setSampleLoadHint(
            `Downloading sample… ${(loaded / (1024 * 1024)).toFixed(1)} MB`
          )
        }
      })
      setSampleLoadHint('Loading model (Wllama)…')
      const { displayName } = await loadModel([file])
      setModelName(displayName)
      setModelStatus('ready')
      setEmbeddingDim(getEmbeddingDimensions())
      clearEmbeddingCache()
    } catch (e) {
      setModelStatus('error')
      setModelError(e instanceof Error ? e.message : String(e))
    } finally {
      setSampleLoadHint(null)
    }
  }

  const embeddingFor = async (text: string): Promise<number[]> => {
    const hit = embCache.get(text)
    if (hit) return hit
    const emb = await getEmbedding(text)
    embCache.set(text, emb)
    return emb
  }

  const handleCompute = async () => {
    const target = targetSentence().trim()
    const lines = compareFields
      .map((f) => f.value.trim())
      .filter((t) => t.length > 0)

    setComputeError('')
    setComputing(true)
    setHasResult(false)
    setResultRows(null)

    try {
      let targetEmb: number[]
      if (cachedTargetText === target && cachedTargetEmb) {
        targetEmb = cachedTargetEmb
      } else {
        targetEmb = await getEmbedding(target)
        cachedTargetText = target
        cachedTargetEmb = targetEmb
        embCache.set(target, targetEmb)
      }

      const rows: ComparisonResultRow[] = []
      for (const line of lines) {
        const emb = await embeddingFor(line)
        const cos = cosineSimilarity(targetEmb, emb)
        const s01 = cosineToUnitInterval(cos)
        rows.push({
          text: line,
          cosine: cos,
          score01: s01,
          interpretation: interpretSimilarity(cos),
        })
      }

      rows.sort((a, b) => b.cosine - a.cosine)

      setResultTarget(target)
      setResultRows(rows)
      setEmbeddingDim(targetEmb.length)
      setHasResult(true)
    } catch (e) {
      setComputeError(e instanceof Error ? e.message : String(e))
    } finally {
      setComputing(false)
    }
  }

  const modelReady = () => modelStatus() === 'ready'

  return (
    <div class="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div class="mx-auto max-w-3xl">
        <header class="mb-10 text-center">
          <h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Sentence similarity
          </h1>
          <p class="mt-2 text-slate-600 dark:text-slate-400">
            SolidJS + Wllama — compare many sentences to one target, in your
            browser
          </p>
        </header>

        <div class="flex flex-col gap-6">
          <ModelLoader
            status={modelStatus}
            modelName={modelName}
            error={modelError}
            onFilesSelected={handleFiles}
            onLoadSample={handleLoadSample}
            sampleFetchProgress={sampleLoadHint}
          />
          <SentenceInput
            targetSentence={targetSentence}
            setTargetSentence={setTargetSentence}
            compareFields={compareFields}
            onAddCompareField={addCompareField}
            onRemoveCompareField={removeCompareField}
            onCompareFieldChange={updateCompareField}
            disabled={() => modelStatus() === 'loading'}
            onCompute={handleCompute}
            computing={computing}
            modelReady={modelReady}
          />
          <SimilarityResult
            targetText={resultTarget}
            rows={resultRows}
            embeddingDim={embeddingDim}
            error={computeError}
            visible={() => hasResult()}
          />
        </div>

        <Show when={modelStatus() === 'loading'}>
          <p class="mt-6 text-center text-sm text-slate-500">
            First load downloads WASM from CDN; large models may take a while.
          </p>
        </Show>

        <footer class="mt-12 text-center text-xs text-slate-400">
          Interpretation bands use raw cosine (≥0.8 / ≥0.5). Use an{' '}
          <strong>embedding</strong> GGUF, not a chat-only model.
        </footer>
      </div>
    </div>
  )
}

export default App