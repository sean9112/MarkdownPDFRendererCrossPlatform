# MarkdownPDFRendererCrossPlatform

Electron + Chromium rewrite of the original macOS Swift app, keeping the renderer template, palette, layout hierarchy, and single-page PDF export model as closely as possible.

## Current Stack

- Desktop shell: Electron
- Renderer: Chromium
- UI: React + TypeScript + Vite
- Import / export host: Electron main process
- Markdown renderer: reused `renderer.html` from the original macOS Swift app

## Current Features

- Import a single `.md` / `.markdown` file
- Import a folder and auto-detect `content.md` / `index.md` / `README.md`
- Import a `.zip` archive and extract it to a temporary workspace
- Preview Markdown / LaTeX / Mermaid with the original HTML template
- Resolve local relative assets through the original renderer base-path logic
- Open local linked files and external links through the OS default handler
- Export a single-page image-based PDF through a hidden Chromium window

## Scripts

Install dependencies:

```bash
npm install
```

Run the Electron app in development:

```bash
npm run dev
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

## Packaging Outputs

- macOS: `release/`
- Windows: `release/`
- Linux AppImage: `release/`

## GitHub Actions

The repository includes [`.github/workflows/build-desktop.yml`](.github/workflows/build-desktop.yml), which builds:

- macOS: raw `.app` bundle
- Windows: `.exe` installer
- Linux: `.AppImage`

It runs on `push` to `main`, on pull requests, and via manual `workflow_dispatch`.

After each run, download the artifacts from the Actions page:

- `macos-app`
- `windows-exe`
- `linux-appimage`

GitHub stores artifacts as downloadable archives, so the macOS artifact is delivered as an archive containing the `.app` bundle.

## Project Layout

- `electron/`
  Electron main process, preload bridge, native import flow, and Chromium PDF export.
- `src/`
  React UI that mirrors the original `MarkdownPDFRenderer` layout and status flow.
- `public/renderer/renderer.html`
  Original renderer template copied from the Swift project.
- `buildResources/`
  Packaged application icons reused from the original Swift build.
- `Scripts/build-appimage.sh`
  Convenience wrapper for Linux AppImage packaging.
- `Scripts/clean.mjs`
  Removes generated build artifacts and stray `.DS_Store` files.

## Tradeoff

The export path is intentionally image-based instead of selectable-text PDF so long Markdown documents can remain on one page without Chromium pagination splitting the output.

## Notes

- The desktop icon is sourced from the original Swift app's compiled `AppIcon.icns`.
- Windows packaging uses `buildResources/icon.ico`, generated from the same source icon for parity across platforms.
