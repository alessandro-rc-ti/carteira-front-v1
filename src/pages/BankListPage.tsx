import { useEffect } from "react";
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
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function BankListPage() {
  const navigate = useNavigate();
  const { banks, loading, fetchBanks, deleteBank } = useBankStore();

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteBank(id);
      toast.success(`Banco "${name}" excluído com sucesso`);
    } catch {
      toast.error("Falha ao excluir banco");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bancos</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações dos seus bancos para importação CSV
          </p>
        </div>
        <Button onClick={() => navigate("/banks/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Banco
        </Button>
      </div>

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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Formato Data</TableHead>
                <TableHead>Delimitador</TableHead>
                <TableHead>Tratamento Débito</TableHead>
                <TableHead>Padrões</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
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
