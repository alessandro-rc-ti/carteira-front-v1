import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/shared";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { useBankStore } from "@/stores/bankStore";
import { useTransactionTypeStore } from "@/stores/transactionTypeStore";
import { useTransactionStore } from "@/stores/transactionStore";
import { showSuccess, showError } from "@/lib/toast";
import { buildTransactionTypeOptions, TransactionType, type TransactionTypeValue } from "@/types/transaction";

type ManualTransactionForm = {
  date: string;
  description: string;
  amount: string;
  type: TransactionTypeValue;
  typeCode: string;
};

export function TransactionManualPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams();
  const bankIdFromQuery = searchParams.get("bankId");
  const bankIdFromParams = (params as Record<string, string>)?.bankId;
  const bankId = bankIdFromQuery || bankIdFromParams || "";

  const { selectedBank, fetchBankById, fetchBanks } = useBankStore();
  const { items: transactionTypes, fetchAll: fetchTransactionTypes } = useTransactionTypeStore();
  const [form, setForm] = useState<ManualTransactionForm>({
    date: "",
    description: "",
    amount: "",
    type: TransactionType.EXPENSE,
    typeCode: TransactionType.EXPENSE,
  });
  const [loading, setLoading] = useState(false);
  const typeOptions = buildTransactionTypeOptions(transactionTypes);

  useEffect(() => {
    fetchBanks();
    if (bankId) fetchBankById(bankId);
    void fetchTransactionTypes();
  }, [bankId, fetchBanks, fetchBankById, fetchTransactionTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankId) {
      showError("Selecione um banco antes de cadastrar a transacao.");
      return;
    }
    setLoading(true);
    try {
      const state = useTransactionStore.getState() as unknown as Record<string, unknown>;
      const createFn = state.createTransaction as (id: string, payload: unknown) => Promise<unknown>;
      const created = await createFn(bankId, {
        date: form.date,
        description: form.description,
        amount: Number(form.amount),
        type: form.type,
        typeCode: form.typeCode,
      });
      if (created) {
        showSuccess("Transacao cadastrada com sucesso!");
        navigate(-1);
      } else {
        showError("Erro ao cadastrar transacao.");
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  if (!bankId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Cadastro Manual" description="Cadastre uma transacao manualmente">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </PageHeader>
        <Card className="max-w-lg">
          <CardContent className="pt-6 space-y-4">
            <p className="text-muted-foreground text-sm">
              E necessario selecionar um banco antes de cadastrar transacoes. Volte para a
              tela de Transacoes e selecione um banco.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => navigate(-1)}>Voltar</Button>
              <Button variant="outline" onClick={() => navigate("/banks/transactions")}>
                Ir para Transacoes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cadastro Manual"
        description={`Banco: ${selectedBank ? selectedBank.bankName : bankId}`}
      >
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </PageHeader>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Nova Transacao</CardTitle>
          <CardDescription>
            Preencha os dados para adicionar uma transacao manualmente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descricao do Extrato</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ex: PIX MERCADO CENTRAL ou SALARIO EMPRESA X"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0,00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={form.typeCode}
                onValueChange={(value) => {
                  const selectedOption = typeOptions.find((option) => option.code === value);
                  setForm({
                    ...form,
                    type: selectedOption?.baseType ?? TransactionType.EXPENSE,
                    typeCode: selectedOption?.code ?? TransactionType.EXPENSE,
                  });
                }}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.code} value={option.code}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {typeOptions.find((option) => option.code === form.typeCode)?.description}
              </p>
            </div>
            <Button className="w-full" disabled={loading} type="submit">
              <PlusCircle className="mr-2 h-4 w-4" />
              {loading ? "Salvando..." : "Salvar Transacao"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
