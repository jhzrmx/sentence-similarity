import { createSignal, type Accessor } from 'solid-js'

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface ModelLoaderProps {
  status: Accessor<ModelStatus>
  modelName: Accessor<string>
  error: Accessor<string>
  onFilesSelected: (files: File[]) => void
  /** Fetch bundled sample GGUF from /assets/models/ */
  onLoadSample?: () => void
  sampleFetchProgress?: Accessor<string | null>
  /** Unload the current model */
  onUnload?: () => void
}

const ggufFilesFromList = (files: FileList | File[]): File[] => {
  return Array.from(files).filter((f) =>
    f.name.toLowerCase().endsWith('.gguf')
  )
}

export const ModelLoader = (props: ModelLoaderProps) => {
  const [dragOver, setDragOver] = createSignal(false)

  const statusLabel = () => {
    switch (props.status()) {
      case 'idle':
        return 'No model'
      case 'loading':
        return 'Loading…'
      case 'ready':
        return 'Ready'
      case 'error':
        return 'Error'
      default:
        return ''
    }
  }

  const statusClass = () => {
    switch (props.status()) {
      case 'ready':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30'
      case 'loading':
        return 'bg-amber-500/15 text-amber-800 dark:text-amber-200 ring-amber-500/30'
      case 'error':
        return 'bg-red-500/15 text-red-700 dark:text-red-300 ring-red-500/30'
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 ring-slate-500/20'
    }
  }

  const dropZoneClass = () => {
    const base =
      'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 transition'
    const idle =
      'border-slate-300 bg-slate-50 hover:border-violet-400 hover:bg-violet-50/50 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:border-violet-500 dark:hover:bg-violet-950/20'
    const active =
      'border-violet-500 bg-violet-100/80 ring-2 ring-violet-400/50 dark:border-violet-400 dark:bg-violet-950/40 dark:ring-violet-500/30'
    const disabled = 'pointer-events-none opacity-50'
    if (props.status() === 'loading') return `${base} ${idle} ${disabled}`
    if (dragOver()) return `${base} ${active}`
    return `${base} ${idle}`
  }

  function onDragEnter(e: DragEvent) {
    if (props.status() === 'loading') return
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }

  function onDragLeave(e: DragEvent) {
    if (props.status() === 'loading') return
    const current = e.currentTarget as Node
    const related = e.relatedTarget as Node | null
    if (!related || !current.contains(related)) {
      setDragOver(false)
    }
  }

  function onDragOver(e: DragEvent) {
    if (props.status() === 'loading') return
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer!.dropEffect = 'copy'
  }

  function onDrop(e: DragEvent) {
    if (props.status() === 'loading') return
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const files = ggufFilesFromList(e.dataTransfer!.files)
    if (files.length > 0) {
      props.onFilesSelected(files)
    }
  }

  return (
    <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
          1. Embedding model
        </h2>
        <span
          class={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset ${statusClass()}`}
        >
          {statusLabel()}
        </span>
      </div>
      <p class="mb-4 text-sm text-slate-600 dark:text-slate-400">
        Upload a local <strong>GGUF</strong> embedding model (e.g. nomic-embed,
        bge-small). Split shards: select or drop all parts together.
      </p>
      <label
        class={dropZoneClass()}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <input
          type="file"
          accept=".gguf"
          multiple
          class="sr-only"
          disabled={props.status() === 'loading'}
          onChange={(e) => {
            const list = e.currentTarget.files
            if (!list?.length) return
            props.onFilesSelected(Array.from(list))
            e.currentTarget.value = ''
          }}
        />
        <span class="text-2xl" aria-hidden="true">
          📁
        </span>
        <span class="mt-2 text-center font-medium text-violet-600 dark:text-violet-400">
          {dragOver()
            ? 'Drop .gguf file(s) here'
            : 'Choose .gguf file(s) or drag & drop'}
        </span>
        <span class="mt-1 text-xs text-slate-500">
          Runs only in your browser
        </span>
      </label>
      {props.status() === 'ready' ? (
        <div class="mt-4 flex flex-col items-center gap-2 border-t border-slate-200 pt-4 dark:border-slate-600">
          <button
            type="button"
            class="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-red-500 dark:hover:bg-red-950/30"
            onClick={() => props.onUnload?.()}
          >
            Unload
          </button>
        </div>
      ) : props.onLoadSample ? (
        <div class="mt-4 flex flex-col items-center gap-2 border-t border-slate-200 pt-4 dark:border-slate-600">
          <p class="text-center text-xs text-slate-500 dark:text-slate-400">
            Or load the bundled sample (small English embedding model)
          </p>
          <button
            type="button"
            class="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:border-violet-400 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-violet-500 dark:hover:bg-violet-950/30"
            disabled={props.status() === 'loading'}
            onClick={() => props.onLoadSample?.()}
          >
            Load sample model (MiniLM-L6-v2 Q4) [20MB]
          </button>
          {props.sampleFetchProgress?.() && (
            <p class="text-center text-xs text-slate-500 dark:text-slate-400">
              {props.sampleFetchProgress()}
            </p>
          )}
        </div>
      ) : null}
      {props.modelName() && props.status() === 'ready' && (
        <p class="mt-4 text-sm text-slate-700 dark:text-slate-300">
          <span class="font-medium">Model:</span> {props.modelName()}
        </p>
      )}
      {props.error() && props.status() === 'error' && (
        <p class="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
          {props.error()}
        </p>
      )}
    </section>
  )
}