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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { PlusCircle } from "lucide-react";

export default function BanksTransactionsPage() {
  const navigate = useNavigate();
  const { banks, fetchBanks } = useBankStore();
  const { transactions, loading, error, fetchAll, fetchByBank } = useTransactionStore();
  const [selectedBankId, setSelectedBankId] = useState<string>("ALL");
  const [showSelectBankModal, setShowSelectBankModal] = useState(false);

  useEffect(() => {
    fetchBanks();
  }, []);

  useEffect(() => {
    if (selectedBankId === "ALL") {
      fetchAll();
    } else {
      fetchByBank(selectedBankId);
    }
  }, [selectedBankId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight uppercase">Transações</h1>
          <p className="text-slate-500 text-sm mt-1">Visualize e gerencie lançamentos por conta bancária</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Select value={selectedBankId} onValueChange={setSelectedBankId}>
            <SelectTrigger className="w-[220px] bg-white shadow-sm border-slate-200">
              <SelectValue placeholder="Filtrar por banco" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os bancos</SelectItem>
              {banks.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.bankName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Link to="/banks/transactions/import">
            <Button variant="outline" className="hidden sm:inline-flex">Importação</Button>
          </Link>

          <Button
            onClick={() => {
              if (selectedBankId === "ALL") setShowSelectBankModal(true);
              else navigate(`/banks/transactions/new?bankId=${selectedBankId}`);
            }}
            className="ml-2"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
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
