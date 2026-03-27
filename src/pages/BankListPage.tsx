import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBankStore } from "@/stores/bankStore";
import { bankService, classificationRuleService } from "@/services";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader, DataTable, KpiCard } from "@/components/shared";
import { Plus, Eye, Pencil, Copy, Trash2, MoreHorizontal, Building2, CheckCircle2 } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import type { BankResponse } from "@/types/bank";
import type { ColumnDef } from "@tanstack/react-table";

const SIGN_LABELS: Record<string, string> = {
  NO_CHANGE: "Sem alteracao",
  INVERT: "Inverter sinal",
  ABSOLUTE: "Valor absoluto",
  NEGATE_IF_POSITIVE: "Negar se positivo",
};

export function BankListPage() {
  const navigate = useNavigate();
  const { banks, loading, fetchBanks } = useBankStore();
  const [cloneLoading, setCloneLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BankResponse | null>(null);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  const openClone = (b: BankResponse) => { setSelectedBank(b); setCloneDialogOpen(true); };
  const openDelete = (b: BankResponse) => { setSelectedBank(b); setDeleteDialogOpen(true); };

  const handleClone = async () => {
    if (!selectedBank) return;
    setCloneLoading(true);
    try {
      const createdBank = await bankService.create({
        bankName: selectedBank.bankName + " (copia)",
        dateFormatPattern: selectedBank.dateFormatPattern,
        decimalSeparator: selectedBank.decimalSeparator,
        csvDelimiter: selectedBank.csvDelimiter,
        csvHeaderMapping: selectedBank.csvHeaderMapping,
        debitValueSignHandling: selectedBank.debitValueSignHandling,
        creditTypeIdentifier: selectedBank.creditTypeIdentifier,
        debitTypeIdentifier: selectedBank.debitTypeIdentifier,
        csvSkipStrategy: selectedBank.csvSkipStrategy,
        csvSkipValue: selectedBank.csvSkipValue,
        csvSimilarityGroupingThreshold: selectedBank.csvSimilarityGroupingThreshold,
        classificationRules: undefined,
      });
      await Promise.all(
        (selectedBank.classificationRules ?? []).map((rule) =>
          classificationRuleService.create(createdBank.id, { ...rule, id: undefined })
        )
      );
      showSuccess(`Banco clonado com sucesso`);
      fetchBanks();
      setCloneDialogOpen(false);
    } catch {
      showError("Falha ao clonar banco");
    } finally {
      setCloneLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBank) return;
    setDeleteLoading(true);
    try {
      await bankService.remove(selectedBank.id);
      showSuccess(`Banco "${selectedBank.bankName}" excluido`);
      fetchBanks();
      setDeleteDialogOpen(false);
    } catch {
      showError("Falha ao excluir banco");
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalBanks = banks.length;
  const activeBanks = banks.filter((b) => b.active).length;

  const columns: ColumnDef<BankResponse, unknown>[] = [
    {
      accessorKey: "bankName",
      header: "Nome do Banco",
      cell: ({ row }) => <span className="font-semibold">{row.original.bankName}</span>,
    },
    {
      accessorKey: "dateFormatPattern",
      header: "Formato de Data",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.dateFormatPattern}</span>
      ),
    },
    {
      accessorKey: "csvDelimiter",
      header: "Delimitador",
      cell: ({ row }) => (
        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
          {row.original.csvDelimiter}
        </span>
      ),
    },
    {
      accessorKey: "debitValueSignHandling",
      header: "Sinal Debito",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {SIGN_LABELS[row.original.debitValueSignHandling] ?? row.original.debitValueSignHandling}
        </span>
      ),
    },
    {
      id: "patterns",
      header: "Padroes",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.classificationRules?.length ?? 0}</Badge>
      ),
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) =>
        row.original.active ? (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">Ativo</Badge>
        ) : (
          <Badge variant="secondary">Inativo</Badge>
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
              <DropdownMenuItem onClick={() => navigate(`/banks/${row.original.id}`)}>
                <Eye className="mr-2 h-4 w-4" /> Ver
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/banks/${row.original.id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openClone(row.original)}>
                <Copy className="mr-2 h-4 w-4" /> Clonar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => openDelete(row.original)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
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
        title="Bancos"
        description="Gerencie as configuracoes dos bancos importados"
      >
        <Button onClick={() => navigate("/banks/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Banco
        </Button>
      </PageHeader>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total de Bancos"
          value={String(totalBanks)}
          icon={Building2}
        />
        <KpiCard
          title="Bancos Ativos"
          value={String(activeBanks)}
          icon={CheckCircle2}
          iconClassName="text-green-600"
        />
      </div>

      <DataTable
        columns={columns}
        data={banks}
        loading={loading}
        globalFilterPlaceholder="Pesquisar bancos..."
        emptyMessage="Nenhum banco cadastrado ainda."
        initialPageSize={25}
      />

      {/* Clone Dialog */}
      <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clonar banco?</DialogTitle>
            <DialogDescription>
              Uma copia de &quot;{selectedBank?.bankName}&quot; sera criada com todas as regras
              de classificacao. Voce podera editar as configuracoes depois.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloneDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleClone} disabled={cloneLoading}>
              {cloneLoading ? "Clonando..." : "Clonar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir banco?</DialogTitle>
            <DialogDescription>
              Isso excluira permanentemente &quot;{selectedBank?.bankName}&quot; e todas as suas
              regras de classificacao. Esta acao e irreversivel.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
