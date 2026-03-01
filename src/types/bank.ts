// ===== Enums (as const objects for erasableSyntaxOnly) =====

export const DebitValueSignHandling = {
  NO_CHANGE: "NO_CHANGE",
  INVERT: "INVERT",
  ABSOLUTE: "ABSOLUTE",
  NEGATE_IF_POSITIVE: "NEGATE_IF_POSITIVE",
} as const;
export type DebitValueSignHandling =
  (typeof DebitValueSignHandling)[keyof typeof DebitValueSignHandling];

export const MatchStrategy = {
  PREFIX: "PREFIX",
  CONTAINS: "CONTAINS",
  REGEX: "REGEX",
  SIMILARITY: "SIMILARITY",
} as const;
export type MatchStrategy =
  (typeof MatchStrategy)[keyof typeof MatchStrategy];

export const ExtractStrategy = {
  REGEX: "REGEX",
  AFTER_PREFIX: "AFTER_PREFIX",
  BETWEEN_DELIMITERS: "BETWEEN_DELIMITERS",
  BETWEEN_MARKERS: "BETWEEN_MARKERS",
  FIXED: "FIXED",
} as const;
export type ExtractStrategy =
  (typeof ExtractStrategy)[keyof typeof ExtractStrategy];

// ===== Description Summary Pattern =====

export interface DescriptionSummaryPattern {
  matchPattern: string;
  extractRegex?: string | null;
  matchStrategy?: MatchStrategy | null;
  extractStrategy?: ExtractStrategy | null;
  similarityThreshold?: number | null;
  extractDelimiter?: string | null;
  extractStart?: string | null;
  extractEnd?: string | null;
  fixedSummary?: string | null;
  extractTicker?: boolean;
}

// ===== Bank Request / Response =====

export interface BankRequest {
  bankName: string;
  dateFormatPattern: string;
  decimalSeparator: string;
  csvDelimiter: string;
  csvHeaderMapping: Record<string, string>;
  debitValueSignHandling: DebitValueSignHandling;
  creditTypeIdentifier?: string | null;
  debitTypeIdentifier?: string | null;
  descriptionSummaryPatterns: DescriptionSummaryPattern[];
}

export interface BankResponse {
  id: string;
  bankName: string;
  dateFormatPattern: string;
  decimalSeparator: string;
  csvDelimiter: string;
  csvHeaderMapping: Record<string, string>;
  debitValueSignHandling: DebitValueSignHandling;
  creditTypeIdentifier?: string | null;
  debitTypeIdentifier?: string | null;
  descriptionSummaryPatterns: DescriptionSummaryPattern[];
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

// ===== CSV Import =====

export interface UnmappedDescription {
  originalDescription: string;
  occurrences: number;
}

export interface ManualMapping {
  originalDescription: string;
  summary: string;
}

export interface CsvAnalysisResponse {
  totalRows: number;
  autoMapped: number;
  unmappedDescriptions: UnmappedDescription[];
}

export interface CsvImportResponse {
  totalRows: number;
  imported: number;
  ignored: number;
  warnings: string[];
  unmatchedDescriptions: string[];
}
