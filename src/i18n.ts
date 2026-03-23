import type { ImportKind } from "./types";

export type AppLocale = "zh-TW" | "en";

type ImportItem = { kind: ImportKind; label: string; detail: string };

type AppMessages = {
  sampleDisplayPath: string;
  initialStatus: string;
  sourceLabelSample: string;
  sourceLabelCurrent: string;
  sampleDocumentName: string;
  helperBusy: string;
  helperNeedsAttention: string;
  helperReady: string;
  helperExporting: string;
  helperRendering: string;
  helperDefault: string;
  workflowSteps: string[];
  waitRenderer: string;
  renderInProgress: string;
  renderDone: string;
  renderFailed: string;
  notDesktop: string;
  cannotOpenImport: string;
  readingSource: string;
  loadedReady: (name: string) => string;
  importCanceled: string;
  readFailed: string;
  cannotExport: string;
  exportingPdf: string;
  exportCanceled: string;
  exportDone: (name: string) => string;
  exportFailed: (message: string) => string;
  eyebrow: string;
  currentStatus: string;
  busyRendering: string;
  needsAttention: string;
  readyToExport: string;
  importButton: string;
  exportButton: string;
  path: string;
  workflow: string;
  threeStepFlow: string;
  input: string;
  inputValue: string;
  preview: string;
  previewValue: string;
  output: string;
  outputValue: string;
  liveCanvas: string;
  livePreviewTitle: string;
  livePreviewBody: string;
  previewTitle: string;
  exportingShort: string;
  renderingShort: string;
  runtimeNote: string;
  openLinkFailed: string;
  rendererNotReady: string;
};

type LocaleContent = {
  importItems: ImportItem[];
  subtitle: string;
  messages: AppMessages;
};

const ZH_TW_CONTENT: LocaleContent = {
  importItems: [
    { kind: "markdown", label: "匯入 Markdown", detail: "單一 .md / .markdown 檔案" },
    { kind: "folder", label: "匯入資料夾", detail: "自動尋找 content.md / index.md / README.md" },
    { kind: "zip", label: "匯入 ZIP", detail: "解壓後讀取 Markdown 與本地資源" }
  ],
  subtitle: "匯入 `.md`，以與 HTML 模板相同的配色渲染 Markdown / LaTeX / Mermaid，再匯出成 PDF。",
  messages: {
    sampleDisplayPath: "尚未選擇檔案，正在顯示內建範例內容。",
    initialStatus: "載入 `.md` 後即可預覽 Markdown / LaTeX / Mermaid。",
    sourceLabelSample: "內建示例",
    sourceLabelCurrent: "目前文件",
    sampleDocumentName: "Sample Markdown Playground",
    helperBusy: "處理中",
    helperNeedsAttention: "需要留意",
    helperReady: "工作台已就緒",
    helperExporting: "Chromium 正在背景輸出 PDF，完成後會保留目前預覽狀態。",
    helperRendering: "Renderer 正在重新整理預覽內容，數學公式與 Mermaid 會一起更新。",
    helperDefault: "支援 Markdown、LaTeX、Mermaid 與相對連結資源，適合快速檢查排版後直接輸出。",
    workflowSteps: [
      "匯入 Markdown、資料夾或 ZIP 專案",
      "即時檢視版面、公式與流程圖",
      "以 Chromium 引擎匯出成高品質 PDF"
    ],
    waitRenderer: "等待 HTML renderer 就緒...",
    renderInProgress: "渲染 Markdown / LaTeX / Mermaid...",
    renderDone: "渲染完成，可匯出 PDF。",
    renderFailed: "渲染失敗",
    notDesktop: "目前不是在 Electron 桌面環境中執行。",
    cannotOpenImport: "無法開啟原生匯入面板",
    readingSource: "正在讀取來源...",
    loadedReady: (name) => `已載入 ${name}，準備渲染中。`,
    importCanceled: "已取消匯入。",
    readFailed: "讀取失敗",
    cannotExport: "無法匯出 PDF",
    exportingPdf: "正在以 Chromium 背景渲染 PDF...",
    exportCanceled: "已取消匯出。",
    exportDone: (name) => `PDF 已輸出到 ${name}`,
    exportFailed: (message) => `PDF 匯出失敗：${message}`,
    eyebrow: "Cross-platform editorial renderer",
    currentStatus: "目前狀態",
    busyRendering: "Busy rendering",
    needsAttention: "Needs attention",
    readyToExport: "Ready to export",
    importButton: "匯入 Markdown / 資料夾 / ZIP",
    exportButton: "匯出 PDF",
    path: "Path",
    workflow: "Workflow",
    threeStepFlow: "Three-step flow",
    input: "Input",
    inputValue: "Markdown / 資料夾 / ZIP",
    preview: "Preview",
    previewValue: "LaTeX + Mermaid",
    output: "Output",
    outputValue: "可列印 PDF",
    liveCanvas: "Live canvas",
    livePreviewTitle: "即時預覽工作台",
    livePreviewBody: "先看排版，再輸出成最終 PDF。這個視窗會同步反映匯入內容、公式與圖表變化。",
    previewTitle: "Markdown Preview",
    exportingShort: "匯出 PDF 中...",
    renderingShort: "重新渲染中...",
    runtimeNote:
      "目前是在純瀏覽器環境中執行，因此原生檔案匯入、背景 Chromium 匯出與本地檔案開啟功能會停用。請在 Electron 桌面環境下使用完整功能。",
    openLinkFailed: "無法開啟連結",
    rendererNotReady: "HTML renderer 尚未準備好。"
  }
};

const EN_CONTENT: LocaleContent = {
  importItems: [
    { kind: "markdown", label: "Import Markdown", detail: "A single .md / .markdown file" },
    { kind: "folder", label: "Import Folder", detail: "Automatically finds content.md / index.md / README.md" },
    { kind: "zip", label: "Import ZIP", detail: "Extracts and reads Markdown plus local assets" }
  ],
  subtitle:
    "Import `.md` files, preview Markdown / LaTeX / Mermaid with the same HTML template styling, then export to PDF.",
  messages: {
    sampleDisplayPath: "No file selected yet. Showing the built-in sample content.",
    initialStatus: "Load a `.md` file to preview Markdown / LaTeX / Mermaid.",
    sourceLabelSample: "Built-in sample",
    sourceLabelCurrent: "Current document",
    sampleDocumentName: "Sample Markdown Playground",
    helperBusy: "In progress",
    helperNeedsAttention: "Needs attention",
    helperReady: "Workspace ready",
    helperExporting: "Chromium is exporting the PDF in the background while keeping the current preview state.",
    helperRendering: "The renderer is refreshing the preview, including math and Mermaid diagrams.",
    helperDefault: "Supports Markdown, LaTeX, Mermaid, and relative assets for quick layout checks before export.",
    workflowSteps: [
      "Import a Markdown file, folder, or ZIP project",
      "Preview layout, formulas, and diagrams instantly",
      "Export a high-quality PDF with Chromium"
    ],
    waitRenderer: "Waiting for the HTML renderer to be ready...",
    renderInProgress: "Rendering Markdown / LaTeX / Mermaid...",
    renderDone: "Rendering complete. Ready to export PDF.",
    renderFailed: "Rendering failed",
    notDesktop: "The app is not running in the Electron desktop environment.",
    cannotOpenImport: "Cannot open the native import panel",
    readingSource: "Reading source...",
    loadedReady: (name) => `${name} loaded. Preparing to render.`,
    importCanceled: "Import canceled.",
    readFailed: "Failed to read source",
    cannotExport: "Cannot export PDF",
    exportingPdf: "Rendering PDF in the Chromium background process...",
    exportCanceled: "Export canceled.",
    exportDone: (name) => `PDF exported to ${name}`,
    exportFailed: (message) => `PDF export failed: ${message}`,
    eyebrow: "Cross-platform editorial renderer",
    currentStatus: "Current status",
    busyRendering: "Busy rendering",
    needsAttention: "Needs attention",
    readyToExport: "Ready to export",
    importButton: "Import Markdown / Folder / ZIP",
    exportButton: "Export PDF",
    path: "Path",
    workflow: "Workflow",
    threeStepFlow: "Three-step flow",
    input: "Input",
    inputValue: "Markdown / Folder / ZIP",
    preview: "Preview",
    previewValue: "LaTeX + Mermaid",
    output: "Output",
    outputValue: "Print-ready PDF",
    liveCanvas: "Live canvas",
    livePreviewTitle: "Live preview workspace",
    livePreviewBody:
      "Review the layout first, then export the final PDF. This canvas reflects imported content, formulas, and diagrams in real time.",
    previewTitle: "Markdown Preview",
    exportingShort: "Exporting PDF...",
    renderingShort: "Refreshing preview...",
    runtimeNote:
      "The app is currently running in a browser-only environment, so native file import, background Chromium export, and local file opening are disabled. Use the Electron desktop app for the full experience.",
    openLinkFailed: "Unable to open link",
    rendererNotReady: "The HTML renderer is not ready yet."
  }
};

const LOCALE_CONTENT: Record<AppLocale, LocaleContent> = {
  "zh-TW": ZH_TW_CONTENT,
  en: EN_CONTENT
};

export function detectAppLocale(): AppLocale {
  if (typeof navigator === "undefined") {
    return "en";
  }

  const candidates = [navigator.language, ...(navigator.languages || [])].filter(Boolean);
  return candidates.some((locale) => locale.toLowerCase().startsWith("zh")) ? "zh-TW" : "en";
}

export function getLocaleContent(locale: AppLocale): LocaleContent {
  return LOCALE_CONTENT[locale];
}

export function getImportItems(locale: AppLocale) {
  return getLocaleContent(locale).importItems;
}

export function getSubtitle(locale: AppLocale) {
  return getLocaleContent(locale).subtitle;
}

export function t(locale: AppLocale) {
  return getLocaleContent(locale).messages;
}
