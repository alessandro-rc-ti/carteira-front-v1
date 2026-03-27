import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
	Activity,
	ArrowRight,
	Landmark,
	LayoutDashboard,
	LineChart,
	Shield,
	Sparkles,
	TrendingUp,
	Users,
	Wallet,
} from "lucide-react";

import { PageHeader } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";

type DashboardAction = {
	label: string;
	to: string;
	permissions: string[];
};

type DashboardSection = {
	title: string;
	description: string;
	summary: string;
	icon: LucideIcon;
	toneClassName: string;
	badgeLabel: string;
	actions: DashboardAction[];
};

const sections: DashboardSection[] = [
	{
		title: "Contas bancarias",
		description:
			"Acompanhe saldo, movimentos operacionais e analise de transacoes por conta.",
		summary: "Entrada pronta para o dashboard operacional das contas.",
		icon: Landmark,
		toneClassName: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
		badgeLabel: "Operacional",
		actions: [
			{
				label: "Abrir dashboard da conta",
				to: "/banks/dashboard",
				permissions: ["bank.dashboard.view"],
			},
			{
				label: "Ver contas",
				to: "/banks/accounts",
				permissions: ["bank.accounts.view", "bank.accounts.manage"],
			},
			{
				label: "Ver transacoes",
				to: "/banks/transactions",
				permissions: ["transaction.view"],
			},
		],
	},
	{
		title: "Investimentos",
		description:
			"Centralize patrimonio, movimentacoes e organizacao da carteira de longo prazo.",
		summary: "Area dedicada a consolidacao patrimonial e historico de posicoes.",
		icon: TrendingUp,
		toneClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
		badgeLabel: "Patrimonio",
		actions: [
			{
				label: "Abrir patrimonio",
				to: "/investments/portfolio",
				permissions: ["investment.portfolio.view"],
			},
			{
				label: "Ver lancamentos",
				to: "/investments/transactions",
				permissions: ["investment.transactions.view", "investment.transactions.manage"],
			},
			{
				label: "Ver aliases",
				to: "/investments/institution-aliases",
				permissions: ["institution_alias.manage"],
			},
		],
	},
	{
		title: "Administracao",
		description:
			"Controle acessos, papeis e o contexto operacional da plataforma multiusuario.",
		summary: "Bloco administrativo para governanca e manutencao do ambiente.",
		icon: Shield,
		toneClassName: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
		badgeLabel: "Governanca",
		actions: [
			{
				label: "Gerenciar usuarios",
				to: "/users",
				permissions: ["user.manage"],
			},
		],
	},
];

const roadmapItems = [
	{
		title: "Fluxo consolidado",
		description: "Resumo unico para caixa, receitas, despesas e patrimonio em uma mesma leitura.",
		icon: LineChart,
	},
	{
		title: "Alertas e pendencias",
		description: "Espaco reservado para desvios de saldo, conciliacoes e eventos relevantes.",
		icon: Activity,
	},
	{
		title: "Camada inteligente",
		description: "Base para insights transversais quando os modulos passarem a expor indicadores consolidados.",
		icon: Sparkles,
	},
];

export function DashboardPage() {
	const hasPermission = useAuthStore((state) => state.hasPermission);
	const user = useAuthStore((state) => state.user);

	const visibleSections = sections.map((section) => ({
		...section,
		visibleActions: section.actions.filter((action) => hasPermission(action.permissions)),
	}));

	return (
		<div className="space-y-6">
			<PageHeader
				title="Dashboard"
				description="Hub principal para navegar entre os modulos e concentrar a futura visao consolidada da plataforma."
			/>

			<div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
				<Card className="border-blue-200/70 bg-gradient-to-br from-blue-50 via-background to-cyan-50 dark:border-blue-900/60 dark:from-blue-950/40 dark:via-background dark:to-cyan-950/30">
					<CardHeader className="gap-4">
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="secondary">Visao principal</Badge>
							<Badge variant="outline">Em evolucao</Badge>
						</div>
						<div className="space-y-2">
							<CardTitle className="text-2xl tracking-tight">
								{user ? `Bem-vindo, ${user.username}` : "Visao central da carteira"}
							</CardTitle>
							<CardDescription className="max-w-2xl text-sm leading-6">
								Esta pagina foi desacoplada do dashboard bancario para servir como camada de orquestracao.
								A partir daqui, a evolucao do produto pode consolidar indicadores dos modulos sem impactar o painel de conta.
							</CardDescription>
						</div>
					</CardHeader>
					<CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
							<div className="rounded-xl border bg-background/80 p-4 shadow-sm">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
									Objetivo
								</p>
								<p className="mt-2 text-sm text-foreground">
									Unificar o que importa entre operacao, patrimonio e administracao.
								</p>
							</div>
							<div className="rounded-xl border bg-background/80 p-4 shadow-sm">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
									Abordagem
								</p>
								<p className="mt-2 text-sm text-foreground">
									Primeiro corte com acessos rapidos e espacos reservados para consolidacao real.
								</p>
							</div>
							<div className="rounded-xl border bg-background/80 p-4 shadow-sm sm:col-span-2 xl:col-span-1">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
									Escopo atual
								</p>
								<p className="mt-2 text-sm text-foreground">
									Separacao estrutural entre o dashboard principal e o dashboard da conta.
								</p>
							</div>
						</div>
						<div className="flex shrink-0 flex-wrap gap-2">
							{hasPermission(["bank.dashboard.view"]) && (
								<Button asChild>
									<Link to="/banks/dashboard">
										Dashboard da Conta
										<ArrowRight className="h-4 w-4" />
									</Link>
								</Button>
							)}
							{hasPermission(["investment.portfolio.view"]) && (
								<Button variant="outline" asChild>
									<Link to="/investments/portfolio">Patrimonio</Link>
								</Button>
							)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<LayoutDashboard className="h-4 w-4 text-primary" />
							Pilares do novo dashboard
						</CardTitle>
						<CardDescription>
							Estrutura inicial para receber indicadores realmente compartilhados entre modulos.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{roadmapItems.map((item) => {
							const Icon = item.icon;

							return (
								<div key={item.title} className="rounded-xl border p-4">
									<div className="flex items-start gap-3">
										<div className="rounded-lg bg-muted p-2 text-muted-foreground">
											<Icon className="h-4 w-4" />
										</div>
										<div className="space-y-1">
											<p className="text-sm font-semibold">{item.title}</p>
											<p className="text-sm text-muted-foreground">{item.description}</p>
										</div>
									</div>
								</div>
							);
						})}
					</CardContent>
				</Card>
			</div>

			<section className="space-y-4">
				<div className="flex items-center justify-between gap-3">
					<div>
						<h2 className="text-base font-semibold tracking-tight">Modulos prioritarios</h2>
						<p className="text-sm text-muted-foreground">
							Cada bloco abaixo leva para a area especializada correspondente, sem compartilhar a logica do dashboard de conta.
						</p>
					</div>
					<Badge variant="outline">Base agregadora</Badge>
				</div>

				<div className="grid gap-4 xl:grid-cols-3">
					{visibleSections.map((section) => {
						const Icon = section.icon;

						return (
							<Card key={section.title} className="h-full">
								<CardHeader className="space-y-4">
									<div className="flex items-start justify-between gap-3">
										<div className={`rounded-xl p-3 ${section.toneClassName}`}>
											<Icon className="h-5 w-5" />
										</div>
										<Badge variant="outline">{section.badgeLabel}</Badge>
									</div>
									<div className="space-y-2">
										<CardTitle className="text-lg">{section.title}</CardTitle>
										<CardDescription className="leading-6">
											{section.description}
										</CardDescription>
									</div>
								</CardHeader>
								<CardContent className="flex h-full flex-col gap-4">
									<div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
										{section.summary}
									</div>
									<div className="mt-auto flex flex-wrap gap-2">
										{section.visibleActions.length > 0 ? (
											section.visibleActions.map((action, index) => (
												<Button
													key={action.to}
													variant={index === 0 ? "default" : "outline"}
													size="sm"
													asChild
												>
													<Link to={action.to}>{action.label}</Link>
												</Button>
											))
										) : (
											<div className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
												Sem acessos liberados neste modulo para o perfil atual.
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			</section>

			<section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<Wallet className="h-4 w-4 text-primary" />
							O que entra na proxima iteracao
						</CardTitle>
						<CardDescription>
							Itens candidatos para transformar este hub em uma visao executiva de fato.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-3 sm:grid-cols-2">
						<div className="rounded-xl border p-4">
							<p className="text-sm font-semibold">Saldo e patrimonio lado a lado</p>
							<p className="mt-2 text-sm text-muted-foreground">
								Relacionar caixa disponivel, carteira investida e evolucao consolidada.
							</p>
						</div>
						<div className="rounded-xl border p-4">
							<p className="text-sm font-semibold">Pendencias operacionais</p>
							<p className="mt-2 text-sm text-muted-foreground">
								Regras de conciliacao, importacoes faltantes e inconsistencias criticas.
							</p>
						</div>
						<div className="rounded-xl border p-4">
							<p className="text-sm font-semibold">Eventos do usuario</p>
							<p className="mt-2 text-sm text-muted-foreground">
								Alertas por modulo, ultimas acoes e atalhos por contexto.
							</p>
						</div>
						<div className="rounded-xl border p-4">
							<p className="text-sm font-semibold">Indicadores transversais</p>
							<p className="mt-2 text-sm text-muted-foreground">
								Leitura unica para metas, desempenho e pontos de atencao da carteira.
							</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<Users className="h-4 w-4 text-primary" />
							Diretriz arquitetural
						</CardTitle>
						<CardDescription>
							Esta pagina agora tem ciclo de vida proprio e pode evoluir sem regressao no dashboard bancario.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 text-sm text-muted-foreground">
						<p>
							O dashboard de conta permanece especializado em filtros, graficos e transacoes por banco.
						</p>
						<p>
							O dashboard principal fica reservado para composicao de alto nivel entre modulos e atalhos operacionais.
						</p>
						<p>
							Quando a consolidacao real entrar, a recomendacao e adicionar uma camada propria de view model em vez de reutilizar stores especializados.
						</p>
					</CardContent>
				</Card>
			</section>
		</div>
	);
}
