export type ImportKind = "markdown" | "folder" | "zip";

export interface ImportedDocument {
  displayPath: string;
  markdownText: string;
  baseHref: string;
  sourceRootHref: string;
}

export interface ExportPdfRequest {
  document: ImportedDocument;
  defaultFileName: string;
  preferredWidth?: number;
}
