// ===== Enums (as const objects for erasableSyntaxOnly) =====

export const DebitValueSignHandling = {
  NO_CHANGE: "NO_CHANGE",
  INVERT: "INVERT",
  ABSOLUTE: "ABSOLUTE",
  NEGATE_IF_POSITIVE: "NEGATE_IF_POSITIVE",
} as const;
export type DebitValueSignHandling =
  (typeof DebitValueSignHandling)[keyof typeof DebitValueSignHandling];

export const CsvSkipStrategy = {
  LINE_NUMBER: "LINE_NUMBER",
  STARTS_WITH_TEXT: "STARTS_WITH_TEXT",
} as const;
export type CsvSkipStrategy =
  (typeof CsvSkipStrategy)[keyof typeof CsvSkipStrategy];

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

// ===== Transaction Classification Rules =====

export interface TransactionClassificationRule {
  id?: string;
  statementDescription?: string | null;
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
  priority?: number | null;
  active?: boolean;
  transactionType?: string | null;
  transactionTypeCode?: string | null;
}

export const TransactionClassificationRuleUpdateMode = {
  UPDATE_LINKED_TRANSACTIONS: "UPDATE_LINKED_TRANSACTIONS",
  CREATE_NEW_VERSION: "CREATE_NEW_VERSION",
} as const;
export type TransactionClassificationRuleUpdateMode =
  (typeof TransactionClassificationRuleUpdateMode)[keyof typeof TransactionClassificationRuleUpdateMode];

export interface UpdateTransactionClassificationRuleRequest {
  rule: TransactionClassificationRule;
  updateMode: TransactionClassificationRuleUpdateMode;
}

export interface TransactionClassificationRuleUsageResponse {
  ruleId: string;
  active: boolean;
  relatedTransactionsCount: number;
  canDeletePhysically: boolean;
}

export interface DeleteTransactionClassificationRuleResponse {
  ruleId: string;
  relatedTransactionsCount: number;
  deletedPhysically: boolean;
  deactivated: boolean;
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
  csvSkipStrategy?: CsvSkipStrategy | null;
  csvSkipValue?: string | null;
  csvSimilarityGroupingThreshold?: number | null;
  classificationRules?: TransactionClassificationRule[];
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
  csvSkipStrategy?: CsvSkipStrategy | null;
  csvSkipValue?: string | null;
  csvSimilarityGroupingThreshold?: number | null;
  classificationRules: TransactionClassificationRule[];
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

// ===== CSV Import =====

export interface UnmappedDescription {
  originalDescription: string;
  occurrences: number;
  groupedDescriptions: string[];
}

export interface ManualMapping {
  originalDescription: string;
  textIdentifier: string;
  summary: string;
  extractTicker?: boolean;
  transactionType?: string | null;
  transactionTypeCode?: string | null;
}

export interface CsvAnalysisResponse {
  totalRows: number;
  autoMapped: number;
  repeatedRows: number;
  notFoundTickerCount: number;
  fileNameAlreadyImported: boolean;
  unmappedDescriptions: UnmappedDescription[];
  notFoundTickerDescriptions: string[];
}

export interface CsvImportResponse {
  totalRows: number;
  imported: number;
  ignored: number;
  repeatedRowsIgnored: number;
  notFoundTickerCount: number;
  warnings: string[];
  unmatchedDescriptions: string[];
  notFoundTickerDescriptions: string[];
}
