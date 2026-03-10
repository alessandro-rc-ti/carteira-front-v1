# Specs — Conta Bancária (v1)

Versão: 0.1
Data: 2026-03-09

## Objetivo

Definir a especificação para a implementação do menu "Contas Bancárias" com submenus "Transações" (contendo "Importação" e "Nova transação") e "Contas", rotas em `/banks/...`, UX/fluxos, stores e endpoints backend necessários para integração.

## Resumo

- Rota base: `/banks` (mantendo plural do projeto)
- Novas rotas propostas:
  - `/banks/transactions` — listagem de transações (filtros: bankId?, from?, to?, type?)
  - `/banks/transactions/import` — importação CSV (upload → análise → confirmar)
  - `/banks/transactions/new` — formulário para nova transação manual
  - `/banks/accounts` — listagem/gestão de contas bancárias

## Decisões chave

- Reutilizar componentes existentes sempre que possível: `TransactionUploadPage`, `TransactionManualPage`, `CsvImportSection`, `TransactionTable`, `BankListPage`.
- Rota principal: `/banks/...`; aceitar `?bankId=` para contexto por conta quando necessário.

## Frontend — Rotas e páginas

- Atualizar `src/router.tsx` adicionando as rotas listadas acima.
- Criar páginas wrapper:
  - `src/pages/BanksTransactionsPage.tsx` — combina `TransactionTable` + ações (Importar / Nova transação) e filtros.
  - `src/pages/BanksAccountsPage.tsx` — wrapper que reutiliza `BankListPage` ou exibe lista de contas.

## Menu / Layout

- Atualizar `src/components/Layout.tsx` para incluir item lateral "Contas Bancárias" com submenu:
  - Contas → `/banks/accounts`
  - Transações → `/banks/transactions`
    - Importação → `/banks/transactions/import`
    - Nova transação → `/banks/transactions/new`

UX: submenu colapsável com destaque quando rota ativa.

## Stores / Serviços

- `useBankStore` (atualizar/confirmar): `fetchBanks()`, `createBank()`, `updateBank()`, `deleteBank()`.
- `useTransactionStore`: `fetchTransactions({ bankId?, from?, to?, page?, size? })`, `importCsv(bankId, file)`, `createTransaction(payload)`, `deleteByFile(bankId, fileName)`.
- Services: `bankService`, `transactionService` com endpoints documentados abaixo.

## Backend — Endpoints mínimos (exemplos)

- GET `/api/v1/banks` — listar contas
- POST `/api/v1/banks` — criar conta
- GET `/api/v1/banks/{bankId}/transactions` — listar transações por conta
- POST `/api/v1/banks/{bankId}/transactions/import` — upload (multipart) retorna análise/preview
- POST `/api/v1/banks/{bankId}/transactions/import/confirm` — confirma import
- POST `/api/v1/banks/{bankId}/transactions` — criar transação manual
- DELETE `/api/v1/banks/{bankId}/transactions/by-file?fileName=` — deletar por arquivo

Exemplos de payloads e respostas devem seguir os padrões já utilizados no projeto (BigDecimal para valores, UUIDs para ids, metadata `fileName` e `fileChecksum`).

## Fluxos UX

- Importação: Upload → análise (preview com linhas problemáticas e unmapped descriptions) → confirm → resultado. Exibir `fileName` e checksum; prevenir duplicação.
- Nova transação: formulário com validações (quantity>0, price>0, currency compatível). Após criar, navegar/atualizar lista.
- Listagem: filtros por conta, período, tipo; ações por linha: editar, deletar, exportar.

## Critérios de Aceitação

- Upload + confirm → transações persistidas; reupload idêntico não duplica.
- Criação manual → aparece na listagem e afeta agregações.
- Deleção por `fileName` remove registros vinculados e atualiza portfólio.

## Arquivos a atualizar

- `src/router.tsx` — adicionar rotas
- `src/components/Layout.tsx` — menu lateral
- `src/pages/BanksTransactionsPage.tsx` — novo
- `src/pages/BanksAccountsPage.tsx` — novo (wrapper)
- `src/stores/*` — ajustar fetch/acoes conforme necessário

---

Fim do spec (v0.1)
