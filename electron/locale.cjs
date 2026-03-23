const ELECTRON_MESSAGES = {
  "zh-TW": {
    chooseFolder: "選擇資料夾",
    chooseZip: "選擇 ZIP",
    chooseMarkdown: "選擇 Markdown",
    markdownFilter: "Markdown",
    noMarkdownFound: "在匯入的資料夾或壓縮檔中找不到 `.md` 檔案。",
    unzipFailed: (message) => `壓縮檔解壓失敗：${message}`,
    exportPdf: "匯出 PDF",
    rendererNotReady: "HTML renderer 尚未準備好。",
    chromiumRenderFailed: "Chromium renderer 渲染失敗。",
    metricsUnavailable: "無法取得目前文件的內容尺寸。"
  },
  en: {
    chooseFolder: "Choose Folder",
    chooseZip: "Choose ZIP",
    chooseMarkdown: "Choose Markdown",
    markdownFilter: "Markdown",
    noMarkdownFound: "No `.md` file was found in the imported folder or archive.",
    unzipFailed: (message) => `Failed to extract ZIP archive: ${message}`,
    exportPdf: "Export PDF",
    rendererNotReady: "The HTML renderer is not ready yet.",
    chromiumRenderFailed: "Chromium renderer failed to render the document.",
    metricsUnavailable: "Unable to determine the current document size."
  }
};

function resolveAppLocale(locale) {
  return String(locale || "").toLowerCase().startsWith("zh") ? "zh-TW" : "en";
}

function getSystemLocale(app) {
  if (app?.getPreferredSystemLanguages) {
    const preferred = app.getPreferredSystemLanguages();
    if (Array.isArray(preferred) && preferred.length > 0) {
      return resolveAppLocale(preferred[0]);
    }
  }

  if (app?.getLocale) {
    return resolveAppLocale(app.getLocale());
  }

  return "en";
}

function getElectronMessages(locale) {
  return ELECTRON_MESSAGES[locale] || ELECTRON_MESSAGES.en;
}

module.exports = {
  getElectronMessages,
  getSystemLocale
};
