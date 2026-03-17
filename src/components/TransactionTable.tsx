import { useMemo, useState, useRef, useEffect } from "react";
import type { Transaction } from "@/types/transaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, ChevronLeft, ChevronRight, Search, X, Edit, ChevronUp, ChevronDown, ArrowUpDown, Copy, Trash as TrashIcon, FileText } from "lucide-react";
import { useTransactionStore } from "@/stores/transactionStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import useI18nStore from "@/stores/i18nStore";

interface TransactionTableProps {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  showBankColumn?: boolean;
  showActions?: boolean;
}

const PAGE_SIZES = [10, 25, 50, 100];

export function TransactionTable({
  transactions,
  loading,
  error,
  showBankColumn = false,
  showActions = false,
}: TransactionTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortKey, setSortKey] = useState<string | null>("transactionDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const navigate = useNavigate();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedAll, setExpandedAll] = useState(false);
  const t = useI18nStore((s) => s.t);
  const deleteTransaction = useTransactionStore((s) => (s as any).deleteTransaction as (id: string) => Promise<boolean>);
  const [tooltipOpenId, setTooltipOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [candidateDeleteId, setCandidateDeleteId] = useState<string | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!tooltipOpenId) return;
      const target = e.target as Node | null;
      if (tooltipRef.current && target && tooltipRef.current.contains(target)) {
        return; // click inside tooltip -> ignore
      }
      setTooltipOpenId(null);
    }

    if (tooltipOpenId) {
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }
  }, [tooltipOpenId]);

  // Available types from data
  const types = useMemo(() => {
    const set = new Set(transactions.map((t) => t.type).filter(Boolean));
    return Array.from(set).sort();
  }, [transactions]);

  // Filtered data
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        !searchTerm ||
        tx.summaryDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.originalDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.tickerB3?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "ALL" || tx.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [transactions, searchTerm, typeFilter]);

  // Sorted data
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av: any = (a as any)[sortKey as any];
      const bv: any = (b as any)[sortKey as any];
      if (av == null) return sortDir === "asc" ? -1 : 1;
      if (bv == null) return sortDir === "asc" ? 1 : -1;
      if (sortKey === "transactionDate") {
        const ad = new Date(String(av));
        const bd = new Date(String(bv));
        return sortDir === "asc" ? ad.getTime() - bd.getTime() : bd.getTime() - ad.getTime();
      }
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      const as = String(av).toLowerCase();
      const bs = String(bv).toLowerCase();
      if (as < bs) return sortDir === "asc" ? -1 : 1;
      if (as > bs) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  // Reset page when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(0);
  };
  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    setPage(0);
  };
  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setPage(0);
  };

  const toggleRowById = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (expandedAll) {
      setExpandedRows(new Set());
      setExpandedAll(false);
    } else {
      setExpandedRows(new Set(transactions.map((tx) => tx.id)));
      setExpandedAll(true);
    }
  };

  // Export to CSV
  const exportCsv = () => {
    const headers = [
      "Data",
      "Descrição Original",
      "Tipo",
      "Ticker",
      "Valor",
      "Tipo",
      ...(showBankColumn ? ["Banco"] : []),
    ];
    const rows = sorted.map((tx) => [
      tx.transactionDate,
      `"${tx.summaryDescription ?? ""}"`,
      tx.tickerB3 ?? "",
      tx.amount.toFixed(2).replace(".", ","),
      tx.type ?? "",
      ...(showBankColumn ? [tx.bankName ?? ""] : []),
    ]);
    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transacoes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Totals
  const totalAmount = filtered.reduce((sum, tx) => sum + tx.amount, 0);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  };


  if (loading) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        {t('transactions.loading', 'Carregando transações...')}
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive py-8 text-center">{error}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('transactions.search.placeholder', 'Buscar por descrição, resumo ou ticker...')}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
              onClick={() => handleSearchChange("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <Select value={typeFilter} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os tipos</SelectItem>
            {types.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          {t('transactions.exportCsv', 'Exportar CSV')}
        </Button>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{filtered.length} transação(ões)</span>
        <span className="font-medium">
          Total:{" "}
          <span className={totalAmount >= 0 ? "text-green-600" : "text-red-600"}>
            {totalAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </span>
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-muted-foreground py-8 text-center">
          {t('transactions.noneFound', 'Nenhuma transação encontrada')}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                    <TableHead className="w-8 text-center">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleAll} aria-label="Expandir/Encolher tudo">
                        <ChevronDown className={`h-4 w-4 transition-transform ${expandedRows.size === paged.length ? "rotate-180" : ""}`} />
                      </Button>
                    </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("transactionDate")}>Data
                        {sortKey === "transactionDate" ? (sortDir === "asc" ? <ChevronUp className="inline ml-2 h-3 w-3" /> : <ChevronDown className="inline ml-2 h-3 w-3" />) : null}
                      </TableHead>
                    {showBankColumn && <TableHead>Banco</TableHead>}
                        {/* Removed 'Descrição Original' column per request */}
                        <TableHead className="cursor-pointer" onClick={() => handleSort("summaryDescription")}>Resumo
                        {sortKey === "summaryDescription" ? (
                          sortDir === "asc" ? <ChevronUp className="inline ml-2 h-3 w-3" /> : <ChevronDown className="inline ml-2 h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="inline ml-2 h-3 w-3 text-slate-300" />
                        )}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("tickerB3")}>
                        Ticker
                        {sortKey === "tickerB3" ? (
                          sortDir === "asc" ? <ChevronUp className="inline ml-2 h-3 w-3" /> : <ChevronDown className="inline ml-2 h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="inline ml-2 h-3 w-3 text-slate-300" />
                        )}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("type")}>
                        Tipo
                        {sortKey === "type" ? (
                          sortDir === "asc" ? <ChevronUp className="inline ml-2 h-3 w-3" /> : <ChevronDown className="inline ml-2 h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="inline ml-2 h-3 w-3 text-slate-300" />
                        )}
                      </TableHead>
                      <TableHead className="cursor-pointer text-right" onClick={() => handleSort("amount")}>
                        Valor
                        {sortKey === "amount" ? (
                          sortDir === "asc" ? <ChevronUp className="inline ml-2 h-3 w-3" /> : <ChevronDown className="inline ml-2 h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="inline ml-2 h-3 w-3 text-slate-300" />
                        )}
                      </TableHead>
                      {showActions && <TableHead>Ações</TableHead>}
                  </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((tx) => (
                <>
                <TableRow key={tx.id}>
                  <TableCell className="text-center w-8">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleRowById(tx.id)} aria-label="Expandir linha">
                      <ChevronDown className={`h-4 w-4 transition-transform ${expandedRows.has(tx.id) ? "rotate-180" : ""}`} />
                    </Button>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {new Date(tx.transactionDate + "T00:00:00").toLocaleDateString("pt-BR")}
                  </TableCell>
                  {showBankColumn && (
                    <TableCell>
                      <Badge variant="outline">{tx.bankName}</Badge>
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{tx.summaryDescription ?? "-"}</TableCell>
                  <TableCell>
                    {tx.tickerB3 ? (
                      <Badge variant="secondary">{tx.tickerB3}</Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={tx.type?.toLowerCase().includes("credit") ? "default" : "outline"}>
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono whitespace-nowrap ${
                      tx.amount >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {tx.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </TableCell>
                    {showActions && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/transactions/${tx.id}/edit`)}>
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setCandidateDeleteId(tx.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <TrashIcon className="h-4 w-4 text-red-600" />
                          </Button>

                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setTooltipOpenId((prev) => (prev === tx.id ? null : tx.id))}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>

                            {tooltipOpenId === tx.id && (
                              <div
                                ref={(el) => { tooltipRef.current = el; }}
                                data-tooltip-id={tx.id}
                                className="absolute right-0 z-50 mt-2 w-64 rounded-md border bg-white p-2 shadow"
                              >
                                <button
                                  aria-label="Fechar"
                                  onClick={() => setTooltipOpenId(null)}
                                  className="absolute top-1 right-1 p-1 text-slate-500 hover:text-slate-700"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="truncate text-sm">{tx.importFileName ?? tx.origin ?? '-'}</div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={async () => {
                                      const text = tx.importFileName ?? tx.origin ?? "";
                                      try {
                                        await navigator.clipboard.writeText(text);
                                        setCopiedId(tx.id);
                                        setTimeout(() => setCopiedId(null), 1500);
                                      } catch (e) {
                                        // ignore
                                      }
                                    }}
                                  >
                                    {copiedId === tx.id ? (
                                      <span className="text-xs text-green-600">Copiado</span>
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    )}
                </TableRow>
                {expandedRows.has(tx.id) && (
                  <TableRow key={`${tx.id}-expanded`} className="bg-muted/5">
                    <TableCell colSpan={
                      1 /* expand */ + 1 /* date */ + (showBankColumn ? 1 : 0) + 1 /* summary */ + 1 /* ticker */ + 1 /* type */ + 1 /* amount */ + (showActions ? 1 : 0)
                    }>
                      <div className="p-3 text-sm text-slate-700">
                        <div className="mb-2"><strong>Descrição original:</strong> {tx.originalDescription ?? "-"}</div>
                        <div className="mb-1"><strong>Resumo:</strong> {tx.summaryDescription ?? "-"}</div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <div><strong>Banco:</strong> {tx.bankName ?? "-"}</div>
                          <div><strong>Ticker:</strong> {tx.tickerB3 ?? "-"}</div>
                          <div><strong>Tipo:</strong> {tx.type ?? "-"}</div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Linhas por página:</span>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Página {page + 1} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete transaction dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar remoção</DialogTitle>
            <DialogDescription>Esta ação irá apagar permanentemente a transação selecionada. Deseja continuar?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!candidateDeleteId) return;
                  await deleteTransaction(candidateDeleteId);
                  setDeleteDialogOpen(false);
                  setCandidateDeleteId(null);
                }}
              >
                Deletar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
