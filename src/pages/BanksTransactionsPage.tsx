import { useNavigate, useLocation } from "react-router-dom";
import { TransactionTable } from "@/components/TransactionTable";
import { useEffect, useState } from "react";
import { useBankStore } from "@/stores/bankStore";
import { useTransactionStore } from "@/stores/transactionStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlusCircle, Trash, FileText, MoreVertical } from "lucide-react";

export default function BanksTransactionsPage() {
  const navigate = useNavigate();
  const { banks, fetchBanks } = useBankStore();
  const { transactions, loading, error, fetchAll, fetchByBank, deleteByFile, deleteAll } = useTransactionStore();
  const location = useLocation();
  const [selectedBankId, setSelectedBankId] = useState<string>("ALL");
  const [showSelectBankModal, setShowSelectBankModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showDeleteByFileModal, setShowDeleteByFileModal] = useState(false);
  const [deleteFileName, setDeleteFileName] = useState("");
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  useEffect(() => {
    fetchBanks();
    // Initialize selected bank from query param if present
    const params = new URLSearchParams(location.search);
    const bankParam = params.get("bankId");
    if (bankParam) setSelectedBankId(bankParam);
  }, []);

  useEffect(() => {
    // update URL query string so selection is preserved on navigation
    const params = new URLSearchParams(location.search);
    if (selectedBankId && selectedBankId !== params.get("bankId")) {
      params.set("bankId", selectedBankId);
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    }

    if (selectedBankId === "ALL") {
      fetchAll();
    } else {
      fetchByBank(selectedBankId);
    }
  }, [selectedBankId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight uppercase">Transações</h1>
          <p className="text-slate-500 text-sm mt-1">Visualize e gerencie lançamentos por conta bancária</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Select value={selectedBankId} onValueChange={setSelectedBankId}>
            <SelectTrigger className="w-[220px] bg-white shadow-sm border-slate-200">
              <SelectValue placeholder="Filtrar por banco" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os bancos</SelectItem>
              {banks.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.bankName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                if (selectedBankId === "ALL") {
                  setShowSelectBankModal(true);
                } else {
                  navigate(`/banks/transactions/import?bankId=${selectedBankId}`);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm ${
                selectedBankId === "ALL"
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed hover:bg-slate-200"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
              aria-disabled={selectedBankId === "ALL"}
            >
              <FileText className="h-4 w-4" />
              Importar Extrato
            </Button>

            <Button
              onClick={() => {
                if (selectedBankId === "ALL") {
                  setShowSelectBankModal(true);
                } else {
                  navigate(`/banks/transactions/new?bankId=${selectedBankId}`);
                }
              }}
              className={`ml-2 flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm ${
                selectedBankId === "ALL"
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed hover:bg-slate-200"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
              aria-disabled={selectedBankId === "ALL"}
            >
              <PlusCircle className="h-4 w-4" />
              Nova Transação
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex h-10 w-10 p-0"
                  disabled={selectedBankId === "ALL"}
                >
                  <span className="sr-only">Abrir menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onSelect={() => setShowDeleteByFileModal(true)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  <span>Deletar por Arquivo</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600"
                  onSelect={() => setShowDeleteAllModal(true)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  <span>Deletar Todas</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Transações</CardTitle>
          <CardDescription>Filtros aplicáveis: por conta, período e tipo</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionTable
            transactions={transactions}
            loading={loading}
            error={error}
            showBankColumn={selectedBankId === "ALL"}
            showActions={true}
          />
        </CardContent>
      </Card>

      {/* Delete All Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border">
            <h3 className="text-lg font-bold text-red-700">Atenção — Excluir todas as transações</h3>
            <p className="mt-2 text-sm text-slate-600">Isso irá apagar todas as transações desta conta bancária. A operação é irreversível.</p>
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowDeleteAllModal(false)}>Cancelar</Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  setDeleteInProgress(true);
                  await deleteAll(selectedBankId);
                  setDeleteInProgress(false);
                  setShowDeleteAllModal(false);
                  // refresh
                  fetchByBank(selectedBankId);
                }}
                disabled={deleteInProgress}
              >
                Confirmar e apagar tudo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete By File Modal */}
      {showDeleteByFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border">
            <h3 className="text-lg font-bold">Deletar transações por arquivo</h3>
            <p className="mt-2 text-sm text-slate-600">Informe o nome do arquivo de origem para deletar somente transações importadas desse arquivo.</p>
            <div className="mt-4">
              <Input placeholder="Nome do arquivo (ex: extrato.csv)" value={deleteFileName} onChange={(e) => setDeleteFileName(e.target.value)} />
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowDeleteByFileModal(false)}>Cancelar</Button>
              <Button
                variant="destructive"
                disabled={!deleteFileName}
                onClick={async () => {
                  setDeleteInProgress(true);
                  await deleteByFile(selectedBankId, deleteFileName);
                  setDeleteInProgress(false);
                  setShowDeleteByFileModal(false);
                  setDeleteFileName("");
                  // refresh
                  fetchByBank(selectedBankId);
                }}
              >
                Deletar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de aviso para selecionar banco (quando botões estiverem desabilitados) */}
      {showSelectBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm relative border border-yellow-200">
            <button
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
              onClick={() => setShowSelectBankModal(false)}
              type="button"
              aria-label="Fechar aviso"
            >
              <span className="text-lg">×</span>
            </button>
            <div className="flex flex-col items-center gap-3">
              <h2 className="text-xl font-bold text-yellow-700 mb-1 text-center">Selecione um banco para continuar</h2>
              <p className="text-slate-600 text-center mb-2 max-w-xs">
                Para usar essa funcionalidade, selecione um banco específico no filtro acima.<br />
                O botão ficará habilitado após a seleção.
              </p>
              <button
                className="mt-2 px-5 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow"
                onClick={() => setShowSelectBankModal(false)}
                type="button"
                autoFocus
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
