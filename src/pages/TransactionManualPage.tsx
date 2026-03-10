import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function TransactionManualPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    date: "",
    description: "",
    amount: "",
    type: "income",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Implementar envio para backend
    setTimeout(() => {
      setLoading(false);
      alert("Transação cadastrada com sucesso!");
      navigate(-1);
    }, 1200);
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white rounded-xl shadow p-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Button>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight uppercase">Cadastro Manual</h1>
      </div>
      <p className="text-slate-500 mb-6 text-sm">Preencha os dados para adicionar uma transação manualmente ao banco selecionado.</p>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          required
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
        <input
          type="text"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Descrição"
          required
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
        <input
          type="number"
          name="amount"
          value={form.amount}
          onChange={handleChange}
          placeholder="Valor"
          required
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="w-full border rounded-md px-3 py-2 text-sm"
        >
          <option value="income">Receita</option>
          <option value="expense">Despesa</option>
        </select>
        <Button
          className="w-full flex items-center gap-2 justify-center bg-blue-600 hover:bg-blue-700"
          disabled={loading}
          type="submit"
        >
          <PlusCircle className="h-4 w-4" />
          {loading ? "Salvando..." : "Salvar Transação"}
        </Button>
      </form>
    </div>
  );
}
