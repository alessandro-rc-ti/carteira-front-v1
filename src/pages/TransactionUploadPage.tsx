import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { transactionService, bankService } from "@/services/bankService";
import type {
  CsvAnalysisResponse,
  CsvImportResponse,
  ManualMapping,
  BankResponse,
} from "@/types/bank";
import { showSuccess, showError } from "@/lib/toast";
import {
  ArrowLeft,
  UploadCloud,
  FileSpreadsheet,
  ArrowRight,
  Check,
  AlertTriangle,
  Settings,
} from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import useI18nStore from "@/stores/i18nStore";

function isBankCsvConfigured(bank: BankResponse): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  const mapping = bank.csvHeaderMapping ?? {};
  const requiredKeys = ["date", "description", "amount"];
  for (const key of requiredKeys) {
    if (!mapping[key] || mapping[key].trim() === "") {
      missing.push(`Cabeçalho CSV obrigatório "${key}" não mapeado`);
    }
  }
  if (!bank.csvSkipStrategy) {
    missing.push('"Ponto de Início de Leitura do CSV" não configurado');
  }
  return { ok: missing.length === 0, missing };
}

export function TransactionUploadPage() {
  const navigate = useNavigate();
  const { bankId } = useParams();
  const location = useLocation();
  const queryBankId = new URLSearchParams(location.search).get("bankId");
  const effectiveBankId = bankId ?? queryBankId ?? undefined;
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
  const [bankConfig, setBankConfig] = useState<BankResponse | null>(null);
  const [configWarnings, setConfigWarnings] = useState<string[]>([]);
  const [pendingRepeatedFileAnalysis, setPendingRepeatedFileAnalysis] =
    useState<CsvAnalysisResponse | null>(null);

  const t = useI18nStore((s) => s.t);

  // Load bank configuration on mount to validate before allowing import.
  // Also re-validates when the window regains focus (user may have come back from bank edit page).
  useEffect(() => {
    if (!effectiveBankId) return;
    const load = () => {
      bankService.getById(effectiveBankId).then((bank) => {
        setBankConfig(bank);
        const { missing } = isBankCsvConfigured(bank);
        setConfigWarnings(missing);
      }).catch(() => {
        // silently ignore — the analyze call will show the proper error
      });
    };
    load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, [effectiveBankId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setStep("upload");
      setAnalysis(null);
      setImportResult(null);
      setMappings([]);
      setPendingRepeatedFileAnalysis(null);
    }
  };

  const advanceToAnalysis = (result: CsvAnalysisResponse) => {
    setAnalysis(result);
    setMappings(
      result.unmappedDescriptions.map((u) => ({
        originalDescription: u.originalDescription,
        textIdentifier: u.originalDescription,
        summary: "",
        extractTicker: false,
      }))
    );
    setStep("analysis");
    setPendingRepeatedFileAnalysis(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    if (!effectiveBankId) {
      showError("Selecione uma conta bancária antes de analisar o CSV");
      return;
    }
    // Block import if bank is not properly configured
    if (bankConfig) {
      const { ok, missing } = isBankCsvConfigured(bankConfig);
      if (!ok) {
        setConfigWarnings(missing);
        return;
      }
    }
    setLoading(true);
    try {
      const result = await transactionService.analyzeCsv(effectiveBankId, file);
      if (result.fileNameAlreadyImported) {
        setPendingRepeatedFileAnalysis(result);
      } else {
        advanceToAnalysis(result);
      }
      showSuccess(
        `Análise completa: ${result.totalRows} linhas, ${result.autoMapped} mapeadas automaticamente`
      );
    } catch {
      showError("Falha ao analisar arquivo CSV");
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (
    index: number,
    field: "textIdentifier" | "summary",
    value: string
  ) => {
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
    if (!file) return;
    if (!effectiveBankId) {
      showError("Selecione uma conta bancária antes de importar o CSV");
      return;
    }
    setLoading(true);
    try {
      const validMappings = mappings.filter(
        (m) => m.textIdentifier.trim() !== "" && m.summary.trim() !== ""
      );
      const result = await transactionService.importCsv(
        effectiveBankId,
        file,
        validMappings.length > 0 ? validMappings : undefined
      );
      setImportResult(result);
      setStep("import-result");
      showSuccess(
        `Importação concluída: ${result.imported} de ${result.totalRows} linhas importadas`
      );
    } catch {
      showError("Falha ao importar arquivo CSV");
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
    setPendingRepeatedFileAnalysis(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Card className="w-full max-w-6xl shadow-lg border-slate-200">
        <CardHeader className="bg-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800 uppercase">
              <FileSpreadsheet className="h-5 w-5" />
              {t('upload.title','Importação CSV')}
            </CardTitle>
          </div>
          <CardDescription className="text-slate-500 mt-2">
            {t('upload.description','Envie um arquivo CSV de extrato para importar transações')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 p-8">
          {/* Configuration warning banner */}
          {configWarnings.length > 0 && (
            <Alert variant="destructive" className="border-amber-300 bg-amber-50 text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800 font-semibold">Banco não configurado para importação CSV</AlertTitle>
              <AlertDescription className="space-y-2">
                <ul className="list-disc list-inside text-sm mt-1 space-y-0.5">
                  {configWarnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
                <Button
                  type="button"
                  size="sm"
                  className="mt-2 bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() =>
                    navigate(`/banks/${effectiveBankId}/edit`, {
                      state: { returnTo: location.pathname + location.search },
                    })
                  }
                >
                  <Settings className="mr-2 h-3 w-3" />
                  Configurar Banco
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Step indicator */}
          <div className="flex items-center gap-2 text-sm mb-2">
            <Badge variant={step === "upload" ? "default" : "secondary"}>{t('upload.steps.upload','1. Envio')}</Badge>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <Badge variant={step === "analysis" ? "default" : "secondary"}>{t('upload.steps.analysis','2. Análise e Mapeamento')}</Badge>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <Badge variant={step === "import-result" ? "default" : "secondary"}>{t('upload.steps.result','3. Resultado')}</Badge>
          </div>
          <Separator />
          {/* Step 1: Upload */}
          {step === "upload" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="csv-file" className="font-medium text-slate-700">
                  {t('upload.field.file.label','Arquivo CSV')}
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
                <div className="space-y-4">
                  <span className="block text-sm text-muted-foreground">
                    {t('upload.selected','Selecionado:')} {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                  {pendingRepeatedFileAnalysis?.fileNameAlreadyImported && (
                    <Alert className="border-amber-300 bg-amber-50 text-amber-900">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-800 font-semibold">
                        Este nome de arquivo já foi importado anteriormente
                      </AlertTitle>
                      <AlertDescription className="space-y-3">
                        <p className="text-sm">
                          O arquivo <strong>{file.name}</strong> já existe no histórico desta conta.
                          Você pode avançar para revisar a análise, mas o sistema não vai inserir
                          novamente os registros idênticos deste mesmo arquivo.
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-amber-900">
                          <Badge variant="secondary" className="bg-amber-100 text-amber-900">
                            {pendingRepeatedFileAnalysis.repeatedRows} registros idênticos já encontrados
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            onClick={() => advanceToAnalysis(pendingRepeatedFileAnalysis)}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            Concordar e avançar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleReset}
                            className="border-amber-300 text-amber-900"
                          >
                            Escolher outro arquivo
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={handleAnalyze}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {loading ? t('upload.analyzing','Analisando...') : (
                        <>
                          <UploadCloud className="mr-2 h-4 w-4" />{t('upload.analyzeButton','Analisar CSV')}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Step 2: Analysis + Manual Mapping */}
          {step === "analysis" && analysis && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                <Card className="bg-slate-50 border-none">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{analysis.totalRows}</div>
                    <p className="text-sm text-muted-foreground">{t('upload.analysis.totalRows','Total de Linhas')}</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50 border-none">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-green-600">
                      {analysis.autoMapped}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('upload.analysis.autoMapped','Mapeadas Automaticamente')}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50 border-none">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-amber-600">
                      {analysis.unmappedDescriptions.length}
                    </div>
                    <p className="text-sm text-muted-foreground">{t('upload.analysis.unmapped','Grupos Não Mapeados')}</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50 border-none">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-slate-600">
                      {analysis.repeatedRows}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Registros já importados com este arquivo
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50 border-none">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-amber-600">
                      {analysis.notFoundTickerCount}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Serão ignoradas por ativo não encontrado
                    </p>
                  </CardContent>
                </Card>
              </div>
              {analysis.fileNameAlreadyImported && (
                <Alert className="border-amber-300 bg-amber-50 text-amber-900">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800 font-semibold">
                    Arquivo já existente no histórico
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    Os registros contados em “Registros já importados com este arquivo” serão ignorados na importação final se forem idênticos aos já gravados.
                  </AlertDescription>
                </Alert>
              )}
              {analysis.notFoundTickerDescriptions.length > 0 && (
                <Alert className="border-amber-300 bg-amber-50 text-amber-900">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800 font-semibold">
                    Algumas linhas já serão ignoradas na importação
                  </AlertTitle>
                  <AlertDescription className="space-y-3 text-sm">
                    <p>
                      Essas descrições já usam regra com ticker, mas não possuem ativo cadastrado correspondente.
                    </p>
                    <div className="max-h-40 overflow-auto rounded-md border border-amber-200 bg-white p-3">
                      {analysis.notFoundTickerDescriptions.map((description, index) => (
                        <p key={index} className="font-mono text-xs text-slate-600">
                          {description}
                        </p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              {analysis.unmappedDescriptions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700">
                    {t('upload.mapping.title','Mapeamentos Manuais (opcional)')}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t('upload.mapping.description','O sistema agrupou descrições parecidas com base na similaridade configurada do banco. Informe um identificador e um resumo para cada grupo. O sistema criará automaticamente uma regra futura de mapeamento.')}
                  </p>
                  <div className="space-y-4">
                    {analysis.unmappedDescriptions.map((desc, idx) => (
                      <Card key={idx} className="border-slate-200 bg-white shadow-sm">
                        <CardContent className="space-y-5 p-5">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                                  {desc.occurrences} ocorrências
                                </Badge>
                                {desc.groupedDescriptions.length > 1 && (
                                  <Badge variant="secondary" className="bg-amber-100 text-amber-900">
                                    {desc.groupedDescriptions.length} descrições agrupadas
                                  </Badge>
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                  {t('upload.mapping.header.original','Descrição Original')}
                                </p>
                                <p className="mt-1 break-words rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
                                  {desc.originalDescription}
                                </p>
                              </div>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 lg:min-w-64">
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <p className="text-sm font-medium text-slate-800">
                                    {t('upload.mapping.header.ticker','Ticker')}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Busca apenas ativos já cadastrados; os não encontrados aparecerão no resultado final.
                                  </p>
                                </div>
                                <Switch
                                  checked={mappings[idx]?.extractTicker ?? false}
                                  onCheckedChange={(checked) =>
                                    handleTickerToggle(idx, checked)
                                  }
                                />
                              </div>
                            </div>
                          </div>

                          {desc.groupedDescriptions.length > 1 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Outras descrições do grupo
                              </p>
                              <div className="max-h-36 overflow-auto rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                                <div className="space-y-1 font-mono text-[11px] text-slate-600">
                                  {desc.groupedDescriptions.map((groupedDescription, groupedIndex) => (
                                    <div key={groupedIndex}>{groupedDescription}</div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="grid gap-4 xl:grid-cols-2">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-slate-700">
                                {t('upload.mapping.header.identifier','Texto Identificador')}
                              </Label>
                              <Textarea
                                placeholder="Use apenas o trecho comum do grupo como identificador"
                                value={mappings[idx]?.textIdentifier ?? ""}
                                onChange={(e) =>
                                  handleMappingChange(idx, "textIdentifier", e.target.value)
                                }
                                className="min-h-24 resize-y bg-slate-50 border-slate-200"
                              />
                              <p className="text-xs text-muted-foreground">
                                Esse texto será usado para reconhecer futuras linhas parecidas deste grupo.
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-slate-700">
                                {t('upload.mapping.header.summary','Descrição Resumida')}
                              </Label>
                              <Textarea
                                placeholder="Como essa transação deve aparecer no sistema"
                                value={mappings[idx]?.summary ?? ""}
                                onChange={(e) => handleMappingChange(idx, "summary", e.target.value)}
                                className="min-h-24 resize-y bg-slate-50 border-slate-200"
                              />
                              <p className="text-xs text-muted-foreground">
                                Use um resumo curto e consistente para facilitar filtros, relatórios e regras futuras.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="border-slate-300"
                >
                  {t('upload.button.reset','Recomeçar')}
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? t('upload.importing','Importando...') : (
                    <>
                      <Check className="mr-2 h-4 w-4" />{t('upload.button.import','Importar Transações')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          {/* Step 3: Import Result */}
          {step === "import-result" && importResult && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                <Card className="bg-slate-50 border-none">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{importResult.totalRows}</div>
                    <p className="text-sm text-muted-foreground">{t('upload.analysis.totalRows','Total de Linhas')}</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50 border-none">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-green-600">
                      {importResult.imported}
                    </div>
                    <p className="text-sm text-muted-foreground">{t('upload.result.imported','Importadas')}</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50 border-none">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-muted-foreground">
                      {importResult.ignored}
                    </div>
                    <p className="text-sm text-muted-foreground">{t('upload.result.ignored','Ignoradas')}</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50 border-none">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-slate-600">
                      {importResult.repeatedRowsIgnored}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Ignoradas por já existirem neste arquivo
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50 border-none">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-amber-600">
                      {importResult.notFoundTickerCount}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Ignoradas por ativo não encontrado
                    </p>
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
              {importResult.notFoundTickerDescriptions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-amber-600">
                    Ativos Não Encontrados ({importResult.notFoundTickerDescriptions.length})
                  </h3>
                  <div className="max-h-40 overflow-auto rounded-md border border-slate-200 bg-white p-3">
                    {importResult.notFoundTickerDescriptions.map((description, i) => (
                      <p key={i} className="font-mono text-xs text-muted-foreground">
                        {description}
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
