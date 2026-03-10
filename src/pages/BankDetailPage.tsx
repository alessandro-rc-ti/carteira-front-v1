import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBankStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { CsvImportSection } from "@/components/CsvImportSection";
import { TransactionTable } from "@/components/TransactionTable";
import { ArrowLeft, Pencil } from "lucide-react";
import { useTransactionStore } from "@/stores/transactionStore";

export function BankDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedBank, loading, fetchBankById, clearSelectedBank } =
    useBankStore();
  const { transactions, loading: loadingTx, error, fetchByBank } = useTransactionStore();

  useEffect(() => {
    if (id) {
      fetchBankById(id);
      fetchByBank(id);
    }
    return () => clearSelectedBank();
  }, [id, fetchBankById, clearSelectedBank, fetchByBank]);

  if (loading && !selectedBank) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Carregando detalhes do banco...
      </div>
    );
  }

  if (!selectedBank) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p>Banco não encontrado</p>
        <Button variant="link" onClick={() => navigate("/banks")}>
          Voltar para bancos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="hover:bg-slate-200" onClick={() => navigate("/banks")}>
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight uppercase">
              {selectedBank.bankName}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Criado em {new Date(selectedBank.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="shadow-sm border-slate-200"
          onClick={() => navigate(`/banks/${selectedBank.id}/edit`)}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      {/* Bank Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração</CardTitle>
          <CardDescription>Configurações de leitura CSV para este banco</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Formato de Data
              </p>
              <p className="font-mono text-sm">{selectedBank.dateFormatPattern}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Separador Decimal
              </p>
              <p className="font-mono text-sm">{selectedBank.decimalSeparator}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Delimitador CSV
              </p>
              <p className="font-mono text-sm">
                {selectedBank.csvDelimiter === ";" ? 'ponto e vírgula (;)' : selectedBank.csvDelimiter}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Tratamento Débito
              </p>
              <p className="text-sm">{selectedBank.debitValueSignHandling}</p>
            </div>
            {selectedBank.creditTypeIdentifier && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  ID Tipo Crédito
                </p>
                <p className="font-mono text-sm">
                  {selectedBank.creditTypeIdentifier}
                </p>
              </div>
            )}
            {selectedBank.debitTypeIdentifier && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  ID Tipo Débito
                </p>
                <p className="font-mono text-sm">
                  {selectedBank.debitTypeIdentifier}
                </p>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* Header Mapping */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Mapeamento de Cabeçalho CSV</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(selectedBank.csvHeaderMapping).map(
                ([key, value]) => (
                  <Badge key={key} variant="outline" className="font-mono text-xs">
                    {key} → {value}
                  </Badge>
                )
              )}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Description Summary Patterns */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              Padrões de Sumarização ({selectedBank.descriptionSummaryPatterns?.length ?? 0})
            </h3>
            {selectedBank.descriptionSummaryPatterns &&
            selectedBank.descriptionSummaryPatterns.length > 0 ? (
              <div className="max-h-64 overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Padrão</TableHead>
                      <TableHead>Estratégia Match</TableHead>
                      <TableHead>Estratégia Extração</TableHead>
                      <TableHead>Resumo Fixo</TableHead>
                      <TableHead>Ticker</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedBank.descriptionSummaryPatterns.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs">
                          {p.matchPattern}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {p.matchStrategy ?? "auto"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {p.extractStrategy ?? "auto"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {p.fixedSummary ?? "-"}
                        </TableCell>
                        <TableCell>
                          {p.extractTicker ? (
                            <Badge variant="default" className="text-xs">Sim</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">Não</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum padrão configurado
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* CSV Import Section */}
      <CsvImportSection bankId={selectedBank.id} />

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Importadas</CardTitle>
          <CardDescription>Lista de transações importadas deste banco</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionTable
            transactions={transactions}
            loading={loadingTx}
            error={error}
          />
        </CardContent>
      </Card>
    </div>
  );
}
