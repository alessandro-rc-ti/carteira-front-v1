import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTransactionStore } from "@/stores/transactionStore";
import { useTransactionTypeStore } from "@/stores/transactionTypeStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared";
import { ArrowLeft } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import {
  buildTransactionTypeOptions,
  TRANSACTION_TYPE_OPTIONS,
  type Transaction,
  normalizeTransactionType,
  resolveTransactionTypeOption,
} from "@/types/transaction";

export default function TransactionEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { transactions, fetchAll, updateTransaction } = useTransactionStore();
  const { items: transactionTypes, fetchAll: fetchTransactionTypes } = useTransactionTypeStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Transaction>>({});
  const typeOptions = buildTransactionTypeOptions(transactionTypes);

  useEffect(() => {
    if (transactions.length === 0) fetchAll().finally(() => setLoading(false));
    else setLoading(false);
    void fetchTransactionTypes();
  }, [transactions, fetchAll, fetchTransactionTypes]);

  useEffect(() => {
    if (!loading && id) {
      const tx = transactions.find((t) => String(t.id) === String(id));
      if (tx) setForm({ ...tx });
    }
  }, [loading, id, transactions]);

  if (loading) return <div className="p-8 text-muted-foreground">Carregando...</div>;
  if (!id) return <div className="p-8 text-destructive">ID invalido</div>;

  const set = (k: keyof Transaction, v: string | number) =>
    setForm((s) => ({ ...s, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTransaction(String(form.id), {
        date: String(form.transactionDate ?? ""),
        description: String(form.originalDescription ?? ""),
        summaryDescription: String(form.summaryDescription ?? ""),
        amount: Number(form.amount ?? 0),
        type: normalizeTransactionType(form.type) ?? TRANSACTION_TYPE_OPTIONS[0].value,
        typeCode: typeof form.typeCode === "string" ? form.typeCode : undefined,
      });
      showSuccess("Transacao atualizada com sucesso");
      navigate(-1);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Erro ao salvar transacao");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar Transacao"
        description="Edite os dados da transacao selecionada"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </PageHeader>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Dados da Transacao</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5">
          <div className="space-y-2">
            <Label htmlFor="transactionDate">Data</Label>
            <Input
              id="transactionDate"
              type="date"
              value={form.transactionDate ?? ""}
              onChange={(e) => set("transactionDate", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="originalDescription">Descricao Original</Label>
            <Input
              id="originalDescription"
              value={form.originalDescription ?? ""}
              onChange={(e) => set("originalDescription", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="summaryDescription">Resumo</Label>
            <Input
              id="summaryDescription"
              value={form.summaryDescription ?? ""}
              onChange={(e) => set("summaryDescription", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={typeof form.typeCode === "string"
                ? form.typeCode
                : resolveTransactionTypeOption(transactionTypes, null, form.type)?.code}
              onValueChange={(value) => {
                const selectedOption = typeOptions.find((option) => option.code === value);
                setForm((current) => ({
                  ...current,
                  type: selectedOption?.baseType ?? current.type,
                  typeCode: selectedOption?.code ?? value,
                }));
              }}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option.code} value={option.code}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={String(form.amount ?? "")}
              onChange={(e) => set("amount", Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
