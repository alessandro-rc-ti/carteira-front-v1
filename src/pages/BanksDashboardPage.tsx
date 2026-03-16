import { useEffect, useMemo, useState } from "react";
import { useTransactionStore } from "@/stores/transactionStore";
import { useBankStore } from "@/stores";
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
import { ArrowUpCircle, ArrowDownCircle, Wallet, Activity, PlusCircle, AlertCircle, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TransactionTable } from "@/components/TransactionTable";

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
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function getYear(dateStr: string) {
  return new Date(dateStr).getFullYear();
}
function getMonth(dateStr: string) {
  return new Date(dateStr).getMonth();
}

export function BanksDashboardPage() {
  const { transactions, loading, fetchAll, fetchByBank } = useTransactionStore();
  const { banks, fetchBanks } = useBankStore();
  const now = useMemo(() => new Date(), []);
  const [selectedBankId, setSelectedBankId] = useState<string>("ALL");
  const [selectedYear, setSelectedYear] = useState<string>(String(now.getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState<string>(String(now.getMonth()));
  const [selectedExpenseCategories, setSelectedExpenseCategories] = useState<Set<string>>(new Set());
  const [selectedIncomeCategories, setSelectedIncomeCategories] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showSelectBankModal, setShowSelectBankModal] = useState(false);
  const [transactionsCollapsed, setTransactionsCollapsed] = useState(false);
  

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
    const years = new Set<string>();
    years.add(String(now.getFullYear()));
    transactions.forEach((tx) => {
      years.add(String(getYear(tx.transactionDate)));
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [transactions, now]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const year = String(getYear(tx.transactionDate));
      const month = String(getMonth(tx.transactionDate));
      const matchYear = selectedYear === "ALL" || year === selectedYear;
      const matchMonth = selectedMonth === "ALL" || month === selectedMonth;
      return matchYear && matchMonth;
    });
  }, [transactions, selectedYear, selectedMonth]);

  function groupChartData(data: ChartEntry[]): ChartEntry[] {
    if (data.length <= 7) return data;
    const top = data.slice(0, 7);
    const outros = data.slice(7).reduce((s, e) => s + e.value, 0);
    return [...top, { name: "Outros", value: outros }];
  }

  const { expenseData, incomeData, allExpenseData, allIncomeData, totalExpense, totalIncome } = useMemo(() => {
    const expenseMap = new Map<string, number>();
    const incomeMap = new Map<string, number>();

    for (const tx of filteredTransactions) {
      const label = tx.summaryDescription || tx.originalDescription || "Sem descrição";
      if (tx.amount < 0) {
        expenseMap.set(label, (expenseMap.get(label) ?? 0) + Math.abs(tx.amount));
      } else if (tx.amount > 0) {
        incomeMap.set(label, (incomeMap.get(label) ?? 0) + tx.amount);
      }
    }

    const toSorted = (map: Map<string, number>): ChartEntry[] =>
      Array.from(map.entries())
        .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
        .sort((a, b) => b.value - a.value);

    const allExpense = toSorted(expenseMap);
    const allIncome = toSorted(incomeMap);
    const expenseEntries = groupChartData(allExpense);
    const incomeEntries = groupChartData(allIncome);

    return {
      expenseData: expenseEntries,
      incomeData: incomeEntries,
      allExpenseData: allExpense,
      allIncomeData: allIncome,
      totalExpense: allExpense.reduce((s, e) => s + e.value, 0),
      totalIncome: allIncome.reduce((s, e) => s + e.value, 0),
    };
  }, [filteredTransactions]);

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const renderTooltip = ({ active, payload }: Record<string, unknown>) => {
    if (!active || !payload) return null;
    const items = payload as Array<{ name: string; value: number }>;
    if (!items.length) return null;
    const entry = items[0];
    return (
      <div className="rounded-md border bg-background p-2 shadow-sm text-sm">
        <p className="font-medium">{entry.name}</p>
        <p className="text-muted-foreground">{formatCurrency(entry.value)}</p>
      </div>
    );
  };

  const [chartType, setChartType] = useState<"pie" | "bar">("pie");

  const renderLabel = (props: PieLabelRenderProps): string => {
    const percent = Number(props.percent ?? 0);
    if (percent < 0.03) return "";
    return `${(percent * 100).toFixed(0)}%`;
  };

  const renderBarTooltip = ({ active, payload }: Record<string, unknown>) => {
    if (!active || !payload) return null;
    const items = payload as Array<{ payload: ChartEntry }>;
    if (!items.length) return null;
    const entry = items[0].payload;
    return (
      <div className="rounded-md border bg-background p-2 shadow-sm text-sm">
        <p className="font-medium">{entry.name}</p>
        <p className="text-muted-foreground">{formatCurrency(entry.value)}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight uppercase">Dashboard da Conta</h1>
          <p className="text-slate-500 text-sm mt-1">
            Visão consolidada da conta selecionada.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={selectedBankId} onValueChange={setSelectedBankId}>
            <SelectTrigger className="w-[180px] bg-white shadow-sm border-slate-200">
              <SelectValue placeholder="Filtrar por banco" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os bancos</SelectItem>
              {banks.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.bankName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px] bg-white shadow-sm border-slate-200">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os anos</SelectItem>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px] bg-white shadow-sm border-slate-200">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os meses</SelectItem>
              {MONTHS.map((m, idx) => (
                <SelectItem key={idx} value={String(idx)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            className={`ml-2 flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm ${
              selectedBankId === "ALL"
                ? "bg-slate-200 text-slate-400 cursor-not-allowed hover:bg-slate-200"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
            onClick={() => {
              if (selectedBankId === "ALL") setShowSelectBankModal(true);
              else setShowTransactionModal(true);
            }}
            type="button"
            tabIndex={0}
            aria-disabled={selectedBankId === "ALL"}
          >
            <PlusCircle className="h-4 w-4" />
            <span>Nova Transação</span>
          </button>
        </div>
      </div>

      {/* Modal para upload/manual */}
      {showTransactionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md relative">
            <button
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
              onClick={() => setShowTransactionModal(false)}
              type="button"
            >
              <span className="text-lg">×</span>
            </button>
            <h2 className="text-lg font-bold mb-4">Adicionar Transação</h2>
            <div className="space-y-4">
              <button
                className="w-full flex items-center gap-2 justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
                onClick={() => { setShowTransactionModal(false); navigate(`/transaction-upload/${selectedBankId}`); }}
                type="button"
              >
                <PlusCircle className="h-4 w-4" />
                Upload de Arquivo CSV
              </button>
              <button
                className="w-full flex items-center gap-2 justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
                onClick={() => { setShowTransactionModal(false); navigate(`/transaction-manual/${selectedBankId}`); }}
                type="button"
              >
                <PlusCircle className="h-4 w-4" />
                Cadastro Manual
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de aviso para selecionar banco */}
      {showSelectBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm relative border border-yellow-200">
            <button
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
              onClick={() => setShowSelectBankModal(false)}
              type="button"
              aria-label="Fechar aviso"
            >
              <span className="text-lg">×</span>
            </button>
            <div className="flex flex-col items-center gap-3">
              <AlertCircle className="h-12 w-12 text-yellow-500 mb-2 drop-shadow" />
              <h2 className="text-xl font-bold text-yellow-700 mb-1 text-center">Selecione um banco para continuar</h2>
              <p className="text-slate-600 text-center mb-2 max-w-xs">
                Para adicionar uma nova transação, é necessário selecionar um banco específico no filtro acima.<br />
                <span className="text-slate-500 text-xs">O botão <b>Nova Transação</b> só será habilitado após a seleção.</span>
              </p>
              <button
                className="mt-2 px-5 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow"
                onClick={() => setShowSelectBankModal(false)}
                type="button"
                autoFocus
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card Saldo Líquido */}
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-5 flex flex-col justify-center h-full">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Saldo Líquido</p>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-bold text-slate-800">
                {formatCurrency(totalIncome - totalExpense)}
              </h2>
            </div>
            <div className="mt-3 flex items-center text-xs">
              <span className={`px-2 py-1 rounded-md font-medium ${(totalIncome - totalExpense) >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                {(totalIncome - totalExpense) >= 0 ? "+ Positivo" : "- Negativo"}
              </span>
              <span className="text-slate-400 ml-2">neste período</span>
            </div>
          </CardContent>
        </Card>

        {/* Card Receitas */}
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-5 flex flex-col justify-center h-full">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Receitas</p>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <ArrowUpCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-bold text-slate-800">
                {formatCurrency(totalIncome)}
              </h2>
            </div>
            <div className="mt-3 flex items-center text-xs">
              <span className="px-2 py-1 rounded-md font-medium bg-emerald-50 text-emerald-600">
                Entradas
              </span>
              <span className="text-slate-400 ml-2">neste período</span>
            </div>
          </CardContent>
        </Card>

        {/* Card Despesas */}
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-5 flex flex-col justify-center h-full">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Despesas</p>
              <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                <ArrowDownCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-bold text-slate-800">
                {formatCurrency(totalExpense)}
              </h2>
            </div>
            <div className="mt-3 flex items-center text-xs">
              <span className="px-2 py-1 rounded-md font-medium bg-red-50 text-red-600">
                Saídas
              </span>
              <span className="text-slate-400 ml-2">neste período</span>
            </div>
          </CardContent>
        </Card>

        {/* Card Movimentações */}
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-5 flex flex-col justify-center h-full">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Transações</p>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-bold text-slate-800">
                {filteredTransactions.length}
              </h2>
            </div>
            <div className="mt-3 flex items-center text-xs">
              <span className="px-2 py-1 rounded-md font-medium bg-indigo-50 text-indigo-600">
                Registros
              </span>
              <span className="text-slate-400 ml-2">neste período</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-muted-foreground py-12 text-center">
          Carregando dados...
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">
          Nenhuma transação encontrada. Importe um CSV para visualizar o dashboard.
        </div>
      ) : (
        <>
          {/* Toggle pizza/barras */}
          <div className="flex gap-2 justify-end mb-2">
            <div className="bg-slate-200/50 p-1 rounded-md inline-flex border border-slate-200">
              <button
                className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${
                  chartType === "pie"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                onClick={() => setChartType("pie")}
              >
                Gráfico de Pizza
              </button>
              <button
                className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${
                  chartType === "bar"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                onClick={() => setChartType("bar")}
              >
                Gráfico de Barras
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Expense Pie */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-4 mb-4">
              <CardTitle className="text-red-600 font-semibold text-lg">Visão Geral de Despesas</CardTitle>
              <CardDescription className="text-slate-500">
                Distribuição por descrição resumida ({expenseData.length} categorias)
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
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={renderTooltip} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={expenseData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v: number) => formatCurrency(v)} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                    <Tooltip content={renderBarTooltip} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {expenseData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              {/* Legenda */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center mt-4 border-t pt-3">
                {expenseData.map((entry, idx) => {
                  const pct = totalExpense > 0 ? ((entry.value / totalExpense) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[idx % COLORS.length] }} />
                      <span className="text-xs font-medium truncate max-w-[120px]" title={entry.name}>{entry.name}</span>
                      <span className="text-xs text-muted-foreground">{pct}%</span>
                      <span className="text-xs text-muted-foreground">({formatCurrency(entry.value)})</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Income Chart */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-4 mb-4">
              <CardTitle className="text-green-600 font-semibold text-lg">Receitas</CardTitle>
              <CardDescription className="text-slate-500">
                Distribuição ({incomeData.length} categorias)
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
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={renderTooltip} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={incomeData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v: number) => formatCurrency(v)} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                    <Tooltip content={renderBarTooltip} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {incomeData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              {/* Legenda */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center mt-4 border-t pt-3">
                {incomeData.map((entry, idx) => {
                  const pct = totalIncome > 0 ? ((entry.value / totalIncome) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[idx % COLORS.length] }} />
                      <span className="text-xs font-medium truncate max-w-[120px]" title={entry.name}>{entry.name}</span>
                      <span className="text-xs text-muted-foreground">{pct}%</span>
                      <span className="text-xs text-muted-foreground">({formatCurrency(entry.value)})</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          </div>

          {/* Tabelas de resumo */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Tabela Despesas */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="border-b border-slate-100 pb-4 mb-4">
                <CardTitle className="text-red-600 text-lg font-semibold">Detalhamento de Despesas</CardTitle>
                <CardDescription className="text-slate-500">Selecione uma ou mais categorias para filtrar os resultados abaixo.</CardDescription>
              </CardHeader>
              <CardContent>
                {allExpenseData.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">Nenhuma despesa</p>
                ) : (
                  <>
                    {/* Filtro de categorias */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <button
                        className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                          selectedExpenseCategories.size === 0
                            ? "bg-red-100 border-red-400 text-red-700"
                            : "bg-background border-input text-muted-foreground hover:bg-accent"
                        }`}
                        onClick={() => setSelectedExpenseCategories(new Set())}
                      >Todas</button>
                      {allExpenseData.map((entry) => {
                        const active = selectedExpenseCategories.has(entry.name);
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
                          >{entry.name}</button>
                        );
                      })}
                    </div>
                    <div className="overflow-auto max-h-[400px]">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-background">
                          <tr className="border-b">
                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Descrição Resumida</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">Valor Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allExpenseData
                            .filter((e) => selectedExpenseCategories.size === 0 || selectedExpenseCategories.has(e.name))
                            .map((entry) => (
                            <tr key={entry.name} className="border-b last:border-0 hover:bg-muted/50">
                              <td className="py-1.5 px-2">{entry.name}</td>
                              <td className="py-1.5 px-2 text-right text-red-600 font-medium tabular-nums">
                                {formatCurrency(entry.value)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 font-bold">
                            <td className="py-2 px-2">Total{selectedExpenseCategories.size > 0 ? " filtrado" : " geral"}</td>
                            <td className="py-2 px-2 text-right text-red-600 tabular-nums">
                              {formatCurrency(
                                allExpenseData
                                  .filter((e) => selectedExpenseCategories.size === 0 || selectedExpenseCategories.has(e.name))
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

            {/* Tabela Receitas */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="border-b border-slate-100 pb-4 mb-4">
                <CardTitle className="text-green-600 text-lg font-semibold">Detalhamento Receitas</CardTitle>
              </CardHeader>
              <CardContent>
                {allIncomeData.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">Nenhuma receita</p>
                ) : (
                  <>
                    {/* Filtro de categorias */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <button
                        className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                          selectedIncomeCategories.size === 0
                            ? "bg-green-100 border-green-400 text-green-700"
                            : "bg-background border-input text-muted-foreground hover:bg-accent"
                        }`}
                        onClick={() => setSelectedIncomeCategories(new Set())}
                      >Todas</button>
                      {allIncomeData.map((entry) => {
                        const active = selectedIncomeCategories.has(entry.name);
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
                          >{entry.name}</button>
                        );
                      })}
                    </div>
                    <div className="overflow-auto max-h-[400px]">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-background">
                          <tr className="border-b">
                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Descrição Resumida</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">Valor Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allIncomeData
                            .filter((e) => selectedIncomeCategories.size === 0 || selectedIncomeCategories.has(e.name))
                            .map((entry) => (
                            <tr key={entry.name} className="border-b last:border-0 hover:bg-muted/50">
                              <td className="py-1.5 px-2">{entry.name}</td>
                              <td className="py-1.5 px-2 text-right text-green-600 font-medium tabular-nums">
                                {formatCurrency(entry.value)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 font-bold">
                            <td className="py-2 px-2">Total{selectedIncomeCategories.size > 0 ? " filtrado" : " geral"}</td>
                            <td className="py-2 px-2 text-right text-green-600 tabular-nums">
                              {formatCurrency(
                                allIncomeData
                                  .filter((e) => selectedIncomeCategories.size === 0 || selectedIncomeCategories.has(e.name))
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

          {/* Tabela Completa de Transações */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-2 mb-2 flex items-center justify-between">
              <div>
                    <CardTitle className="text-slate-800 text-lg font-semibold">Transações</CardTitle>
                      <CardDescription className="text-slate-500">Lista completa de transações no período selecionado ({filteredTransactions.length} registros)</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-2 py-1 rounded-md text-sm text-slate-600 hover:bg-slate-100"
                  onClick={() => setTransactionsCollapsed((v) => !v)}
                  aria-expanded={!transactionsCollapsed}
                >
                  {transactionsCollapsed ? (
                    <span className="inline-flex items-center gap-1">Expandir <ChevronDown className="h-4 w-4 rotate-180" /></span>
                  ) : (
                    <span className="inline-flex items-center gap-1">Recolher <ChevronDown className="h-4 w-4" /></span>
                  )}
                </button>
                {/* Export button removed per request */}
              </div>
            </CardHeader>
            {!transactionsCollapsed && (
              <CardContent>
                <TransactionTable
                  transactions={filteredTransactions}
                  loading={loading}
                  error={null}
                  showBankColumn={selectedBankId === "ALL"}
                  showActions={true}
                />
              </CardContent>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
