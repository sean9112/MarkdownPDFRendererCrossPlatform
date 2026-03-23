const path = require("node:path");
const { fileURLToPath } = require("node:url");
const { app, BrowserWindow, ipcMain, shell } = require("electron");
const { getSystemLocale } = require("./locale.cjs");
const { importSource } = require("./importer.cjs");
const { exportPdf } = require("./exporter.cjs");

let mainWindow = null;
let appLocale = "en";

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 860,
    minWidth: 980,
    minHeight: 720,
    backgroundColor: "#FAF9F5",
    title: "Markdown PDF Renderer",
    autoHideMenuBar: process.platform !== "darwin",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void openLink(url);
    return { action: "deny" };
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

async function openLink(target) {
  if (/^https?:\/\//i.test(target) || /^mailto:/i.test(target)) {
    await shell.openExternal(target);
    return;
  }

  if (target.startsWith("file://")) {
    const result = await shell.openPath(fileURLToPath(target));
    if (result) {
      throw new Error(result);
    }
    return;
  }

  const result = await shell.openPath(target);
  if (result) {
    throw new Error(result);
  }
}

app.whenReady().then(() => {
  appLocale = getSystemLocale(app);

  ipcMain.handle("app:import-source", async (event, kind) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender) ?? mainWindow;
    return importSource(browserWindow, kind, appLocale);
  });

  ipcMain.handle("app:export-pdf", async (event, request) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender) ?? mainWindow;
    return exportPdf(browserWindow, request, appLocale);
  });

  ipcMain.handle("app:open-link", async (_event, target) => {
    await openLink(target);
  });

  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
