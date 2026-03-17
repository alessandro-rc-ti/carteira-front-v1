import { useEffect, useState } from "react";
import { useInstitutionAliasStore } from "@/stores/institutionAliasStore";
import { Button } from "@/components/ui/button";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader, DataTable } from "@/components/shared";
import { Plus, Pencil, Trash2, ArrowRightLeft, MoreHorizontal } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import type { InstitutionAliasResponse } from "@/types/institutionAlias";
import type { ColumnDef } from "@tanstack/react-table";

export function InstitutionAliasPage() {
  const { aliases, loading, fetchAliases, createAlias, updateAlias, deleteAlias } =
    useInstitutionAliasStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAlias, setEditingAlias] = useState<InstitutionAliasResponse | null>(null);
  const [deletingAlias, setDeletingAlias] = useState<InstitutionAliasResponse | null>(null);
  const [aliasValue, setAliasValue] = useState("");
  const [normalizedName, setNormalizedName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAliases();
  }, [fetchAliases]);

  const openNew = () => {
    setEditingAlias(null);
    setAliasValue("");
    setNormalizedName("");
    setDialogOpen(true);
  };

  const openEdit = (a: InstitutionAliasResponse) => {
    setEditingAlias(a);
    setAliasValue(a.alias);
    setNormalizedName(a.normalizedName);
    setDialogOpen(true);
  };

  const openDelete = (a: InstitutionAliasResponse) => {
    setDeletingAlias(a);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!aliasValue.trim() || !normalizedName.trim()) {
      showError("Preencha ambos os campos");
      return;
    }
    setSubmitting(true);
    try {
      const request = { alias: aliasValue.trim(), normalizedName: normalizedName.trim() };
      if (editingAlias) {
        await updateAlias(editingAlias.id, request);
        showSuccess("Alias atualizado com sucesso");
      } else {
        await createAlias(request);
        showSuccess("Alias criado com sucesso");
      }
      setDialogOpen(false);
    } catch {
      showError(editingAlias ? "Falha ao atualizar alias" : "Falha ao criar alias");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAlias) return;
    try {
      await deleteAlias(deletingAlias.id);
      showSuccess(`Alias "${deletingAlias.alias}" excluido com sucesso`);
      setDeleteDialogOpen(false);
    } catch {
      showError("Falha ao excluir alias");
    }
  };

  const columns: ColumnDef<InstitutionAliasResponse, unknown>[] = [
    {
      accessorKey: "alias",
      header: "Alias (palavra-chave)",
      cell: ({ row }) => (
        <span className="font-mono text-xs uppercase">{row.original.alias}</span>
      ),
    },
    {
      accessorKey: "normalizedName",
      header: "Nome Normalizado",
      cell: ({ row }) => <span className="font-medium">{row.original.normalizedName}</span>,
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
              <DropdownMenuItem onClick={() => openEdit(row.original)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openDelete(row.original)}
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
        title="Aliases de Instituicao"
        description="Mapeie os nomes longos das instituicoes da B3 para nomes curtos e legiveis"
      >
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Alias
        </Button>
      </PageHeader>

      {aliases.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <ArrowRightLeft className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium mb-1">Nenhum alias cadastrado ainda</p>
          <p className="text-sm mb-6">
            Adicione aliases para normalizar os nomes de instituicao ao importar CSV da B3
          </p>
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeiro Alias
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={aliases}
          loading={loading}
          globalFilterPlaceholder="Pesquisar aliases..."
          emptyMessage="Nenhum alias encontrado."
          initialPageSize={25}
        />
      )}

      {/* Dialog Criar / Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAlias ? "Editar Alias" : "Novo Alias"}</DialogTitle>
            <DialogDescription>
              O sistema procura este alias (case-insensitive) no nome da instituicao do CSV da B3.
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
                Nome curto que sera salvo no investimento
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
            >
              {submitting ? "Salvando..." : editingAlias ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Excluir */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir alias?</DialogTitle>
            <DialogDescription>
              Isso excluira permanentemente o alias &quot;{deletingAlias?.alias}&quot;{" "}
              &rarr; &quot;{deletingAlias?.normalizedName}&quot;. Futuras importacoes nao
              farao mais esse de/para.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
