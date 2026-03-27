export const TransactionType = {
  INCOME_ACTIVE: "INCOME_ACTIVE",
  INCOME_PASSIVE: "INCOME_PASSIVE",
  EXPENSE: "EXPENSE",
  TRANSFER: "TRANSFER",
  INVESTMENT_APPLY: "INVESTMENT_APPLY",
  INVESTMENT_REDEEM: "INVESTMENT_REDEEM",
  LOAN_IN: "LOAN_IN",
  LOAN_OUT: "LOAN_OUT",
  TAX_FEE: "TAX_FEE",
  ADJUSTMENT: "ADJUSTMENT",
} as const;

export type TransactionTypeValue =
  (typeof TransactionType)[keyof typeof TransactionType];

export interface TransactionTypeOption {
  code: string;
  value: TransactionTypeValue;
  baseType: TransactionTypeValue;
  label: string;
  description: string;
  systemDefined?: boolean;
  custom?: boolean;
}

export interface TransactionTypeDefinition {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  baseType: TransactionTypeValue;
  affectsInflation: boolean;
  active: boolean;
  systemDefined: boolean;
  custom: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const TRANSACTION_TYPE_OPTIONS: TransactionTypeOption[] = [
  {
    code: TransactionType.INCOME_ACTIVE,
    value: TransactionType.INCOME_ACTIVE,
    baseType: TransactionType.INCOME_ACTIVE,
    label: "Receita ativa",
    description: "Salario, pro-labore e renda do trabalho.",
    systemDefined: true,
    custom: false,
  },
  {
    code: TransactionType.INCOME_PASSIVE,
    value: TransactionType.INCOME_PASSIVE,
    baseType: TransactionType.INCOME_PASSIVE,
    label: "Receita passiva",
    description: "Dividendos, JCP, FIIs, aluguel de acoes e aluguel de imovel.",
    systemDefined: true,
    custom: false,
  },
  {
    code: TransactionType.EXPENSE,
    value: TransactionType.EXPENSE,
    baseType: TransactionType.EXPENSE,
    label: "Despesa",
    description: "Consumo e custo de vida do dia a dia.",
    systemDefined: true,
    custom: false,
  },
  {
    code: TransactionType.TRANSFER,
    value: TransactionType.TRANSFER,
    baseType: TransactionType.TRANSFER,
    label: "Transferencia",
    description: "Movimentacao entre contas e carteiras sem impacto de renda ou despesa.",
    systemDefined: true,
    custom: false,
  },
  {
    code: TransactionType.INVESTMENT_APPLY,
    value: TransactionType.INVESTMENT_APPLY,
    baseType: TransactionType.INVESTMENT_APPLY,
    label: "Aplicacao",
    description: "Saida para compra de ativo ou aporte.",
    systemDefined: true,
    custom: false,
  },
  {
    code: TransactionType.INVESTMENT_REDEEM,
    value: TransactionType.INVESTMENT_REDEEM,
    baseType: TransactionType.INVESTMENT_REDEEM,
    label: "Resgate",
    description: "Entrada por venda ou resgate de investimento.",
    systemDefined: true,
    custom: false,
  },
  {
    code: TransactionType.LOAN_IN,
    value: TransactionType.LOAN_IN,
    baseType: TransactionType.LOAN_IN,
    label: "Emprestimo recebido",
    description: "Entrada de caixa com obrigacao futura.",
    systemDefined: true,
    custom: false,
  },
  {
    code: TransactionType.LOAN_OUT,
    value: TransactionType.LOAN_OUT,
    baseType: TransactionType.LOAN_OUT,
    label: "Emprestimo concedido",
    description: "Saida de caixa para emprestimo a terceiros.",
    systemDefined: true,
    custom: false,
  },
  {
    code: TransactionType.TAX_FEE,
    value: TransactionType.TAX_FEE,
    baseType: TransactionType.TAX_FEE,
    label: "Imposto/Taxa",
    description: "IPTU, IPVA, IOF, IR, tarifas e outros encargos.",
    systemDefined: true,
    custom: false,
  },
  {
    code: TransactionType.ADJUSTMENT,
    value: TransactionType.ADJUSTMENT,
    baseType: TransactionType.ADJUSTMENT,
    label: "Ajuste",
    description: "Acertos, estornos e correcoes operacionais.",
    systemDefined: true,
    custom: false,
  },
];

const LEGACY_TYPE_ALIASES: Record<string, TransactionTypeValue> = {
  CREDIT: TransactionType.INCOME_ACTIVE,
  INCOME: TransactionType.INCOME_ACTIVE,
  DEBIT: TransactionType.EXPENSE,
  TAX: TransactionType.TAX_FEE,
  FEE: TransactionType.TAX_FEE,
  INVESTMENT_INCOME: TransactionType.INCOME_PASSIVE,
};

export function normalizeTransactionType(value?: string | null): TransactionTypeValue | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().replace(/[-\s]+/g, "_").toUpperCase();
  if (normalized in TransactionType) {
    return normalized as TransactionTypeValue;
  }

  return LEGACY_TYPE_ALIASES[normalized] ?? null;
}

export function getTransactionTypeLabel(value?: string | null): string {
  const normalized = normalizeTransactionType(value);
  if (!normalized) {
    return value?.trim() || "-";
  }

  return TRANSACTION_TYPE_OPTIONS.find((option) => option.value === normalized)?.label ?? normalized;
}

export function buildTransactionTypeOptions(definitions?: TransactionTypeDefinition[]): TransactionTypeOption[] {
  if (!definitions || definitions.length === 0) {
    return TRANSACTION_TYPE_OPTIONS;
  }

  return definitions
    .filter((definition) => definition.active)
    .map((definition) => ({
      code: definition.code,
      value: definition.baseType,
      baseType: definition.baseType,
      label: definition.name,
      description: definition.description?.trim() || getTransactionTypeLabel(definition.baseType),
      systemDefined: definition.systemDefined,
      custom: definition.custom,
    }));
}

export function resolveTransactionTypeOption(
  definitions: TransactionTypeDefinition[] | undefined,
  typeCode?: string | null,
  type?: string | null
): TransactionTypeOption | null {
  const options = buildTransactionTypeOptions(definitions);
  if (typeCode) {
    const byCode = options.find((option) => option.code === typeCode);
    if (byCode) {
      return byCode;
    }
  }

  const normalizedType = normalizeTransactionType(type);
  if (!normalizedType) {
    return null;
  }

  return options.find((option) => option.baseType === normalizedType) ?? null;
}

export function getTransactionTypeDisplayLabel(
  definitions: TransactionTypeDefinition[] | undefined,
  typeCode?: string | null,
  type?: string | null
): string {
  return resolveTransactionTypeOption(definitions, typeCode, type)?.label
    ?? getTransactionTypeLabel(type);
}

export function isExpenseTransactionType(value?: string | null): boolean {
  const normalized = normalizeTransactionType(value);
  return normalized === TransactionType.EXPENSE || normalized === TransactionType.TAX_FEE;
}
export function isIncomeTransactionType(value?: string | null): boolean {
  const normalized = normalizeTransactionType(value);
  return (
    normalized === TransactionType.INCOME_ACTIVE ||
    normalized === TransactionType.INCOME_PASSIVE
  );
}
export function isNeutralTransactionType(value?: string | null): boolean {
  const normalized = normalizeTransactionType(value);
  return normalized != null && !isExpenseTransactionType(normalized) && !isIncomeTransactionType(normalized);
}
export type TransactionFlowGroup = "income" | "expense" | "neutral";
export function getTransactionFlowGroup(value?: string | null): TransactionFlowGroup {
  if (isExpenseTransactionType(value)) {
    return "expense";
  }
  if (isIncomeTransactionType(value)) {
    return "income";
  }
  return "neutral";
}

export interface Transaction {
  id: string;
  originalDescription: string;
  summaryDescription: string;
  classificationRuleId?: string | null;
  classificationRulePriority?: number | null;
  tickerB3: string | null;
  amount: number;
  transactionDate: string;
  type: string;
  typeCode?: string | null;
  category: string | null;
  origin: string | null;
  importFileName?: string | null;
  bankId: string;
  bankName: string;
  createdAt: string;
}

export interface TransactionUpsertPayload {
  date: string;
  description: string;
  summaryDescription?: string | null;
  amount: number;
  type: TransactionTypeValue;
  typeCode?: string | null;
}
