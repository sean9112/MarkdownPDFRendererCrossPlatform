import { detectAppLocale, getImportItems, getSubtitle, t } from "./i18n";
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

const appLocale = detectAppLocale();
const messages = t(appLocale);

export const appContext = {
  locale: appLocale,
  messages,
  importItems: getImportItems(appLocale),
  subtitle: getSubtitle(appLocale)
};

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

  throw new Error(messages.rendererNotReady);
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
          setStatusMessage(messages.openLinkFailed);
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

export type { ImportKind };
