import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTransactionStore } from "@/stores/transactionStore";
import { useBankStore } from "@/stores";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Activity,
  PlusCircle,
  ChevronDown,
  Upload,
  FileText,
} from "lucide-react";
import { PageHeader, KpiCard, DataTable } from "@/components/shared";
import type { Transaction } from "@/types";

const COLORS = [
  "#2563eb", "#dc2626", "#16a34a", "#ca8a04", "#9333ea",
  "#0891b2", "#e11d48", "#65a30d", "#d97706", "#7c3aed",
  "#059669", "#db2777", "#4f46e5", "#ea580c", "#0d9488",
  "#a21caf", "#c026d3", "#f59e0b", "#10b981", "#6366f1",
];

interface ChartEntry {
  name: string;
  value: number;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function getYear(dateStr: string) {
  return new Date(dateStr).getFullYear();
}

function getMonth(dateStr: string) {
  return new Date(dateStr).getMonth();
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function groupChartData(
  entries: ChartEntry[],
  limit = 7
): ChartEntry[] {
  const sorted = [...entries].sort((a, b) => b.value - a.value);
  if (sorted.length <= limit) return sorted;
  const top = sorted.slice(0, limit);
  const rest = sorted.slice(limit).reduce((s, e) => s + e.value, 0);
  return [...top, { name: "Outros", value: rest }];
}

export function BanksDashboardPage() {
  const { transactions, loading, fetchAll, fetchByBank } =
    useTransactionStore();
  const { banks, fetchBanks } = useBankStore();
  const now = useMemo(() => new Date(), []);

  const [selectedBankId, setSelectedBankId] = useState<string>("ALL");
  const [selectedYear, setSelectedYear] = useState<string>(
    String(now.getFullYear())
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    String(now.getMonth())
  );
  const [selectedExpenseCategories, setSelectedExpenseCategories] = useState<
    Set<string>
  >(new Set());
  const [selectedIncomeCategories, setSelectedIncomeCategories] = useState<
    Set<string>
  >(new Set());
  const navigate = useNavigate();
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showSelectBankModal, setShowSelectBankModal] = useState(false);
  const [transactionsCollapsed, setTransactionsCollapsed] = useState(false);
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  useEffect(() => {
    if (selectedBankId === "ALL") {
      fetchAll();
    } else {
      fetchByBank(selectedBankId);
    }
  }, [selectedBankId, fetchAll, fetchByBank]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    transactions.forEach((t) => years.add(getYear(t.transactionDate)));
    years.add(now.getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, now]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const y = getYear(t.transactionDate);
      const m = getMonth(t.transactionDate);
      const yearOk = selectedYear === "ALL" || String(y) === selectedYear;
      const monthOk = selectedMonth === "ALL" || String(m) === selectedMonth;
      return yearOk && monthOk;
    });
  }, [transactions, selectedYear, selectedMonth]);

  const {
    expenseData,
    incomeData,
    allExpenseData,
    allIncomeData,
    totalExpense,
    totalIncome,
  } = useMemo(() => {
    const expenseMap = new Map<string, number>();
    const incomeMap = new Map<string, number>();

    filteredTransactions.forEach((t) => {
      const key = t.summaryDescription || t.originalDescription;
      const val = Math.abs(t.amount);
      if (t.type === "DEBIT") {
        expenseMap.set(key, (expenseMap.get(key) ?? 0) + val);
      } else {
        incomeMap.set(key, (incomeMap.get(key) ?? 0) + val);
      }
    });

    const toArr = (map: Map<string, number>): ChartEntry[] =>
      Array.from(map.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const allExp = toArr(expenseMap);
    const allInc = toArr(incomeMap);

    return {
      expenseData: groupChartData(allExp),
      incomeData: groupChartData(allInc),
      allExpenseData: allExp,
      allIncomeData: allInc,
      totalExpense: allExp.reduce((s, e) => s + e.value, 0),
      totalIncome: allInc.reduce((s, e) => s + e.value, 0),
    };
  }, [filteredTransactions]);

  const columns = useMemo<ColumnDef<Transaction, unknown>[]>(() => {
    const cols: ColumnDef<Transaction, unknown>[] = [
      {
        accessorKey: "transactionDate",
        header: "Data",
        cell: ({ getValue }) => {
          const v = getValue() as string;
          return new Date(v + "T00:00:00").toLocaleDateString("pt-BR");
        },
      },
      {
        accessorKey: "summaryDescription",
        header: "Descricao",
        cell: ({ row }) => (
          <div>
            <span className="font-medium">
              {row.original.summaryDescription}
            </span>
            {row.original.originalDescription !==
              row.original.summaryDescription && (
              <p className="text-xs text-muted-foreground truncate max-w-[260px]">
                {row.original.originalDescription}
              </p>
            )}
          </div>
        ),
      },
    ];

    if (selectedBankId === "ALL") {
      cols.push({ accessorKey: "bankName", header: "Banco" });
    }

    cols.push(
      {
        accessorKey: "amount",
        header: "Valor",
        cell: ({ row }) => (
          <span
            className={`tabular-nums font-medium ${
              row.original.type === "CREDIT"
                ? "text-emerald-600"
                : "text-red-600"
            }`}
          >
            {formatCurrency(Math.abs(row.original.amount))}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: "Tipo",
        cell: ({ getValue }) => {
          const v = getValue() as string;
          return (
            <Badge
              variant={v === "CREDIT" ? "default" : "destructive"}
              className="text-xs"
            >
              {v === "CREDIT" ? "Receita" : "Despesa"}
            </Badge>
          );
        },
      }
    );

    return cols;
  }, [selectedBankId]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const entry = payload[0];
    const chartEntry = entry.payload as ChartEntry;
    return (
      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-md text-sm">
        <p className="font-semibold mb-1">{chartEntry.name}</p>
        <p className="text-foreground">{formatCurrency(Number(entry.value))}</p>
      </div>
    );
  };

  const renderLabel = (props: PieLabelRenderProps) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    if ((percent ?? 0) < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = (Number(innerRadius) + Number(outerRadius)) / 2;
    const x = Number(cx) + radius * Math.cos(-Number(midAngle) * RADIAN);
    const y = Number(cy) + radius * Math.sin(-Number(midAngle) * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={600}
      >
        {`${((percent ?? 0) * 100).toFixed(0)}%`}
      </text>
    );
  };

  const saldo = totalIncome - totalExpense;

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Dashboard"
        description="Analise receitas e despesas por periodo"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={selectedBankId}
            onValueChange={(v) => {
              setSelectedBankId(v);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Todos os Bancos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Bancos</SelectItem>
              {banks.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.bankName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os anos</SelectItem>
              {availableYears.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os meses</SelectItem>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => {
              if (selectedBankId === "ALL") {
                setShowSelectBankModal(true);
              } else {
                setShowTransactionModal(true);
              }
            }}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Nova Transacao
          </Button>
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Saldo Liquido"
          value={formatCurrency(saldo)}
          icon={Wallet}
          iconClassName={
            saldo >= 0
              ? "bg-blue-50 text-blue-600"
              : "bg-red-50 text-red-600"
          }
          description={
            saldo >= 0 ? "Positivo neste periodo" : "Negativo neste periodo"
          }
        />
        <KpiCard
          title="Receitas"
          value={formatCurrency(totalIncome)}
          icon={ArrowUpCircle}
          iconClassName="bg-emerald-50 text-emerald-600"
          description="Entradas neste periodo"
        />
        <KpiCard
          title="Despesas"
          value={formatCurrency(totalExpense)}
          icon={ArrowDownCircle}
          iconClassName="bg-red-50 text-red-600"
          description="Saidas neste periodo"
        />
        <KpiCard
          title="Transacoes"
          value={String(filteredTransactions.length)}
          icon={Activity}
          iconClassName="bg-indigo-50 text-indigo-600"
          description="Registros neste periodo"
        />
      </div>

      {loading ? (
        <div className="text-muted-foreground py-12 text-center">
          Carregando dados...
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">
          Nenhuma transacao encontrada. Importe um CSV para visualizar o
          dashboard.
        </div>
      ) : (
        <>
          {/* Chart type toggle */}
          <div className="flex justify-end">
            <div className="inline-flex rounded-md border border-input bg-muted p-1 gap-1">
              <Button
                variant={chartType === "pie" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartType("pie")}
              >
                Pizza
              </Button>
              <Button
                variant={chartType === "bar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartType("bar")}
              >
                Barras
              </Button>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Expense chart */}
            <Card className="shadow-sm">
              <CardHeader className="border-b pb-4 mb-4">
                <CardTitle className="text-red-600 font-semibold text-lg">
                  Despesas
                </CardTitle>
                <CardDescription>
                  Distribuicao ({expenseData.length} categorias)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {expenseData.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma despesa encontrada
                  </p>
                ) : chartType === "pie" ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={expenseData}
                        cx="50%"
                        cy="50%"
                        outerRadius={130}
                        dataKey="value"
                        label={renderLabel}
                        labelLine={false}
                      >
                        {expenseData.map((_, idx) => (
                          <Cell
                            key={idx}
                            fill={COLORS[idx % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={renderTooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={expenseData}
                      layout="vertical"
                      margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tickFormatter={(v: number) => formatCurrency(v)}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={130}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip content={renderTooltip} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {expenseData.map((_, idx) => (
                          <Cell
                            key={idx}
                            fill={COLORS[idx % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
                <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center mt-4 border-t pt-3">
                  {expenseData.map((entry, idx) => {
                    const pct =
                      totalExpense > 0
                        ? ((entry.value / totalExpense) * 100).toFixed(1)
                        : "0.0";
                    return (
                      <div
                        key={entry.name}
                        className="flex items-center gap-1.5"
                      >
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-sm"
                          style={{ background: COLORS[idx % COLORS.length] }}
                        />
                        <span
                          className="text-xs font-medium truncate max-w-[120px]"
                          title={entry.name}
                        >
                          {entry.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {pct}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({formatCurrency(entry.value)})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Income chart */}
            <Card className="shadow-sm">
              <CardHeader className="border-b pb-4 mb-4">
                <CardTitle className="text-green-600 font-semibold text-lg">
                  Receitas
                </CardTitle>
                <CardDescription>
                  Distribuicao ({incomeData.length} categorias)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {incomeData.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma receita encontrada
                  </p>
                ) : chartType === "pie" ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={incomeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={130}
                        dataKey="value"
                        label={renderLabel}
                        labelLine={false}
                      >
                        {incomeData.map((_, idx) => (
                          <Cell
                            key={idx}
                            fill={COLORS[idx % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={renderTooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={incomeData}
                      layout="vertical"
                      margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tickFormatter={(v: number) => formatCurrency(v)}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={130}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip content={renderTooltip} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {incomeData.map((_, idx) => (
                          <Cell
                            key={idx}
                            fill={COLORS[idx % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
                <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center mt-4 border-t pt-3">
                  {incomeData.map((entry, idx) => {
                    const pct =
                      totalIncome > 0
                        ? ((entry.value / totalIncome) * 100).toFixed(1)
                        : "0.0";
                    return (
                      <div
                        key={entry.name}
                        className="flex items-center gap-1.5"
                      >
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-sm"
                          style={{ background: COLORS[idx % COLORS.length] }}
                        />
                        <span
                          className="text-xs font-medium truncate max-w-[120px]"
                          title={entry.name}
                        >
                          {entry.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {pct}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({formatCurrency(entry.value)})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary tables row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Expense summary table */}
            <Card className="shadow-sm">
              <CardHeader className="border-b pb-4 mb-4">
                <CardTitle className="text-red-600 text-lg font-semibold">
                  Detalhamento de Despesas
                </CardTitle>
                <CardDescription>
                  Selecione uma ou mais categorias para filtrar os resultados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allExpenseData.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">
                    Nenhuma despesa
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <button
                        className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                          selectedExpenseCategories.size === 0
                            ? "bg-red-100 border-red-400 text-red-700"
                            : "bg-background border-input text-muted-foreground hover:bg-accent"
                        }`}
                        onClick={() =>
                          setSelectedExpenseCategories(new Set())
                        }
                      >
                        Todas
                      </button>
                      {allExpenseData.map((entry) => {
                        const active = selectedExpenseCategories.has(
                          entry.name
                        );
                        return (
                          <button
                            key={entry.name}
                            className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                              active
                                ? "bg-red-100 border-red-400 text-red-700"
                                : "bg-background border-input text-muted-foreground hover:bg-accent"
                            }`}
                            onClick={() => {
                              const next = new Set(selectedExpenseCategories);
                              if (active) next.delete(entry.name);
                              else next.add(entry.name);
                              setSelectedExpenseCategories(next);
                            }}
                          >
                            {entry.name}
                          </button>
                        );
                      })}
                    </div>
                    <div className="overflow-auto max-h-[400px]">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-background">
                          <tr className="border-b">
                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                              Descricao Resumida
                            </th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">
                              Valor Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {allExpenseData
                            .filter(
                              (e) =>
                                selectedExpenseCategories.size === 0 ||
                                selectedExpenseCategories.has(e.name)
                            )
                            .map((entry) => (
                              <tr
                                key={entry.name}
                                className="border-b last:border-0 hover:bg-muted/50"
                              >
                                <td className="py-1.5 px-2">{entry.name}</td>
                                <td className="py-1.5 px-2 text-right text-red-600 font-medium tabular-nums">
                                  {formatCurrency(entry.value)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 font-bold">
                            <td className="py-2 px-2">
                              Total
                              {selectedExpenseCategories.size > 0
                                ? " filtrado"
                                : " geral"}
                            </td>
                            <td className="py-2 px-2 text-right text-red-600 tabular-nums">
                              {formatCurrency(
                                allExpenseData
                                  .filter(
                                    (e) =>
                                      selectedExpenseCategories.size === 0 ||
                                      selectedExpenseCategories.has(e.name)
                                  )
                                  .reduce((s, e) => s + e.value, 0)
                              )}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Income summary table */}
            <Card className="shadow-sm">
              <CardHeader className="border-b pb-4 mb-4">
                <CardTitle className="text-green-600 text-lg font-semibold">
                  Detalhamento Receitas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allIncomeData.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">
                    Nenhuma receita
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <button
                        className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                          selectedIncomeCategories.size === 0
                            ? "bg-green-100 border-green-400 text-green-700"
                            : "bg-background border-input text-muted-foreground hover:bg-accent"
                        }`}
                        onClick={() =>
                          setSelectedIncomeCategories(new Set())
                        }
                      >
                        Todas
                      </button>
                      {allIncomeData.map((entry) => {
                        const active = selectedIncomeCategories.has(
                          entry.name
                        );
                        return (
                          <button
                            key={entry.name}
                            className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                              active
                                ? "bg-green-100 border-green-400 text-green-700"
                                : "bg-background border-input text-muted-foreground hover:bg-accent"
                            }`}
                            onClick={() => {
                              const next = new Set(selectedIncomeCategories);
                              if (active) next.delete(entry.name);
                              else next.add(entry.name);
                              setSelectedIncomeCategories(next);
                            }}
                          >
                            {entry.name}
                          </button>
                        );
                      })}
                    </div>
                    <div className="overflow-auto max-h-[400px]">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-background">
                          <tr className="border-b">
                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                              Descricao Resumida
                            </th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">
                              Valor Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {allIncomeData
                            .filter(
                              (e) =>
                                selectedIncomeCategories.size === 0 ||
                                selectedIncomeCategories.has(e.name)
                            )
                            .map((entry) => (
                              <tr
                                key={entry.name}
                                className="border-b last:border-0 hover:bg-muted/50"
                              >
                                <td className="py-1.5 px-2">{entry.name}</td>
                                <td className="py-1.5 px-2 text-right text-green-600 font-medium tabular-nums">
                                  {formatCurrency(entry.value)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 font-bold">
                            <td className="py-2 px-2">
                              Total
                              {selectedIncomeCategories.size > 0
                                ? " filtrado"
                                : " geral"}
                            </td>
                            <td className="py-2 px-2 text-right text-green-600 tabular-nums">
                              {formatCurrency(
                                allIncomeData
                                  .filter(
                                    (e) =>
                                      selectedIncomeCategories.size === 0 ||
                                      selectedIncomeCategories.has(e.name)
                                  )
                                  .reduce((s, e) => s + e.value, 0)
                              )}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transactions DataTable */}
          <Card className="shadow-sm">
            <CardHeader className="border-b pb-2 mb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">
                    Transacoes
                  </CardTitle>
                  <CardDescription>
                    Lista completa de transacoes no periodo selecionado (
                    {filteredTransactions.length} registros)
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTransactionsCollapsed((v) => !v)}
                  aria-expanded={!transactionsCollapsed}
                >
                  {transactionsCollapsed ? (
                    <span className="inline-flex items-center gap-1">
                      Expandir{" "}
                      <ChevronDown className="h-4 w-4 rotate-180" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      Recolher <ChevronDown className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </div>
            </CardHeader>
            {!transactionsCollapsed && (
              <CardContent>
                <DataTable
                  columns={columns}
                  data={filteredTransactions}
                  loading={loading}
                  globalFilterPlaceholder="Buscar transacoes..."
                  emptyMessage="Nenhuma transacao no periodo selecionado"
                  initialPageSize={25}
                />
              </CardContent>
            )}
          </Card>
        </>
      )}

      {/* Nova Transacao Dialog */}
      <Dialog
        open={showTransactionModal}
        onOpenChange={setShowTransactionModal}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar Transacao</DialogTitle>
            <DialogDescription>
              Escolha como deseja cadastrar a transacao.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              className="w-full"
              onClick={() => {
                setShowTransactionModal(false);
                navigate(`/transaction-upload/${selectedBankId}`);
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload de Arquivo CSV
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setShowTransactionModal(false);
                navigate(`/transaction-manual/${selectedBankId}`);
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              Cadastro Manual
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Selecione Banco Dialog */}
      <Dialog
        open={showSelectBankModal}
        onOpenChange={setShowSelectBankModal}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-yellow-600">
              Selecione um banco para continuar
            </DialogTitle>
            <DialogDescription>
              Para adicionar uma nova transacao, e necessario selecionar um
              banco especifico no filtro acima. O botao{" "}
              <strong>Nova Transacao</strong> so sera habilitado apos a
              selecao.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setShowSelectBankModal(false)}
              autoFocus
            >
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
