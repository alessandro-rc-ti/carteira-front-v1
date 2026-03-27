import { startTransition, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTransactionStore } from "@/stores/transactionStore";
import { useBankStore } from "@/stores";
import { useTransactionTypeStore } from "@/stores/transactionTypeStore";
import { bankDashboardService } from "@/services/bankDashboardService";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  ReferenceDot,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { TooltipContentProps, TooltipValueType } from "recharts";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Activity,
  PlusCircle,
  ChevronDown,
  Upload,
  FileText,
  SlidersHorizontal,
  RefreshCw,
} from "lucide-react";
import { PageHeader, KpiCard, DataTable } from "@/components/shared";
import type { BankDashboardInflationResponse, Transaction } from "@/types";
import {
  getTransactionFlowGroup,
  getTransactionTypeDisplayLabel,
  normalizeTransactionType,
  type TransactionFlowGroup,
} from "@/types/transaction";

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

type CategorySelection = "ALL" | Set<string>;

interface PeriodEntry {
  key: string;
  label: string;
  year: number;
  month: number;
}

interface MonthlySeries {
  key: string;
  name: string;
  color: string;
}

interface MonthlyChartPoint {
  periodKey: string;
  periodLabel: string;
  total: number;
  [key: string]: string | number;
}

interface TrendHighlight {
  rise?: {
    periodKey: string;
    periodLabel: string;
    delta: number;
    total: number;
  };
  drop?: {
    periodKey: string;
    periodLabel: string;
    delta: number;
    total: number;
  };
}

type ChartTooltipProps = TooltipContentProps<TooltipValueType, string | number>;

type FilterContext = "expense" | "income";

type TableTypeFilters = {
  expense: boolean;
  income: boolean;
  neutral: boolean;
};

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const MONTHS_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
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

function formatPercentage(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + "%";
}

function getSummaryDescription(transaction: Transaction) {
  return transaction.summaryDescription || transaction.originalDescription;
}

function getTransactionTypeFilterKey(transaction: Transaction) {
  return transaction.typeCode ?? normalizeTransactionType(transaction.type) ?? transaction.type;
}

function getPeriodKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function buildPeriods(
  transactions: Transaction[],
  selectedYear: string,
  selectedMonth: string
): PeriodEntry[] {
  if (selectedYear !== "ALL") {
    const year = Number(selectedYear);

    if (selectedMonth !== "ALL") {
      const month = Number(selectedMonth);
      return [
        {
          key: getPeriodKey(year, month),
          label: MONTHS_SHORT[month],
          year,
          month,
        },
      ];
    }

    return MONTHS_SHORT.map((label, month) => ({
      key: getPeriodKey(year, month),
      label,
      year,
      month,
    }));
  }

  const periods = new Map<string, PeriodEntry>();

  transactions.forEach((transaction) => {
    const year = getYear(transaction.transactionDate);
    const month = getMonth(transaction.transactionDate);

    if (selectedMonth !== "ALL" && month !== Number(selectedMonth)) {
      return;
    }

    const key = getPeriodKey(year, month);
    periods.set(key, {
      key,
      label:
        selectedMonth === "ALL"
          ? `${MONTHS_SHORT[month]}/${String(year).slice(-2)}`
          : String(year),
      year,
      month,
    });
  });

  return Array.from(periods.values()).sort((left, right) => {
    if (left.year !== right.year) {
      return left.year - right.year;
    }

    return left.month - right.month;
  });
}

function isCategorySelected(selection: CategorySelection, category: string) {
  return selection === "ALL" || selection.has(category);
}

function toggleCategorySelection(
  selection: CategorySelection,
  category: string
): CategorySelection {
  if (selection === "ALL") {
    return new Set([category]);
  }

  const next = new Set(selection);
  if (next.has(category)) {
    next.delete(category);
  } else {
    next.add(category);
  }

  return next;
}

function toggleAllSelection(selection: CategorySelection): CategorySelection {
  return selection === "ALL" ? new Set<string>() : "ALL";
}

function getSelectedSummary(
  selection: CategorySelection,
  totalCount: number,
  singularLabel: string,
  pluralLabel: string
) {
  if (selection === "ALL") {
    return `Todas as ${pluralLabel.toLowerCase()} (${totalCount})`;
  }

  if (selection.size === 0) {
    return `Nenhuma ${singularLabel.toLowerCase()} selecionada`;
  }

  return `${selection.size} ${selection.size === 1 ? singularLabel.toLowerCase() : pluralLabel.toLowerCase()} selecionada${selection.size === 1 ? "" : "s"}`;
}

function hasVisibleSelection(selection: CategorySelection) {
  return selection === "ALL" || selection.size > 0;
}

function getGroupSummaryLabel(
  label: string,
  selection: CategorySelection,
  totalCount: number
) {
  if (totalCount === 0) {
    return `${label}: sem dados`;
  }

  if (selection === "ALL") {
    return `${label}: todas`;
  }

  if (selection.size === 0) {
    return `${label}: nenhuma`;
  }

  return `${label}: ${selection.size}`;
}

function buildSelectionTooltip(
  label: string,
  selection: CategorySelection,
  categories: string[]
) {
  if (categories.length === 0) {
    return `${label}: sem opções no período`;
  }

  if (selection === "ALL") {
    return `${label}: todas as descrições`;
  }

  if (selection.size === 0) {
    return `${label}: nenhuma descrição selecionada`;
  }

  const selected = categories.filter((category) => selection.has(category));
  const preview = selected.slice(0, 4).join(", ");
  const suffix = selected.length > 4 ? ` +${selected.length - 4}` : "";

  return `${label}: ${preview}${suffix}`;
}

function buildMonthlyChartModel(
  transactions: Transaction[],
  flowGroup: Exclude<TransactionFlowGroup, "neutral">,
  selection: CategorySelection,
  selectedYear: string,
  selectedMonth: string
) {
  const relevantTransactions = transactions.filter(
    (transaction) => getTransactionFlowGroup(transaction.type) === flowGroup
  );

  const totalsByCategory = new Map<string, number>();
  relevantTransactions.forEach((transaction) => {
    const category = getSummaryDescription(transaction);
    totalsByCategory.set(
      category,
      (totalsByCategory.get(category) ?? 0) + Math.abs(transaction.amount)
    );
  });

  const categories = Array.from(totalsByCategory.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([name]) => name);

  const selectedCategories =
    selection === "ALL"
      ? categories
      : categories.filter((category) => selection.has(category));

  const periods = buildPeriods(relevantTransactions, selectedYear, selectedMonth);
  const series: MonthlySeries[] = selectedCategories.map((name, index) => ({
    key: `series_${index}`,
    name,
    color: COLORS[index % COLORS.length],
  }));

  const keyByCategory = new Map(series.map((item) => [item.name, item.key]));
  const points = periods.map<MonthlyChartPoint>((period) => {
    const basePoint: MonthlyChartPoint = {
      periodKey: period.key,
      periodLabel: period.label,
      total: 0,
    };

    series.forEach((item) => {
      basePoint[item.key] = 0;
    });

    return basePoint;
  });

  const pointByKey = new Map(points.map((point) => [point.periodKey, point]));

  relevantTransactions.forEach((transaction) => {
    const category = getSummaryDescription(transaction);
    const seriesKey = keyByCategory.get(category);

    if (!seriesKey) {
      return;
    }

    const year = getYear(transaction.transactionDate);
    const month = getMonth(transaction.transactionDate);
    const point = pointByKey.get(getPeriodKey(year, month));

    if (!point) {
      return;
    }

    const amount = Math.abs(transaction.amount);
    point[seriesKey] = Number(point[seriesKey] ?? 0) + amount;
    point.total = Number(point.total) + amount;
  });

  return {
    categories,
    series,
    data: points,
  };
}

function getTrendHighlight(data: MonthlyChartPoint[]): TrendHighlight {
  const comparableData = data.filter((point) => Number(point.total) > 0);

  if (comparableData.length < 2) {
    return {};
  }

  let biggestRise: TrendHighlight["rise"];
  let biggestDrop: TrendHighlight["drop"];

  for (let index = 1; index < comparableData.length; index += 1) {
    const current = comparableData[index];
    const previous = comparableData[index - 1];
    const delta = Number(current.total) - Number(previous.total);

    if (delta > 0 && (!biggestRise || delta > biggestRise.delta)) {
      biggestRise = {
        periodKey: current.periodKey,
        periodLabel: current.periodLabel,
        delta,
        total: Number(current.total),
      };
    }

    if (delta < 0 && (!biggestDrop || delta < biggestDrop.delta)) {
      biggestDrop = {
        periodKey: current.periodKey,
        periodLabel: current.periodLabel,
        delta,
        total: Number(current.total),
      };
    }
  }

  return {
    rise: biggestRise,
    drop: biggestDrop,
  };
}

export function BanksDashboardPage() {
  const transactionTypes = useTransactionTypeStore((state) => state.items);
  const fetchTransactionTypes = useTransactionTypeStore((state) => state.fetchAll);
  const { transactions, loading, fetchAll, fetchByBank } =
    useTransactionStore();
  const { banks, fetchBanks } = useBankStore();
  const now = useMemo(() => new Date(), []);
  const [inflationDashboard, setInflationDashboard] =
    useState<BankDashboardInflationResponse | null>(null);
  const [inflationLoading, setInflationLoading] = useState(false);
  const [inflationError, setInflationError] = useState<string | null>(null);

  const [selectedBankId, setSelectedBankId] = useState<string>("ALL");
    useEffect(() => {
      void fetchTransactionTypes();
    }, [fetchTransactionTypes]);

  const [selectedYear, setSelectedYear] = useState<string>(
    String(now.getFullYear())
  );
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [selectedTransactionTypeCode, setSelectedTransactionTypeCode] = useState<string>("ALL");
  const [selectedExpenseCategories, setSelectedExpenseCategories] = useState<CategorySelection>("ALL");
  const [selectedIncomeCategories, setSelectedIncomeCategories] = useState<CategorySelection>("ALL");
  const [tableTypeFilters, setTableTypeFilters] = useState<TableTypeFilters>({
    expense: true,
    income: true,
    neutral: true,
  });
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [activeFilterContext, setActiveFilterContext] =
    useState<FilterContext>("expense");
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

  useEffect(() => {
    let active = true;

    startTransition(() => {
      setInflationLoading(true);
      setInflationError(null);
    });

    bankDashboardService
      .getInflationDashboard(selectedYear, selectedMonth)
      .then((response) => {
        if (!active) {
          return;
        }
        setInflationDashboard(response);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        setInflationError(
          error instanceof Error
            ? error.message
            : "Falha ao carregar indicadores de inflação"
        );
        setInflationDashboard(null);
      })
      .finally(() => {
        if (active) {
          setInflationLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedYear, selectedMonth]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    transactions.forEach((t) => years.add(getYear(t.transactionDate)));
    years.add(now.getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, now]);

  const periodTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const y = getYear(t.transactionDate);
      const m = getMonth(t.transactionDate);
      const yearOk = selectedYear === "ALL" || String(y) === selectedYear;
      const monthOk = selectedMonth === "ALL" || String(m) === selectedMonth;
      return yearOk && monthOk;
    });
  }, [transactions, selectedYear, selectedMonth]);

  const availableTransactionTypes = useMemo(() => {
    const options = new Map<string, { code: string; label: string; count: number }>();

    periodTransactions.forEach((transaction) => {
      const code = getTransactionTypeFilterKey(transaction);
      if (!code) {
        return;
      }

      const current = options.get(code);
      if (current) {
        current.count += 1;
        return;
      }

      options.set(code, {
        code,
        label: getTransactionTypeDisplayLabel(transactionTypes, transaction.typeCode, transaction.type),
        count: 1,
      });
    });

    return Array.from(options.values()).sort((left, right) => left.label.localeCompare(right.label, "pt-BR"));
  }, [periodTransactions, transactionTypes]);

  useEffect(() => {
    if (selectedTransactionTypeCode === "ALL") {
      return;
    }

    const stillAvailable = availableTransactionTypes.some((option) => option.code === selectedTransactionTypeCode);
    if (!stillAvailable) {
      setSelectedTransactionTypeCode("ALL");
    }
  }, [availableTransactionTypes, selectedTransactionTypeCode]);

  const filteredTransactions = useMemo(() => {
    if (selectedTransactionTypeCode === "ALL") {
      return periodTransactions;
    }

    return periodTransactions.filter(
      (transaction) => getTransactionTypeFilterKey(transaction) === selectedTransactionTypeCode
    );
  }, [periodTransactions, selectedTransactionTypeCode]);

  const selectedTransactionTypeLabel = useMemo(() => {
    if (selectedTransactionTypeCode === "ALL") {
      return "Todos os tipos";
    }

    return availableTransactionTypes.find((option) => option.code === selectedTransactionTypeCode)?.label
      ?? selectedTransactionTypeCode;
  }, [availableTransactionTypes, selectedTransactionTypeCode]);

  const {
    allExpenseData,
    allIncomeData,
    totalExpense,
    totalIncome,
  } = useMemo(() => {
    const expenseMap = new Map<string, number>();
    const incomeMap = new Map<string, number>();

    filteredTransactions.forEach((t) => {
      const key = getSummaryDescription(t);
      const val = Math.abs(t.amount);
      if (getTransactionFlowGroup(t.type) === "expense") {
        expenseMap.set(key, (expenseMap.get(key) ?? 0) + val);
      } else if (getTransactionFlowGroup(t.type) === "income") {
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
      allExpenseData: allExp,
      allIncomeData: allInc,
      totalExpense: allExp.reduce((s, e) => s + e.value, 0),
      totalIncome: allInc.reduce((s, e) => s + e.value, 0),
    };
  }, [filteredTransactions]);

  useEffect(() => {
    if (selectedExpenseCategories === "ALL") {
      return;
    }

    const availableCategories = new Set(allExpenseData.map((entry) => entry.name));
    const nextSelection = new Set(
      Array.from(selectedExpenseCategories).filter((name) =>
        availableCategories.has(name)
      )
    );

    if (nextSelection.size !== selectedExpenseCategories.size) {
      startTransition(() => {
        setSelectedExpenseCategories(nextSelection);
      });
    }
  }, [allExpenseData, selectedExpenseCategories]);

  useEffect(() => {
    if (selectedIncomeCategories === "ALL") {
      return;
    }

    const availableCategories = new Set(allIncomeData.map((entry) => entry.name));
    const nextSelection = new Set(
      Array.from(selectedIncomeCategories).filter((name) =>
        availableCategories.has(name)
      )
    );

    if (nextSelection.size !== selectedIncomeCategories.size) {
      startTransition(() => {
        setSelectedIncomeCategories(nextSelection);
      });
    }
  }, [allIncomeData, selectedIncomeCategories]);

  const expenseChartModel = useMemo(
    () =>
      buildMonthlyChartModel(
        filteredTransactions,
        "expense",
        selectedExpenseCategories,
        selectedYear,
        selectedMonth
      ),
    [filteredTransactions, selectedExpenseCategories, selectedYear, selectedMonth]
  );

  const incomeChartModel = useMemo(
    () =>
      buildMonthlyChartModel(
        filteredTransactions,
        "income",
        selectedIncomeCategories,
        selectedYear,
        selectedMonth
      ),
    [filteredTransactions, selectedIncomeCategories, selectedYear, selectedMonth]
  );

  const expenseTrend = useMemo(
    () => getTrendHighlight(expenseChartModel.data),
    [expenseChartModel.data]
  );

  const incomeTrend = useMemo(
    () => getTrendHighlight(incomeChartModel.data),
    [incomeChartModel.data]
  );

  const selectedBankLabel = useMemo(() => {
    if (selectedBankId === "ALL") {
      return "Todas as contas";
    }

    return banks.find((bank) => bank.id === selectedBankId)?.bankName ?? "Conta selecionada";
  }, [banks, selectedBankId]);

  const selectedPeriodLabel = useMemo(() => {
    if (selectedYear === "ALL" && selectedMonth === "ALL") {
      return "Todo o histórico";
    }

    if (selectedYear !== "ALL" && selectedMonth === "ALL") {
      return `Ano ${selectedYear}`;
    }

    if (selectedYear === "ALL") {
      return `${MONTHS[Number(selectedMonth)]} em todos os anos`;
    }

    return `${MONTHS[Number(selectedMonth)]} de ${selectedYear}`;
  }, [selectedMonth, selectedYear]);

  const neutralMetrics = useMemo(() => {
    return filteredTransactions.reduce(
      (accumulator, transaction) => {
        if (getTransactionFlowGroup(transaction.type) !== "neutral") {
          return accumulator;
        }

        accumulator.count += 1;
        accumulator.total += Math.abs(transaction.amount);
        return accumulator;
      },
      { count: 0, total: 0 }
    );
  }, [filteredTransactions]);

  const resetDashboardFilters = () => {
    setSelectedBankId("ALL");
    setSelectedYear(String(now.getFullYear()));
    setSelectedMonth("ALL");
    setSelectedTransactionTypeCode("ALL");
    setSelectedExpenseCategories("ALL");
    setSelectedIncomeCategories("ALL");
    setTableTypeFilters({ expense: true, income: true, neutral: true });
    setActiveFilterContext("expense");
  };

  const showExpenseSections = hasVisibleSelection(selectedExpenseCategories);
  const showIncomeSections = hasVisibleSelection(selectedIncomeCategories);
  const showDetailGrid = showExpenseSections || showIncomeSections;

  const isExpenseFilterActive = activeFilterContext === "expense";
  const activeFilterCategories = isExpenseFilterActive
    ? expenseChartModel.categories
    : incomeChartModel.categories;
  const activeFilterSelection = isExpenseFilterActive
    ? selectedExpenseCategories
    : selectedIncomeCategories;
  const activeFilterSummary = isExpenseFilterActive
    ? getSelectedSummary(
        selectedExpenseCategories,
        expenseChartModel.categories.length,
        "descrição",
        "descrições"
      )
    : getSelectedSummary(
        selectedIncomeCategories,
        incomeChartModel.categories.length,
        "descrição",
        "descrições"
      );
  const activeFilterEmptyMessage = isExpenseFilterActive
    ? "Nenhuma despesa encontrada no período atual."
    : "Nenhuma receita encontrada no período atual.";

  const updateActiveSelection = (
    updater: (current: CategorySelection) => CategorySelection
  ) => {
    if (isExpenseFilterActive) {
      setSelectedExpenseCategories((current) => updater(current));
      return;
    }

    setSelectedIncomeCategories((current) => updater(current));
  };

  const filterButtonSummary = [
    getGroupSummaryLabel(
      "Desp.",
      selectedExpenseCategories,
      expenseChartModel.categories.length
    ),
    getGroupSummaryLabel(
      "Rec.",
      selectedIncomeCategories,
      incomeChartModel.categories.length
    ),
  ].join(" • ");

  const filterButtonTooltip = [
    buildSelectionTooltip(
      "Despesas",
      selectedExpenseCategories,
      expenseChartModel.categories
    ),
    buildSelectionTooltip(
      "Receitas",
      selectedIncomeCategories,
      incomeChartModel.categories
    ),
  ].join("\n");

  const tableTransactions = useMemo(() => {
    return filteredTransactions.filter((transaction) => {
      const flowGroup = getTransactionFlowGroup(transaction.type);

      if (flowGroup === "expense") {
        if (!tableTypeFilters.expense) {
          return false;
        }

        return isCategorySelected(
          selectedExpenseCategories,
          getSummaryDescription(transaction)
        );
      }

      if (flowGroup === "income") {
        if (!tableTypeFilters.income) {
          return false;
        }

        return isCategorySelected(
          selectedIncomeCategories,
          getSummaryDescription(transaction)
        );
      }

      if (!tableTypeFilters.neutral) {
        return false;
      }

      return true;
    });
  }, [
    filteredTransactions,
    tableTypeFilters,
    selectedExpenseCategories,
    selectedIncomeCategories,
  ]);

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
        header: "Descrição",
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
              getTransactionFlowGroup(row.original.type) === "income"
                ? "text-emerald-600"
                : getTransactionFlowGroup(row.original.type) === "expense"
                  ? "text-red-600"
                  : "text-slate-600"
            }`}
          >
            {formatCurrency(Math.abs(row.original.amount))}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: "Tipo",
        cell: ({ row }) => {
          const flowGroup = getTransactionFlowGroup(row.original.type);
          return (
            <Badge
              variant={flowGroup === "income" ? "default" : flowGroup === "expense" ? "destructive" : "secondary"}
              className="text-xs"
            >
              {getTransactionTypeDisplayLabel(transactionTypes, row.original.typeCode, row.original.type)}
            </Badge>
          );
        },
      }
    );

    return cols;
  }, [selectedBankId, transactionTypes]);

  const renderMonthlyTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (!active || !payload?.length) return null;

    const totalEntry = payload.find((entry) => entry.dataKey === "total");
    const stackEntries = payload.filter(
      (entry) => entry.dataKey !== "total" && Number(entry.value) > 0
    );

    return (
      <div className="min-w-[220px] rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
        <p className="mb-2 font-semibold">{label}</p>
        <div className="space-y-1.5">
          {stackEntries.map(
            (entry) => (
              <div key={entry.name} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="truncate text-muted-foreground">
                    {entry.name}
                  </span>
                </div>
                <span className="font-medium text-foreground">
                  {formatCurrency(Number(entry.value))}
                </span>
              </div>
            )
          )}
        </div>
        <div className="mt-2 flex items-center justify-between border-t pt-2 font-semibold">
          <span>Total</span>
          <span>{formatCurrency(Number(totalEntry?.value ?? 0))}</span>
        </div>
      </div>
    );
  };

  const saldo = totalIncome - totalExpense;
  const inflationSummary = inflationDashboard?.summary;
  const inflationSeries = inflationDashboard?.monthlySeries ?? [];
  const hasInflationSeries = inflationSeries.length > 0;

  const renderInflationTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (!active || !payload?.length) return null;

    const official = payload.find((entry) => entry.dataKey === "officialInflationRate");
    const personal = payload.find((entry) => entry.dataKey === "personalInflationRate");
    const realGain = payload.find((entry) => entry.dataKey === "realGainOrLoss");

    return (
      <div className="min-w-[240px] rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
        <p className="mb-2 font-semibold">{label}</p>
        <div className="space-y-1.5">
          {official && official.value != null && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">IPCA oficial</span>
              <span className="font-medium">
                {formatPercentage(Number(official.value))}
              </span>
            </div>
          )}
          {personal && personal.value != null && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Inflação pessoal</span>
              <span className="font-medium">
                {formatPercentage(Number(personal.value))}
              </span>
            </div>
          )}
          {realGain && realGain.value != null && (
            <div className="flex items-center justify-between gap-3 border-t pt-2">
              <span className="text-muted-foreground">Ganho/Perda real</span>
              <span
                className={`font-medium ${
                  Number(realGain.value) >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {formatCurrency(Number(realGain.value))}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Dashboard da Conta"
        description="Análise de receitas e despesas por período"
      >
        <Badge variant="outline">{selectedBankLabel}</Badge>
        <Badge variant="outline">{selectedPeriodLabel}</Badge>
        <Badge variant="outline">{selectedTransactionTypeLabel}</Badge>
        <Badge variant="secondary">Inflação sempre consolidada</Badge>
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

          <Select value={selectedTransactionTypeCode} onValueChange={setSelectedTransactionTypeCode}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os tipos</SelectItem>
              {availableTransactionTypes.map((option) => (
                <SelectItem key={option.code} value={option.code}>
                  {option.label} ({option.count})
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
            Nova transação
          </Button>

          <Button variant="outline" onClick={resetDashboardFilters}>
            Limpar filtros
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          title="Fluxo de Caixa Líquido"
          value={formatCurrency(saldo)}
          icon={Wallet}
          iconClassName={
            saldo >= 0
              ? "bg-blue-50 text-blue-600"
              : "bg-red-50 text-red-600"
          }
          description={
            saldo >= 0 ? "Receitas menos despesas no período" : "Despesas acima das receitas no período"
          }
          tooltip="Fluxo de caixa líquido considera apenas receitas e despesas. Transferências, aportes, resgates e outros movimentos neutros não entram nessa conta."
        />
        <KpiCard
          title="Receitas"
          value={formatCurrency(totalIncome)}
          icon={ArrowUpCircle}
          iconClassName="bg-emerald-50 text-emerald-600"
          description="Entradas no período"
        />
        <KpiCard
          title="Despesas"
          value={formatCurrency(totalExpense)}
          icon={ArrowDownCircle}
          iconClassName="bg-red-50 text-red-600"
          description="Saídas no período"
        />
        <KpiCard
          title="Transações"
          value={String(filteredTransactions.length)}
          icon={Activity}
          iconClassName="bg-indigo-50 text-indigo-600"
          description="Registros no período"
        />
        <KpiCard
          title="Outros Movimentos"
          value={formatCurrency(neutralMetrics.total)}
          icon={FileText}
          iconClassName="bg-slate-100 text-slate-700"
          description={`${neutralMetrics.count} registros neutros no período`}
          tooltip="Movimentos neutros não alteram o fluxo de caixa líquido. Aqui entram, por exemplo, transferências internas, aportes, resgates, ajustes e demais movimentos sem efeito direto de receita/despesa."
        />
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardContent className="grid gap-4 p-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-foreground">Leitura do período</p>
            <p className="text-sm text-muted-foreground">
              O dashboard separa fluxo de caixa de movimentações neutras. O resultado principal do período vem de receitas e despesas.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Entra no fluxo</p>
              <p className="mt-1 text-sm text-emerald-800">Receitas e despesas impactam o saldo líquido do período.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Fica fora do fluxo</p>
              <p className="mt-1 text-sm text-slate-800">Transferências, aportes, resgates e ajustes ficam em outros movimentos.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          title="IPCA no Ano"
          value={
            inflationSummary?.officialInflationYearToDate != null
              ? formatPercentage(inflationSummary.officialInflationYearToDate)
              : "--"
          }
          icon={Activity}
          iconClassName="bg-amber-50 text-amber-600"
          description={
            inflationSummary?.referenceMonthLabel
              ? `Acumulado até ${inflationSummary.referenceMonthLabel}`
              : inflationLoading
                ? "Carregando IPCA oficial"
                : "Sem base oficial disponível"
          }
          tooltip={
            "IPCA acumulado no ano (oficial). Fórmula: ((∏ (1 + taxa_mes/100)) - 1) × 100 — acumula as taxas oficiais mensais desde jan até o mês de referência."
          }
        />
        <KpiCard
          title="IPCA 12 Meses"
          value={
            inflationSummary?.officialInflationLast12Months != null
              ? formatPercentage(inflationSummary.officialInflationLast12Months)
              : "--"
          }
          icon={RefreshCw}
          iconClassName="bg-orange-50 text-orange-600"
          description="Janela móvel dos últimos 12 meses fechados"
          tooltip={
            "IPCA acumulado nos últimos 12 meses. Fórmula: ((∏ (1 + taxa_mes/100) over 12 meses) - 1) × 100."
          }
        />
        <KpiCard
          title="Média Inflação Pessoal"
          value={
            inflationSummary?.averagePersonalInflation != null
              ? formatPercentage(inflationSummary.averagePersonalInflation)
              : "--"
          }
          icon={ArrowUpCircle}
          iconClassName="bg-rose-50 text-rose-600"
          description={`${inflationSummary?.closedMonthsCount ?? 0} meses fechados com movimento`}
          tooltip={
            "Média da inflação pessoal. Por mês: (Despesa_atual - Despesa_anterior) × 100 / Despesa_anterior. Resultado = média aritmética dos meses fechados."
          }
        />
        <KpiCard
          title="Média Ganho/Perda Real"
          value={
            inflationSummary?.averageRealGainOrLoss != null
              ? formatCurrency(inflationSummary.averageRealGainOrLoss)
              : "--"
          }
          icon={Wallet}
          iconClassName={
            (inflationSummary?.averageRealGainOrLoss ?? 0) >= 0
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-600"
          }
          description="Média dos meses fechados após reposição inflacionária"
          tooltip={
            "Média do ganho/perda real após reposição. Por mês: Ganho líquido - Reposição. Ganho líquido = Receita - Despesa. Reposição = Despesa_anterior × (IPCA_oficial/100). Média = média aritmética dos meses fechados."
          }
        />
        <KpiCard
          title="Média Reposição Inflacionária"
          value={
            inflationSummary?.averageInflationReplacement != null
              ? formatCurrency(inflationSummary.averageInflationReplacement)
              : "--"
          }
          icon={ArrowDownCircle}
          iconClassName="bg-sky-50 text-sky-600"
          description="Baseada na despesa do mês anterior"
          tooltip={
            "Média do valor de reposição inflacionária. Por mês: Reposição = Despesa_anterior × (IPCA_oficial/100). Média = média aritmética dos meses fechados."
          }
        />
      </div>

      {(inflationError || inflationDashboard?.statusMessage) && (
        <Card className="shadow-sm border-border/70">
          <CardContent className="flex flex-col gap-1 p-4 text-sm text-muted-foreground">
            {inflationError && <p>{inflationError}</p>}
            {!inflationError && inflationDashboard?.statusMessage && (
              <p>{inflationDashboard.statusMessage}</p>
            )}
            <p>Os indicadores inflacionários sempre consideram todas as contas, independentemente do banco selecionado.</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-muted-foreground py-12 text-center">
          Carregando dados...
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">
          Nenhuma transação encontrada. Importe um CSV para visualizar o
          dashboard.
        </div>
      ) : (
        <>
          <div className="sticky top-4 z-20 flex justify-start">
            <DropdownMenu open={filterMenuOpen} onOpenChange={setFilterMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-auto min-h-11 rounded-full border-border/70 bg-background/95 px-4 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80"
                  title={filterButtonTooltip}
                >
                  <span className="inline-flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="font-medium">Filtros</span>
                  </span>
                  <span className="ml-3 max-w-[220px] truncate text-xs text-muted-foreground">
                    {filterButtonSummary}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={10}
                className="w-[min(92vw,28rem)] rounded-2xl p-0"
              >
                <div className="border-b border-border/70 p-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                        isExpenseFilterActive
                          ? "border-red-300 bg-red-50 text-red-700"
                          : "border-border text-muted-foreground hover:bg-accent"
                      }`}
                      onClick={() => setActiveFilterContext("expense")}
                    >
                      Despesas
                    </button>
                    <button
                      type="button"
                      className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                        !isExpenseFilterActive
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-border text-muted-foreground hover:bg-accent"
                      }`}
                      onClick={() => setActiveFilterContext("income")}
                    >
                      Receitas
                    </button>
                  </div>
                </div>

                <div className="space-y-3 p-3">
                  <div>
                    <p className="text-sm font-medium">
                      {isExpenseFilterActive
                        ? "Descrições resumidas de despesas"
                        : "Descrições resumidas de receitas"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      O filtro escolhido aqui afeta detalhamento, mês a mês e lista de transações.
                    </p>
                  </div>

                  {activeFilterCategories.length === 0 ? (
                    <p className="rounded-xl border border-dashed px-3 py-4 text-sm text-muted-foreground">
                      {activeFilterEmptyMessage}
                    </p>
                  ) : (
                    <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          className={`px-2 py-1 rounded-md text-xs border transition-colors ${
                            activeFilterSelection === "ALL"
                              ? isExpenseFilterActive
                                ? "bg-red-100 border-red-400 text-red-700"
                                : "bg-green-100 border-green-400 text-green-700"
                              : "bg-background border-input text-muted-foreground hover:bg-accent"
                          }`}
                          onClick={() =>
                            updateActiveSelection((current) =>
                              toggleAllSelection(current)
                            )
                          }
                        >
                          Todas
                        </button>
                        {activeFilterCategories.map((category, index) => {
                          const active = isCategorySelected(
                            activeFilterSelection,
                            category
                          );

                          return (
                            <button
                              key={category}
                              type="button"
                              className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs transition-colors ${
                                active
                                  ? isExpenseFilterActive
                                    ? "bg-red-100 border-red-400 text-red-700"
                                    : "bg-green-100 border-green-400 text-green-700"
                                  : "bg-background border-input text-muted-foreground hover:bg-accent"
                              }`}
                              onClick={() =>
                                updateActiveSelection((current) =>
                                  toggleCategorySelection(current, category)
                                )
                              }
                            >
                              <span
                                className="h-2.5 w-2.5 rounded-sm"
                                style={{
                                  backgroundColor: COLORS[index % COLORS.length],
                                }}
                              />
                              <span className="max-w-[210px] truncate" title={category}>
                                {category}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {activeFilterSummary}
                      </p>
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {showDetailGrid && (
            <div
              className={`grid grid-cols-1 gap-6 ${
                showExpenseSections && showIncomeSections ? "lg:grid-cols-2" : ""
              }`}
            >
              {showExpenseSections && (
                <Card className="shadow-sm">
              <CardHeader className="border-b pb-4 mb-4">
                <CardTitle className="text-red-600 text-lg font-semibold">
                  Detalhamento de Despesas
                </CardTitle>
                <CardDescription>
                  Resumo do filtro ativo no botão de filtros para despesas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allExpenseData.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">
                    Nenhuma despesa
                  </p>
                ) : (
                  <div className="overflow-auto max-h-[400px]">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-background">
                        <tr className="border-b">
                          <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                            Descrição resumida
                          </th>
                          <th className="text-right py-2 px-2 font-medium text-muted-foreground">
                            Valor total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {allExpenseData
                          .filter((entry) =>
                            isCategorySelected(selectedExpenseCategories, entry.name)
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
                            {selectedExpenseCategories !== "ALL"
                              ? " filtrado"
                              : " geral"}
                          </td>
                          <td className="py-2 px-2 text-right text-red-600 tabular-nums">
                            {formatCurrency(
                              allExpenseData
                                .filter((entry) =>
                                  isCategorySelected(selectedExpenseCategories, entry.name)
                                )
                                .reduce((sum, entry) => sum + entry.value, 0)
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </CardContent>
                </Card>
              )}

              {showIncomeSections && (
                <Card className="shadow-sm">
              <CardHeader className="border-b pb-4 mb-4">
                <CardTitle className="text-green-600 text-lg font-semibold">
                  Detalhamento de Receitas
                </CardTitle>
                <CardDescription>
                  Resumo do filtro ativo no botão de filtros para receitas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allIncomeData.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">
                    Nenhuma receita
                  </p>
                ) : (
                  <div className="overflow-auto max-h-[400px]">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-background">
                        <tr className="border-b">
                          <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                            Descrição resumida
                          </th>
                          <th className="text-right py-2 px-2 font-medium text-muted-foreground">
                            Valor total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {allIncomeData
                          .filter((entry) =>
                            isCategorySelected(selectedIncomeCategories, entry.name)
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
                            {selectedIncomeCategories !== "ALL"
                              ? " filtrado"
                              : " geral"}
                          </td>
                          <td className="py-2 px-2 text-right text-green-600 tabular-nums">
                            {formatCurrency(
                              allIncomeData
                                .filter((entry) =>
                                  isCategorySelected(selectedIncomeCategories, entry.name)
                                )
                                .reduce((sum, entry) => sum + entry.value, 0)
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </CardContent>
                </Card>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="border-b pb-4 mb-4">
                <CardTitle className="text-slate-700 font-semibold text-lg">
                  Inflação oficial, inflação pessoal e ganho real
                </CardTitle>
                <CardDescription>
                  Série dos meses fechados com transações, consolidando todas as contas para os indicadores inflacionários.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {inflationLoading ? (
                  <p className="text-muted-foreground text-center py-8">
                    Carregando série inflacionária...
                  </p>
                ) : !inflationDashboard?.inflationDataAvailable ? (
                  <p className="text-muted-foreground text-center py-8">
                    Dados oficiais de inflação ainda não estão disponíveis em memória.
                  </p>
                ) : !hasInflationSeries ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum mês fechado com transação foi encontrado para o filtro atual.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={360}>
                    <ComposedChart
                      data={inflationSeries}
                      margin={{ left: 10, right: 16, top: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="periodLabel" tick={{ fontSize: 12 }} />
                      <YAxis
                        yAxisId="percent"
                        tickFormatter={(value: number) => `${value.toFixed(1)}%`}
                        tick={{ fontSize: 11 }}
                        width={72}
                      />
                      <YAxis
                        yAxisId="currency"
                        orientation="right"
                        tickFormatter={(value: number) => formatCurrency(value)}
                        tick={{ fontSize: 11 }}
                        width={96}
                      />
                      <Tooltip content={renderInflationTooltip} />
                      <Bar
                        yAxisId="currency"
                        dataKey="realGainOrLoss"
                        name="Ganho/Perda real"
                        fill="#0f766e"
                        radius={[6, 6, 0, 0]}
                      />
                      <Line
                        yAxisId="percent"
                        type="monotone"
                        dataKey="officialInflationRate"
                        name="IPCA oficial"
                        stroke="#d97706"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#d97706" }}
                      />
                      <Line
                        yAxisId="percent"
                        type="monotone"
                        dataKey="personalInflationRate"
                        name="Inflação pessoal"
                        stroke="#dc2626"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#dc2626" }}
                        connectNulls={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {showExpenseSections && (
              <Card className="shadow-sm">
              <CardHeader className="border-b pb-4 mb-4">
                <CardTitle className="text-red-600 font-semibold text-lg">
                  Despesas mês a mês
                </CardTitle>
                <CardDescription>
                  Barras empilhadas por descrição resumida com linha de total por mês, seguindo o botão de filtros.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {expenseChartModel.categories.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma despesa encontrada
                  </p>
                ) : expenseChartModel.series.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Selecione ao menos uma descrição resumida para visualizar o gráfico.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={380}>
                    <ComposedChart
                      data={expenseChartModel.data}
                      margin={{ left: 10, right: 16, top: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="periodLabel" tick={{ fontSize: 12 }} />
                      <YAxis
                        tickFormatter={(value: number) => formatCurrency(value)}
                        tick={{ fontSize: 11 }}
                        width={90}
                      />
                      <Tooltip content={renderMonthlyTooltip} />
                      {expenseChartModel.series.map((series) => (
                        <Bar
                          key={series.key}
                          dataKey={series.key}
                          name={series.name}
                          stackId="expense"
                          fill={series.color}
                          radius={[0, 0, 0, 0]}
                        />
                      ))}
                      {expenseTrend.rise && (
                        <ReferenceDot
                          x={expenseTrend.rise.periodLabel}
                          y={expenseTrend.rise.total}
                          r={6}
                          fill="#166534"
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      )}
                      {expenseTrend.drop && (
                        <ReferenceDot
                          x={expenseTrend.drop.periodLabel}
                          y={expenseTrend.drop.total}
                          r={6}
                          fill="#b91c1c"
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="total"
                        name="Total"
                        stroke="#991b1b"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#991b1b" }}
                        activeDot={{ r: 5 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
                {(expenseTrend.rise || expenseTrend.drop) && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {expenseTrend.rise && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        <span className="font-semibold">Maior alta:</span>{" "}
                        {expenseTrend.rise.periodLabel} ({formatCurrency(expenseTrend.rise.delta)})
                      </div>
                    )}
                    {expenseTrend.drop && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        <span className="font-semibold">Maior queda:</span>{" "}
                        {expenseTrend.drop.periodLabel} ({formatCurrency(Math.abs(expenseTrend.drop.delta))})
                      </div>
                    )}
                  </div>
                )}
                <div className="grid gap-2 border-t pt-3 sm:grid-cols-2 xl:grid-cols-3">
                  {expenseChartModel.series.map((series) => {
                    const total = expenseChartModel.data.reduce(
                      (sum, point) => sum + Number(point[series.key] ?? 0),
                      0
                    );
                    return (
                      <div key={series.key} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-sm"
                            style={{ backgroundColor: series.color }}
                          />
                          <span className="truncate text-xs font-medium" title={series.name}>
                            {series.name}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(total)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              </Card>
            )}

            {showIncomeSections && (
              <Card className="shadow-sm">
              <CardHeader className="border-b pb-4 mb-4">
                <CardTitle className="text-green-600 font-semibold text-lg">
                  Receitas mês a mês
                </CardTitle>
                <CardDescription>
                  Barras empilhadas por descrição resumida com linha de total por mês, seguindo o botão de filtros.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {incomeChartModel.categories.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma receita encontrada
                  </p>
                ) : incomeChartModel.series.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Selecione ao menos uma descrição resumida para visualizar o gráfico.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={380}>
                    <ComposedChart
                      data={incomeChartModel.data}
                      margin={{ left: 10, right: 16, top: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="periodLabel" tick={{ fontSize: 12 }} />
                      <YAxis
                        tickFormatter={(value: number) => formatCurrency(value)}
                        tick={{ fontSize: 11 }}
                        width={90}
                      />
                      <Tooltip content={renderMonthlyTooltip} />
                      {incomeChartModel.series.map((series) => (
                        <Bar
                          key={series.key}
                          dataKey={series.key}
                          name={series.name}
                          stackId="income"
                          fill={series.color}
                          radius={[0, 0, 0, 0]}
                        />
                      ))}
                      {incomeTrend.rise && (
                        <ReferenceDot
                          x={incomeTrend.rise.periodLabel}
                          y={incomeTrend.rise.total}
                          r={6}
                          fill="#166534"
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      )}
                      {incomeTrend.drop && (
                        <ReferenceDot
                          x={incomeTrend.drop.periodLabel}
                          y={incomeTrend.drop.total}
                          r={6}
                          fill="#b91c1c"
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="total"
                        name="Total"
                        stroke="#166534"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#166534" }}
                        activeDot={{ r: 5 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
                {(incomeTrend.rise || incomeTrend.drop) && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {incomeTrend.rise && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        <span className="font-semibold">Maior alta:</span>{" "}
                        {incomeTrend.rise.periodLabel} ({formatCurrency(incomeTrend.rise.delta)})
                      </div>
                    )}
                    {incomeTrend.drop && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        <span className="font-semibold">Maior queda:</span>{" "}
                        {incomeTrend.drop.periodLabel} ({formatCurrency(Math.abs(incomeTrend.drop.delta))})
                      </div>
                    )}
                  </div>
                )}
                <div className="grid gap-2 border-t pt-3 sm:grid-cols-2 xl:grid-cols-3">
                  {incomeChartModel.series.map((series) => {
                    const total = incomeChartModel.data.reduce(
                      (sum, point) => sum + Number(point[series.key] ?? 0),
                      0
                    );
                    return (
                      <div key={series.key} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-sm"
                            style={{ backgroundColor: series.color }}
                          />
                          <span className="truncate text-xs font-medium" title={series.name}>
                            {series.name}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(total)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              </Card>
            )}
          </div>

          <Card className="shadow-sm">
            <CardHeader className="border-b pb-2 mb-2">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold">
                    Lista de transações
                  </CardTitle>
                  <CardDescription>
                    A lista reflete o botão de filtros, o tipo selecionado e os grupos marcados abaixo ({tableTransactions.length} registros).
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={tableTypeFilters.expense}
                      onChange={(event) =>
                        setTableTypeFilters((current) => ({
                          ...current,
                          expense: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-input"
                    />
                    Despesas
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={tableTypeFilters.income}
                      onChange={(event) =>
                        setTableTypeFilters((current) => ({
                          ...current,
                          income: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-input"
                    />
                    Receitas
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={tableTypeFilters.neutral}
                      onChange={(event) =>
                        setTableTypeFilters((current) => ({
                          ...current,
                          neutral: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-input"
                    />
                    Outros movimentos
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-end">
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
                  data={tableTransactions}
                  loading={loading}
                  globalFilterPlaceholder="Buscar transações..."
                  emptyMessage="Nenhuma transação encontrada com os filtros selecionados"
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
            <DialogTitle>Adicionar transação</DialogTitle>
            <DialogDescription>
              Escolha como deseja cadastrar a transação.
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
              Para adicionar uma nova transação, é necessário selecionar um
              banco específico no filtro acima. O botão{" "}
              <strong>Nova transação</strong> só será habilitado após a
              seleção.
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
