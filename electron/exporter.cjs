const fs = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { BrowserWindow, dialog } = require("electron");
const MIN_EXPORT_WIDTH = 1100;
const VIEWPORT_HEIGHT = 1200;
const EXPORT_DELAY_MS = 160;
const MAX_SINGLE_PAGE_HEIGHT_PX = 18000;

async function exportPdf(browserWindow, request) {
  const defaultFileName = request?.defaultFileName || "markdown-rendered.pdf";
  const saveResult = await dialog.showSaveDialog(browserWindow, {
    title: "匯出 PDF",
    defaultPath: defaultFileName,
    filters: [{ name: "PDF", extensions: ["pdf"] }]
  });

  if (saveResult.canceled || !saveResult.filePath) {
    return null;
  }

  const pdfBytes = await renderDocumentToPdf(request.document, request.preferredWidth);
  await fs.writeFile(saveResult.filePath, pdfBytes);
  return saveResult.filePath;
}

async function renderDocumentToPdf(documentState, preferredWidth) {
  const exportWidth = Math.max(Math.ceil(preferredWidth || 0), MIN_EXPORT_WIDTH);
  const exportWindow = new BrowserWindow({
    show: false,
    width: exportWidth,
    height: VIEWPORT_HEIGHT,
    useContentSize: true,
    backgroundColor: "#FAF9F5",
    paintWhenInitiallyHidden: true,
    webPreferences: {
      backgroundThrottling: false,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  try {
    await exportWindow.loadURL(getRendererUrl());
    const metrics = await prepareExportWindow(exportWindow, documentState);
    return await printSinglePagePdf(exportWindow, metrics);
  } finally {
    if (!exportWindow.isDestroyed()) {
      exportWindow.destroy();
    }
  }
}

function getRendererUrl() {
  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (devUrl) {
    const normalized = devUrl.endsWith("/") ? devUrl : `${devUrl}/`;
    return new URL("renderer/renderer.html", normalized).toString();
  }

  return pathToFileURL(path.join(__dirname, "..", "dist", "renderer", "renderer.html")).toString();
}

async function prepareExportWindow(exportWindow, documentState) {
  const payload = {
    markdown: documentState.markdownText,
    baseHref: documentState.baseHref,
    sourceRootHref: documentState.sourceRootHref
  };

  const metrics = await exportWindow.webContents.executeJavaScript(
    `(async () => {
      const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

      async function waitForRendererReady() {
        for (let index = 0; index < 200; index += 1) {
          if (window.CodexRenderer?.renderMarkdownFromSource) {
            return;
          }
          await sleep(50);
        }
        throw new Error("HTML renderer 尚未準備好。");
      }

      async function waitForImagesReady() {
        const images = Array.from(document.images || []);
        await Promise.race([
          Promise.all(
            images.map((image) =>
              image.complete
                ? Promise.resolve()
                : new Promise((resolve) => {
                    image.addEventListener("load", resolve, { once: true });
                    image.addEventListener("error", resolve, { once: true });
                  })
            )
          ),
          sleep(6000)
        ]);
      }

      async function waitForStableMetrics(samples = 6, interval = 60) {
        let last = null;
        let stableCount = 0;

        for (let i = 0; i < 60; i += 1) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
          await sleep(interval);

          const current = window.CodexRenderer.getExportMetrics();

          if (
            last &&
            current.width === last.width &&
            current.contentWidth === last.contentWidth &&
            current.height === last.height
          ) {
            stableCount += 1;
          } else {
            stableCount = 0;
          }

          last = current;

          if (stableCount >= samples) {
            return current;
          }
        }

        return window.CodexRenderer.getExportMetrics();
      }

      await waitForRendererReady();

      const input = ${serializeForBrowser(payload)};
      const result = await window.CodexRenderer.renderMarkdownFromSource(
        input.markdown,
        input.baseHref,
        input.sourceRootHref
      );

      if (result !== "ok") {
        throw new Error("Chromium renderer 渲染失敗。");
      }

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      await waitForImagesReady();
      await sleep(${EXPORT_DELAY_MS});

      const firstMetrics = await waitForStableMetrics();

      if (!firstMetrics?.width || !firstMetrics?.height) {
        throw new Error("無法取得目前文件的內容尺寸。");
      }

      const exportScale = Math.min(1, ${MAX_SINGLE_PAGE_HEIGHT_PX} / firstMetrics.height);

      window.CodexRenderer.prepareSinglePageExport(firstMetrics.width, firstMetrics.height, {
        scale: exportScale,
        contentWidth: firstMetrics.contentWidth,
        safeExtraPx: 12
      });

      await sleep(80);

      const finalMetrics = await waitForStableMetrics();

      return {
        width: Math.max(Math.ceil(finalMetrics.width), 1),
        height: Math.max(Math.ceil(finalMetrics.height), 1),
        contentWidth: Math.max(Math.ceil(finalMetrics.contentWidth), 1),
        exportScale,
        debug: {
          before: firstMetrics.debug,
          after: finalMetrics.debug
        }
      };
    })()`,
    true
  );

  return {
    width: Math.max(Math.ceil(metrics.width), 1),
    height: Math.max(Math.ceil(metrics.height), 1),
    exportScale: Math.min(Math.max(Number(metrics.exportScale) || 1, 0.1), 1)
  };
}

async function printSinglePagePdf(exportWindow, metrics) {
  try {
    await exportWindow.webContents.executeJavaScript(
      `(async () => {
        window.scrollTo(0, 0);
        await new Promise((resolve) => window.setTimeout(resolve, ${EXPORT_DELAY_MS}));
      })()`,
      true
    );

    return await exportWindow.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true,
      margins: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      }
    });
  } finally {
    await exportWindow.webContents
      .executeJavaScript(
        `window.CodexRenderer?.cleanupSinglePageExport ? window.CodexRenderer.cleanupSinglePageExport() : "ok"`,
        true
      )
      .catch(() => "ok");
  }
}

function serializeForBrowser(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function pxToMicrons(value) {
  return Math.max(Math.round((value / 96) * 25400), 353);
}

module.exports = {
  exportPdf
};
