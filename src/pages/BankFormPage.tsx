import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import {
  DebitValueSignHandling,
  MatchStrategy,
  ExtractStrategy,
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

    const bankRequest: BankRequest = {
      bankName: bankName.trim(),
      dateFormatPattern,
      decimalSeparator,
      csvDelimiter,
      debitValueSignHandling,
      creditTypeIdentifier: creditTypeIdentifier || null,
      debitTypeIdentifier: debitTypeIdentifier || null,
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
        toast.success("Banco atualizado com sucesso");
        navigate(`/banks/${id}`);
      } else {
        const created = await createBank(bankRequest);
        toast.success("Banco criado com sucesso");
        navigate(`/banks/${created.id}`);
      }
    } catch {
      toast.error(isEditing ? "Falha ao atualizar banco" : "Falha ao criar banco");
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
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => navigate(isEditing ? `/banks/${id}` : "/banks")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Editar Banco" : "Novo Banco"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditing
              ? "Atualize a configuração CSV do banco"
              : "Configure um novo banco para importação CSV"}
          </p>
        </div>
      </div>

      {/* Basic Info */}
      <Card>
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
            Regras para extrair descrições resumidas das transações CSV
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {patterns.map((pattern, idx) => (
            <div key={idx} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Padrão #{idx + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removePattern(idx)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {/* Match Pattern */}
                <div className="space-y-1">
                  <Label className="text-xs">Padrão de Match *</Label>
                  <Input
                    value={pattern.matchPattern}
                    onChange={(e) =>
                      updatePattern(idx, "matchPattern", e.target.value)
                    }
                    placeholder="Ex: PIX"
                    className="h-8 text-sm"
                  />
                </div>

                {/* Match Strategy */}
                <div className="space-y-1">
                  <Label className="text-xs">Estratégia de Match</Label>
                  <Select
                    value={pattern.matchStrategy ?? "AUTO"}
                    onValueChange={(v) =>
                      updatePattern(
                        idx,
                        "matchStrategy",
                        v === "AUTO" ? null : (v as MatchStrategy)
                      )
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AUTO">Automático</SelectItem>
                      {Object.values(MatchStrategy).map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Extract Strategy */}
                <div className="space-y-1">
                  <Label className="text-xs">Estratégia de Extração</Label>
                  <Select
                    value={pattern.extractStrategy ?? "AUTO"}
                    onValueChange={(v) =>
                      updatePattern(
                        idx,
                        "extractStrategy",
                        v === "AUTO" ? null : (v as ExtractStrategy)
                      )
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AUTO">Automático</SelectItem>
                      {Object.values(ExtractStrategy).map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Extract Regex */}
                <div className="space-y-1">
                  <Label className="text-xs">Regex de Extração</Label>
                  <Input
                    value={pattern.extractRegex ?? ""}
                    onChange={(e) =>
                      updatePattern(idx, "extractRegex", e.target.value || null)
                    }
                    placeholder="e.g., PIX\\s+-\\s+(.*)"
                    className="h-8 font-mono text-xs"
                  />
                </div>

                {/* Fixed Summary */}
                <div className="space-y-1">
                  <Label className="text-xs">Resumo Fixo</Label>
                  <Input
                    value={pattern.fixedSummary ?? ""}
                    onChange={(e) =>
                      updatePattern(idx, "fixedSummary", e.target.value || null)
                    }
                    placeholder="e.g., Resgate {1}"
                    className="h-8 text-sm"
                  />
                </div>

                {/* Similarity Threshold */}
                <div className="space-y-1">
                  <Label className="text-xs">Limite de Similaridade</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={pattern.similarityThreshold ?? ""}
                    onChange={(e) =>
                      updatePattern(
                        idx,
                        "similarityThreshold",
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    placeholder="0.0 - 1.0"
                    className="h-8 text-sm"
                  />
                </div>

                {/* Extract Delimiter */}
                <div className="space-y-1">
                  <Label className="text-xs">Delimitador de Extração</Label>
                  <Input
                    value={pattern.extractDelimiter ?? ""}
                    onChange={(e) =>
                      updatePattern(
                        idx,
                        "extractDelimiter",
                        e.target.value || null
                      )
                    }
                    placeholder="e.g., -"
                    className="h-8 text-sm"
                  />
                </div>

                {/* Extract Start */}
                <div className="space-y-1">
                  <Label className="text-xs">Marcador Início</Label>
                  <Input
                    value={pattern.extractStart ?? ""}
                    onChange={(e) =>
                      updatePattern(idx, "extractStart", e.target.value || null)
                    }
                    className="h-8 text-sm"
                  />
                </div>

                {/* Extract End */}
                <div className="space-y-1">
                  <Label className="text-xs">Marcador Fim</Label>
                  <Input
                    value={pattern.extractEnd ?? ""}
                    onChange={(e) =>
                      updatePattern(idx, "extractEnd", e.target.value || null)
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* Extract Ticker toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={pattern.extractTicker ?? false}
                  onCheckedChange={(checked) =>
                    updatePattern(idx, "extractTicker", checked)
                  }
                />
                <Label className="text-xs">Extrair Ticker B3</Label>
              </div>
            </div>
          ))}

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
