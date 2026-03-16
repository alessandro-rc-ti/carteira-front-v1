import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useBankStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";
import { showSuccess, showError } from "@/lib/toast";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import {
  DebitValueSignHandling,
  CsvSkipStrategy,
} from "@/types";
import type { BankRequest, DescriptionSummaryPattern } from "@/types";

const EMPTY_PATTERN: DescriptionSummaryPattern = {
  matchPattern: "",
  extractRegex: null,
  matchStrategy: null,
  extractStrategy: null,
  similarityThreshold: null,
  extractDelimiter: null,
  extractStart: null,
  extractEnd: null,
  fixedSummary: null,
  extractTicker: false,
};

const DEFAULT_HEADER_MAPPING: Record<string, string> = {
  date: "",
  description: "",
  amount: "",
  type: "",
};

export function BankFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo;
  const { selectedBank, loading, fetchBankById, createBank, updateBank, clearSelectedBank } =
    useBankStore();
  const isEditing = Boolean(id);

  // Form state
  const [bankName, setBankName] = useState("");
  const [dateFormatPattern, setDateFormatPattern] = useState("dd/MM/yyyy");
  const [decimalSeparator, setDecimalSeparator] = useState(",");
  const [csvDelimiter, setCsvDelimiter] = useState(";");
  const [debitValueSignHandling, setDebitValueSignHandling] =
    useState<DebitValueSignHandling>(DebitValueSignHandling.NO_CHANGE);
  const [creditTypeIdentifier, setCreditTypeIdentifier] = useState("");
  const [debitTypeIdentifier, setDebitTypeIdentifier] = useState("");
  const [csvSkipStrategy, setCsvSkipStrategy] = useState<CsvSkipStrategy | "">("");
  const [csvSkipValue, setCsvSkipValue] = useState("");
  const [csvSimilarityGroupingThresholdPercent, setCsvSimilarityGroupingThresholdPercent] = useState("60");
  const [headerMapping, setHeaderMapping] = useState<Record<string, string>>(
    { ...DEFAULT_HEADER_MAPPING }
  );
  const [patterns, setPatterns] = useState<DescriptionSummaryPattern[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Load bank for edit mode
  useEffect(() => {
    if (id) {
      fetchBankById(id);
    }
    return () => clearSelectedBank();
  }, [id, fetchBankById, clearSelectedBank]);

  // Populate form when bank is loaded
  useEffect(() => {
    if (isEditing && selectedBank) {
      setBankName(selectedBank.bankName);
      setDateFormatPattern(selectedBank.dateFormatPattern);
      setDecimalSeparator(selectedBank.decimalSeparator);
      setCsvDelimiter(selectedBank.csvDelimiter);
      setDebitValueSignHandling(selectedBank.debitValueSignHandling);
      setCreditTypeIdentifier(selectedBank.creditTypeIdentifier ?? "");
      setDebitTypeIdentifier(selectedBank.debitTypeIdentifier ?? "");
      setCsvSkipStrategy((selectedBank.csvSkipStrategy as CsvSkipStrategy) ?? "");
      setCsvSkipValue(selectedBank.csvSkipValue ?? "");
      setCsvSimilarityGroupingThresholdPercent(
        String(Math.round((selectedBank.csvSimilarityGroupingThreshold ?? 0.6) * 100))
      );
      setHeaderMapping(
        Object.keys(selectedBank.csvHeaderMapping).length > 0
          ? { ...selectedBank.csvHeaderMapping }
          : { ...DEFAULT_HEADER_MAPPING }
      );
      setPatterns(
        selectedBank.descriptionSummaryPatterns?.map((p) => ({ ...p })) ?? []
      );
    }
  }, [isEditing, selectedBank]);

  // Header mapping helpers
  const handleHeaderChange = (key: string, value: string) => {
    setHeaderMapping((prev) => ({ ...prev, [key]: value }));
  };

  const addHeaderField = () => {
    const newKey = `field_${Object.keys(headerMapping).length + 1}`;
    setHeaderMapping((prev) => ({ ...prev, [newKey]: "" }));
  };

  const removeHeaderField = (key: string) => {
    setHeaderMapping((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const renameHeaderKey = (oldKey: string, newKey: string) => {
    if (newKey === oldKey || newKey.trim() === "") return;
    setHeaderMapping((prev) => {
      const entries = Object.entries(prev);
      const updated: Record<string, string> = {};
      for (const [k, v] of entries) {
        updated[k === oldKey ? newKey : k] = v;
      }
      return updated;
    });
  };

  // Pattern helpers
  const addPattern = () => {
    setPatterns((prev) => [...prev, { ...EMPTY_PATTERN }]);
  };

  const removePattern = (index: number) => {
    setPatterns((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePattern = (
    index: number,
    field: keyof DescriptionSummaryPattern,
    value: unknown
  ) => {
    setPatterns((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bankName.trim()) {
      toast.error("Nome do banco é obrigatório");
      return;
    }

    const thresholdPercent = Number(csvSimilarityGroupingThresholdPercent);
    if (Number.isNaN(thresholdPercent) || thresholdPercent <= 0 || thresholdPercent > 100) {
      showError("Percentual de similaridade deve estar entre 1 e 100");
      return;
    }

    const bankRequest: BankRequest = {
      bankName: bankName.trim(),
      dateFormatPattern,
      decimalSeparator,
      csvDelimiter,
      debitValueSignHandling,
      creditTypeIdentifier: creditTypeIdentifier || null,
      debitTypeIdentifier: debitTypeIdentifier || null,
      csvSkipStrategy: csvSkipStrategy || null,
      csvSkipValue: csvSkipValue.trim() || null,
      csvSimilarityGroupingThreshold: thresholdPercent / 100,
      csvHeaderMapping: Object.fromEntries(
        Object.entries(headerMapping).filter(([k, v]) => k.trim() && v.trim())
      ),
      descriptionSummaryPatterns: patterns
        .filter((p) => p.matchPattern.trim() !== "")
        .map((p) => ({
          ...p,
          extractRegex: p.extractRegex || null,
          matchStrategy: p.matchStrategy || null,
          extractStrategy: p.extractStrategy || null,
          similarityThreshold: p.similarityThreshold || null,
          extractDelimiter: p.extractDelimiter || null,
          extractStart: p.extractStart || null,
          extractEnd: p.extractEnd || null,
          fixedSummary: p.fixedSummary || null,
        })),
    };

    setSubmitting(true);
    try {
      if (isEditing && id) {
        await updateBank(id, bankRequest);
        showSuccess("Banco atualizado com sucesso");
        navigate(returnTo ?? `/banks/${id}`);
      } else {
        const created = await createBank(bankRequest);
        showSuccess("Banco criado com sucesso");
        navigate(returnTo ?? `/banks/${created.id}`);
      }
    } catch {
      showError(isEditing ? "Falha ao atualizar banco" : "Falha ao criar banco");
    } finally {
      setSubmitting(false);
    }
  };

  if (isEditing && loading && !selectedBank) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Carregando banco...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hover:bg-slate-200"
            onClick={() => navigate(isEditing ? `/banks/${id}` : "/banks")}
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight uppercase">
              {isEditing ? "Editar Banco" : "Novo Banco"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isEditing
                ? "Atualize a configuração CSV do banco"
                : "Configure um novo banco para importação CSV"}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
           <Button type="button" variant="outline" onClick={() => navigate("/banks")}>Cancelar</Button>
           <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
             <Save className="mr-2 h-4 w-4" /> Salvar Banco
           </Button>
        </div>
      </div>

      {/* Basic Info */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bankName">Nome do Banco *</Label>
              <Input
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Ex: Inter, Nubank"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Formato de Data</Label>
              <Input
                id="dateFormat"
                value={dateFormatPattern}
                onChange={(e) => setDateFormatPattern(e.target.value)}
                placeholder="dd/MM/yyyy"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="decimalSep">Separador Decimal</Label>
              <Input
                id="decimalSep"
                value={decimalSeparator}
                onChange={(e) => setDecimalSeparator(e.target.value)}
                placeholder=","
                maxLength={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="csvDelim">Delimitador CSV</Label>
              <Input
                id="csvDelim"
                value={csvDelimiter}
                onChange={(e) => setCsvDelimiter(e.target.value)}
                placeholder=";"
                maxLength={1}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Tratamento Sinal Débito</Label>
              <Select
                value={debitValueSignHandling}
                onValueChange={(v) =>
                  setDebitValueSignHandling(v as DebitValueSignHandling)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(DebitValueSignHandling).map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="creditId">Identificador Tipo Crédito</Label>
              <Input
                id="creditId"
                value={creditTypeIdentifier}
                onChange={(e) => setCreditTypeIdentifier(e.target.value)}
                placeholder="Ex: Credito"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debitId">Identificador Tipo Débito</Label>
              <Input
                id="debitId"
                value={debitTypeIdentifier}
                onChange={(e) => setDebitTypeIdentifier(e.target.value)}
                placeholder="Ex: Debito"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="csvSimilarityGroupingThresholdPercent">
                Similaridade para Agrupamento (%)
              </Label>
              <Input
                id="csvSimilarityGroupingThresholdPercent"
                type="number"
                min="1"
                max="100"
                value={csvSimilarityGroupingThresholdPercent}
                onChange={(e) => setCsvSimilarityGroupingThresholdPercent(e.target.value)}
                placeholder="60"
              />
              <p className="text-xs text-muted-foreground">
                Default recomendado: 60. Valores maiores deixam o agrupamento mais rígido.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CSV Skip / Start-of-data Configuration */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle>Ponto de Início de Leitura do CSV</CardTitle>
          <CardDescription>
            Configure onde o sistema deve começar a ler o arquivo CSV. Bancos como o Inter
            possuem linhas de cabeçalho do arquivo antes dos dados — informe a linha ou
            o texto de início para que essas linhas sejam ignoradas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Estratégia de Início</Label>
              <Select
                value={csvSkipStrategy}
                onValueChange={(v) => {
                  setCsvSkipStrategy(v === "NONE" ? "" : (v as CsvSkipStrategy));
                  setCsvSkipValue("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sem configuração (início padrão)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Sem configuração (início padrão)</SelectItem>
                  <SelectItem value={CsvSkipStrategy.LINE_NUMBER}>
                    Número da linha
                  </SelectItem>
                  <SelectItem value={CsvSkipStrategy.STARTS_WITH_TEXT}>
                    Texto de início
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {csvSkipStrategy && (
              <div className="space-y-2">
                <Label htmlFor="csvSkipValue">
                  {csvSkipStrategy === CsvSkipStrategy.LINE_NUMBER
                    ? "Número da linha do cabeçalho"
                    : "Texto que inicia o cabeçalho"}
                </Label>
                <Input
                  id="csvSkipValue"
                  value={csvSkipValue}
                  onChange={(e) => setCsvSkipValue(e.target.value)}
                  placeholder={
                    csvSkipStrategy === CsvSkipStrategy.LINE_NUMBER
                      ? "Ex: 5"
                      : "Ex: Data Lançamento"
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {csvSkipStrategy === CsvSkipStrategy.LINE_NUMBER
                    ? "Informe o número da linha que contém o cabeçalho das colunas (ex: 5 = linha 5 do arquivo)."
                    : "Informe os caracteres iniciais da linha de cabeçalho. O sistema localiza a primeira linha que começa com esse texto."}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* CSV Header Mapping */}
      <Card>
        <CardHeader>
          <CardTitle>Mapeamento de Cabeçalho CSV</CardTitle>
          <CardDescription>
            Mapeie os cabeçalhos das colunas do CSV para os campos esperados (date, description,
            amount, type)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(headerMapping).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <Input
                value={key}
                onChange={(e) => renameHeaderKey(key, e.target.value)}
                className="w-40"
                placeholder="Chave do campo"
              />
              <span className="text-muted-foreground">→</span>
              <Input
                value={value}
                onChange={(e) => handleHeaderChange(key, e.target.value)}
                className="flex-1"
                placeholder="Cabeçalho da coluna CSV"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeHeaderField(key)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addHeaderField}>
            <Plus className="mr-1 h-3 w-3" />
            Adicionar Campo
          </Button>
        </CardContent>
      </Card>

      {/* Description Summary Patterns */}
      <Card>
        <CardHeader>
          <CardTitle>
            Padrões de Sumarização ({patterns.length})
          </CardTitle>
          <CardDescription>
            Informe a descrição do CSV, a descrição resumida desejada e ative o ticker para extração automática de ativos B3.
            O sistema gera a regra de mapeamento automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {patterns.length > 0 && (
            <div className="rounded-md border">
              <div className="grid grid-cols-[1fr_1fr_80px_40px] gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                <span>Descrição (CSV)</span>
                <span>Descrição Resumida</span>
                <span className="text-center">Ticker</span>
                <span></span>
              </div>
              {patterns.map((pattern, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[1fr_1fr_80px_40px] gap-2 px-4 py-2 border-t items-center"
                >
                  <Input
                    value={pattern.matchPattern}
                    onChange={(e) =>
                      updatePattern(idx, "matchPattern", e.target.value)
                    }
                    placeholder="Ex: Resgate: &quot;CDB PORQUINHO"
                    className="h-8 text-sm font-mono"
                  />
                  <Input
                    value={pattern.fixedSummary ?? ""}
                    onChange={(e) =>
                      updatePattern(idx, "fixedSummary", e.target.value || null)
                    }
                    placeholder="Ex: Resgate Porquinho"
                    className="h-8 text-sm"
                  />
                  <div className="flex justify-center">
                    <Switch
                      checked={pattern.extractTicker ?? false}
                      onCheckedChange={(checked) =>
                        updatePattern(idx, "extractTicker", checked)
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePattern(idx)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button type="button" variant="outline" onClick={addPattern}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Padrão
          </Button>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(isEditing ? `/banks/${id}` : "/banks")}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            "Salvando..."
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? "Atualizar Banco" : "Criar Banco"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
