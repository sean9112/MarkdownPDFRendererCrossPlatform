import { useEffect, useMemo, useRef, useState } from "react";
import {
  appContext,
  basename,
  formatErrorMessage,
  installLinkBridge,
  isCancelError,
  isDesktopRuntime,
  type RendererWindow,
  stripExtension,
  waitUntilRendererReady
} from "./appSupport";
import { getSampleMarkdown } from "./sampleMarkdown";
import type { ImportKind, ImportedDocument } from "./types";

const { importItems, locale: appLocale, messages, subtitle } = appContext;

const sampleDocument: ImportedDocument = {
  displayPath: messages.sampleDisplayPath,
  markdownText: getSampleMarkdown(appLocale),
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
  const [statusMessage, setStatusMessage] = useState(messages.initialStatus);
  const [lastError, setLastError] = useState<string | null>(null);

  const canUseNative = useMemo(() => isDesktopRuntime(), []);
  const busy = isRendering || isExporting;
  const uiState = getViewModel(documentState, busy, isExporting, lastError);

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
        setStatusMessage(messages.waitRenderer);
        await waitUntilRendererReady(frameWindow);

        if (cancelled) {
          return;
        }

        setStatusMessage(messages.renderInProgress);
        const result = await frameWindow.CodexRenderer?.renderMarkdownFromSource(
          documentState.markdownText,
          documentState.baseHref,
          documentState.sourceRootHref
        );

        if (result !== "ok") {
          throw new Error("Renderer returned an unexpected result.");
        }

        installLinkBridge(frameWindow, canUseNative, setLastError, setStatusMessage);
        setStatusMessage(messages.renderDone);
      } catch (error) {
        if (!cancelled) {
          const message = formatErrorMessage(error);
          setLastError(message);
          setStatusMessage(messages.renderFailed);
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
      setLastError(messages.notDesktop);
      setStatusMessage(messages.cannotOpenImport);
      return;
    }

    try {
      setStatusMessage(messages.readingSource);
      setLastError(null);
      const imported = await window.markdownPdfRenderer.importSource(kind);
      setDocumentState(imported);
      setStatusMessage(messages.loadedReady(basename(imported.displayPath)));
    } catch (error) {
      if (isCancelError(error)) {
        setStatusMessage(messages.importCanceled);
        return;
      }

      const message = formatErrorMessage(error);
      setLastError(message);
      setStatusMessage(messages.readFailed);
    }
  }

  async function handleExport() {
    if (!window.markdownPdfRenderer) {
      setLastError(messages.notDesktop);
      setStatusMessage(messages.cannotExport);
      return;
    }

    setIsExporting(true);
    setLastError(null);
    setStatusMessage(messages.exportingPdf);

    try {
      const defaultFileName = `${stripExtension(basename(documentState.displayPath || "markdown-rendered"))}.pdf`;
      const savePath = await window.markdownPdfRenderer.exportPdf({
        document: documentState,
        defaultFileName,
        preferredWidth: Math.max(iframeRef.current?.clientWidth ?? 0, 1100)
      });

      if (!savePath) {
        setStatusMessage(messages.exportCanceled);
        return;
      }

      setStatusMessage(messages.exportDone(basename(savePath)));
    } catch (error) {
      const message = formatErrorMessage(error);
      setLastError(message);
      setStatusMessage(messages.exportFailed(message));
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
            <span className="eyebrow">{messages.eyebrow}</span>
            <h1>Markdown PDF Renderer</h1>
            <p>
              <InlineMarkdownText text={subtitle} />
            </p>

            <div className="hero-meta">
              <div className="meta-chip">
                <span className="meta-label">{uiState.sourceLabel}</span>
                <strong>{uiState.documentName}</strong>
              </div>
              <div className="meta-chip">
                <span className="meta-label">{messages.currentStatus}</span>
                <strong>{uiState.statusLabel}</strong>
              </div>
            </div>
          </div>

          <div className="actions">
            <div className="import-menu" ref={importMenuRef}>
              <button
                className="glass-button accent"
                disabled={busy}
                onClick={() => setIsImportMenuOpen((value) => !value)}
                type="button"
              >
                {messages.importButton}
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
              {messages.exportButton}
            </button>
          </div>
        </header>

        <section className="status-strip">
          <div className="status-path">
            <span className="status-icon">{messages.path}</span>
            <span className="truncate">{documentState.displayPath}</span>
          </div>

          <div className={`status-message ${lastError ? "error" : "success"}`}>{statusMessage}</div>
        </section>

        <section className="workspace-grid">
          <aside className="insight-panel">
            <div className="panel-section panel-lead">
              <span className="section-kicker">{messages.workflow}</span>
              <h2>{uiState.helperTitle}</h2>
              <p>{uiState.helperText}</p>
            </div>

            <div className="panel-section">
              <span className="section-kicker">{messages.threeStepFlow}</span>
              <ol className="workflow-list">
                {messages.workflowSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="panel-section capability-grid">
              <div className="capability-card">
                <span className="capability-label">{messages.input}</span>
                <strong>{messages.inputValue}</strong>
              </div>
              <div className="capability-card">
                <span className="capability-label">{messages.preview}</span>
                <strong>{messages.previewValue}</strong>
              </div>
              <div className="capability-card">
                <span className="capability-label">{messages.output}</span>
                <strong>{messages.outputValue}</strong>
              </div>
            </div>
          </aside>

          <section className="preview-shell">
            <div className="preview-heading">
              <div>
                <span className="section-kicker">{messages.liveCanvas}</span>
                <h2>{messages.livePreviewTitle}</h2>
              </div>
              <p>{messages.livePreviewBody}</p>
            </div>

            <iframe
              ref={iframeRef}
              className="preview-frame"
              onLoad={() => setIsFrameLoaded(true)}
              src="renderer/renderer.html"
              title={messages.previewTitle}
            />

            {busy ? (
              <div className="busy-pill">
                <span className="spinner" />
                <span>{isExporting ? messages.exportingShort : messages.renderingShort}</span>
              </div>
            ) : null}
          </section>
        </section>

        {!canUseNative ? (
          <section className="runtime-note">{messages.runtimeNote}</section>
        ) : null}
      </main>
    </div>
  );
}

function getViewModel(documentState: ImportedDocument, busy: boolean, isExporting: boolean, lastError: string | null) {
  const isSample = documentState.displayPath === sampleDocument.displayPath;

  return {
    sourceLabel: isSample ? messages.sourceLabelSample : messages.sourceLabelCurrent,
    documentName: isSample ? messages.sampleDocumentName : stripExtension(basename(documentState.displayPath || "Untitled")),
    statusLabel: busy ? messages.busyRendering : lastError ? messages.needsAttention : messages.readyToExport,
    helperTitle: busy ? messages.helperBusy : lastError ? messages.helperNeedsAttention : messages.helperReady,
    helperText: busy
      ? isExporting
        ? messages.helperExporting
        : messages.helperRendering
      : lastError
        ? lastError
        : messages.helperDefault
  };
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
