import { useMemo, useState } from "react";
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
import { Download, ChevronLeft, ChevronRight, Search, X } from "lucide-react";

interface TransactionTableProps {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  showBankColumn?: boolean;
}

const PAGE_SIZES = [10, 25, 50, 100];

export function TransactionTable({
  transactions,
  loading,
  error,
  showBankColumn = false,
}: TransactionTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

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

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

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

  // Export to CSV
  const exportCsv = () => {
    const headers = [
      "Data",
      "Descrição Original",
      "Resumo",
      "Ticker",
      "Valor",
      "Tipo",
      ...(showBankColumn ? ["Banco"] : []),
    ];
    const rows = filtered.map((tx) => [
      tx.transactionDate,
      `"${tx.originalDescription ?? ""}"`,
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

  if (loading) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        Carregando transações...
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
            placeholder="Buscar por descrição, resumo ou ticker..."
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
          Exportar CSV
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
          Nenhuma transação encontrada
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                {showBankColumn && <TableHead>Banco</TableHead>}
                <TableHead>Descrição Original</TableHead>
                <TableHead>Resumo</TableHead>
                <TableHead>Ticker</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(tx.transactionDate + "T00:00:00").toLocaleDateString("pt-BR")}
                  </TableCell>
                  {showBankColumn && (
                    <TableCell>
                      <Badge variant="outline">{tx.bankName}</Badge>
                    </TableCell>
                  )}
                  <TableCell className="max-w-[250px] truncate" title={tx.originalDescription}>
                    {tx.originalDescription}
                  </TableCell>
                  <TableCell className="font-medium">{tx.summaryDescription ?? "-"}</TableCell>
                  <TableCell>
                    {tx.tickerB3 ? (
                      <Badge variant="secondary">{tx.tickerB3}</Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono whitespace-nowrap ${
                      tx.amount >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {tx.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={tx.type?.toLowerCase().includes("credit") ? "default" : "outline"}>
                      {tx.type}
                    </Badge>
                  </TableCell>
                </TableRow>
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
    </div>
  );
}
