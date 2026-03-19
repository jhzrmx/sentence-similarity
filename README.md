# Sentence Similarity (SolidJS + Wllama)

Client-only app: upload a **GGUF embedding model**, enter sentences, get **cosine similarity** via [Wllama](https://github.com/ngxson/wllama) (WebAssembly).

## Setup

```bash
npm install
npm run dev
```

Open the URL shown (e.g. `http://localhost:5173`). **Use a real embedding GGUF** (e.g. `nomic-embed-text`, `bge-small-en-v1.5` in GGUF form)—chat models without embedding support will fail.

**Sample model:** `all-MiniLM-L6-v2-Q4_K_M.gguf` is found at `public/assets/models/` to enable **Load sample model**.

## Build

```bash
npm run build
npm run preview
```

### PWA

Production build emits a **service worker** + **web manifest** (installable app). Precache covers the app shell; **Wllama `.wasm`** files are cached at runtime from jsDelivr. Large local **`.gguf`** models are not precached.

`npm install` uses `legacy-peer-deps` (`.npmrc`) so `vite-plugin-pwa` works with **Vite 8** until peer ranges catch up.

## Deploying

The dev server sets **COOP** / **COEP** headers so Wllama can use multi-thread WASM. For production, configure the same headers on your host:

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

WASM is loaded from jsDelivr (`@wllama/wllama`); the model stays local in the browser.

## Scripts

| Script        | Description                    |
| ------------- | ------------------------------ |
| `npm run dev` | Vite dev server                |
| `npm run build` | Production bundle            |
| `npm run preview` | Preview production build     |
| `npm run typecheck` | `tsc` (may hit upstream quirks) |

## Stack

SolidJS · Vite · **Tailwind CSS v4** (`@tailwindcss/vite` — no `tailwind.config` / PostCSS) · `@wllama/wllama`

`package.json` includes an npm **override** so `@tailwindcss/vite` accepts Vite 8.
