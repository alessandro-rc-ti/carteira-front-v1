import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { transactionService } from "@/services/bankService";
import type {
  CsvAnalysisResponse,
  CsvImportResponse,
  ManualMapping,
} from "@/types/bank";
import { toast } from "sonner";
import {
  ArrowLeft,
  UploadCloud,
  FileSpreadsheet,
  ArrowRight,
  Check,
  AlertTriangle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

export function TransactionUploadPage() {
  const navigate = useNavigate();
  const { bankId } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<"upload" | "analysis" | "import-result">(
    "upload"
  );
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<CsvAnalysisResponse | null>(null);
  const [importResult, setImportResult] = useState<CsvImportResponse | null>(
    null
  );
  const [mappings, setMappings] = useState<ManualMapping[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setStep("upload");
      setAnalysis(null);
      setImportResult(null);
      setMappings([]);
    }
  };

  const handleAnalyze = async () => {
    if (!file || !bankId) return;
    setLoading(true);
    try {
      const result = await transactionService.analyzeCsv(bankId, file);
      setAnalysis(result);
      setMappings(
        result.unmappedDescriptions.map((u) => ({
          originalDescription: u.originalDescription,
          summary: "",
          extractTicker: false,
        }))
      );
      setStep("analysis");
      toast.success(
        `Análise completa: ${result.totalRows} linhas, ${result.autoMapped} mapeadas automaticamente`
      );
    } catch {
      toast.error("Falha ao analisar arquivo CSV");
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (index: number, field: "summary", value: string) => {
    setMappings((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const handleTickerToggle = (index: number, checked: boolean) => {
    setMappings((prev) =>
      prev.map((m, i) => (i === index ? { ...m, extractTicker: checked } : m))
    );
  };

  const handleImport = async () => {
    if (!file || !bankId) return;
    setLoading(true);
    try {
      const validMappings = mappings.filter((m) => m.summary.trim() !== "");
      const result = await transactionService.importCsv(
        bankId,
        file,
        validMappings.length > 0 ? validMappings : undefined
      );
      setImportResult(result);
      setStep("import-result");
      toast.success(
        `Importação concluída: ${result.imported} de ${result.totalRows} linhas importadas`
      );
    } catch {
      toast.error("Falha ao importar arquivo CSV");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setStep("upload");
    setAnalysis(null);
    setImportResult(null);
    setMappings([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Card className="w-full max-w-2xl shadow-lg border-slate-200">
        <CardHeader className="bg-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800 uppercase">
              <FileSpreadsheet className="h-5 w-5" />
              Importação CSV
            </CardTitle>
          </div>
          <CardDescription className="text-slate-500 mt-2">
            Envie um arquivo CSV de extrato para importar transações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 p-8">
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-sm mb-2">
            <Badge variant={step === "upload" ? "default" : "secondary"}>1. Envio</Badge>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <Badge variant={step === "analysis" ? "default" : "secondary"}>2. Análise e Mapeamento</Badge>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <Badge variant={step === "import-result" ? "default" : "secondary"}>3. Resultado</Badge>
          </div>
          <Separator />
          {/* Step 1: Upload */}
          {step === "upload" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="csv-file" className="font-medium text-slate-700">
                  Arquivo CSV
                </Label>
                <Input
                  id="csv-file"
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="bg-white border-slate-200"
                />
              </div>
              {file && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    Selecionado: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                  <Button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? "Analisando..." : (
                      <>
                        <UploadCloud className="mr-2 h-4 w-4" />Analisar CSV
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
          {/* Step 2: Analysis + Manual Mapping */}
          {step === "analysis" && analysis && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-slate-50 border-none">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{analysis.totalRows}</div>
                    <p className="text-sm text-muted-foreground">Total de Linhas</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50 border-none">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-green-600">
                      {analysis.autoMapped}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Mapeadas Automaticamente
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50 border-none">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-amber-600">
                      {analysis.unmappedDescriptions.length}
                    </div>
                    <p className="text-sm text-muted-foreground">Não Mapeadas</p>
                  </CardContent>
                </Card>
              </div>
              {analysis.unmappedDescriptions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700">
                    Mapeamentos Manuais (opcional)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Informe um resumo para as descrições não mapeadas. O sistema criará automaticamente uma regra de mapeamento.
                    Deixe em branco para ignorar.
                  </p>
                  <div className="max-h-80 overflow-auto rounded-md border border-slate-200 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Descrição Original</TableHead>
                          <TableHead className="w-20 text-center">Qtd</TableHead>
                          <TableHead>Descrição Resumida</TableHead>
                          <TableHead className="w-20 text-center">Ticker</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analysis.unmappedDescriptions.map((desc, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-xs">
                              {desc.originalDescription}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{desc.occurrences}</Badge>
                            </TableCell>
                            <TableCell>
                              <Input
                                placeholder="Digite o resumo..."
                                value={mappings[idx]?.summary ?? ""}
                                onChange={(e) => handleMappingChange(idx, "summary", e.target.value)}
                                className="h-8 text-sm bg-slate-50 border-slate-200"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Switch
                                checked={mappings[idx]?.extractTicker ?? false}
                                onCheckedChange={(checked) =>
                                  handleTickerToggle(idx, checked)
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="border-slate-300"
                >
                  Recomeçar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? "Importando..." : (
                    <>
                      <Check className="mr-2 h-4 w-4" />Importar Transações
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          {/* Step 3: Import Result */}
          {step === "import-result" && importResult && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-slate-50 border-none">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{importResult.totalRows}</div>
                    <p className="text-sm text-muted-foreground">Total de Linhas</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50 border-none">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-green-600">
                      {importResult.imported}
                    </div>
                    <p className="text-sm text-muted-foreground">Importadas</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50 border-none">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-muted-foreground">
                      {importResult.ignored}
                    </div>
                    <p className="text-sm text-muted-foreground">Ignoradas</p>
                  </CardContent>
                </Card>
              </div>
              {importResult.warnings.length > 0 && (
                <div className="space-y-2">
                  <h3 className="flex items-center gap-2 text-sm font-medium text-amber-600">
                    <AlertTriangle className="h-4 w-4" />Avisos ({importResult.warnings.length})
                  </h3>
                  <div className="max-h-40 overflow-auto rounded-md border border-slate-200 bg-white p-3">
                    {importResult.warnings.map((w, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        {w}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {importResult.unmatchedDescriptions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-amber-600">
                    Descrições Não Mapeadas ({importResult.unmatchedDescriptions.length})
                  </h3>
                  <div className="max-h-40 overflow-auto rounded-md border border-slate-200 bg-white p-3">
                    {importResult.unmatchedDescriptions.map((d, i) => (
                      <p key={i} className="font-mono text-xs text-muted-foreground">
                        {d}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              <Button
                onClick={handleReset}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Importar Outro Arquivo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
