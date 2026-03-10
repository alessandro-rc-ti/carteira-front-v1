import { useEffect, useState } from "react";
import { useInstitutionAliasStore } from "@/stores/institutionAliasStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";

export function InstitutionAliasPage() {
  const { aliases, loading, fetchAliases, createAlias, updateAlias, deleteAlias } =
    useInstitutionAliasStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [aliasValue, setAliasValue] = useState("");
  const [normalizedName, setNormalizedName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAliases();
  }, [fetchAliases]);

  const openNew = () => {
    setEditingId(null);
    setAliasValue("");
    setNormalizedName("");
    setDialogOpen(true);
  };

  const openEdit = (id: string, alias: string, name: string) => {
    setEditingId(id);
    setAliasValue(alias);
    setNormalizedName(name);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!aliasValue.trim() || !normalizedName.trim()) {
      toast.error("Preencha ambos os campos");
      return;
    }
    setSubmitting(true);
    try {
      const request = { alias: aliasValue.trim(), normalizedName: normalizedName.trim() };
      if (editingId) {
        await updateAlias(editingId, request);
        toast.success("Alias atualizado com sucesso");
      } else {
        await createAlias(request);
        toast.success("Alias criado com sucesso");
      }
      setDialogOpen(false);
    } catch {
      toast.error(editingId ? "Falha ao atualizar alias" : "Falha ao criar alias");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, alias: string) => {
    try {
      await deleteAlias(id);
      toast.success(`Alias "${alias}" excluído com sucesso`);
    } catch {
      toast.error("Falha ao excluir alias");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight uppercase">
            Resumo Instituição
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Mapeie os nomes longos das instituições da B3 para nomes curtos e legíveis
          </p>
        </div>
        <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Alias
        </Button>
      </div>

      {loading && aliases.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Carregando aliases...
        </div>
      ) : aliases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <ArrowRightLeft className="h-12 w-12 mb-4 text-slate-300" />
          <p className="text-lg">Nenhum alias cadastrado ainda</p>
          <p className="text-sm">Adicione aliases para normalizar os nomes de instituição ao importar CSV da B3</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden text-sm">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="font-semibold text-slate-600">Alias (palavra-chave)</TableHead>
                <TableHead className="font-semibold text-slate-600">Nome Normalizado</TableHead>
                <TableHead className="text-right font-semibold text-slate-600">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aliases.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs uppercase">{a.alias}</TableCell>
                  <TableCell className="font-medium">{a.normalizedName}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(a.id, a.alias, a.normalizedName)}
                        title="Editar alias"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="Excluir alias">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir alias?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Isso excluirá permanentemente o alias &quot;{a.alias}&quot; → &quot;{a.normalizedName}&quot;.
                              Futuras importações não farão mais esse de/para.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(a.id, a.alias)}>
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

      {/* Dialog Criar / Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Alias" : "Novo Alias"}</DialogTitle>
            <DialogDescription>
              O sistema procura este alias (case-insensitive) no nome da instituição do CSV da B3.
              Se encontrar, usa o nome normalizado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="alias">Alias (palavra-chave no CSV)</Label>
              <Input
                id="alias"
                value={aliasValue}
                onChange={(e) => setAliasValue(e.target.value)}
                placeholder="Ex: INTER DISTRIBUIDORA"
                className="font-mono uppercase"
              />
              <p className="text-xs text-muted-foreground">
                Parte do nome que aparece no CSV da B3 (case-insensitive)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="normalizedName">Nome Normalizado</Label>
              <Input
                id="normalizedName"
                value={normalizedName}
                onChange={(e) => setNormalizedName(e.target.value)}
                placeholder="Ex: Inter"
              />
              <p className="text-xs text-muted-foreground">
                Nome curto que será salvo no investimento
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !aliasValue.trim() || !normalizedName.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? "Salvando..." : editingId ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
