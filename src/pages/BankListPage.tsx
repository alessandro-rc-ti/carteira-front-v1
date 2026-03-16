import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBankStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Eye, Pencil, Trash2, Copy } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import { bankService } from "@/services/bankService";

export function BankListPage() {
  const navigate = useNavigate();
  const { banks, loading, fetchBanks, deleteBank } = useBankStore();
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [cloneBankId, setCloneBankId] = useState<string | null>(null);
  const [cloneBankName, setCloneBankName] = useState("");
  const [cloning, setCloning] = useState(false);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteBank(id);
      showSuccess(`Banco "${name}" excluído com sucesso`);
    } catch {
      showError("Falha ao excluir banco");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight uppercase">Bancos & Contas</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gerencie as configurações dos seus bancos para importação CSV
          </p>
        </div>
        <Button onClick={() => navigate("/banks/new")} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Banco
        </Button>
      </div>

      {/* Modal de Clonar Banco */}
      {cloneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md relative">
            <button
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
              onClick={() => setCloneModalOpen(false)}
              type="button"
            >
              <span className="text-lg">×</span>
            </button>
            <h2 className="text-lg font-bold mb-4">Clonar Banco</h2>
            <p className="text-sm text-slate-500 mb-4">
              Será criado um novo banco com todas as configurações idênticas. Informe apenas o nome.
            </p>
            <div className="space-y-2">
              <label htmlFor="cloneBankName" className="text-sm font-medium">Nome do novo banco *</label>
              <input
                id="cloneBankName"
                value={cloneBankName}
                onChange={(e) => setCloneBankName(e.target.value)}
                placeholder="Ex: Inter Conta 2"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && cloneBankName.trim()) {
                    e.preventDefault();
                    document.getElementById("btnClonar")?.click();
                  }
                }}
              />
            </div>
            <div className="flex gap-2 mt-6 justify-end">
              <button
                className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm"
                onClick={() => setCloneModalOpen(false)}
                type="button"
              >
                Cancelar
              </button>
              <button
                id="btnClonar"
                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm disabled:opacity-50"
                disabled={cloning || !cloneBankName.trim()}
                onClick={async () => {
                  if (!cloneBankId) return;
                  setCloning(true);
                  try {
                    const original = await bankService.getById(cloneBankId);
                    const cloneReq = {
                      bankName: cloneBankName.trim(),
                      dateFormatPattern: original.dateFormatPattern,
                      decimalSeparator: original.decimalSeparator,
                      csvDelimiter: original.csvDelimiter,
                      csvHeaderMapping: original.csvHeaderMapping,
                      debitValueSignHandling: original.debitValueSignHandling,
                      creditTypeIdentifier: original.creditTypeIdentifier,
                      debitTypeIdentifier: original.debitTypeIdentifier,
                      descriptionSummaryPatterns: original.descriptionSummaryPatterns ?? [],
                    };
                    const created = await bankService.create(cloneReq);
                    showSuccess(`Banco "${cloneBankName.trim()}" clonado com sucesso!`);
                    setCloneModalOpen(false);
                    setCloneBankName("");
                    setCloneBankId(null);
                    fetchBanks();
                    navigate(`/banks/${created.id}`);
                  } catch {
                    showError("Falha ao clonar banco");
                  } finally {
                    setCloning(false);
                  }
                }}
                type="button"
              >
                {cloning ? "Clonando..." : "Clonar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && banks.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Carregando bancos...
        </div>
      ) : banks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p className="text-lg">Nenhum banco configurado ainda</p>
          <p className="text-sm">Crie seu primeiro banco para começar a importar transações</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden text-sm">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="font-semibold text-slate-600">Nome</TableHead>
                <TableHead className="font-semibold text-slate-600">Formato Data</TableHead>
                <TableHead className="font-semibold text-slate-600">Delimitador</TableHead>
                <TableHead className="font-semibold text-slate-600">Tratamento Débito</TableHead>
                <TableHead className="font-semibold text-slate-600">Padrões</TableHead>
                <TableHead className="font-semibold text-slate-600">Status</TableHead>
                <TableHead className="text-right font-semibold text-slate-600">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banks.map((bank) => (
                <TableRow key={bank.id}>
                  <TableCell className="font-medium">{bank.bankName}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {bank.dateFormatPattern}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {bank.csvDelimiter === ";" ? "ponto e vírgula (;)" : bank.csvDelimiter}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {bank.debitValueSignHandling}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {bank.descriptionSummaryPatterns?.length ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={bank.active ? "default" : "outline"}>
                      {bank.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCloneBankId(bank.id);
                          setCloneBankName("");
                          setCloneModalOpen(true);
                        }}
                        title="Clonar banco"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/banks/${bank.id}`)}
                        title="Ver detalhes e importar CSV"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/banks/${bank.id}/edit`)}
                        title="Editar banco"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="Excluir banco">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir banco?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Isso excluirá permanentemente &quot;{bank.bankName}&quot; e toda sua
                              configuração. Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(bank.id, bank.bankName)}
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
    </div>
  );
}
