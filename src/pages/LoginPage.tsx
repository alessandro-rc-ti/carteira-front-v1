import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Landmark, LockKeyhole, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";
import { showError, showSuccess } from "@/lib/toast";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const login = useAuthStore((state) => state.login);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (user) {
    const target = (location.state as { from?: string } | null)?.from ?? "/";
    return <Navigate to={target} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await login(username.trim(), password);
      showSuccess("Sessão iniciada com sucesso.");
      const target = (location.state as { from?: string } | null)?.from ?? "/";
      navigate(target, { replace: true });
    } catch {
      showError("Não foi possível entrar. Verifique usuário e senha.");
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#eff6ff_48%,_#e2e8f0_100%)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid gap-6 lg:grid-cols-[1.2fr_0.9fr] items-stretch">
        <section className="rounded-3xl border border-white/60 bg-slate-950 text-white p-8 lg:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.28),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.16),_transparent_28%)]" />
          <div className="relative space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-slate-100">
              <div className="h-9 w-9 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-900/40">
                <Landmark className="h-4 w-4" />
              </div>
              <span className="font-medium tracking-wide">CarteiraApp</span>
            </div>

            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.35em] text-blue-200/80">Conta compartilhada</p>
              <h1 className="text-3xl lg:text-5xl font-semibold leading-tight max-w-xl">
                Acesse os módulos liberados para a sua conta, com dados compartilhados e governança por perfil.
              </h1>
              <p className="text-slate-300 max-w-lg text-sm lg:text-base leading-7">
                Owner, admin e padrão operam na mesma base da conta, mas cada usuário enxerga apenas menus,
                dashboards e ações compatíveis com as permissões concedidas.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Módulos</p>
                <p className="mt-2 text-lg font-semibold">Contas e investimentos</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Acesso</p>
                <p className="mt-2 text-lg font-semibold">Menus por permissão</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Dados</p>
                <p className="mt-2 text-lg font-semibold">Conta compartilhada</p>
              </div>
            </div>
          </div>
        </section>

        <Card className="border-slate-200/80 shadow-xl shadow-slate-300/30 bg-white/90 backdrop-blur">
          <CardHeader className="space-y-3">
            <CardTitle className="text-2xl">Entrar</CardTitle>
            <CardDescription>
              Use as credenciais fornecidas pelo owner ou pelo administrador da conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Usuário</span>
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Digite seu usuário"
                    className="pl-9 h-11"
                    autoComplete="username"
                    required
                  />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Senha</span>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Digite sua senha"
                    className="pl-9 h-11"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </label>

              <Button type="submit" className="w-full h-11 text-sm font-medium" disabled={loading}>
                {loading ? "Entrando..." : "Acessar conta"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
