const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("markdownPdfRenderer", {
  importSource(kind) {
    return ipcRenderer.invoke("app:import-source", kind);
  },
  exportPdf(request) {
    return ipcRenderer.invoke("app:export-pdf", request);
  },
  openLink(target) {
    return ipcRenderer.invoke("app:open-link", target);
  }
});
