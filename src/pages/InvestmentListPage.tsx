import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInvestmentStore } from "@/stores/investmentStore";
import { B3ImportSection } from "@/components/B3ImportSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Pencil, Trash2, Upload, FileX, MoreVertical, MoreHorizontal } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import { investmentService } from "@/services";
import {
  InvestmentCategoryLabels,
  InvestmentOrderTypeLabels,
} from "@/types/investment";
import type { InvestmentCategory, InvestmentOrderType, InvestmentResponse } from "@/types/investment";
import type { ColumnDef } from "@tanstack/react-table";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const formatDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};
const formatQty = (v: number) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 6 }).format(v);

export function InvestmentListPage() {
  const navigate = useNavigate();
  const { investments, loading, fetchInvestments, deleteInvestment } = useInvestmentStore();
  const [b3ImportOpen, setB3ImportOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteByFileOpen, setDeleteByFileOpen] = useState(false);
  const [deleteFileName, setDeleteFileName] = useState("");
  const [deleteSingleId, setDeleteSingleId] = useState<{ id: string; ticker: string } | null>(null);

  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  const handleDeleteAll = async () => {
    if (!confirm("Tem certeza? Isso apagara TODOS os investimentos e aliases de instituicao. Acao irreversivel.")) return;
    setDeleteLoading(true);
    try {
      await investmentService.deleteAllInvestmentsAndAliases();
      showSuccess("Todos os investimentos e aliases foram deletados");
      fetchInvestments();
    } catch {
      showError("Falha ao deletar investimentos e aliases");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteInvestments = async () => {
    if (!confirm("Tem certeza? Isso apagara TODOS os investimentos. Acao irreversivel.")) return;
    setDeleteLoading(true);
    try {
      await investmentService.deleteAllInvestments();
      showSuccess("Todos os investimentos foram deletados");
      fetchInvestments();
    } catch {
      showError("Falha ao deletar investimentos");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteByFile = async () => {
    if (!deleteFileName.trim()) { showError("Informe o nome do arquivo"); return; }
    setDeleteLoading(true);
    try {
      await investmentService.deleteInvestmentsByFile(deleteFileName.trim());
      showSuccess(`Investimentos do arquivo "${deleteFileName}" deletados`);
      setDeleteByFileOpen(false);
      setDeleteFileName("");
      fetchInvestments();
    } catch {
      showError("Falha ao deletar investimentos por arquivo");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteSingle = async () => {
    if (!deleteSingleId) return;
    try {
      await deleteInvestment(deleteSingleId.id);
      showSuccess(`Investimento "${deleteSingleId.ticker}" excluido com sucesso`);
      setDeleteSingleId(null);
    } catch {
      showError("Falha ao excluir investimento");
    }
  };

  const columns: ColumnDef<InvestmentResponse, unknown>[] = [
    {
      accessorKey: "ticker",
      header: "Ticker",
      cell: ({ row }) => (
        <span className="font-mono font-semibold uppercase">{row.original.ticker}</span>
      ),
    },
    {
      accessorKey: "category",
      header: "Categoria",
      cell: ({ row }) => (
        <Badge variant="secondary">
          {InvestmentCategoryLabels[row.original.category as InvestmentCategory] ?? row.original.category}
        </Badge>
      ),
    },
    {
      accessorKey: "orderType",
      header: "Tipo Ordem",
      cell: ({ row }) => (
        <Badge variant="outline">
          {InvestmentOrderTypeLabels[row.original.orderType as InvestmentOrderType] ?? row.original.orderType}
        </Badge>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Quantidade",
      cell: ({ row }) => (
        <span className="text-right block tabular-nums text-muted-foreground">
          {formatQty(row.original.quantity)}
        </span>
      ),
    },
    {
      accessorKey: "unitPrice",
      header: "Preco Unit.",
      cell: ({ row }) => (
        <span className="text-right block tabular-nums text-muted-foreground">
          {formatCurrency(row.original.unitPrice)}
        </span>
      ),
    },
    {
      accessorKey: "totalPrice",
      header: "Total",
      cell: ({ row }) => (
        <span className="text-right block tabular-nums font-medium">
          {formatCurrency(row.original.totalPrice)}
        </span>
      ),
    },
    {
      accessorKey: "purchaseDate",
      header: "Data Compra",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatDate(row.original.purchaseDate)}</span>
      ),
    },
    {
      accessorKey: "institution",
      header: "Instituicao",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.institution}</span>,
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
                onClick={() => navigate(`/investments/transactions/${row.original.id}/edit`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteSingleId({ id: row.original.id, ticker: row.original.ticker })}
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Investimentos"
        description="Gerencie sua carteira de investimentos"
      >
        <Button variant="outline" onClick={() => setB3ImportOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Importar B3
        </Button>
        <Button onClick={() => navigate("/investments/transactions/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Investimento
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acoes em massa</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setDeleteByFileOpen(true)}
            >
              <FileX className="mr-2 h-4 w-4" />
              Deletar por arquivo
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDeleteInvestments}
              className="text-destructive focus:text-destructive"
              disabled={deleteLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Deletar todos os investimentos
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDeleteAll}
              className="text-destructive focus:text-destructive"
              disabled={deleteLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Deletar investimentos + aliases
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader>

      <DataTable
        columns={columns}
        data={investments}
        loading={loading}
        globalFilterPlaceholder="Pesquisar por ticker, instituicao..."
        emptyMessage="Nenhum investimento cadastrado ainda."
        initialPageSize={25}
      />

      <B3ImportSection
        open={b3ImportOpen}
        onOpenChange={setB3ImportOpen}
        onImportComplete={() => fetchInvestments()}
      />

      {/* Delete by file */}
      <Dialog open={deleteByFileOpen} onOpenChange={setDeleteByFileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar investimentos por arquivo</DialogTitle>
            <DialogDescription>
              Informe o nome exato do arquivo de importacao cujos investimentos devem ser removidos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="deleteFileName">Nome do arquivo</Label>
              <Input
                id="deleteFileName"
                placeholder="ex: movimentacao-2024.csv"
                value={deleteFileName}
                onChange={(e) => setDeleteFileName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteByFileOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteByFile}
              disabled={deleteLoading || !deleteFileName.trim()}
            >
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete single confirm */}
      <Dialog open={!!deleteSingleId} onOpenChange={(o) => !o && setDeleteSingleId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir investimento?</DialogTitle>
            <DialogDescription>
              Isso excluira permanentemente o investimento &quot;{deleteSingleId?.ticker}&quot;.
              Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteSingleId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteSingle}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
