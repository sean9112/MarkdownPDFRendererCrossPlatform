import type { ExportPdfRequest, ImportKind, ImportedDocument } from "./types";

declare global {
  interface Window {
    markdownPdfRenderer?: {
      importSource(kind: ImportKind): Promise<ImportedDocument>;
      exportPdf(request: ExportPdfRequest): Promise<string | null>;
      openLink(target: string): Promise<void>;
    };
  }
}

export {};
