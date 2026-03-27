import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useBankStore } from "@/stores";
import { useTransactionTypeStore } from "@/stores/transactionTypeStore";
import { classificationRuleService } from "@/services";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { showSuccess, showError } from "@/lib/toast";
import { ArrowLeft, Plus, Trash2, Save, ArrowRightLeft, History } from "lucide-react";
import { PageHeader } from "@/components/shared";
import {
  DebitValueSignHandling,
  CsvSkipStrategy,
  TransactionClassificationRuleUpdateMode,
} from "@/types";
import type {
  BankRequest,
  TransactionClassificationRule,
  TransactionClassificationRuleUpdateMode as TransactionClassificationRuleUpdateModeType,
  TransactionClassificationRuleUsageResponse,
} from "@/types";
import { buildTransactionTypeOptions } from "@/types/transaction";

const EMPTY_RULE: TransactionClassificationRule = {
  id: undefined,
  statementDescription: null,
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
  priority: null,
  active: true,
  transactionType: null,
  transactionTypeCode: null,
};

const DEFAULT_HEADER_MAPPING: Record<string, string> = {
  date: "",
  description: "",
  amount: "",
  type: "",
};

function normalizeNullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeRule(rule: TransactionClassificationRule): TransactionClassificationRule {
  return {
    id: rule.id,
    statementDescription: normalizeNullableText(rule.statementDescription),
    matchPattern: rule.matchPattern.trim(),
    extractRegex: normalizeNullableText(rule.extractRegex),
    matchStrategy: rule.matchStrategy ?? null,
    extractStrategy: rule.extractStrategy ?? null,
    similarityThreshold: rule.similarityThreshold ?? null,
    extractDelimiter: normalizeNullableText(rule.extractDelimiter),
    extractStart: normalizeNullableText(rule.extractStart),
    extractEnd: normalizeNullableText(rule.extractEnd),
    fixedSummary: normalizeNullableText(rule.fixedSummary),
    extractTicker: Boolean(rule.extractTicker),
    priority: rule.priority ?? null,
    active: rule.active ?? true,
    transactionType: normalizeNullableText(rule.transactionType),
    transactionTypeCode: normalizeNullableText(rule.transactionTypeCode),
  };
}

function haveRulesChanged(before: TransactionClassificationRule, after: TransactionClassificationRule) {
  const normalizedBefore = normalizeRule(before);
  const normalizedAfter = normalizeRule(after);

  return JSON.stringify({ ...normalizedBefore, id: undefined }) !== JSON.stringify({ ...normalizedAfter, id: undefined });
}

export function BankFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo;
  const { selectedBank, loading, fetchBankById, createBank, updateBank, clearSelectedBank } = useBankStore();
  const { items: transactionTypes, fetchAll: fetchTransactionTypes } = useTransactionTypeStore();
  const isEditing = Boolean(id);
  const typeOptions = buildTransactionTypeOptions(transactionTypes);

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
  const [headerMapping, setHeaderMapping] = useState<Record<string, string>>({ ...DEFAULT_HEADER_MAPPING });
  const [rules, setRules] = useState<TransactionClassificationRule[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [updateModeDialogOpen, setUpdateModeDialogOpen] = useState(false);
  const [selectedUpdateMode, setSelectedUpdateMode] = useState<TransactionClassificationRuleUpdateModeType | null>(null);
  const [pendingBankRequest, setPendingBankRequest] = useState<BankRequest | null>(null);
  const [pendingRules, setPendingRules] = useState<TransactionClassificationRule[]>([]);
  const [deleteRuleDialogOpen, setDeleteRuleDialogOpen] = useState(false);
  const [deleteRuleLoading, setDeleteRuleLoading] = useState(false);
  const [deleteRuleTarget, setDeleteRuleTarget] = useState<TransactionClassificationRule | null>(null);
  const [deleteRuleUsage, setDeleteRuleUsage] = useState<TransactionClassificationRuleUsageResponse | null>(null);

  useEffect(() => {
    if (id) {
      fetchBankById(id);
    }
    void fetchTransactionTypes();
    return () => clearSelectedBank();
  }, [id, fetchBankById, clearSelectedBank, fetchTransactionTypes]);

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
      setRules(selectedBank.classificationRules?.map((rule) => ({ ...rule })) ?? []);
    }
  }, [isEditing, selectedBank]);

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
      for (const [key, value] of entries) {
        updated[key === oldKey ? newKey : key] = value;
      }
      return updated;
    });
  };

  const addRule = () => {
    setRules((prev) => {
      const nextPriority = prev.reduce((max, rule) => Math.max(max, rule.priority ?? 0), 0) + 1;
      return [...prev, { ...EMPTY_RULE, priority: nextPriority }];
    });
  };

  const updateRule = (
    index: number,
    field: keyof TransactionClassificationRule,
    value: unknown
  ) => {
    setRules((prev) =>
      prev.map((rule, currentIndex) => (currentIndex === index ? { ...rule, [field]: value } : rule))
    );
  };

  const removeRule = async (index: number) => {
    const targetRule = rules[index];
    if (!targetRule) {
      return;
    }

    if (!targetRule.id || !id) {
      setRules((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
      return;
    }

    setDeleteRuleLoading(true);
    try {
      const usage = await classificationRuleService.getUsage(id, targetRule.id);
      setDeleteRuleTarget(targetRule);
      setDeleteRuleUsage(usage);
      setDeleteRuleDialogOpen(true);
    } catch {
      showError("Falha ao consultar vínculos da regra");
    } finally {
      setDeleteRuleLoading(false);
    }
  };

  const getPreparedRules = () =>
    rules
      .filter((rule) => rule.matchPattern.trim() !== "")
      .map(normalizeRule);

  const getUpdatedExistingRules = (preparedRules: TransactionClassificationRule[]) => {
    if (!selectedBank) {
      return [];
    }

    const initialRulesById = new Map(
      (selectedBank.classificationRules ?? [])
        .filter((rule) => rule.id)
        .map((rule) => [rule.id as string, rule])
    );

    return preparedRules.filter((rule) => {
      if (!rule.id) {
        return false;
      }
      const initialRule = initialRulesById.get(rule.id);
      return initialRule ? haveRulesChanged(initialRule, rule) : false;
    });
  };

  const persistRules = async (
    bankId: string,
    preparedRules: TransactionClassificationRule[],
    updateMode: TransactionClassificationRuleUpdateModeType | null
  ) => {
    const updatedExistingRules = getUpdatedExistingRules(preparedRules);
    const newRules = preparedRules.filter((rule) => !rule.id);

    if (updatedExistingRules.length > 0 && !updateMode) {
      throw new Error("UPDATE_MODE_REQUIRED");
    }

    for (const rule of updatedExistingRules) {
      await classificationRuleService.update(bankId, rule.id as string, {
        rule,
        updateMode: updateMode as TransactionClassificationRuleUpdateModeType,
      });
    }

    for (const rule of newRules) {
      await classificationRuleService.create(bankId, rule);
    }
  };

  const persistForm = async (
    bankRequest: BankRequest,
    preparedRules: TransactionClassificationRule[],
    updateMode: TransactionClassificationRuleUpdateModeType | null
  ) => {
    setSubmitting(true);
    try {
      let targetBankId = id;

      if (isEditing && id) {
        await updateBank(id, bankRequest);
      } else {
        const created = await createBank(bankRequest);
        targetBankId = created.id;
      }

      if (targetBankId) {
        await persistRules(targetBankId, preparedRules, updateMode);
      }

      showSuccess(isEditing ? "Banco atualizado com sucesso" : "Banco criado com sucesso");
      setSelectedUpdateMode(null);
      setPendingBankRequest(null);
      setPendingRules([]);
      navigate(returnTo ?? `/banks/${targetBankId}`);
    } catch (error) {
      if (error instanceof Error && error.message === "UPDATE_MODE_REQUIRED") {
        setPendingBankRequest(bankRequest);
        setPendingRules(preparedRules);
        setUpdateModeDialogOpen(true);
        return;
      }
      showError(isEditing ? "Falha ao atualizar banco" : "Falha ao criar banco");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bankName.trim()) {
      showError("Nome do banco é obrigatório");
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
        Object.entries(headerMapping).filter(([key, value]) => key.trim() && value.trim())
      ),
    };

    const preparedRules = getPreparedRules();
    await persistForm(bankRequest, preparedRules, selectedUpdateMode);
  };

  const handleConfirmUpdateMode = async () => {
    if (!pendingBankRequest || !selectedUpdateMode) {
      return;
    }

    setUpdateModeDialogOpen(false);
    await persistForm(pendingBankRequest, pendingRules, selectedUpdateMode);
  };

  const handleConfirmRuleDelete = async () => {
    if (!id || !deleteRuleTarget?.id) {
      return;
    }

    setDeleteRuleLoading(true);
    try {
      const result = await classificationRuleService.remove(id, deleteRuleTarget.id);
      setRules((prev) => prev.filter((rule) => rule.id !== deleteRuleTarget.id));
      showSuccess(
        result.deletedPhysically
          ? "Regra excluída fisicamente"
          : "Regra desativada para preservar o histórico"
      );
      setDeleteRuleDialogOpen(false);
      setDeleteRuleTarget(null);
      setDeleteRuleUsage(null);
    } catch {
      showError("Falha ao excluir regra");
    } finally {
      setDeleteRuleLoading(false);
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
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <PageHeader
          title={isEditing ? "Editar Banco" : "Novo Banco"}
          description={isEditing ? "Atualize a configuração CSV do banco" : "Configure um novo banco para importação CSV"}
        >
          <Button type="button" variant="ghost" size="icon" onClick={() => navigate(isEditing ? `/banks/${id}` : "/banks") }>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(isEditing ? `/banks/${id}` : "/banks")}>Cancelar</Button>
          <Button type="submit" disabled={submitting} className="gap-1.5">
            <Save className="h-4 w-4" /> {submitting ? "Salvando..." : "Salvar Banco"}
          </Button>
        </PageHeader>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bankName">Nome do Banco *</Label>
                <Input id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Ex: Inter, Nubank" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateFormat">Formato de Data</Label>
                <Input id="dateFormat" value={dateFormatPattern} onChange={(e) => setDateFormatPattern(e.target.value)} placeholder="dd/MM/yyyy" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="decimalSep">Separador Decimal</Label>
                <Input id="decimalSep" value={decimalSeparator} onChange={(e) => setDecimalSeparator(e.target.value)} placeholder="," maxLength={1} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="csvDelim">Delimitador CSV</Label>
                <Input id="csvDelim" value={csvDelimiter} onChange={(e) => setCsvDelimiter(e.target.value)} placeholder=";" maxLength={1} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Tratamento Sinal Débito</Label>
                <Select value={debitValueSignHandling} onValueChange={(value) => setDebitValueSignHandling(value as DebitValueSignHandling)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(DebitValueSignHandling).map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditId">Identificador Tipo Crédito</Label>
                <Input id="creditId" value={creditTypeIdentifier} onChange={(e) => setCreditTypeIdentifier(e.target.value)} placeholder="Ex: Credito" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="debitId">Identificador Tipo Débito</Label>
                <Input id="debitId" value={debitTypeIdentifier} onChange={(e) => setDebitTypeIdentifier(e.target.value)} placeholder="Ex: Debito" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="csvSimilarityGroupingThresholdPercent">Similaridade para Agrupamento (%)</Label>
                <Input id="csvSimilarityGroupingThresholdPercent" type="number" min="1" max="100" value={csvSimilarityGroupingThresholdPercent} onChange={(e) => setCsvSimilarityGroupingThresholdPercent(e.target.value)} placeholder="60" />
                <p className="text-xs text-muted-foreground">
                  Default recomendado: 60. Valores maiores deixam o agrupamento mais rígido.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Ponto de Início de Leitura do CSV</CardTitle>
            <CardDescription>
              Configure onde o sistema deve começar a ler o arquivo CSV. Bancos como o Inter
              possuem linhas de cabeçalho do arquivo antes dos dados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Estratégia de Início</Label>
                <Select
                  value={csvSkipStrategy}
                  onValueChange={(value) => {
                    setCsvSkipStrategy(value === "NONE" ? "" : (value as CsvSkipStrategy));
                    setCsvSkipValue("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sem configuração (início padrão)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Sem configuração (início padrão)</SelectItem>
                    <SelectItem value={CsvSkipStrategy.LINE_NUMBER}>Número da linha</SelectItem>
                    <SelectItem value={CsvSkipStrategy.STARTS_WITH_TEXT}>Texto de início</SelectItem>
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
                    placeholder={csvSkipStrategy === CsvSkipStrategy.LINE_NUMBER ? "Ex: 5" : "Ex: Data Lançamento"}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mapeamento de Cabeçalho CSV</CardTitle>
            <CardDescription>
              Mapeie os cabeçalhos das colunas do CSV para os campos esperados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(headerMapping).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <Input value={key} onChange={(e) => renameHeaderKey(key, e.target.value)} className="w-40" placeholder="Chave do campo" />
                <span className="text-muted-foreground">→</span>
                <Input value={value} onChange={(e) => handleHeaderChange(key, e.target.value)} className="flex-1" placeholder="Cabeçalho da coluna CSV" />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeHeaderField(key)}>
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

        <Card>
          <CardHeader>
            <CardTitle>Regras de Classificação ({rules.length})</CardTitle>
            <CardDescription>
              Revise a descrição, o texto identificador, a descrição resumida, a prioridade, o tipo e o ticker.
              Menor número = maior prioridade.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {rules.length > 0 && (
              <div className="rounded-md border">
                <div className="grid grid-cols-[1.2fr_1fr_1fr_120px_220px_80px_40px] gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                  <span>Descricao</span>
                  <span>Texto Identificador</span>
                  <span>Descricao Resumida</span>
                  <span>Prioridade</span>
                  <span>Tipo</span>
                  <span className="text-center">Ticker</span>
                  <span></span>
                </div>
                {rules.map((rule, index) => (
                  <div key={rule.id ?? index} className="grid grid-cols-[1.2fr_1fr_1fr_120px_220px_80px_40px] gap-2 px-4 py-2 border-t items-center">
                    <Input
                      value={rule.statementDescription ?? ""}
                      onChange={(e) => updateRule(index, "statementDescription", e.target.value || null)}
                      placeholder="Ex: PIX MERCADO CENTRAL LTDA"
                      className="h-8 text-sm"
                    />
                    <Input
                      value={rule.matchPattern}
                      onChange={(e) => updateRule(index, "matchPattern", e.target.value)}
                      placeholder="Trecho usado para reconhecer"
                      className="h-8 text-sm font-mono"
                    />
                    <Input
                      value={rule.fixedSummary ?? ""}
                      onChange={(e) => updateRule(index, "fixedSummary", e.target.value || null)}
                      placeholder="Ex: Resgate Porquinho"
                      className="h-8 text-sm"
                    />
                    <Input
                      type="number"
                      min="1"
                      value={rule.priority ?? ""}
                      onChange={(e) => updateRule(index, "priority", e.target.value === "" ? null : Number(e.target.value))}
                      placeholder="1"
                      className="h-8 text-sm"
                    />
                    <Select
                      value={rule.transactionTypeCode ?? "AUTO"}
                      onValueChange={(value) => {
                        if (value === "AUTO") {
                          setRules((prev) => prev.map((currentRule, currentIndex) => (
                            currentIndex === index
                              ? { ...currentRule, transactionType: null, transactionTypeCode: null }
                              : currentRule
                          )));
                          return;
                        }

                        const selectedOption = typeOptions.find((option) => option.code === value);
                        setRules((prev) => prev.map((currentRule, currentIndex) => (
                          currentIndex === index
                            ? {
                                ...currentRule,
                                transactionType: selectedOption?.baseType ?? null,
                                transactionTypeCode: selectedOption?.code ?? value,
                              }
                            : currentRule
                        )));
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Inferir pelo arquivo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AUTO">Inferir pelo arquivo</SelectItem>
                        {typeOptions.map((option) => (
                          <SelectItem key={option.code} value={option.code}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex justify-center">
                      <Switch checked={rule.extractTicker ?? false} onCheckedChange={(checked) => updateRule(index, "extractTicker", checked)} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => void removeRule(index)} className="h-8 w-8" disabled={deleteRuleLoading}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button type="button" variant="outline" onClick={addRule}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Regra
            </Button>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 sm:hidden">
          <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(isEditing ? `/banks/${id}` : "/banks")}>Cancelar</Button>
          <Button type="submit" disabled={submitting} className="flex-1 gap-1.5">
            <Save className="h-4 w-4" /> {submitting ? "Salvando..." : isEditing ? "Atualizar" : "Criar Banco"}
          </Button>
        </div>
      </form>

      <Dialog open={updateModeDialogOpen} onOpenChange={setUpdateModeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Como aplicar as alterações nas regras existentes?</DialogTitle>
            <DialogDescription>
              Essa escolha é obrigatória. Ela define se as transações já vinculadas serão atualizadas ou se o histórico será preservado com uma nova versão da regra.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <Button
              type="button"
              variant={selectedUpdateMode === TransactionClassificationRuleUpdateMode.UPDATE_LINKED_TRANSACTIONS ? "default" : "outline"}
              className="justify-start h-auto py-3"
              onClick={() => setSelectedUpdateMode(TransactionClassificationRuleUpdateMode.UPDATE_LINKED_TRANSACTIONS)}
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Atualizar todas as transações vinculadas
            </Button>
            <Button
              type="button"
              variant={selectedUpdateMode === TransactionClassificationRuleUpdateMode.CREATE_NEW_VERSION ? "default" : "outline"}
              className="justify-start h-auto py-3"
              onClick={() => setSelectedUpdateMode(TransactionClassificationRuleUpdateMode.CREATE_NEW_VERSION)}
            >
              <History className="mr-2 h-4 w-4" />
              Criar novo padrão e manter histórico
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateModeDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => void handleConfirmUpdateMode()} disabled={!selectedUpdateMode || submitting}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteRuleDialogOpen} onOpenChange={setDeleteRuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir regra de classificação?</DialogTitle>
            <DialogDescription>
              {deleteRuleUsage?.relatedTransactionsCount
                ? `Esta regra possui ${deleteRuleUsage.relatedTransactionsCount} transações vinculadas. A exclusão será lógica para preservar o histórico.`
                : "Esta regra não possui transações vinculadas. A exclusão será física."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {deleteRuleTarget?.id && id && deleteRuleUsage?.relatedTransactionsCount ? (
              <Button
                variant="outline"
                onClick={() => navigate(`/banks/transactions?bankId=${id}&ruleId=${deleteRuleTarget.id}`)}
              >
                Ver transações relacionadas
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setDeleteRuleDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => void handleConfirmRuleDelete()} disabled={deleteRuleLoading}>
              {deleteRuleLoading ? "Excluindo..." : "Excluir regra"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}