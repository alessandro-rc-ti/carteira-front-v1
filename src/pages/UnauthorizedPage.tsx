import { ShieldAlert } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export function UnauthorizedPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Acesso não autorizado"
        description="Sua conta está autenticada, mas este menu ou ação não foi liberado para o seu perfil."
      />

      <Card>
        <CardContent className="pt-6 flex items-start gap-4">
          <div className="h-11 w-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <p className="font-medium">Permissão insuficiente</p>
            <p className="text-sm text-muted-foreground leading-6">
              Solicite ao owner ou ao administrador da conta a habilitação deste menu, submenu ou ação.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
