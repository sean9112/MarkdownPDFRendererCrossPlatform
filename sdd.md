# Software Design Document

## Purpose

`Markdown PDF Renderer` is a cross-platform Electron desktop application for previewing Markdown with LaTeX, Mermaid, and local assets, then exporting the rendered result as a single-page PDF. The project intentionally preserves the original renderer HTML template and output style from the earlier Swift version.

## Goals

- Keep preview and export visually aligned with the original renderer template
- Support local asset resolution for imported Markdown projects
- Keep the UX simple: import, preview, export
- Minimize locale complexity while still supporting Traditional Chinese and English
- Preserve a packaging flow that works for macOS, Windows, and Linux

## Non-Goals

- Rich-text editing inside the app
- Multi-page paginated PDF export
- Full i18n framework or dynamic language switching in-app
- Server-side components or cloud sync

## High-Level Architecture

### Renderer UI

- Entry: `src/main.tsx`
- Main screen: `src/App.tsx`
- Shared UI/runtime helpers: `src/appSupport.ts`
- Locale content: `src/i18n.ts`
- Built-in sample Markdown: `src/sampleMarkdown.ts`
- Styling: `src/styles.css`

The React app is a thin desktop shell around a preview iframe. It manages:

- import/export buttons
- user-facing status messages
- preview iframe lifecycle
- locale-aware copy
- “busy” states while previewing or exporting

### Markdown Rendering Surface

- HTML template: `public/renderer/renderer.html`

This file is intentionally reused from the original app. React does not render the Markdown content itself. Instead, the app loads the renderer inside an iframe and calls `window.CodexRenderer.renderMarkdownFromSource(...)`.

### Electron Main Process

- App entry: `electron/main.cjs`
- Native import flow: `electron/importer.cjs`
- PDF export flow: `electron/exporter.cjs`
- Locale-aware native strings: `electron/locale.cjs`
- Preload bridge: `electron/preload.cjs`

Electron owns anything OS-facing:

- open file/folder dialogs
- save dialog for PDF export
- opening external links or local files
- hidden browser window used for production PDF generation

## Core Runtime Flow

### Import Flow

1. User clicks import in `src/App.tsx`
2. Renderer process calls `window.markdownPdfRenderer.importSource(kind)`
3. Preload forwards the IPC request
4. `electron/main.cjs` delegates to `electron/importer.cjs`
5. Importer opens the native dialog based on import kind:
   - file
   - folder
   - zip
6. Importer resolves the actual Markdown file:
   - direct file import uses the selected file
   - folder import recursively searches for Markdown files
   - zip import extracts to temp, then searches recursively
7. The imported payload returned to React contains:
   - `displayPath`
   - `markdownText`
   - `baseHref`
   - `sourceRootHref`
8. React updates document state and rerenders the iframe preview

### Preview Flow

1. `src/App.tsx` waits for iframe load
2. `waitUntilRendererReady(...)` polls until `CodexRenderer` is available
3. React sends the imported Markdown payload into the iframe renderer
4. `installLinkBridge(...)` upgrades links:
   - external HTTP/HTTPS links open via OS handler in Electron mode
   - local file links can be opened through Electron
   - browser fallback still opens web links in a new tab

### Export Flow

1. User clicks export in `src/App.tsx`
2. Renderer process sends `exportPdf(...)` through preload IPC
3. `electron/exporter.cjs` opens a save dialog
4. Exporter creates a hidden `BrowserWindow`
5. It loads the same renderer HTML
6. It injects the current Markdown payload
7. It waits for:
   - renderer readiness
   - fonts
   - images
   - stable metrics
8. It prepares the renderer for single-page export
9. Chromium `printToPDF()` generates the final PDF bytes
10. Electron writes the PDF to disk

## Locale Strategy

Locale behavior is intentionally simple.

- If the environment language starts with `zh`, the app uses `zh-TW`
- Everything else uses English

There is no manual language switcher in the app.

### Locale Entry Points

- Renderer/UI locale detection: `src/i18n.ts`
- Electron/native dialog locale detection: `electron/locale.cjs`

Keep these two in sync if locale rules ever change.

## Important Design Decisions

### 1. React does not own Markdown rendering

The React UI is only a shell. The actual document rendering lives in the reused renderer HTML. This keeps compatibility with the original app’s visual output.

### 2. Export uses a hidden Chromium window

Export is intentionally decoupled from the visible preview iframe so that PDF generation is deterministic and can wait for stable metrics without disturbing the visible UI.

### 3. Single-page PDF is preferred over selectable text PDF

The app preserves the original behavior of fitting long content onto one page instead of letting Chromium paginate it.

### 4. Locale copy is centralized

All renderer-side copy should live in `src/i18n.ts`. All Electron-native copy should live in `electron/locale.cjs`.

Do not reintroduce inline hard-coded UI strings unless there is a very strong reason.

## Key Files To Read First

If you are coming back to this project later, read these files in this order:

1. `sdd.md`
2. `README.md`
3. `src/App.tsx`
4. `src/appSupport.ts`
5. `src/i18n.ts`
6. `electron/main.cjs`
7. `electron/importer.cjs`
8. `electron/exporter.cjs`

That should be enough to recover the architecture quickly.

## Safe Change Guidelines

### When changing UI copy

- Update `src/i18n.ts`
- If the change affects native dialogs or Electron-thrown user-facing errors, also update `electron/locale.cjs`

### When changing import behavior

- Start in `electron/importer.cjs`
- Be careful not to break relative asset resolution
- Verify folder and zip import both still work

### When changing export behavior

- Start in `electron/exporter.cjs`
- Verify hidden-window rendering still waits for fonts and images
- Watch for regressions in oversized documents and metric stabilization

### When changing renderer integration

- The iframe and hidden export window both depend on the same renderer contract:
  `window.CodexRenderer.renderMarkdownFromSource(...)`
- Any change to that contract must be tested in both preview and export paths

## Verification Checklist

Run these after meaningful changes:

```bash
npm run check
```

For Electron packaging changes, also run:

```bash
npm run package:mac:app
```

Manual smoke checks:

- import a `.md` file
- import a folder with relative assets
- import a `.zip`
- preview LaTeX
- preview Mermaid
- export PDF
- verify Chinese environment uses `zh-TW`
- verify non-Chinese environment uses English

## Known Tradeoffs

- Export is image-based, not selectable text
- Locale support is intentionally only two-mode: `zh-TW` or English
- The project still relies on a reused renderer HTML rather than a React-native renderer pipeline

## Future Refactor Candidates

- Split `src/App.tsx` into presentational subcomponents
- Add automated smoke tests for import/export flows
- Add a shared constant module for app metadata and repeated magic values
- Introduce lightweight lint/format scripts if the project grows further
