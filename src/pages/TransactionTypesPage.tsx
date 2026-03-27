import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/shared";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { showError, showSuccess } from "@/lib/toast";
import { useAuthStore } from "@/stores/authStore";
import { useTransactionTypeStore } from "@/stores/transactionTypeStore";
import {
  TRANSACTION_TYPE_OPTIONS,
  getTransactionTypeLabel,
  type TransactionTypeDefinition,
} from "@/types/transaction";
import { CircleDot, Globe2, Pencil, Plus, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";

type TypeFormState = {
  code: string;
  name: string;
  description: string;
  baseType: string;
  affectsInflation: boolean;
};

const EMPTY_FORM: TypeFormState = {
  code: "",
  name: "",
  description: "",
  baseType: TRANSACTION_TYPE_OPTIONS[0].value,
  affectsInflation: false,
};

function sortByName(left: TransactionTypeDefinition, right: TransactionTypeDefinition) {
  return left.name.localeCompare(right.name, "pt-BR");
}

function matchesSearch(type: TransactionTypeDefinition, term: string) {
  const normalizedTerm = term.trim().toLocaleLowerCase("pt-BR");
  if (!normalizedTerm) {
    return true;
  }

  return [type.name, type.code, type.description ?? "", getTransactionTypeLabel(type.baseType)]
    .join(" ")
    .toLocaleLowerCase("pt-BR")
    .includes(normalizedTerm);
}

function canManageType(role: string | undefined, type: TransactionTypeDefinition) {
  if (role === "SYSTEM_OWNER") {
    return type.systemDefined;
  }

  if (role === "ACCOUNT_ADMIN") {
    return !type.systemDefined;
  }

  return false;
}

function buildRoleCopy(role: string | undefined) {
  if (role === "SYSTEM_OWNER") {
    return {
      title: "Catálogo global da plataforma",
      description: "Você define os tipos padrão usados como base por todas as contas. Tipos globais podem entrar ou não no cálculo da inflação pessoal.",
      formTitleCreate: "Novo tipo global",
      formTitleEdit: "Editar tipo global",
      formDescription: "Crie ou ajuste o catálogo padrão. Alterações no indicador de inflação valem para todo o histórico vinculado a este tipo.",
      emptyManaged: "Nenhum tipo global encontrado.",
      emptyReadOnly: "Não há outros catálogos para exibir.",
    };
  }

  return {
    title: "Tipos da sua conta",
    description: "Você pode criar e manter apenas tipos customizados da sua conta. Os tipos globais continuam visíveis para consulta, mas não podem ser alterados aqui.",
    formTitleCreate: "Novo tipo customizado",
    formTitleEdit: "Editar tipo customizado",
    formDescription: "Cada tipo customizado herda um tipo base para preservar os cálculos financeiros e permite decidir se entra na inflação pessoal.",
    emptyManaged: "Nenhum tipo customizado cadastrado para esta conta.",
    emptyReadOnly: "Nenhum tipo global disponível para consulta.",
  };
}

function TypeCard({
  type,
  canManage,
  onEdit,
  onDelete,
}: {
  type: TransactionTypeDefinition;
  canManage: boolean;
  onEdit: (type: TransactionTypeDefinition) => void;
  onDelete: (type: TransactionTypeDefinition) => void;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground">{type.name}</h3>
            <Badge variant={type.systemDefined ? "secondary" : "outline"}>
              {type.systemDefined ? "Global" : "Customizado"}
            </Badge>
            <Badge variant="outline">{getTransactionTypeLabel(type.baseType)}</Badge>
            <Badge variant={type.affectsInflation ? "default" : "secondary"}>
              {type.affectsInflation ? "Conta na inflação" : "Fora da inflação"}
            </Badge>
          </div>

          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <p>
              <span className="font-medium text-foreground">Código:</span> {type.code}
            </p>
            <p>
              <span className="font-medium text-foreground">Escopo:</span> {type.systemDefined ? "Plataforma" : "Conta"}
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            {type.description?.trim() || "Sem descrição cadastrada."}
          </p>
        </div>

        {canManage ? (
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onEdit(type)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(type)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function TransactionTypesPage() {
  const user = useAuthStore((state) => state.user);
  const { items, loading, fetchAll, createType, updateType, deleteType } = useTransactionTypeStore();
  const [form, setForm] = useState<TypeFormState>(EMPTY_FORM);
  const [editing, setEditing] = useState<TransactionTypeDefinition | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typePendingDelete, setTypePendingDelete] = useState<TransactionTypeDefinition | null>(null);

  useEffect(() => {
    void fetchAll(true);
  }, [fetchAll]);

  const role = user?.role;
  const copy = useMemo(() => buildRoleCopy(role), [role]);

  const globalTypes = useMemo(
    () => items.filter((item) => item.active && item.systemDefined).sort(sortByName),
    [items]
  );

  const customTypes = useMemo(
    () => items.filter((item) => item.active && !item.systemDefined).sort(sortByName),
    [items]
  );

  const managedTypes = role === "SYSTEM_OWNER" ? globalTypes : customTypes;
  const readOnlyTypes = role === "SYSTEM_OWNER" ? [] : globalTypes;
  const filteredManagedTypes = useMemo(
    () => managedTypes.filter((type) => matchesSearch(type, searchTerm)),
    [managedTypes, searchTerm]
  );
  const filteredReadOnlyTypes = useMemo(
    () => readOnlyTypes.filter((type) => matchesSearch(type, searchTerm)),
    [readOnlyTypes, searchTerm]
  );

  const resetForm = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const startEditing = (type: TransactionTypeDefinition) => {
    setEditing(type);
    setForm({
      code: type.code,
      name: type.name,
      description: type.description ?? "",
      baseType: type.baseType,
      affectsInflation: type.affectsInflation,
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      showError("Informe o nome do tipo.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: form.code.trim() || null,
        name: form.name.trim(),
        description: form.description.trim() || null,
        baseType: form.baseType,
        affectsInflation: form.affectsInflation,
        active: true,
      };

      if (editing) {
        await updateType(editing.id, payload);
        showSuccess("Tipo de transação atualizado.");
      } else {
        await createType(payload);
        showSuccess("Tipo de transação criado.");
      }

      resetForm();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Falha ao salvar tipo de transação.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (type: TransactionTypeDefinition) => {
    if (!canManageType(role, type)) {
      return;
    }

    setTypePendingDelete(type);
  };

  const handleDelete = async () => {
    if (!typePendingDelete) {
      return;
    }

    try {
      await deleteType(typePendingDelete.id);
      showSuccess("Tipo de transação removido.");
      if (editing?.id === typePendingDelete.id) {
        resetForm();
      }
      setTypePendingDelete(null);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Falha ao remover tipo de transação.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tipos de Transação"
        description="Configure como cada tipo deve ser classificado e se ele participa do cálculo da inflação pessoal."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              Escopo de gestão
            </div>
            <CardTitle>{copy.title}</CardTitle>
            <CardDescription>{copy.description}</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Globe2 className="h-4 w-4" />
              Tipos globais ativos
            </div>
            <CardTitle>{globalTypes.length}</CardTitle>
            <CardDescription>
              Catálogo padrão visível nesta sessão.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CircleDot className="h-4 w-4" />
              Tipos customizados ativos
            </div>
            <CardTitle>{customTypes.length}</CardTitle>
            <CardDescription>
              Tipos particulares da conta autenticada.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{editing ? copy.formTitleEdit : copy.formTitleCreate}</CardTitle>
            <CardDescription>{copy.formDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="transaction-type-name">Nome</Label>
                <Input
                  id="transaction-type-name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ex: Cashback do cartão"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transaction-type-code">Código</Label>
                <Input
                  id="transaction-type-code"
                  value={form.code}
                  onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                  placeholder="Opcional. Se vazio, o sistema gera a partir do nome"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transaction-type-base">Tipo base</Label>
                <Select value={form.baseType} onValueChange={(value) => setForm((current) => ({ ...current, baseType: value }))}>
                  <SelectTrigger id="transaction-type-base">
                    <SelectValue placeholder="Selecione o tipo base" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSACTION_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.code} value={option.baseType}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transaction-type-description">Descrição</Label>
                <Textarea
                  id="transaction-type-description"
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Explique quando esse tipo deve ser usado."
                />
              </div>

              <div className="rounded-lg border border-border/70 bg-muted/30 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="transaction-type-inflation">Conta na inflação pessoal</Label>
                    <p className="text-sm text-muted-foreground">
                      Quando ativado, todas as transações deste tipo passam a compor o cálculo histórico da inflação pessoal.
                    </p>
                  </div>
                  <Switch
                    id="transaction-type-inflation"
                    checked={form.affectsInflation}
                    onCheckedChange={(checked) => setForm((current) => ({ ...current, affectsInflation: checked }))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {editing ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                  {submitting ? "Salvando..." : editing ? "Atualizar tipo" : "Criar tipo"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Limpar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Catálogo disponível</CardTitle>
            <CardDescription>
              Os tipos listados abaixo já estão disponíveis para uso em lançamentos, importações e regras de classificação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                  <div className="space-y-2">
                    <Label htmlFor="transaction-type-search">Buscar no catálogo</Label>
                    <Input
                      id="transaction-type-search"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Filtre por nome, código, descrição ou tipo base"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary">{filteredManagedTypes.length} gerenciáveis</Badge>
                    {role !== "SYSTEM_OWNER" ? (
                      <Badge variant="outline">{filteredReadOnlyTypes.length} globais</Badge>
                    ) : null}
                  </div>
                </div>
              </div>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      {role === "SYSTEM_OWNER" ? "Tipos globais sob sua gestão" : "Tipos customizados da conta"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {role === "SYSTEM_OWNER"
                        ? "Somente o owner da plataforma pode alterar este catálogo."
                        : "Somente tipos customizados da sua conta podem ser alterados aqui."}
                    </p>
                  </div>
                </div>

                {loading && filteredManagedTypes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Carregando tipos...</p>
                ) : filteredManagedTypes.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                    Nenhum tipo encontrado com esse filtro.
                  </p>
                ) : filteredManagedTypes.map((type) => (
                  <TypeCard
                    key={type.id}
                    type={type}
                    canManage={canManageType(role, type)}
                    onEdit={startEditing}
                    onDelete={confirmDelete}
                  />
                ))}
              </section>

              {filteredReadOnlyTypes.length > 0 ? (
                <section className="space-y-3">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Catálogo global para referência</h2>
                    <p className="text-sm text-muted-foreground">
                      Tipos padrão visíveis para uso, sem permissão de alteração neste perfil.
                    </p>
                  </div>

                  {filteredReadOnlyTypes.map((type) => (
                    <TypeCard
                      key={type.id}
                      type={type}
                      canManage={false}
                      onEdit={startEditing}
                      onDelete={confirmDelete}
                    />
                  ))}
                </section>
              ) : null}

              {!loading && filteredReadOnlyTypes.length === 0 && role !== "SYSTEM_OWNER" ? (
                <p className="text-sm text-muted-foreground">
                  {searchTerm.trim() ? "Nenhum tipo global encontrado com esse filtro." : copy.emptyReadOnly}
                </p>
              ) : null}

              {loading && filteredManagedTypes.length === 0 && filteredReadOnlyTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Carregando tipos...</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={typePendingDelete != null} onOpenChange={(open) => !open && setTypePendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tipo de transação</AlertDialogTitle>
            <AlertDialogDescription>
              {typePendingDelete
                ? `Você está prestes a excluir o tipo ${typePendingDelete.name}. Essa ação só é permitida quando ele não possui uso em transações ou regras de classificação.`
                : "Confirme a exclusão do tipo selecionado."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void handleDelete()}>
              Excluir tipo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}