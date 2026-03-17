import { useEffect, useMemo, useState } from "react";

import type { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle2,
  MoreHorizontal,
  Pencil,
  Power,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";

import { DataTable, KpiCard, PageHeader } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { showError, showSuccess } from "@/lib/toast";
import { useAuthStore } from "@/stores/authStore";
import { useUserStore } from "@/stores/userStore";
import type {
  AppUser,
  AppUserCreateRequest,
  AppUserUpdateRequest,
  UserRole,
} from "@/types";

const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  STANDARD: "Padrão",
};

type PermissionEntry = { key: string; label: string };
type PermissionSubGroup = { label: string; permissions: PermissionEntry[] };
type PermissionModule = { key: string; label: string; subGroups: PermissionSubGroup[] };

const DASHBOARD_PERMISSION: PermissionEntry = {
  key: "dashboard.main.view",
  label: "Visualizar dashboard principal",
};

const PERMISSION_MODULES: PermissionModule[] = [
  {
    key: "bank",
    label: "Contas Bancárias",
    subGroups: [
      {
        label: "Dashboard bancário",
        permissions: [{ key: "bank.dashboard.view", label: "Visualizar dashboard bancário" }],
      },
      {
        label: "Contas",
        permissions: [
          { key: "bank.accounts.view", label: "Visualizar contas" },
          { key: "bank.accounts.manage", label: "Gerenciar contas" },
        ],
      },
      {
        label: "Transações",
        permissions: [
          { key: "transaction.view", label: "Visualizar transações" },
          { key: "transaction.import", label: "Importar extrato" },
          { key: "transaction.create", label: "Criar transações" },
          { key: "transaction.edit", label: "Editar transações" },
          { key: "transaction.delete", label: "Excluir transações" },
        ],
      },
    ],
  },
  {
    key: "investment",
    label: "Investimentos",
    subGroups: [
      {
        label: "Portfólio",
        permissions: [{ key: "investment.portfolio.view", label: "Visualizar patrimônio" }],
      },
      {
        label: "Lançamentos",
        permissions: [
          { key: "investment.transactions.view", label: "Visualizar lançamentos" },
          { key: "investment.transactions.manage", label: "Gerenciar lançamentos" },
        ],
      },
      {
        label: "Configurações",
        permissions: [{ key: "institution_alias.manage", label: "Gerenciar aliases da B3" }],
      },
    ],
  },
  {
    key: "admin",
    label: "Administração",
    subGroups: [
      {
        label: "Usuários",
        permissions: [{ key: "user.manage", label: "Gerenciar usuários" }],
      },
      {
        label: "Permissões",
        permissions: [{ key: "permission.manage", label: "Gerenciar permissões" }],
      },
    ],
  },
];

type UserFormState = {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  permissions: string[];
  active: boolean;
};

const EMPTY_FORM: UserFormState = {
  username: "",
  email: "",
  password: "",
  role: "STANDARD",
  permissions: [],
  active: true,
};

function getPermissionLabel(permission: string): string {
  if (permission === DASHBOARD_PERMISSION.key) return DASHBOARD_PERMISSION.label;
  for (const mod of PERMISSION_MODULES) {
    for (const sub of mod.subGroups) {
      const entry = sub.permissions.find((p) => p.key === permission);
      if (entry) return entry.label;
    }
  }
  return permission;
}

export function UsersPage() {
  const { users, metadata, loading, fetchUsers, fetchManagementMetadata, createUser, updateUser, setUserActive } = useUserStore();
  const currentUser = useAuthStore((state) => state.user);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusDialogUser, setStatusDialogUser] = useState<AppUser | null>(null);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);

  useEffect(() => {
    void Promise.all([fetchUsers(), fetchManagementMetadata()]).catch(() => {
      showError("Falha ao carregar a gestão de usuários");
    });
  }, [fetchManagementMetadata, fetchUsers]);

  const assignableRoles = metadata?.assignableRoles ?? [];
  const availablePermissions = metadata?.availablePermissions ?? [];

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.active).length;
  const adminUsers = users.filter((user) => user.role === "ADMIN").length;

  const filteredModules = useMemo(() => {
    const available = new Set(availablePermissions);
    return PERMISSION_MODULES.map((mod) => ({
      ...mod,
      subGroups: mod.subGroups
        .map((sub) => ({
          ...sub,
          permissions: sub.permissions.filter((p) => available.has(p.key)),
        }))
        .filter((sub) => sub.permissions.length > 0),
    })).filter((mod) => mod.subGroups.length > 0);
  }, [availablePermissions]);

  const dashboardAvailable = availablePermissions.includes(DASHBOARD_PERMISSION.key);

  const resetForm = () => {
    setForm({
      ...EMPTY_FORM,
      role: assignableRoles.includes("STANDARD") ? "STANDARD" : (assignableRoles[0] ?? "STANDARD"),
    });
    setEditingUser(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (user: AppUser) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      email: user.email ?? "",
      password: "",
      role: user.role,
      permissions: [...user.permissions],
      active: user.active,
    });
    setDialogOpen(true);
  };

  const togglePermission = (permission: string, checked: boolean) => {
    setForm((current) => ({
      ...current,
      permissions: checked
        ? [...current.permissions, permission].sort()
        : current.permissions.filter((item) => item !== permission),
    }));
  };

  const toggleModule = (allKeys: string[], allSelected: boolean) => {
    setForm((current) => ({
      ...current,
      permissions: allSelected
        ? current.permissions.filter((p) => !allKeys.includes(p))
        : [...new Set([...current.permissions, ...allKeys])].sort(),
    }));
  };

  const handleSubmit = async () => {
    if (!form.username.trim()) {
      showError("Informe o username do usuário");
      return;
    }
    if (!editingUser && !form.password.trim()) {
      showError("Informe a senha inicial do usuário");
      return;
    }
    if (form.permissions.length === 0) {
      showError("Selecione pelo menos uma permissão");
      return;
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        const payload: AppUserUpdateRequest = {
          username: form.username.trim(),
          email: form.email.trim() || null,
          role: form.role,
          permissions: form.permissions,
          active: form.active,
        };
        await updateUser(editingUser.id, payload);
        showSuccess(`Usuário ${form.username.trim()} atualizado com sucesso`);
      } else {
        const payload: AppUserCreateRequest = {
          username: form.username.trim(),
          email: form.email.trim() || null,
          password: form.password,
          role: form.role,
          permissions: form.permissions,
          active: form.active,
        };
        await createUser(payload);
        showSuccess(`Usuário ${form.username.trim()} criado com sucesso`);
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Falha ao salvar usuário");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async () => {
    if (!statusDialogUser) {
      return;
    }
    setSubmitting(true);
    try {
      await setUserActive(statusDialogUser.id, !statusDialogUser.active);
      showSuccess(
        statusDialogUser.active
          ? `Usuário ${statusDialogUser.username} desativado`
          : `Usuário ${statusDialogUser.username} ativado`
      );
      setStatusDialogUser(null);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Falha ao atualizar status do usuário");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<AppUser, unknown>[] = [
    {
      accessorKey: "username",
      header: "Usuário",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold">{row.original.username}</span>
          <span className="text-xs text-muted-foreground">{row.original.email || "Sem e-mail"}</span>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Perfil",
      cell: ({ row }) => <Badge variant="secondary">{ROLE_LABELS[row.original.role]}</Badge>,
    },
    {
      accessorKey: "permissions",
      header: "Permissões",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-md">
          {row.original.permissions.slice(0, 3).map((permission) => (
            <Badge key={permission} variant="outline" className="max-w-full truncate">
              {getPermissionLabel(permission)}
            </Badge>
          ))}
          {row.original.permissions.length > 3 ? (
            <Badge variant="outline">+{row.original.permissions.length - 3}</Badge>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => (
        row.original.active ? (
          <Badge className="bg-green-600 hover:bg-green-700">Ativo</Badge>
        ) : (
          <Badge variant="secondary">Inativo</Badge>
        )
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      cell: ({ row }) => {
        const isSelf = currentUser?.userId === row.original.id;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditDialog(row.original)} disabled={isSelf}>
                  <Pencil className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setStatusDialogUser(row.original)}
                  disabled={isSelf}
                  className={row.original.active ? "text-destructive focus:text-destructive" : ""}
                >
                  <Power className="mr-2 h-4 w-4" />
                  {row.original.active ? "Desativar" : "Ativar"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        description="Gerencie os acessos da conta compartilhada, incluindo perfis e permissões por módulo."
      >
        <Button onClick={openCreateDialog} disabled={assignableRoles.length === 0}>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo usuário
        </Button>
      </PageHeader>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total de usuários" value={String(totalUsers)} icon={Users} />
        <KpiCard title="Usuários ativos" value={String(activeUsers)} icon={CheckCircle2} iconClassName="text-green-600" />
        <KpiCard title="Administradores" value={String(adminUsers)} icon={ShieldCheck} iconClassName="text-amber-600" />
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        globalFilterPlaceholder="Pesquisar usuários..."
        emptyMessage="Nenhum usuário disponível para esta conta."
        initialPageSize={25}
      />

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle>{editingUser ? "Editar usuário" : "Novo usuário"}</DialogTitle>
            <DialogDescription>
              Configure perfil, status e permissões de navegação e operação dentro da conta compartilhada.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="user-username">Username</Label>
                <Input
                  id="user-username"
                  value={form.username}
                  onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  placeholder="alessandro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-email">E-mail</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="usuario@empresa.com"
                />
              </div>

              {!editingUser ? (
                <div className="space-y-2">
                  <Label htmlFor="user-password">Senha inicial</Label>
                  <Input
                    id="user-password"
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Defina a senha inicial"
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="user-role">Perfil</Label>
                <Select
                  value={form.role}
                  onValueChange={(value) => setForm((current) => ({ ...current, role: value as UserRole }))}
                >
                  <SelectTrigger id="user-role">
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold">Permissões por módulo</h3>
                  <p className="text-xs text-muted-foreground">
                    Habilite os módulos e ações que este usuário pode acessar.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    id="user-active"
                    checked={form.active}
                    onCheckedChange={(checked) => setForm((current) => ({ ...current, active: checked }))}
                  />
                  <Label htmlFor="user-active" className="cursor-pointer text-sm">Ativo</Label>
                </div>
              </div>

              {/* Dashboard Principal */}
              {dashboardAvailable && (
                <div className="rounded-md border">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 rounded-t-md border-b">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex-1">Dashboard Principal</p>
                    <p className="text-xs text-muted-foreground">Conteúdo varia conforme módulos ativos</p>
                  </div>
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        id={`perm-${DASHBOARD_PERMISSION.key}`}
                        checked={form.permissions.includes(DASHBOARD_PERMISSION.key)}
                        onCheckedChange={(checked) => togglePermission(DASHBOARD_PERMISSION.key, checked)}
                        className="shrink-0"
                      />
                      <Label htmlFor={`perm-${DASHBOARD_PERMISSION.key}`} className="font-normal cursor-pointer text-sm">
                        {DASHBOARD_PERMISSION.label}
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              {/* Módulos */}
              {filteredModules.map((mod) => {
                const allKeys = mod.subGroups.flatMap((sub) => sub.permissions.map((p) => p.key));
                const selectedCount = allKeys.filter((k) => form.permissions.includes(k)).length;
                const allSelected = selectedCount === allKeys.length && allKeys.length > 0;
                return (
                  <div key={mod.key} className="rounded-md border">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 rounded-t-md border-b">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{mod.label}</p>
                        <span className="text-xs text-muted-foreground tabular-nums">{selectedCount}/{allKeys.length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Habilitar tudo</span>
                        <Switch
                          checked={allSelected}
                          onCheckedChange={() => toggleModule(allKeys, allSelected)}
                          className="shrink-0"
                        />
                      </div>
                    </div>
                    <div className="px-4 py-3 space-y-4">
                      {mod.subGroups.map((sub) => (
                        <div key={sub.label} className="space-y-1.5">
                          <p className="text-xs font-medium text-muted-foreground">{sub.label}</p>
                          <div className="space-y-1.5 pl-1">
                            {sub.permissions.map((perm) => (
                              <div key={perm.key} className="flex items-center gap-3">
                                <Switch
                                  id={`perm-${perm.key}`}
                                  checked={form.permissions.includes(perm.key)}
                                  onCheckedChange={(checked) => togglePermission(perm.key, checked)}
                                  className="shrink-0"
                                />
                                <Label htmlFor={`perm-${perm.key}`} className="font-normal cursor-pointer text-sm">
                                  {perm.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-background shrink-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Salvando..." : editingUser ? "Salvar alterações" : "Criar usuário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(statusDialogUser)} onOpenChange={(open) => !open && setStatusDialogUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{statusDialogUser?.active ? "Desativar usuário" : "Ativar usuário"}</DialogTitle>
            <DialogDescription>
              {statusDialogUser?.active
                ? `O usuário ${statusDialogUser?.username} perderá acesso ao sistema até ser reativado.`
                : `O usuário ${statusDialogUser?.username} voltará a acessar a conta compartilhada.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogUser(null)}>
              Cancelar
            </Button>
            <Button onClick={handleStatusChange} variant={statusDialogUser?.active ? "destructive" : "default"} disabled={submitting}>
              {submitting ? "Processando..." : statusDialogUser?.active ? "Desativar" : "Ativar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}