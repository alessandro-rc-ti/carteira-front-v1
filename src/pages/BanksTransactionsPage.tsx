import { Link, useNavigate } from "react-router-dom";
import { TransactionTable } from "@/components/TransactionTable";
import { useEffect, useState } from "react";
import { useBankStore } from "@/stores/bankStore";
import { useTransactionStore } from "@/stores/transactionStore";

export default function BanksTransactionsPage() {
  const navigate = useNavigate();
  const { banks, fetchBanks } = useBankStore();
  const { transactions, loading, error, fetchAll, fetchByBank } = useTransactionStore();
  const [selectedBankId, setSelectedBankId] = useState<string>("");

  useEffect(() => {
    fetchBanks();
  }, []);

  useEffect(() => {
    if (selectedBankId) {
      fetchByBank(selectedBankId);
    } else {
      fetchAll();
    }
  }, [selectedBankId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Transações</h1>
        <div className="flex items-center gap-2">
          <Link to="/banks/transactions/import" className="btn btn-sm">
            Importação
          </Link>
          <select
            value={selectedBankId}
            onChange={(e) => setSelectedBankId(e.target.value)}
            className="border rounded-md px-2 py-1 text-sm"
          >
            <option value="">Selecionar banco (obrigatório)</option>
            {banks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.bankName}
              </option>
            ))}
          </select>
          <button
            className={`btn btn-primary btn-sm ${!selectedBankId ? "opacity-60 cursor-not-allowed" : ""}`}
            disabled={!selectedBankId}
            onClick={() => navigate(`/banks/transactions/new?bankId=${selectedBankId}`)}
          >
            Nova transação
          </button>
        </div>
      </div>

      <div className="card">
        <TransactionTable
          transactions={transactions}
          loading={loading}
          error={error}
          showBankColumn={!selectedBankId}
        />
      </div>
    </div>
  );
}
