import type { ImportKind } from "./types";

export type RendererWindow = Window & {
  CodexRenderer?: {
    renderMarkdownFromSource: (
      markdown: string,
      baseHref: string,
      sourceRootHref: string
    ) => Promise<string>;
  };
};

export const importItems: Array<{ kind: ImportKind; label: string; detail: string }> = [
  { kind: "markdown", label: "匯入 Markdown", detail: "單一 .md / .markdown 檔案" },
  { kind: "folder", label: "匯入資料夾", detail: "自動尋找 content.md / index.md / README.md" },
  { kind: "zip", label: "匯入 ZIP", detail: "解壓後讀取 Markdown 與本地資源" }
];

export const subtitle =
  "匯入 `.md`，以與 HTML 模板相同的配色渲染 Markdown / LaTeX / Mermaid，再匯出成 PDF。";

export function isDesktopRuntime() {
  return typeof window !== "undefined" && typeof window.markdownPdfRenderer !== "undefined";
}

export function isCancelError(message: unknown) {
  return String(message).includes("__CANCELLED__");
}

export async function waitUntilRendererReady(frameWindow: RendererWindow) {
  for (let index = 0; index < 120; index += 1) {
    if (frameWindow.CodexRenderer?.renderMarkdownFromSource) {
      return;
    }

    await delay(100);
  }

  throw new Error("HTML renderer 尚未準備好。");
}

export function installLinkBridge(
  frameWindow: RendererWindow,
  canUseNative: boolean,
  setLastError: (message: string | null) => void,
  setStatusMessage: (message: string) => void
) {
  const doc = frameWindow.document;
  const links = Array.from(doc.querySelectorAll<HTMLAnchorElement>("a[href]"));

  links.forEach((link) => {
    if (link.dataset.bridgeBound === "true") {
      return;
    }

    link.dataset.bridgeBound = "true";
    const href = link.getAttribute("href") ?? "";

    if (!canUseNative || !window.markdownPdfRenderer) {
      if (/^https?:\/\//i.test(href)) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noreferrer");
      }
      return;
    }

    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href)) {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        void window.markdownPdfRenderer?.openLink(href).catch((error) => {
          const message = formatErrorMessage(error);
          setLastError(message);
          setStatusMessage("無法開啟連結");
        });
      });
    }
  });
}

export function basename(value: string) {
  const parts = value.split(/[\\/]/);
  return parts[parts.length - 1] || value;
}

export function stripExtension(value: string) {
  const dotIndex = value.lastIndexOf(".");
  if (dotIndex <= 0) {
    return value;
  }

  return value.slice(0, dotIndex);
}

export function formatErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return String(error);
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
