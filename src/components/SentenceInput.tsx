import { For, type Accessor } from 'solid-js'
import type { Store } from 'solid-js/store'

export interface CompareField {
  id: string
  value: string
}

export interface SentenceInputProps {
  targetSentence: Accessor<string>
  setTargetSentence: (v: string) => void
  /** Reactive list from createStore — keeps focus stable while typing */
  compareFields: Store<CompareField[]>
  onAddCompareField: () => void
  onRemoveCompareField: (id: string) => void
  onCompareFieldChange: (id: string, value: string) => void
  disabled: Accessor<boolean>
  onCompute: () => void
  computing: Accessor<boolean>
  modelReady: Accessor<boolean>
}

export function SentenceInput(props: SentenceInputProps) {
  const nonEmptyComparisons = () =>
    props.compareFields
      .map((f) => f.value.trim())
      .filter((t) => t.length > 0)

  const canCompute = () =>
    props.modelReady() &&
    !props.computing() &&
    !props.disabled() &&
    props.targetSentence().trim().length > 0 &&
    nonEmptyComparisons().length > 0

  const canRemove = () => props.compareFields.length > 1

  return (
    <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
      <h2 class="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
        2. Sentences
      </h2>

      <div class="space-y-5">
        <div>
          <label
            for="target-sentence"
            class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Input sentence
          </label>
          <textarea
            id="target-sentence"
            rows={3}
            class="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            placeholder="The sentence to compare others against…"
            value={props.targetSentence()}
            onInput={(e) => props.setTargetSentence(e.currentTarget.value)}
            disabled={props.disabled()}
          />
        </div>

        <div>
          <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
              Sentences to compare
            </label>
            <button
              type="button"
              class="rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700 transition hover:bg-violet-100 disabled:opacity-50 dark:border-violet-700 dark:bg-violet-950/50 dark:text-violet-300 dark:hover:bg-violet-900/50"
              disabled={props.disabled()}
              onClick={() => props.onAddCompareField()}
            >
              + Add sentence
            </button>
          </div>
          <p class="mb-3 text-xs text-slate-500 dark:text-slate-400">
            Add or remove text boxes. Empty boxes are ignored when computing.
          </p>
          <ul class="space-y-3">
            <For each={props.compareFields}>
              {(field) => (
                <li class="flex gap-2">
                  <textarea
                    id={`compare-${field.id}`}
                    rows={2}
                    class="min-w-0 flex-1 resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="Sentence to compare to the target…"
                    value={field.value}
                    onInput={(e) =>
                      props.onCompareFieldChange(field.id, e.currentTarget.value)
                    }
                    disabled={props.disabled()}
                  />
                  <button
                    type="button"
                    class="shrink-0 self-start rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-400 dark:hover:border-red-800 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                    disabled={!canRemove() || props.disabled()}
                    title={
                      canRemove()
                        ? 'Remove this sentence'
                        : 'Keep at least one box'
                    }
                    onClick={() => props.onRemoveCompareField(field.id)}
                  >
                    Remove
                  </button>
                </li>
              )}
            </For>
          </ul>
        </div>
      </div>

      <div class="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-slate-900"
          disabled={!canCompute()}
          onClick={() => props.onCompute()}
        >
          {props.computing() ? (
            <span class="flex items-center gap-2">
              <span
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                aria-hidden="true"
              />
              Computing…
            </span>
          ) : (
            'Compute similarity to target'
          )}
        </button>
        {!props.modelReady() && (
          <span class="text-sm text-amber-600 dark:text-amber-400">
            Load a model first
          </span>
        )}
      </div>
    </section>
  )
}
