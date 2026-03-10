import { Link, useNavigate } from "react-router-dom";
import { TransactionTable } from "@/components/TransactionTable";
import { useEffect, useState } from "react";
import { useBankStore } from "@/stores/bankStore";
import { useTransactionStore } from "@/stores/transactionStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight uppercase">Transações</h1>
          <p className="text-slate-500 text-sm mt-1">Visualize e gerencie lançamentos por conta bancária</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link to="/banks/transactions/import">
            <Button variant="outline" className="hidden sm:inline-flex">Importação</Button>
          </Link>

          <select
            value={selectedBankId}
            onChange={(e) => setSelectedBankId(e.target.value)}
            className="border rounded-md px-2 py-1 text-sm ml-2"
          >
            <option value="">Selecionar banco (opcional)</option>
            {banks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.bankName}
              </option>
            ))}
          </select>

          <Button
            onClick={() => navigate(`/banks/transactions/new?bankId=${selectedBankId}`)}
            disabled={!selectedBankId}
            className="ml-2"
          >
            Nova transação
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Transações</CardTitle>
          <CardDescription>Filtros aplicáveis: por conta, período e tipo</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionTable
            transactions={transactions}
            loading={loading}
            error={error}
            showBankColumn={!selectedBankId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
