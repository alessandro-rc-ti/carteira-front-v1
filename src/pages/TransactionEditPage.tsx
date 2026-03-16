import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTransactionStore } from "@/stores/transactionStore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function TransactionEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { transactions, fetchAll, updateTransaction } = useTransactionStore();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    // ensure transactions loaded
    if (transactions.length === 0) fetchAll().finally(() => setLoading(false));
    else setLoading(false);
  }, [transactions, fetchAll]);

  useEffect(() => {
    if (!loading && id) {
      const tx = transactions.find((t) => String(t.id) === String(id));
      if (tx) setForm({ ...tx });
    }
  }, [loading, id, transactions]);

  if (loading) return <div>Carregando...</div>;
  if (!id) return <div>ID inválido</div>;

  const handleChange = (k: string, v: any) => setForm((s: any) => ({ ...s, [k]: v }));

  const handleSave = async () => {
    try {
      await updateTransaction(form.id, form);
      navigate(-1);
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar");
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Editar Transação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 max-w-2xl">
            <label className="text-sm">Data</label>
            <Input value={form.transactionDate ?? ""} onChange={(e: any) => handleChange("transactionDate", e.target.value)} />

            <label className="text-sm">Descrição Original</label>
            <Input value={form.originalDescription ?? ""} onChange={(e: any) => handleChange("originalDescription", e.target.value)} />

            <label className="text-sm">Resumo</label>
            <Input value={form.summaryDescription ?? ""} onChange={(e: any) => handleChange("summaryDescription", e.target.value)} />

            <label className="text-sm">Valor</label>
            <Input value={String(form.amount ?? "")} onChange={(e: any) => handleChange("amount", Number(e.target.value))} />

            <div className="flex gap-2 mt-3">
              <Button onClick={handleSave}>Salvar</Button>
              <Button variant="ghost" onClick={() => navigate(-1)}>Cancelar</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
