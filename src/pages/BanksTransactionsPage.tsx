import { Link } from "react-router-dom";
import { TransactionTable } from "@/components/TransactionTable";

export default function BanksTransactionsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Transações</h1>
        <div className="flex items-center gap-2">
          <Link to="/banks/transactions/import" className="btn btn-sm">
            Importação
          </Link>
          <Link to="/banks/transactions/new" className="btn btn-primary btn-sm">
            Nova transação
          </Link>
        </div>
      </div>

      <div className="card">
        <TransactionTable showBankColumn={true} />
      </div>
    </div>
  );
}
