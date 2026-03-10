export interface Transaction {
  id: string;
  originalDescription: string;
  summaryDescription: string;
  tickerB3: string | null;
  amount: number;
  transactionDate: string;
  type: string;
  category: string | null;
  origin: string | null;
  bankId: string;
  bankName: string;
  createdAt: string;
}
