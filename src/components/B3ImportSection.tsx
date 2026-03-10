import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { investmentService } from "@/services";
import type {
  B3AnalysisResponse,
  B3ImportResponse,
  InstitutionMapping,
} from "@/types";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  ArrowRight,
  Search,
} from "lucide-react";

interface B3ImportSectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

type ImportStep = "upload" | "analysis" | "import-result";

export function B3ImportSection({
  open,
  onOpenChange,
  onImportComplete,
}: B3ImportSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<ImportStep>("upload");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<B3AnalysisResponse | null>(null);
  const [importResult, setImportResult] = useState<B3ImportResponse | null>(null);
  const [mappings, setMappings] = useState<InstitutionMapping[]>([]);



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

  // ── Step 1 → 2: Analyze ──────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const result = await investmentService.analyzeB3(file);
      setAnalysis(result);
      setMappings(
        result.unmappedInstitutions.map((u) => ({
          rawInstitution: u.rawInstitution,
          normalizedName: "",
        }))
      );
      setStep("analysis");
      toast.success(
        `Análise completa: ${result.totalRows} linhas, ${result.autoMappedInstitutions} instituições mapeadas`
      );
    } catch {
      toast.error("Falha ao analisar arquivo CSV da B3");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 → 3: Import ───────────────────────────────────────────────
  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const validMappings = mappings.filter(
        (m) => m.normalizedName.trim() !== ""
      );
      const result = await investmentService.importB3(
        file,
        validMappings.length > 0 ? validMappings : undefined
      );
      setImportResult(result);
      setStep("import-result");
      toast.success(
        `Importação concluída: ${result.imported} de ${result.totalRows} investimentos importados`
      );
      onImportComplete();
    } catch {
      toast.error("Falha ao importar arquivo CSV da B3");
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (index: number, value: string) => {
    setMappings((prev) =>
      prev.map((m, i) => (i === index ? { ...m, normalizedName: value } : m))
    );
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

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };



  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar CSV da B3
          </DialogTitle>
          <DialogDescription>
            Envie o arquivo CSV exportado do portal B3 (CEI) para importar seus investimentos.
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm">
          <Badge variant={step === "upload" ? "default" : "secondary"}>1. Envio</Badge>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <Badge variant={step === "analysis" ? "default" : "secondary"}>2. Análise</Badge>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <Badge variant={step === "import-result" ? "default" : "secondary"}>3. Resultado</Badge>
        </div>

        <Separator />

        <div className="space-y-4">
          {/* ════════════════════════ STEP 1: Upload ════════════════════════ */}
          {step === "upload" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Enviar Arquivo CSV
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="b3-csv-file">Arquivo CSV</Label>
                  <Input
                    id="b3-csv-file"
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                </div>

                {file && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span className="font-medium">{file.name}</span>
                    <span>({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  <p className="font-medium mb-1">Como exportar do portal B3:</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-700">
                    <li>Acesse o portal CEI/B3 (cei.b3.com.br)</li>
                    <li>Vá em Extratos e Informativos → Negociação</li>
                    <li>Selecione o período desejado</li>
                    <li>Clique em &quot;Exportar&quot; no formato CSV</li>
                  </ol>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleAnalyze}
                    disabled={!file || loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? (
                      <>Analisando...</>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Analisar CSV
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ════════════ STEP 2: Analysis + Mapping ════════════ */}
          {step === "analysis" && analysis && (
            <div className="space-y-4">
              {/* Analysis summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{analysis.totalRows}</div>
                    <p className="text-sm text-muted-foreground">Total de Linhas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-green-600">
                      {analysis.autoMappedInstitutions}
                    </div>
                    <p className="text-sm text-muted-foreground">Instituições Mapeadas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-amber-600">
                      {analysis.unmappedInstitutions.length}
                    </div>
                    <p className="text-sm text-muted-foreground">Não Mapeadas</p>
                  </CardContent>
                </Card>
              </div>

              {/* Manual mappings table */}
              {analysis.unmappedInstitutions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Mapeamento de Instituições
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Informe o nome normalizado (curto) para cada instituição não mapeada.
                    O sistema criará automaticamente o alias para futuras importações.
                    Deixe em branco para usar o nome original truncado.
                  </p>
                  <div className="max-h-64 overflow-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome Original (CSV B3)</TableHead>
                          <TableHead className="w-20 text-center">Qtd</TableHead>
                          <TableHead>Nome Normalizado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analysis.unmappedInstitutions.map((inst, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-xs max-w-[240px] truncate">
                              {inst.rawInstitution}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{inst.occurrences}</Badge>
                            </TableCell>
                            <TableCell>
                              <Input
                                placeholder="Ex: Inter, XP, Nu Invest..."
                                value={mappings[idx]?.normalizedName ?? ""}
                                onChange={(e) => handleMappingChange(idx, e.target.value)}
                                className="h-8 text-sm"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {analysis.unmappedInstitutions.length === 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  <Check className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-green-800 font-medium">
                    Todas as instituições já possuem mapeamento!
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    O arquivo está pronto para importação.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 justify-end">
                <Button variant="outline" onClick={handleReset}>
                  Recomeçar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>Importando...</>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Importar Investimentos
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ═══════════════ STEP 3: Import Result ═══════════════ */}
          {step === "import-result" && importResult && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Resultado da Importação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-bold text-slate-800">{importResult.totalRows}</p>
                    <p className="text-xs text-muted-foreground">Total de linhas</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                    <p className="text-xs text-muted-foreground">Importados</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <p className="text-2xl font-bold text-amber-600">{importResult.skipped}</p>
                    <p className="text-xs text-muted-foreground">Ignorados</p>
                  </div>
                </div>

                {importResult.warnings.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2 text-amber-700">
                        <AlertTriangle className="h-4 w-4" />
                        Avisos ({importResult.warnings.length})
                      </h4>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {importResult.warnings.map((warning, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Badge variant="outline" className="text-xs shrink-0 mt-0.5">
                              Aviso
                            </Badge>
                            <span className="text-xs text-muted-foreground">{warning}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleReset}>
                    Importar outro arquivo
                  </Button>
                  <Button onClick={handleClose} className="bg-blue-600 hover:bg-blue-700">
                    Concluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
