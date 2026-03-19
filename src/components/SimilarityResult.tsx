import type { Accessor } from 'solid-js'

export interface ComparisonResultRow {
  text: string
  cosine: number
  score01: number
  interpretation: string
}

export interface SimilarityResultProps {
  targetText: Accessor<string>
  rows: Accessor<ComparisonResultRow[] | null>
  embeddingDim: Accessor<number | null>
  error: Accessor<string>
  visible: Accessor<boolean>
}

export const SimilarityResult = (props: SimilarityResultProps) => {
  const getMaxScore = () => {
    const rows = props.rows()
    if (!rows || rows.length === 0) return null
    return Math.max(...rows.map((r) => r.score01))
  }

  const isHighestScore = (score: number) => {
    const maxScore = getMaxScore()
    return maxScore !== null && Math.abs(score - maxScore) < 0.0001
  }

  return (
    <section
      class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50"
      classList={{ hidden: !props.visible() && !props.error() }}
    >
      <h2 class="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
        3. Results
      </h2>
      {props.error() && (
        <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
          {props.error()}
        </p>
      )}
      {props.visible() && props.rows() && props.rows()!.length > 0 && (
        <div class="space-y-4">
          <div class="rounded-xl bg-violet-50 px-4 py-3 dark:bg-violet-950/30">
            <p class="text-xs font-medium uppercase tracking-wide text-violet-700 dark:text-violet-300">
              Target sentence
            </p>
            <p class="mt-1 text-sm text-slate-800 dark:text-slate-200">
              {props.targetText()}
            </p>
          </div>
          <p class="text-sm text-slate-600 dark:text-slate-400">
            Similarity of each line to the target (highest first). Score 0–1 ={' '}
            <span class="font-mono text-xs">(cosine + 1) / 2</span>
          </p>
          {props.embeddingDim() != null && (
            <p class="text-xs text-slate-500">
              Embedding length:{' '}
              <span class="font-mono">{props.embeddingDim()}</span>
            </p>
          )}
          <ul class="space-y-4">
            {props.rows()!.map((row) => (
              <li
                class="rounded-xl border p-4 dark:border-slate-600"
                classList={{
                  'border-emerald-300 bg-emerald-50/70 dark:border-emerald-600 dark:bg-emerald-950/30 ring-2 ring-emerald-400/40':
                    isHighestScore(row.score01),
                  'border-slate-200': !isHighestScore(row.score01),
                }}
              >
                <p class={`mb-3 text-sm text-slate-800 dark:text-slate-200 ${isHighestScore(row.score01) ? 'font-semibold' : ''}`}>
                  {row.text}
                </p>
                <div class="flex flex-wrap items-end gap-4">
                  <div>
                    <p class="text-xs text-slate-500">Score (0–1)</p>
                    <p class="text-2xl font-bold text-violet-600 dark:text-violet-400">
                      {row.score01.toFixed(4)}
                    </p>
                  </div>
                  <div>
                    <p class="text-xs text-slate-500">Cosine</p>
                    <p class="font-mono text-sm font-medium text-slate-700 dark:text-slate-300">
                      {row.cosine.toFixed(4)}
                    </p>
                  </div>
                  <div class="flex-1 min-w-35">
                    <p class="text-xs text-slate-500">{row.interpretation}</p>
                    <div class="mt-1 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        class="h-full rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500"
                        style={{
                          width: `${Math.min(100, Math.max(0, row.score01 * 100))}%`,
                        }}
                        role="progressbar"
                        aria-valuenow={row.score01}
                        aria-valuemin={0}
                        aria-valuemax={1}
                      />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
