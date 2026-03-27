import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useBankStore } from "@/stores/bankStore";
import { useTransactionStore } from "@/stores/transactionStore";
import { useTransactionTypeStore } from "@/stores/transactionTypeStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader, DataTable, KpiCard } from "@/components/shared";
import {
  PlusCircle,
  FileText,
  MoreVertical,
  Trash2,
  FileX,
  Edit,
  MoreHorizontal,
  ArrowUpCircle,
  ArrowDownCircle,
  Activity,
  Wallet,
  RotateCcw,
} from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import {
  getTransactionFlowGroup,
  getTransactionTypeDisplayLabel,
  type Transaction,
} from "@/types/transaction";
import type { ColumnDef } from "@tanstack/react-table";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const formatDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

export default function BanksTransactionsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { banks, fetchBanks } = useBankStore();
  const { items: transactionTypes, fetchAll: fetchTransactionTypes } = useTransactionTypeStore();
  const { transactions, loading, fetchAll, fetchByBank, deleteByFile, deleteAll, deleteTransaction } =
    useTransactionStore();

  const [selectedBankId, setSelectedBankId] = useState<string>("ALL");
  const [selectedRuleId, setSelectedRuleId] = useState<string>("ALL");
  const [showSelectBankModal, setShowSelectBankModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showDeleteByFileModal, setShowDeleteByFileModal] = useState(false);
  const [deleteFileName, setDeleteFileName] = useState("");
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [deleteTxId, setDeleteTxId] = useState<string | null>(null);
  const [flowFilters, setFlowFilters] = useState({
    expense: true,
    income: true,
    neutral: true,
  });

  useEffect(() => {
    fetchBanks();
    void fetchTransactionTypes();
    const params = new URLSearchParams(location.search);
    const bankParam = params.get("bankId");
    const ruleParam = params.get("ruleId");
    if (bankParam) setSelectedBankId(bankParam);
    if (ruleParam) setSelectedRuleId(ruleParam);
  }, [fetchBanks, fetchTransactionTypes, location.search]);

  useEffect(() => {
    if (selectedBankId === "ALL" && selectedRuleId !== "ALL") {
      setSelectedRuleId("ALL");
    }
  }, [selectedBankId, selectedRuleId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (selectedBankId && selectedBankId !== params.get("bankId")) {
      params.set("bankId", selectedBankId);
    }
    if (selectedBankId !== "ALL" && selectedRuleId !== "ALL") {
      params.set("ruleId", selectedRuleId);
    } else {
      params.delete("ruleId");
    }
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    if (selectedBankId === "ALL") fetchAll();
    else fetchByBank(selectedBankId, selectedRuleId === "ALL" ? null : selectedRuleId);
  }, [
    fetchAll,
    fetchByBank,
    location.pathname,
    location.search,
    navigate,
    selectedBankId,
    selectedRuleId,
  ]);

  const selectedBankLabel = useMemo(() => {
    if (selectedBankId === "ALL") {
      return "Todos os bancos";
    }

    return banks.find((bank) => bank.id === selectedBankId)?.bankName ?? "Banco selecionado";
  }, [banks, selectedBankId]);

  const scopedTransactions = useMemo(() => {
    return transactions.filter((transaction) => flowFilters[getTransactionFlowGroup(transaction.type)]);
  }, [transactions, flowFilters]);

  const summary = useMemo(() => {
    return scopedTransactions.reduce(
      (accumulator, transaction) => {
        const flowGroup = getTransactionFlowGroup(transaction.type);
        const amount = Math.abs(transaction.amount);

        accumulator.visibleCount += 1;

        if (flowGroup === "income") {
          accumulator.income += amount;
        } else if (flowGroup === "expense") {
          accumulator.expense += amount;
        } else {
          accumulator.neutral += amount;
          accumulator.neutralCount += 1;
        }

        return accumulator;
      },
      {
        visibleCount: 0,
        income: 0,
        expense: 0,
        neutral: 0,
        neutralCount: 0,
      }
    );
  }, [scopedTransactions]);

  const allFlowFiltersEnabled = flowFilters.expense && flowFilters.income && flowFilters.neutral;

  const handleDeleteAll = async () => {
    setDeleteInProgress(true);
    try {
      await deleteAll(selectedBankId);
      showSuccess("Todas as transacoes foram excluidas");
      setShowDeleteAllModal(false);
    } catch {
      showError("Falha ao excluir transacoes");
    } finally {
      setDeleteInProgress(false);
    }
  };

  const handleDeleteByFile = async () => {
    if (!deleteFileName.trim()) { showError("Informe o nome do arquivo"); return; }
    setDeleteInProgress(true);
    try {
      await deleteByFile(selectedBankId, deleteFileName);
      showSuccess(`Transacoes do arquivo "${deleteFileName}" excluidas`);
      setShowDeleteByFileModal(false);
      setDeleteFileName("");
    } catch {
      showError("Falha ao excluir transacoes por arquivo");
    } finally {
      setDeleteInProgress(false);
    }
  };

  const handleDeleteTx = async () => {
    if (!deleteTxId) return;
    try {
      await deleteTransaction(deleteTxId);
      showSuccess("Transacao excluida");
      setDeleteTxId(null);
      if (selectedBankId === "ALL") fetchAll(); else fetchByBank(selectedBankId, selectedRuleId === "ALL" ? null : selectedRuleId);
    } catch {
      showError("Falha ao excluir transacao");
    }
  };

  const columns: ColumnDef<Transaction, unknown>[] = [
    {
      accessorKey: "transactionDate",
      header: "Data",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {formatDate(row.original.transactionDate)}
        </span>
      ),
    },
    {
      accessorKey: "summaryDescription",
      header: "Descricao",
      cell: ({ row }) => (
        <div className="max-w-[300px]">
          <p className="font-medium truncate">{row.original.summaryDescription || row.original.originalDescription}</p>
          {row.original.summaryDescription && row.original.originalDescription !== row.original.summaryDescription && (
            <p className="text-xs text-muted-foreground truncate">{row.original.originalDescription}</p>
          )}
        </div>
      ),
    },
    ...(selectedBankId === "ALL"
      ? [{
          accessorKey: "bankName" as const,
          header: "Banco",
          cell: ({ row }: { row: { original: Transaction } }) => (
            <span className="text-sm">{row.original.bankName}</span>
          ),
        }]
      : []),
    {
      accessorKey: "amount",
      header: "Valor",
      cell: ({ row }) => {
        const flowGroup = getTransactionFlowGroup(row.original.type);
        const amountClass =
          flowGroup === "income"
            ? "text-green-600"
            : flowGroup === "expense"
              ? "text-red-600"
              : "text-slate-600";

        return (
          <span className={`font-medium tabular-nums ${amountClass}`}>
            {formatCurrency(Math.abs(row.original.amount))}
          </span>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => {
        const flowGroup = getTransactionFlowGroup(row.original.type);

        if (flowGroup === "income") {
          return (
            <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
              {getTransactionTypeDisplayLabel(transactionTypes, row.original.typeCode, row.original.type)}
            </Badge>
          );
        }

        if (flowGroup === "expense") {
          return (
            <Badge variant="outline" className="text-red-600 border-red-200">
              {getTransactionTypeDisplayLabel(transactionTypes, row.original.typeCode, row.original.type)}
            </Badge>
          );
        }

        return <Badge variant="secondary">{getTransactionTypeDisplayLabel(transactionTypes, row.original.typeCode, row.original.type)}</Badge>;
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Acoes</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => navigate(`/banks/transactions/${row.original.id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteTxId(row.original.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const requireBank = (action: () => void) => {
    if (selectedBankId === "ALL") { setShowSelectBankModal(true); return; }
    action();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Transacoes" description="Visualize e gerencie lancamentos por conta bancaria">
        <Badge variant="outline">{selectedBankLabel}</Badge>
        {selectedRuleId !== "ALL" ? <Badge variant="secondary">Regra específica</Badge> : null}
        <Badge variant="outline">{summary.visibleCount} visíveis</Badge>
        <Select value={selectedBankId} onValueChange={setSelectedBankId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por banco" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os bancos</SelectItem>
            {banks.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.bankName}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => requireBank(() => navigate(`/banks/transactions/import?bankId=${selectedBankId}`))}
        >
          <FileText className="mr-2 h-4 w-4" />
          Importar
        </Button>

        <Button
          onClick={() => requireBank(() => navigate(`/banks/transactions/new?bankId=${selectedBankId}`))}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Transacao
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" disabled={selectedBankId === "ALL"}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acoes em massa</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setShowDeleteByFileModal(true)}
            >
              <FileX className="mr-2 h-4 w-4" />
              Deletar por Arquivo
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setShowDeleteAllModal(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Deletar Todas
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Transações visíveis"
          value={String(summary.visibleCount)}
          icon={Activity}
          iconClassName="bg-slate-100 text-slate-700"
          description="Após escopo e filtros semânticos"
        />
        <KpiCard
          title="Receitas"
          value={formatCurrency(summary.income)}
          icon={ArrowUpCircle}
          iconClassName="bg-emerald-50 text-emerald-600"
          description="Entradas no escopo atual"
        />
        <KpiCard
          title="Despesas"
          value={formatCurrency(summary.expense)}
          icon={ArrowDownCircle}
          iconClassName="bg-red-50 text-red-600"
          description="Saídas no escopo atual"
        />
        <KpiCard
          title="Outros movimentos"
          value={formatCurrency(summary.neutral)}
          icon={Wallet}
          iconClassName="bg-slate-100 text-slate-700"
          description={`${summary.neutralCount} movimentos neutros`}
        />
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Escopo atual</p>
            <p className="text-sm text-muted-foreground">
              {selectedBankLabel}
              {selectedRuleId !== "ALL" ? " • filtrado por regra específica" : " • sem restrição por regra"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={flowFilters.expense ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setFlowFilters((current) => ({
                  ...current,
                  expense: !current.expense,
                }))
              }
              className={flowFilters.expense ? "bg-red-600 hover:bg-red-700" : "text-red-600 border-red-200"}
            >
              Despesas
            </Button>
            <Button
              type="button"
              variant={flowFilters.income ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setFlowFilters((current) => ({
                  ...current,
                  income: !current.income,
                }))
              }
              className={flowFilters.income ? "bg-emerald-600 hover:bg-emerald-700" : "text-emerald-600 border-emerald-200"}
            >
              Receitas
            </Button>
            <Button
              type="button"
              variant={flowFilters.neutral ? "secondary" : "outline"}
              size="sm"
              onClick={() =>
                setFlowFilters((current) => ({
                  ...current,
                  neutral: !current.neutral,
                }))
              }
            >
              Outros movimentos
            </Button>
            {!allFlowFiltersEnabled ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFlowFilters({ expense: true, income: true, neutral: true })}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Restaurar
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={scopedTransactions}
        loading={loading}
        globalFilterPlaceholder="Pesquisar transacoes..."
        emptyMessage="Nenhuma transacao encontrada com o escopo e filtros atuais."
        initialPageSize={25}
      />

      {/* Delete All Dialog */}
      <Dialog open={showDeleteAllModal} onOpenChange={setShowDeleteAllModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir todas as transacoes?</DialogTitle>
            <DialogDescription>
              Isso ira apagar todas as transacoes desta conta bancaria. A operacao e irreversivel.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteAllModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteAll} disabled={deleteInProgress}>
              {deleteInProgress ? "Excluindo..." : "Confirmar e apagar tudo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete By File Dialog */}
      <Dialog open={showDeleteByFileModal} onOpenChange={setShowDeleteByFileModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar transacoes por arquivo</DialogTitle>
            <DialogDescription>
              Informe o nome do arquivo de origem para deletar somente transacoes importadas desse arquivo.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="Nome do arquivo (ex: extrato.csv)"
              value={deleteFileName}
              onChange={(e) => setDeleteFileName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteByFileModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!deleteFileName.trim() || deleteInProgress}
              onClick={handleDeleteByFile}
            >
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Select Bank Warning Dialog */}
      <Dialog open={showSelectBankModal} onOpenChange={setShowSelectBankModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecione um banco para continuar</DialogTitle>
            <DialogDescription>
              Para usar essa funcionalidade, selecione um banco especifico no filtro.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowSelectBankModal(false)}>Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Single Tx Confirm */}
      <Dialog open={!!deleteTxId} onOpenChange={(o) => !o && setDeleteTxId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir transacao?</DialogTitle>
            <DialogDescription>
              Esta acao e irreversivel e nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTxId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteTx}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
