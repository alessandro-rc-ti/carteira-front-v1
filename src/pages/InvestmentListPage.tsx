import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInvestmentStore } from "@/stores/investmentStore";
import { B3ImportSection } from "@/components/B3ImportSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Upload, FileX } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import { investmentService } from "@/services";
import { InvestmentCategoryLabels, InvestmentOrderTypeLabels } from "@/types/investment";
import type { InvestmentCategory, InvestmentOrderType } from "@/types/investment";

export function InvestmentListPage() {
  const navigate = useNavigate();
  const { investments, loading, fetchInvestments, deleteInvestment } = useInvestmentStore();
  const [b3ImportOpen, setB3ImportOpen] = useState(false);

  // Delete state
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteFileName, setDeleteFileName] = useState("");

  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  // ── Delete handlers ───────────────────────────────────────────────────
  const handleDeleteAll = async () => {
    if (!confirm("Tem certeza? Isso apagará TODOS os investimentos e aliases de instituição. Ação irreversível.")) return;
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
    if (!confirm("Tem certeza? Isso apagará TODOS os investimentos. Ação irreversível.")) return;
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
    if (!deleteFileName.trim()) {
      showError("Informe o nome do arquivo");
      return;
    }
    setDeleteLoading(true);
    try {
      await investmentService.deleteInvestmentsByFile(deleteFileName.trim());
      showSuccess(`Investimentos do arquivo "${deleteFileName}" deletados`);
      setDeleteModalOpen(false);
      setDeleteFileName("");
      fetchInvestments();
    } catch {
      showError("Falha ao deletar investimentos por arquivo");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDelete = async (id: string, ticker: string) => {
    try {
      await deleteInvestment(id);
      showSuccess(`Investimento "${ticker}" excluído com sucesso`);
    } catch {
      showError("Falha ao excluir investimento");
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const formatQuantity = (value: number) =>
    new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 6 }).format(value);

  // Ordenação
  const [sortKey, setSortKey] = useState<string>("purchaseDate");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const sortedInvestments = [...investments].sort((a, b) => {
    const valA = a[sortKey as keyof typeof a];
    const valB = b[sortKey as keyof typeof b];
    if (typeof valA === "string" && typeof valB === "string") {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    if (typeof valA === "number" && typeof valB === "number") {
      return sortAsc ? valA - valB : valB - valA;
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight uppercase">Investimentos</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gerencie sua carteira de investimentos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setB3ImportOpen(true)} className="w-full sm:w-auto">
            <Upload className="mr-2 h-4 w-4" />
            Importar B3
          </Button>
          <Button onClick={() => navigate("/investments/transactions/new")} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo Investimento
          </Button>
        </div>
      </div>

      {/* Botões de exclusão */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDeleteAll}
          disabled={deleteLoading}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Deletar tudo (Investimentos + Aliases)
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDeleteInvestments}
          disabled={deleteLoading}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Deletar todos os investimentos
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDeleteModalOpen(true)}
          disabled={deleteLoading}
        >
          <FileX className="mr-2 h-4 w-4" />
          Deletar por arquivo
        </Button>
      </div>

      {loading && investments.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Carregando investimentos...
        </div>
      ) : investments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p className="text-lg">Nenhum investimento cadastrado ainda</p>
          <p className="text-sm">Adicione seu primeiro investimento para começar a acompanhar sua carteira</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden text-sm">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="font-semibold text-slate-600 cursor-pointer" onClick={() => {setSortKey("ticker");setSortAsc(sortKey!=="ticker"?true:!sortAsc);}}>Ticker</TableHead>
                <TableHead className="font-semibold text-slate-600 cursor-pointer" onClick={() => {setSortKey("category");setSortAsc(sortKey!=="category"?true:!sortAsc);}}>Categoria</TableHead>
                <TableHead className="font-semibold text-slate-600 cursor-pointer" onClick={() => {setSortKey("orderType");setSortAsc(sortKey!=="orderType"?true:!sortAsc);}}>Tipo de Ordem</TableHead>
                <TableHead className="font-semibold text-slate-600 text-right cursor-pointer" onClick={() => {setSortKey("quantity");setSortAsc(sortKey!=="quantity"?true:!sortAsc);}}>Quantidade</TableHead>
                <TableHead className="font-semibold text-slate-600 text-right cursor-pointer" onClick={() => {setSortKey("unitPrice");setSortAsc(sortKey!=="unitPrice"?true:!sortAsc);}}>Preço Unit.</TableHead>
                <TableHead className="font-semibold text-slate-600 text-right cursor-pointer" onClick={() => {setSortKey("totalPrice");setSortAsc(sortKey!=="totalPrice"?true:!sortAsc);}}>Total</TableHead>
                <TableHead className="font-semibold text-slate-600 cursor-pointer" onClick={() => {setSortKey("purchaseDate");setSortAsc(sortKey!=="purchaseDate"?true:!sortAsc);}}>Data Compra</TableHead>
                <TableHead className="font-semibold text-slate-600 cursor-pointer" onClick={() => {setSortKey("institution");setSortAsc(sortKey!=="institution"?true:!sortAsc);}}>Instituição</TableHead>
                <TableHead className="text-right font-semibold text-slate-600">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedInvestments.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium font-mono uppercase">{inv.ticker}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {InvestmentCategoryLabels[inv.category as InvestmentCategory] ?? inv.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {InvestmentOrderTypeLabels[inv.orderType as InvestmentOrderType] ?? inv.orderType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatQuantity(inv.quantity)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(inv.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(inv.totalPrice)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(inv.purchaseDate)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{inv.institution}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/investments/transactions/${inv.id}/edit`)}
                        title="Editar investimento"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="Excluir investimento">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir investimento?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Isso excluirá permanentemente o investimento &quot;{inv.ticker}&quot;.
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(inv.id, inv.ticker)}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <B3ImportSection
        open={b3ImportOpen}
        onOpenChange={setB3ImportOpen}
        onImportComplete={() => fetchInvestments()}
      />

      {/* Modal: Deletar por arquivo */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar investimentos por arquivo</DialogTitle>
            <DialogDescription>
              Informe o nome exato do arquivo de importação cujos investimentos devem ser removidos.
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteByFile}
                disabled={deleteLoading || !deleteFileName.trim()}
              >
                Deletar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
