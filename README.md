# Markdown PDF Renderer

Cross-platform Electron rewrite of the original macOS Swift `MarkdownPDFRenderer`, preserving the existing HTML renderer template, visual tone, and single-page PDF export model while making the app runnable on macOS, Windows, and Linux.

## Highlights

- Import a single `.md` / `.markdown` file
- Import a folder and auto-detect `content.md`, `index.md`, or `README.md`
- Import a `.zip` archive into a temporary workspace
- Preview Markdown, LaTeX, Mermaid, and relative local assets with the reused renderer template
- Open external links and local file links through the OS default handler
- Export a single-page Chromium-rendered PDF
- Automatically use Traditional Chinese (`zh-TW`) for Chinese environments and English for all other locales

## Stack

- Electron main process for native file dialogs, file opening, and PDF export
- React + TypeScript + Vite for the desktop UI shell
- Reused `public/renderer/renderer.html` from the original Swift app for the Markdown rendering surface
- `electron-builder` for desktop packaging

## Scripts

Install dependencies:

```bash
npm install
```

Run the app in development:

```bash
npm run dev
```

Run the main verification step:

```bash
npm run check
```

Build the renderer bundle:

```bash
npm run build
```

Package the desktop app:

```bash
npm run package
```

Package a raw macOS `.app` bundle:

```bash
npm run package:mac:app
```

Package Linux AppImage:

```bash
npm run package:linux
```

Package Windows NSIS `.exe`:

```bash
npm run package:win:exe
```

Remove generated build artifacts:

```bash
npm run clean
```

## Project Layout

- `src/`
  React UI shell, locale-aware copy, shared types, and entrypoint bootstrap.
- `electron/`
  Electron main process, preload bridge, native import flow, locale-aware dialog copy, and hidden-window PDF export.
- `public/renderer/renderer.html`
  Original renderer template reused from the Swift version.
- `buildResources/`
  App icons for packaged desktop builds.
- `Scripts/clean.mjs`
  Removes generated artifacts and stray `.DS_Store` files.
- `sdd.md`
  Design and maintenance notes for future changes.

## Packaging Output

Generated desktop artifacts are written to `release/`.

## Notes

- PDF export is intentionally image-based instead of selectable-text PDF so long documents can remain on a single page.
- The current locale strategy is intentionally simple: any `zh-*` environment becomes `zh-TW`; everything else becomes English.
- If you are continuing work on this project later, read `sdd.md` first before tracing the whole codebase again.
