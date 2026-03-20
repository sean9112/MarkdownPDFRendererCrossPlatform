import { useEffect, useMemo, useRef, useState } from "react";
import {
  basename,
  formatErrorMessage,
  importItems,
  installLinkBridge,
  isCancelError,
  isDesktopRuntime,
  type RendererWindow,
  stripExtension,
  subtitle,
  waitUntilRendererReady
} from "./appSupport";
import { sampleMarkdown } from "./sampleMarkdown";
import type { ImportKind, ImportedDocument } from "./types";

const sampleDocument: ImportedDocument = {
  displayPath: "尚未選擇檔案，正在顯示內建範例內容。",
  markdownText: sampleMarkdown,
  baseHref: "",
  sourceRootHref: ""
};

export default function App() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const importMenuRef = useRef<HTMLDivElement | null>(null);

  const [documentState, setDocumentState] = useState<ImportedDocument>(sampleDocument);
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
  const [isFrameLoaded, setIsFrameLoaded] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("載入 `.md` 後即可預覽 Markdown / LaTeX / Mermaid。");
  const [lastError, setLastError] = useState<string | null>(null);

  const canUseNative = useMemo(() => isDesktopRuntime(), []);
  const busy = isRendering || isExporting;

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!importMenuRef.current?.contains(event.target as Node)) {
        setIsImportMenuOpen(false);
      }
    }

    if (isImportMenuOpen) {
      window.addEventListener("pointerdown", handlePointerDown);
    }

    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isImportMenuOpen]);

  useEffect(() => {
    if (!isFrameLoaded) {
      return;
    }

    let cancelled = false;

    async function renderCurrentDocument() {
      const frameWindow = iframeRef.current?.contentWindow as RendererWindow | null;
      if (!frameWindow) {
        return;
      }

      setIsRendering(true);
      setLastError(null);

      try {
        setStatusMessage("等待 HTML renderer 就緒...");
        await waitUntilRendererReady(frameWindow);

        if (cancelled) {
          return;
        }

        setStatusMessage("渲染 Markdown / LaTeX / Mermaid...");
        const result = await frameWindow.CodexRenderer?.renderMarkdownFromSource(
          documentState.markdownText,
          documentState.baseHref,
          documentState.sourceRootHref
        );

        if (result !== "ok") {
          throw new Error("Renderer returned an unexpected result.");
        }

        installLinkBridge(frameWindow, canUseNative, setLastError, setStatusMessage);
        setStatusMessage("渲染完成，可匯出 PDF。");
      } catch (error) {
        if (!cancelled) {
          const message = formatErrorMessage(error);
          setLastError(message);
          setStatusMessage("渲染失敗");
        }
      } finally {
        if (!cancelled) {
          setIsRendering(false);
        }
      }
    }

    void renderCurrentDocument();

    return () => {
      cancelled = true;
    };
  }, [canUseNative, documentState, isFrameLoaded]);

  async function handleImport(kind: ImportKind) {
    setIsImportMenuOpen(false);

    if (!canUseNative || !window.markdownPdfRenderer) {
      setLastError("目前不是在 Electron 桌面環境中執行。");
      setStatusMessage("無法開啟原生匯入面板");
      return;
    }

    try {
      setStatusMessage("正在讀取來源...");
      setLastError(null);
      const imported = await window.markdownPdfRenderer.importSource(kind);
      setDocumentState(imported);
      setStatusMessage(`已載入 ${basename(imported.displayPath)}，準備渲染中。`);
    } catch (error) {
      if (isCancelError(error)) {
        setStatusMessage("已取消匯入。");
        return;
      }

      const message = formatErrorMessage(error);
      setLastError(message);
      setStatusMessage("讀取失敗");
    }
  }

  async function handleExport() {
    if (!window.markdownPdfRenderer) {
      setLastError("目前不是在 Electron 桌面環境中執行。");
      setStatusMessage("無法匯出 PDF");
      return;
    }

    setIsExporting(true);
    setLastError(null);
    setStatusMessage("正在以 Chromium 背景渲染 PDF...");

    try {
      const defaultFileName = `${stripExtension(basename(documentState.displayPath || "markdown-rendered"))}.pdf`;
      const savePath = await window.markdownPdfRenderer.exportPdf({
        document: documentState,
        defaultFileName,
        preferredWidth: Math.max(iframeRef.current?.clientWidth ?? 0, 1100)
      });

      if (!savePath) {
        setStatusMessage("已取消匯出。");
        return;
      }

      setStatusMessage(`PDF 已輸出到 ${basename(savePath)}`);
    } catch (error) {
      const message = formatErrorMessage(error);
      setLastError(message);
      setStatusMessage(`PDF 匯出失敗：${message}`);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="backdrop-layer" />

      <main className="app-frame">
        <header className="header">
          <div className="title-block">
            <h1>Markdown PDF Renderer</h1>
            <p>
              <InlineMarkdownText text={subtitle} />
            </p>
          </div>

          <div className="actions">
            <div className="import-menu" ref={importMenuRef}>
              <button
                className="glass-button accent"
                disabled={busy}
                onClick={() => setIsImportMenuOpen((value) => !value)}
                type="button"
              >
                匯入 Markdown / 資料夾 / ZIP
              </button>

              {isImportMenuOpen ? (
                <div className="menu-panel">
                  {importItems.map((item) => (
                    <button
                      key={item.kind}
                      className="menu-item"
                      onClick={() => void handleImport(item.kind)}
                      type="button"
                    >
                      <strong>{item.label}</strong>
                      <span>{item.detail}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <button className="glass-button blue" disabled={busy} onClick={() => void handleExport()} type="button">
              匯出 PDF
            </button>
          </div>
        </header>

        <section className="status-strip">
          <div className="status-path">
            <span className="status-icon">📄</span>
            <span className="truncate">{documentState.displayPath}</span>
          </div>

          <div className={`status-message ${lastError ? "error" : "success"}`}>{statusMessage}</div>
        </section>

        <section className="preview-shell">
          <iframe
            ref={iframeRef}
            className="preview-frame"
            onLoad={() => setIsFrameLoaded(true)}
            src="renderer/renderer.html"
            title="Markdown Preview"
          />

          {busy ? (
            <div className="busy-pill">
              <span className="spinner" />
              <span>{isExporting ? "匯出 PDF 中..." : "重新渲染中..."}</span>
            </div>
          ) : null}
        </section>

        {!canUseNative ? (
          <section className="runtime-note">
            目前是在純瀏覽器環境中執行，因此原生檔案匯入、背景 Chromium 匯出與本地檔案開啟功能會停用。請在 Electron 桌面環境下使用完整功能。
          </section>
        ) : null}
      </main>
    </div>
  );
}

function InlineMarkdownText({ text }: { text: string }) {
  const segments = text.split(/(`[^`]+`)/g).filter(Boolean);

  return (
    <>
      {segments.map((segment, index) =>
        segment.startsWith("`") && segment.endsWith("`") ? (
          <code key={`${segment}-${index}`}>{segment.slice(1, -1)}</code>
        ) : (
          <span key={`${segment}-${index}`}>{segment}</span>
        )
      )}
    </>
  );
}
