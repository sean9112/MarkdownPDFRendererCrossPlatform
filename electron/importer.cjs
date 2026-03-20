const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { pathToFileURL } = require("node:url");
const { dialog } = require("electron");
const AdmZip = require("adm-zip");

const markdownExtensions = new Set([".md", ".markdown"]);
const preferredMarkdownNames = new Set(["content.md", "index.md", "readme.md"]);

async function importSource(browserWindow, kind) {
  const selectedPath = await selectSource(browserWindow, kind);
  if (!selectedPath) {
    throw new Error("__CANCELLED__");
  }

  return loadImportedMarkdown(selectedPath);
}

async function selectSource(browserWindow, kind) {
  if (kind === "folder") {
    const result = await dialog.showOpenDialog(browserWindow, {
      properties: ["openDirectory"],
      title: "選擇資料夾"
    });
    return result.canceled ? null : result.filePaths[0];
  }

  const filters =
    kind === "zip"
      ? [{ name: "ZIP", extensions: ["zip"] }]
      : [{ name: "Markdown", extensions: ["md", "markdown"] }];

  const result = await dialog.showOpenDialog(browserWindow, {
    properties: ["openFile"],
    title: kind === "zip" ? "選擇 ZIP" : "選擇 Markdown",
    filters
  });

  return result.canceled ? null : result.filePaths[0];
}

function loadImportedMarkdown(selectedPath) {
  const absolutePath = path.resolve(selectedPath);
  const stat = fs.statSync(absolutePath);
  const { markdownPath, sourceRootPath } = resolveMarkdownSource(absolutePath, stat);
  const baseDirectoryPath = path.dirname(markdownPath);
  const markdownText = readMarkdown(markdownPath);

  return {
    displayPath: markdownPath,
    markdownText,
    baseHref: toDirectoryHref(baseDirectoryPath),
    sourceRootHref: toDirectoryHref(sourceRootPath)
  };
}

function resolveMarkdownSource(absolutePath, stat) {
  if (stat.isDirectory()) {
    return {
      markdownPath: findPrimaryMarkdown(absolutePath),
      sourceRootPath: absolutePath
    };
  }

  if (path.extname(absolutePath).toLowerCase() === ".zip") {
    const extractedRootPath = extractZipToTempDirectory(absolutePath);
    return {
      markdownPath: findPrimaryMarkdown(extractedRootPath),
      sourceRootPath: extractedRootPath
    };
  }

  return {
    markdownPath: absolutePath,
    sourceRootPath: path.dirname(absolutePath)
  };
}

function findPrimaryMarkdown(rootPath) {
  const candidates = [];
  walkMarkdownFiles(rootPath, candidates);

  if (!candidates.length) {
    throw new Error("在匯入的資料夾或壓縮檔中找不到 `.md` 檔案。");
  }

  candidates.sort((left, right) => left.localeCompare(right, "en"));

  const preferred = candidates.find((candidate) => preferredMarkdownNames.has(path.basename(candidate).toLowerCase()));
  return preferred ?? candidates[0];
}

function walkMarkdownFiles(directoryPath, results) {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name, "en"));

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      walkMarkdownFiles(entryPath, results);
      continue;
    }

    if (entry.isFile() && markdownExtensions.has(path.extname(entry.name).toLowerCase())) {
      results.push(entryPath);
    }
  }
}

function readMarkdown(markdownPath) {
  const buffer = fs.readFileSync(markdownPath);

  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return new TextDecoder("utf-16le", { fatal: true }).decode(buffer.subarray(2));
  }

  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    return new TextDecoder("utf-16le", { fatal: true }).decode(Buffer.from(buffer.subarray(2)).swap16());
  }

  const utf8 = tryDecode(buffer, "utf-8");
  if (utf8 !== null) {
    return utf8;
  }

  const utf16 = tryDecode(buffer, "utf-16le");
  if (utf16 !== null) {
    return utf16;
  }

  return buffer.toString("utf8");
}

function tryDecode(buffer, encoding) {
  try {
    return new TextDecoder(encoding, { fatal: true }).decode(buffer);
  } catch {
    return null;
  }
}

function extractZipToTempDirectory(zipPath) {
  const extractionRoot = path.join(os.tmpdir(), "MarkdownPDFRendererElectron", crypto.randomUUID());

  try {
    fs.mkdirSync(extractionRoot, { recursive: true });
    const archive = new AdmZip(zipPath);
    archive.extractAllTo(extractionRoot, true);
    return extractionRoot;
  } catch (error) {
    throw new Error(`壓縮檔解壓失敗：${error instanceof Error ? error.message : String(error)}`);
  }
}

function toDirectoryHref(directoryPath) {
  let href = pathToFileURL(path.resolve(directoryPath)).href;
  if (!href.endsWith("/")) {
    href += "/";
  }
  return href;
}

module.exports = {
  importSource
};
