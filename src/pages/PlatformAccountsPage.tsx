import { useEffect, useMemo, useState } from "react";

import type { ColumnDef } from "@tanstack/react-table";
import {
  Building2,
  CheckCircle2,
  MoreHorizontal,
  Pencil,
  PlusCircle,
  Power,
  ShieldCheck,
  Users,
  XCircle,
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
import { platformAccountService } from "@/services";
import type {
  PlatformAccount,
  PlatformAccountProvisionRequest,
  PlatformAccountUpdateRequest,
} from "@/types";
import { SUBSCRIPTION_PLANS } from "@/types";

export function PlatformAccountsPage() {
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<PlatformAccount | null>(null);

  // Form state for provision
  const [formData, setFormData] = useState<PlatformAccountProvisionRequest>({
    accountName: "",
    accountAdminUsername: "",
    accountAdminEmail: "",
    accountAdminPassword: "",
    subscriptionPlanCode: "STARTER",
    standardUserLimit: 3,
    accountAdminStandardUserQuota: 3,
    accountAdminDelegablePermissions: [],
    active: true,
  });

  // Form state for update
  const [updateFormData, setUpdateFormData] = useState<PlatformAccountUpdateRequest>({
    name: "",
    subscriptionPlanCode: "",
    standardUserLimit: 0,
    active: true,
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await platformAccountService.list();
      setAccounts(data);
    } catch (error) {
      showError("Erro ao carregar contas");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProvisionDialog = () => {
    setEditMode(false);
    setSelectedAccount(null);
    setFormData({
      accountName: "",
      accountAdminUsername: "",
      accountAdminEmail: "",
      accountAdminPassword: "",
      subscriptionPlanCode: "STARTER",
      standardUserLimit: SUBSCRIPTION_PLANS.STARTER.defaultStandardUserLimit,
      accountAdminStandardUserQuota: SUBSCRIPTION_PLANS.STARTER.defaultStandardUserLimit,
      accountAdminDelegablePermissions: [],
      active: true,
    });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (account: PlatformAccount) => {
    setEditMode(true);
    setSelectedAccount(account);
    setUpdateFormData({
      name: account.name,
      subscriptionPlanCode: account.subscriptionPlanCode,
      standardUserLimit: account.standardUserLimit,
      active: account.active,
    });
    setDialogOpen(true);
  };

  const handleProvision = async () => {
    try {
      await platformAccountService.provision(formData);
      showSuccess("Conta provisionada com sucesso");
      setDialogOpen(false);
      loadAccounts();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showError(err.response?.data?.message || "Erro ao provisionar conta");
      console.error(error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedAccount) return;

    try {
      await platformAccountService.update(selectedAccount.id, updateFormData);
      showSuccess("Conta atualizada com sucesso");
      setDialogOpen(false);
      loadAccounts();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showError(err.response?.data?.message || "Erro ao atualizar conta");
      console.error(error);
    }
  };

  const handlePlanChange = (planCode: string, isEditMode: boolean) => {
    const plan = SUBSCRIPTION_PLANS[planCode];
    if (isEditMode) {
      setUpdateFormData((prev) => ({
        ...prev,
        subscriptionPlanCode: planCode,
        standardUserLimit: plan.defaultStandardUserLimit,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        subscriptionPlanCode: planCode,
        standardUserLimit: plan.defaultStandardUserLimit,
        accountAdminStandardUserQuota: plan.defaultStandardUserLimit,
      }));
    }
  };

  const columns: ColumnDef<PlatformAccount>[] = useMemo<ColumnDef<PlatformAccount>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nome da Conta",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: "subscriptionPlanCode",
        header: "Plano",
        cell: ({ row }) => {
          const plan = SUBSCRIPTION_PLANS[row.original.subscriptionPlanCode];
          return (
            <Badge variant="outline">{plan?.displayName || row.original.subscriptionPlanCode}</Badge>
          );
        },
      },
      {
        accessorKey: "accountAdminUsersCount",
        header: "Admin",
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.accountAdminUsersCount}
          </div>
        ),
      },
      {
        accessorKey: "activeStandardUsers",
        header: "Usuários",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              {row.original.activeStandardUsers}/{row.original.standardUserLimit}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "active",
        header: "Status",
        cell: ({ row }) =>
          row.original.active ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Ativa
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <XCircle className="h-3 w-3" />
              Inativa
            </Badge>
          ),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleOpenEditDialog(row.original)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  handleUpdate()
                }
              >
                <Power className="mr-2 h-4 w-4" />
                {row.original.active ? "Desativar" : "Ativar"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [handleUpdate]
  );

  const kpis = useMemo(() => {
    const totalAccounts = accounts.length;
    const activeAccounts = accounts.filter((a) => a.active).length;
    const totalUsers = accounts.reduce((sum, a) => sum + a.activeStandardUsers + a.accountAdminUsersCount, 0);

    return [
      {
        title: "Total de Contas",
        value: totalAccounts,
        icon: Building2,
      },
      {
        title: "Contas Ativas",
        value: activeAccounts,
        icon: CheckCircle2,
      },
      {
        title: "Total de Usuários",
        value: totalUsers,
        icon: Users,
      },
      {
        title: "Admins",
        value: accounts.reduce((sum, a) => sum + a.accountAdminUsersCount, 0),
        icon: ShieldCheck,
      },
    ];
  }, [accounts]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gerenciamento de Contas"
        description="Provisione e gerencie contas do sistema"
      >
        <Button onClick={handleOpenProvisionDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Provisionar Conta
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <KpiCard key={index} {...kpi} value={String(kpi.value)} />
        ))}
      </div>

      <DataTable columns={columns} data={accounts} loading={loading} />

      {/* Provision / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Editar Conta" : "Provisionar Nova Conta"}
            </DialogTitle>
            <DialogDescription>
              {editMode
                ? "Atualize as configurações da conta"
                : "Crie uma nova conta e seu administrador inicial"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Account Name */}
            <div className="grid gap-2">
              <Label htmlFor="accountName">Nome da Conta</Label>
              <Input
                id="accountName"
                value={editMode ? updateFormData.name : formData.accountName}
                onChange={(e) =>
                  editMode
                    ? setUpdateFormData({ ...updateFormData, name: e.target.value })
                    : setFormData({ ...formData, accountName: e.target.value })
                }
              />
            </div>

            {!editMode && (
              <>
                {/* Admin Username */}
                <div className="grid gap-2">
                  <Label htmlFor="adminUsername">Nome de Usuário do Admin</Label>
                  <Input
                    id="adminUsername"
                    value={formData.accountAdminUsername}
                    onChange={(e) =>
                      setFormData({ ...formData, accountAdminUsername: e.target.value })
                    }
                  />
                </div>

                {/* Admin Email */}
                <div className="grid gap-2">
                  <Label htmlFor="adminEmail">Email do Admin</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={formData.accountAdminEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, accountAdminEmail: e.target.value })
                    }
                  />
                </div>

                {/* Admin Password */}
                <div className="grid gap-2">
                  <Label htmlFor="adminPassword">Senha do Admin</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={formData.accountAdminPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, accountAdminPassword: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            {/* Subscription Plan */}
            <div className="grid gap-2">
              <Label htmlFor="subscriptionPlan">Plano de Assinatura</Label>
              <Select
                value={
                  editMode ? updateFormData.subscriptionPlanCode : formData.subscriptionPlanCode
                }
                onValueChange={(value) => handlePlanChange(value, editMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
                    <SelectItem key={plan.code} value={plan.code}>
                      {plan.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Standard User Limit */}
            <div className="grid gap-2">
              <Label htmlFor="userLimit">Limite de Usuários STANDARD</Label>
              <Input
                id="userLimit"
                type="number"
                min="0"
                value={
                  editMode ? updateFormData.standardUserLimit : formData.standardUserLimit
                }
                onChange={(e) =>
                  editMode
                    ? setUpdateFormData({
                        ...updateFormData,
                        standardUserLimit: parseInt(e.target.value) || 0,
                      })
                    : setFormData({
                        ...formData,
                        standardUserLimit: parseInt(e.target.value) || 0,
                      })
                }
              />
            </div>

            {/* Active Switch */}
            <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={editMode ? updateFormData.active : formData.active}
                onCheckedChange={(checked) =>
                  editMode
                    ? setUpdateFormData({ ...updateFormData, active: checked })
                    : setFormData({ ...formData, active: checked })
                }
              />
              <Label htmlFor="active">Conta Ativa</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={editMode ? handleUpdate : handleProvision}>
              {editMode ? "Atualizar" : "Provisionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
