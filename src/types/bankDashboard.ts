export interface BankDashboardInflationSummary {
  officialInflationYearToDate: number | null;
  officialInflationLast12Months: number | null;
  averagePersonalInflation: number | null;
  averageRealGainOrLoss: number | null;
  averageInflationReplacement: number | null;
  closedMonthsCount: number;
  referenceMonthLabel: string | null;
}

export interface BankDashboardInflationMonth {
  periodKey: string;
  periodLabel: string;
  officialInflationRate: number | null;
  personalInflationRate: number | null;
  inflationReplacement: number;
  realGainOrLoss: number;
  incomeTotal: number;
  expenseTotal: number;
  netTotal: number;
  transactionCount: number;
}

export interface BankDashboardInflationResponse {
  inflationDataAvailable: boolean;
  latestOfficialMonth: string | null;
  lastSuccessfulSyncAt: string | null;
  statusMessage: string | null;
  summary: BankDashboardInflationSummary;
  monthlySeries: BankDashboardInflationMonth[];
}