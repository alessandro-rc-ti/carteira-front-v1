import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useInvestmentStore } from "@/stores/investmentStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import {
  InvestmentCategory,
  InvestmentCategoryLabels,
  InvestmentOrderType,
  InvestmentOrderTypeLabels,
} from "@/types/investment";
import type { InvestmentRequest } from "@/types";

export function InvestmentFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    selectedInvestment,
    loading,
    fetchInvestmentById,
    createInvestment,
    updateInvestment,
    clearSelectedInvestment,
  } = useInvestmentStore();
  const isEditing = Boolean(id);

  // Form state
  const [ticker, setTicker] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [category, setCategory] = useState<string>(InvestmentCategory.STOCK);
  const [orderType, setOrderType] = useState<string>(InvestmentOrderType.COMPRA);
  const [institution, setInstitution] = useState("");
  const [brokerFee, setBrokerFee] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Computed total
  const computedTotal = (() => {
    const q = parseFloat(quantity);
    const p = parseFloat(unitPrice);
    if (!isNaN(q) && !isNaN(p) && q > 0 && p > 0) {
      return (q * p).toFixed(2);
    }
    return "";
  })();

  // Load investment for edit mode
  useEffect(() => {
    if (id) {
      fetchInvestmentById(id);
    }
    return () => clearSelectedInvestment();
  }, [id, fetchInvestmentById, clearSelectedInvestment]);

  // Populate form when investment is loaded
  useEffect(() => {
    if (isEditing && selectedInvestment) {
      setTicker(selectedInvestment.ticker);
      setQuantity(String(selectedInvestment.quantity));
      setUnitPrice(String(selectedInvestment.unitPrice));
      setPurchaseDate(selectedInvestment.purchaseDate);
      setCategory(selectedInvestment.category);
      setOrderType(selectedInvestment.orderType);
      setInstitution(selectedInvestment.institution);
      setBrokerFee(selectedInvestment.brokerFee != null ? String(selectedInvestment.brokerFee) : "");
      setNotes(selectedInvestment.notes ?? "");
    }
  }, [isEditing, selectedInvestment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ticker.trim()) {
      toast.error("Ticker é obrigatório");
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }
    if (!unitPrice || parseFloat(unitPrice) <= 0) {
      toast.error("Preço unitário deve ser maior que zero");
      return;
    }
    if (!purchaseDate) {
      toast.error("Data da compra é obrigatória");
      return;
    }
    if (!institution.trim()) {
      toast.error("Instituição é obrigatória");
      return;
    }

    const request: InvestmentRequest = {
      ticker: ticker.trim().toUpperCase(),
      quantity: parseFloat(quantity),
      unitPrice: parseFloat(unitPrice),
      totalPrice: computedTotal ? parseFloat(computedTotal) : null,
      purchaseDate,
      category: category as InvestmentRequest["category"],
      orderType: orderType as InvestmentRequest["orderType"],
      institution: institution.trim(),
      brokerFee: brokerFee ? parseFloat(brokerFee) : null,
      notes: notes.trim() || null,
    };

    setSubmitting(true);
    try {
      if (isEditing && id) {
        await updateInvestment(id, request);
        toast.success("Investimento atualizado com sucesso");
        navigate("/investments/transactions");
      } else {
        await createInvestment(request);
        toast.success("Investimento criado com sucesso");
        navigate("/investments/transactions");
      }
    } catch {
      toast.error(isEditing ? "Falha ao atualizar investimento" : "Falha ao criar investimento");
    } finally {
      setSubmitting(false);
    }
  };

  if (isEditing && loading && !selectedInvestment) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Carregando investimento...
      </div>
    );
  }

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => navigate("/investments/transactions")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight uppercase">
            {isEditing ? "Editar Investimento" : "Novo Investimento"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isEditing
              ? "Altere os dados do investimento"
              : "Preencha os dados para cadastrar um novo investimento"}
          </p>
        </div>
      </div>

      {/* Dados Principais */}
      <Card>
        <CardHeader>
          <CardTitle>Dados do Investimento</CardTitle>
          <CardDescription>
            Informe o ticker, quantidade, preço e demais dados da operação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticker">Ticker *</Label>
              <Input
                id="ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="Ex: ITSA3, HGLG11"
                required
                className="font-mono uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(InvestmentCategoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderType">Tipo de Ordem *</Label>
              <Select value={orderType} onValueChange={setOrderType}>
                <SelectTrigger id="orderType">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(InvestmentOrderTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                step="any"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ex: 100"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Preço Unitário (R$) *</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="Ex: 9.85"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalPrice">Preço Total (R$)</Label>
              <Input
                id="totalPrice"
                value={computedTotal ? formatCurrency(computedTotal) : ""}
                readOnly
                disabled
                className="bg-slate-50 font-medium"
                placeholder="Calculado automaticamente"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Data da Compra *</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="institution">Instituição *</Label>
              <Input
                id="institution"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Ex: Inter, XP, Nubank"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brokerFee">Taxa de Corretagem (R$)</Label>
              <Input
                id="brokerFee"
                type="number"
                step="0.01"
                min="0"
                value={brokerFee}
                onChange={(e) => setBrokerFee(e.target.value)}
                placeholder="Ex: 4.90"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações opcionais sobre este investimento..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/investments/transactions")}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            "Salvando..."
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? "Atualizar Investimento" : "Criar Investimento"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
