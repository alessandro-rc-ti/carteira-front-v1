export const InvestmentOrderType = {
  COMPRA: "COMPRA",
  VENDA: "VENDA",
  BONIFICACAO: "BONIFICACAO",
} as const;
export type InvestmentOrderType = (typeof InvestmentOrderType)[keyof typeof InvestmentOrderType];

export const InvestmentOrderTypeLabels: Record<InvestmentOrderType, string> = {
  COMPRA: "Compra",
  VENDA: "Venda",
  BONIFICACAO: "Bonificação",
};
// ===== Enums =====

export const InvestmentCategory = {
  STOCK: "STOCK",
  FII: "FII",
  ETF: "ETF",
  BDR: "BDR",
  FIXED_INCOME: "FIXED_INCOME",
  CRYPTO: "CRYPTO",
  OTHER: "OTHER",
} as const;
export type InvestmentCategory =
  (typeof InvestmentCategory)[keyof typeof InvestmentCategory];

/** Labels em português para exibição na UI */
export const InvestmentCategoryLabels: Record<InvestmentCategory, string> = {
  STOCK: "Ação",
  FII: "FII",
  ETF: "ETF",
  BDR: "BDR",
  FIXED_INCOME: "Renda Fixa",
  CRYPTO: "Cripto",
  OTHER: "Outro",
};

// ===== Request / Response =====

export interface InvestmentRequest {
  ticker: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number | null;
  purchaseDate: string;
  category: InvestmentCategory;
  institution: string;
  brokerFee?: number | null;
  notes?: string | null;
  orderType: InvestmentOrderType;
}

export interface InvestmentResponse {
  id: string;
  ticker: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  purchaseDate: string;
  category: InvestmentCategory;
  institution: string;
  brokerFee: number | null;
  notes: string | null;
  importFileName?: string | null;
  orderType: InvestmentOrderType;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ===== B3 Import =====

export interface UnmappedInstitution {
  rawInstitution: string;
  occurrences: number;
}

export interface B3AnalysisResponse {
  totalRows: number;
  autoMappedInstitutions: number;
  unmappedInstitutions: UnmappedInstitution[];
}

export interface InstitutionMapping {
  rawInstitution: string;
  normalizedName: string;
}

export interface B3ImportResponse {
  totalRows: number;
  imported: number;
  skipped: number;
  warnings: string[];
  unmatchedInstitutions?: string[];
}
