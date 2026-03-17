import { useEffect, useMemo, useState } from "react";
import { useInvestmentStore } from "@/stores/investmentStore";
import { InvestmentCategoryLabels, InvestmentOrderType } from "@/types/investment";
import type { InvestmentCategory, InvestmentResponse } from "@/types/investment";
import { Badge } from "@/components/ui/badge";
import { PageHeader, KpiCard } from "@/components/shared";
import {
  ChevronDown,
  ChevronRight,
  TrendingUp,
  DollarSign,
  BarChart3,
  Layers,
  ChevronsUpDown,
  ChevronUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TickerSummary {
  ticker: string;
  category: InvestmentCategory;
  netQuantity: number;
  avgPrice: number;
  totalInvested: number;
  lastPurchaseDate: string;
  institutions: string[];
  orderCount: number;
}

interface CategoryGroup {
  category: InvestmentCategory;
  tickers: TickerSummary[];
  totalInvested: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const fmtQty = (v: number) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 6 }).format(v);
const fmtDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};
const fmtPct = (v: number) => `${v.toFixed(1)}%`;

function aggregate(investments: InvestmentResponse[]): CategoryGroup[] {
  const tickerMap = new Map<string, {
    category: InvestmentCategory;
    totalBought: number;
    totalBoughtQty: number;
    netQty: number;
    lastDate: string;
    institutions: Set<string>;
    orderCount: number;
  }>();

  for (const inv of investments) {
    if (!tickerMap.has(inv.ticker)) {
      tickerMap.set(inv.ticker, {
        category: inv.category as InvestmentCategory,
        totalBought: 0,
        totalBoughtQty: 0,
        netQty: 0,
        lastDate: inv.purchaseDate,
        institutions: new Set(),
        orderCount: 0,
      });
    }
    const t = tickerMap.get(inv.ticker)!;
    t.institutions.add(inv.institution);
    t.orderCount++;
    if (inv.purchaseDate > t.lastDate) t.lastDate = inv.purchaseDate;

    if (inv.orderType === InvestmentOrderType.COMPRA) {
      t.totalBought += inv.totalPrice;
      t.totalBoughtQty += inv.quantity;
      t.netQty += inv.quantity;
    } else if (inv.orderType === InvestmentOrderType.VENDA) {
      t.netQty -= inv.quantity;
    } else if (inv.orderType === InvestmentOrderType.BONIFICACAO) {
      t.netQty += inv.quantity;
    }
  }

  const summaries: TickerSummary[] = [];
  tickerMap.forEach((data, ticker) => {
    summaries.push({
      ticker,
      category: data.category,
      netQuantity: data.netQty,
      avgPrice: data.totalBoughtQty > 0 ? data.totalBought / data.totalBoughtQty : 0,
      totalInvested: data.totalBought,
      lastPurchaseDate: data.lastDate,
      institutions: Array.from(data.institutions).sort(),
      orderCount: data.orderCount,
    });
  });

  const catMap = new Map<InvestmentCategory, TickerSummary[]>();
  for (const s of summaries) {
    if (!catMap.has(s.category)) catMap.set(s.category, []);
    catMap.get(s.category)!.push(s);
  }

  const groups: CategoryGroup[] = [];
  catMap.forEach((tickers, category) => {
    tickers.sort((a, b) => b.totalInvested - a.totalInvested);
    const totalInvested = tickers.reduce((sum, t) => sum + t.totalInvested, 0);
    groups.push({ category, tickers, totalInvested });
  });

  return groups.sort((a, b) => b.totalInvested - a.totalInvested);
}

type SortKey = "ticker" | "netQuantity" | "avgPrice" | "totalInvested" | "pct" | "lastPurchaseDate" | "institution";
interface SortState { key: SortKey; asc: boolean; }

const categoryColor: Record<string, string> = {
  STOCK: "bg-blue-500",
  FII: "bg-emerald-500",
  ETF: "bg-violet-500",
  BDR: "bg-amber-500",
  FIXED_INCOME: "bg-teal-500",
  CRYPTO: "bg-orange-500",
  OTHER: "bg-slate-400",
};

const categoryBadgeVariant: Record<string, string> = {
  STOCK: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  FII: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  ETF: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  BDR: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  FIXED_INCOME: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  CRYPTO: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  OTHER: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function InvestmentPortfolioPage() {
  const { investments, loading, fetchInvestments } = useInvestmentStore();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [sortState, setSortState] = useState<Record<string, SortState>>({});

  useEffect(() => { fetchInvestments(); }, [fetchInvestments]);

  const groups = useMemo(() => aggregate(investments), [investments]);

  const grandTotal = groups.reduce((s, g) => s + g.totalInvested, 0);
  const totalTickers = groups.reduce((s, g) => s + g.tickers.length, 0);
  const totalOrders = investments.length;

  const toggleCategory = (cat: string) =>
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const handleSort = (cat: string, key: SortKey) => {
    setSortState((prev) => {
      const cur = prev[cat];
      return { ...prev, [cat]: { key, asc: cur?.key === key ? !cur.asc : true } };
    });
  };

  const sortedTickers = (cat: string, tickers: TickerSummary[]) => {
    const s = sortState[cat];
    if (!s) return tickers;
    return [...tickers].sort((a, b) => {
      let va: string | number;
      let vb: string | number;
      if (s.key === "pct") { va = a.totalInvested; vb = b.totalInvested; }
      else if (s.key === "institution") { va = a.institutions[0] ?? ""; vb = b.institutions[0] ?? ""; }
      else { va = a[s.key] as string | number; vb = b[s.key] as string | number; }
      if (typeof va === "string" && typeof vb === "string")
        return s.asc ? va.localeCompare(vb) : vb.localeCompare(va);
      return s.asc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
  };

  if (loading && investments.length === 0) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        Carregando carteira...
      </div>
    );
  }

  if (investments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-2">
        <TrendingUp className="h-10 w-10 opacity-30" />
        <p className="text-lg">Nenhum investimento na carteira</p>
        <p className="text-sm">Importe um CSV da B3 ou adicione manualmente na aba Lancamentos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patrimonio"
        description="Visao consolidada dos seus ativos agrupados por ticker"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Total Investido"
          value={fmtBRL(grandTotal)}
          icon={DollarSign}
          iconClassName="text-blue-500"
        />
        <KpiCard
          title="Ativos (tickers)"
          value={String(totalTickers)}
          icon={Layers}
          iconClassName="text-emerald-500"
        />
        <KpiCard
          title="Total de Ordens"
          value={String(totalOrders)}
          icon={BarChart3}
          iconClassName="text-violet-500"
        />
        <KpiCard
          title="Maior posicao"
          value={groups[0]?.tickers[0]?.ticker ?? "—"}
          description={groups[0]?.tickers[0] ? fmtBRL(groups[0].tickers[0].totalInvested) : undefined}
          icon={TrendingUp}
          iconClassName="text-amber-500"
        />
      </div>

      {/* Allocation bar */}
      <div className="rounded-xl border border-border bg-card shadow-sm p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Alocacao por Categoria
        </p>
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          {groups.map((g) => {
            const pct = grandTotal > 0 ? (g.totalInvested / grandTotal) * 100 : 0;
            return (
              <div
                key={g.category}
                title={`${InvestmentCategoryLabels[g.category]}: ${fmtPct(pct)}`}
                className={`${categoryColor[g.category] ?? "bg-slate-400"} transition-all`}
                style={{ width: `${pct}%` }}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
          {groups.map((g) => {
            const pct = grandTotal > 0 ? (g.totalInvested / grandTotal) * 100 : 0;
            return (
              <span key={g.category} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${categoryColor[g.category] ?? "bg-slate-400"}`} />
                {InvestmentCategoryLabels[g.category]} {fmtPct(pct)}
              </span>
            );
          })}
        </div>
      </div>

      {/* Category tables */}
      {groups.map((g) => {
        const isCollapsed = collapsed[g.category] ?? false;
        const pct = grandTotal > 0 ? (g.totalInvested / grandTotal) * 100 : 0;

        return (
          <div key={g.category} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors"
              onClick={() => toggleCategory(g.category)}
            >
              <div className="flex items-center gap-3">
                {isCollapsed
                  ? <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                }
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${categoryBadgeVariant[g.category] ?? "bg-muted text-muted-foreground"}`}>
                  {InvestmentCategoryLabels[g.category]}
                </span>
                <span className="text-sm text-muted-foreground">
                  {g.tickers.length} ativo{g.tickers.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="hidden sm:inline text-muted-foreground">{fmtPct(pct)} da carteira</span>
                <span className="font-semibold text-foreground">{fmtBRL(g.totalInvested)}</span>
              </div>
            </button>

            {!isCollapsed && (
              <div className="overflow-x-auto border-t border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <Th label="Ticker" colKey="ticker" cat={g.category} sortState={sortState} onSort={handleSort} align="left" className="px-5" />
                      <Th label="Qtd Liquida" colKey="netQuantity" cat={g.category} sortState={sortState} onSort={handleSort} align="right" />
                      <Th label="Preco Medio" colKey="avgPrice" cat={g.category} sortState={sortState} onSort={handleSort} align="right" />
                      <Th label="Total Investido" colKey="totalInvested" cat={g.category} sortState={sortState} onSort={handleSort} align="right" />
                      <Th label="% Carteira" colKey="pct" cat={g.category} sortState={sortState} onSort={handleSort} align="right" />
                      <Th label="Ultima Compra" colKey="lastPurchaseDate" cat={g.category} sortState={sortState} onSort={handleSort} align="right" className="hidden lg:table-cell" />
                      <Th label="Instituicao" colKey="institution" cat={g.category} sortState={sortState} onSort={handleSort} align="left" className="hidden xl:table-cell" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sortedTickers(g.category, g.tickers).map((t) => {
                      const tickerPct = grandTotal > 0 ? (t.totalInvested / grandTotal) * 100 : 0;
                      return (
                        <tr key={t.ticker} className="hover:bg-muted/40 transition-colors">
                          <td className="px-5 py-3">
                            <span className="font-bold font-mono text-foreground tracking-wider">{t.ticker}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{t.orderCount} ordem{t.orderCount !== 1 ? "s" : ""}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-foreground tabular-nums">{fmtQty(t.netQuantity)}</td>
                          <td className="px-4 py-3 text-right text-foreground tabular-nums">{fmtBRL(t.avgPrice)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground tabular-nums">{fmtBRL(t.totalInvested)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-muted-foreground tabular-nums">{fmtPct(tickerPct)}</span>
                              <div className="h-1 w-16 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${categoryColor[t.category] ?? "bg-slate-400"} rounded-full`}
                                  style={{ width: `${Math.min(tickerPct * 4, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground hidden lg:table-cell">{fmtDate(t.lastPurchaseDate)}</td>
                          <td className="px-4 py-3 text-left hidden xl:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {t.institutions.map((inst) => (
                                <Badge key={inst} variant="secondary" className="text-xs">{inst}</Badge>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-muted/50 border-t border-border">
                    <tr>
                      <td colSpan={3} className="px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Subtotal {InvestmentCategoryLabels[g.category]}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-foreground tabular-nums">{fmtBRL(g.totalInvested)}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums">{fmtPct(pct)}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* Grand total footer */}
      <div className="rounded-xl border border-border bg-slate-800 dark:bg-slate-900 text-white shadow-sm px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Patrimonio Total Investido</p>
          <p className="text-2xl font-bold mt-0.5">{fmtBRL(grandTotal)}</p>
        </div>
        <div className="flex gap-8 text-sm text-slate-300">
          <div>
            <p className="text-slate-500 text-xs">Ativos</p>
            <p className="font-semibold text-white">{totalTickers}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Categorias</p>
            <p className="font-semibold text-white">{groups.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sortable Th ──────────────────────────────────────────────────────────────

function Th({
  label, colKey, cat, sortState, onSort, align, className = "",
}: {
  label: string;
  colKey: SortKey;
  cat: string;
  sortState: Record<string, SortState>;
  onSort: (cat: string, key: SortKey) => void;
  align: "left" | "right";
  className?: string;
}) {
  const s = sortState[cat];
  const active = s?.key === colKey;
  return (
    <th
      className={`px-4 py-2.5 font-semibold text-muted-foreground cursor-pointer select-none whitespace-nowrap ${align === "right" ? "text-right" : "text-left"} ${className}`}
      onClick={() => onSort(cat, colKey)}
    >
      <span className="inline-flex items-center gap-1 group">
        {align === "right" && (
          <span className="text-muted-foreground">
            {active ? (
              s.asc
                ? <ChevronUp className="h-3.5 w-3.5 text-blue-500" />
                : <ChevronDown className="h-3.5 w-3.5 text-blue-500" />
            ) : (
              <ChevronsUpDown className="h-3.5 w-3.5 opacity-40 group-hover:opacity-70" />
            )}
          </span>
        )}
        <span className={active ? "text-blue-600" : ""}>{label}</span>
        {align === "left" && (
          <span className="text-muted-foreground">
            {active ? (
              s.asc
                ? <ChevronUp className="h-3.5 w-3.5 text-blue-500" />
                : <ChevronDown className="h-3.5 w-3.5 text-blue-500" />
            ) : (
              <ChevronsUpDown className="h-3.5 w-3.5 opacity-40 group-hover:opacity-70" />
            )}
          </span>
        )}
      </span>
    </th>
  );
}
