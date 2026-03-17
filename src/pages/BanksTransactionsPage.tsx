import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useBankStore } from "@/stores/bankStore";
import { useTransactionStore } from "@/stores/transactionStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { PageHeader, DataTable } from "@/components/shared";
import {
  PlusCircle,
  FileText,
  MoreVertical,
  Trash2,
  FileX,
  Edit,
  MoreHorizontal,
} from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import type { Transaction } from "@/types/transaction";
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
  const { transactions, loading, fetchAll, fetchByBank, deleteByFile, deleteAll, deleteTransaction } =
    useTransactionStore();

  const [selectedBankId, setSelectedBankId] = useState<string>("ALL");
  const [showSelectBankModal, setShowSelectBankModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showDeleteByFileModal, setShowDeleteByFileModal] = useState(false);
  const [deleteFileName, setDeleteFileName] = useState("");
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [deleteTxId, setDeleteTxId] = useState<string | null>(null);

  useEffect(() => {
    fetchBanks();
    const params = new URLSearchParams(location.search);
    const bankParam = params.get("bankId");
    if (bankParam) setSelectedBankId(bankParam);
  }, [fetchBanks]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (selectedBankId && selectedBankId !== params.get("bankId")) {
      params.set("bankId", selectedBankId);
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    }
    if (selectedBankId === "ALL") fetchAll();
    else fetchByBank(selectedBankId);
  }, [selectedBankId]);

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
      if (selectedBankId === "ALL") fetchAll(); else fetchByBank(selectedBankId);
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
      cell: ({ row }) => (
        <span
          className={`font-medium tabular-nums ${
            row.original.type === "income" ? "text-green-600" : "text-red-600"
          }`}
        >
          {row.original.type === "expense" && row.original.amount > 0 ? "-" : ""}
          {formatCurrency(Math.abs(row.original.amount))}
        </span>
      ),
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) =>
        row.original.type === "income" ? (
          <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Receita</Badge>
        ) : (
          <Badge variant="outline" className="text-red-600 border-red-200">Despesa</Badge>
        ),
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

      <DataTable
        columns={columns}
        data={transactions}
        loading={loading}
        globalFilterPlaceholder="Pesquisar transacoes..."
        emptyMessage="Nenhuma transacao encontrada."
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
