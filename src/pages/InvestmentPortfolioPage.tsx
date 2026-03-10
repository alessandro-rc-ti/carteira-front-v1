import { useEffect, useMemo, useState } from "react";
import { useInvestmentStore } from "@/stores/investmentStore";
import {
  InvestmentCategoryLabels,
  InvestmentOrderType,
} from "@/types/investment";
import type { InvestmentCategory, InvestmentResponse } from "@/types/investment";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, TrendingUp, DollarSign, BarChart3, Layers, ChevronsUpDown, ChevronUp } from "lucide-react";

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

  // Build ticker summaries
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

  // Group by category
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

// ─── Category color map ───────────────────────────────────────────────────────

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
  STOCK: "bg-blue-100 text-blue-700",
  FII: "bg-emerald-100 text-emerald-700",
  ETF: "bg-violet-100 text-violet-700",
  BDR: "bg-amber-100 text-amber-700",
  FIXED_INCOME: "bg-teal-100 text-teal-700",
  CRYPTO: "bg-orange-100 text-orange-700",
  OTHER: "bg-slate-100 text-slate-700",
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
        <p className="text-sm">Importe um CSV da B3 ou adicione manualmente na aba Lançamentos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight uppercase">Patrimônio</h1>
        <p className="text-slate-500 text-sm mt-1">Visão consolidada dos seus ativos agrupados por ticker</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={<DollarSign className="h-5 w-5 text-blue-500" />}
          label="Total Investido"
          value={fmtBRL(grandTotal)}
          bg="bg-blue-50"
        />
        <SummaryCard
          icon={<Layers className="h-5 w-5 text-emerald-500" />}
          label="Ativos (tickers)"
          value={String(totalTickers)}
          bg="bg-emerald-50"
        />
        <SummaryCard
          icon={<BarChart3 className="h-5 w-5 text-violet-500" />}
          label="Categorias"
          value={String(groups.length)}
          bg="bg-violet-50"
        />
        <SummaryCard
          icon={<TrendingUp className="h-5 w-5 text-amber-500" />}
          label="Maior posição"
          value={groups[0]?.tickers[0]?.ticker ?? "—"}
          sub={groups[0]?.tickers[0] ? fmtBRL(groups[0].tickers[0].totalInvested) : undefined}
          bg="bg-amber-50"
        />
      </div>

      {/* Allocation bar */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Alocação por Categoria</p>
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
              <span key={g.category} className="flex items-center gap-1.5 text-xs text-slate-600">
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
          <div key={g.category} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Category header */}
            <button
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
              onClick={() => toggleCategory(g.category)}
            >
              <div className="flex items-center gap-3">
                {isCollapsed
                  ? <ChevronRight className="h-4 w-4 text-slate-400" />
                  : <ChevronDown className="h-4 w-4 text-slate-400" />
                }
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${categoryBadgeVariant[g.category] ?? "bg-slate-100 text-slate-700"}`}
                >
                  {InvestmentCategoryLabels[g.category]}
                </span>
                <span className="text-sm text-slate-500">{g.tickers.length} ativo{g.tickers.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="hidden sm:inline text-slate-400">{fmtPct(pct)} da carteira</span>
                <span className="font-semibold text-slate-800">{fmtBRL(g.totalInvested)}</span>
              </div>
            </button>

            {/* Table */}
            {!isCollapsed && (
              <div className="overflow-x-auto border-t border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <Th label="Ticker" colKey="ticker" cat={g.category} sortState={sortState} onSort={handleSort} align="left" className="px-5" />
                      <Th label="Qtd Líquida" colKey="netQuantity" cat={g.category} sortState={sortState} onSort={handleSort} align="right" />
                      <Th label="Preço Médio" colKey="avgPrice" cat={g.category} sortState={sortState} onSort={handleSort} align="right" />
                      <Th label="Total Investido" colKey="totalInvested" cat={g.category} sortState={sortState} onSort={handleSort} align="right" />
                      <Th label="% Carteira" colKey="pct" cat={g.category} sortState={sortState} onSort={handleSort} align="right" />
                      <Th label="Última Compra" colKey="lastPurchaseDate" cat={g.category} sortState={sortState} onSort={handleSort} align="right" className="hidden lg:table-cell" />
                      <Th label="Instituição" colKey="institution" cat={g.category} sortState={sortState} onSort={handleSort} align="left" className="hidden xl:table-cell" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedTickers(g.category, g.tickers).map((t) => {
                      const tickerPct = grandTotal > 0 ? (t.totalInvested / grandTotal) * 100 : 0;
                      return (
                        <tr key={t.ticker} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3">
                            <span className="font-bold font-mono text-slate-800 tracking-wider">{t.ticker}</span>
                            <span className="ml-2 text-xs text-slate-400">{t.orderCount} ordem{t.orderCount !== 1 ? "s" : ""}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700 tabular-nums">{fmtQty(t.netQuantity)}</td>
                          <td className="px-4 py-3 text-right text-slate-700 tabular-nums">{fmtBRL(t.avgPrice)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-800 tabular-nums">{fmtBRL(t.totalInvested)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-slate-600 tabular-nums">{fmtPct(tickerPct)}</span>
                              <div className="h-1 w-16 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${categoryColor[t.category] ?? "bg-slate-400"} rounded-full`}
                                  style={{ width: `${Math.min(tickerPct * 4, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500 hidden lg:table-cell">{fmtDate(t.lastPurchaseDate)}</td>
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
                  {/* Category subtotal */}
                  <tfoot className="bg-slate-50 border-t border-slate-200">
                    <tr>
                      <td colSpan={3} className="px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Subtotal {InvestmentCategoryLabels[g.category]}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-slate-800 tabular-nums">{fmtBRL(g.totalInvested)}</td>
                      <td className="px-4 py-2.5 text-right text-slate-500 tabular-nums">{fmtPct(pct)}</td>
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
      <div className="rounded-xl border border-slate-200 bg-slate-800 text-white shadow-sm px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Patrimônio Total Investido</p>
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

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  icon, label, value, sub, bg,
}: {
  icon: React.ReactNode; label: string; value: string; sub?: string; bg: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm p-4 flex items-start gap-3`}>
      <div className={`${bg} rounded-lg p-2 flex-shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 truncate">{label}</p>
        <p className="text-lg font-bold text-slate-800 truncate">{value}</p>
        {sub && <p className="text-xs text-slate-400 truncate">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Sortable Th ─────────────────────────────────────────────────────────────

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
      className={`px-4 py-2.5 font-semibold text-slate-600 cursor-pointer select-none whitespace-nowrap ${align === "right" ? "text-right" : "text-left"} ${className}`}
      onClick={() => onSort(cat, colKey)}
    >
      <span className="inline-flex items-center gap-1 group">
        {align === "right" && (
          <span className="text-slate-400">
            {active ? (s.asc ? <ChevronUp className="h-3.5 w-3.5 text-blue-500" /> : <ChevronDown className="h-3.5 w-3.5 text-blue-500" />) : <ChevronsUpDown className="h-3.5 w-3.5 opacity-40 group-hover:opacity-70" />}
          </span>
        )}
        <span className={active ? "text-blue-600" : ""}>{label}</span>
        {align === "left" && (
          <span className="text-slate-400">
            {active ? (s.asc ? <ChevronUp className="h-3.5 w-3.5 text-blue-500" /> : <ChevronDown className="h-3.5 w-3.5 text-blue-500" />) : <ChevronsUpDown className="h-3.5 w-3.5 opacity-40 group-hover:opacity-70" />}
          </span>
        )}
      </span>
    </th>
  );
}
