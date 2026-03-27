# Carteira Frontend

Referência central: ver `../.github/copilot-instructions.md`.

## Escopo
Aplicação React/Vite em TypeScript para interface, navegação e consumo da API do backend.

## Convenções do Frontend
- Páginas ficam em `src/pages` e seguem o padrão `*Page.tsx`.
- Componentes reutilizáveis ficam em `src/components`; componentes de base e UI ficam em `src/components/ui`.
- Estado global e fluxos compartilhados ficam em `src/stores` com Zustand.
- Integrações HTTP passam por `src/services/api.ts` e serviços do diretório `src/services`.
- Preserve o design system existente com Tailwind + Shadcn/UI; evite criar padrões paralelos sem necessidade.
- Textos de interface com vocação multilíngue devem considerar os arquivos em `public/locales`.

## Build e Testes
- Preferir a partir da raiz: `make dev-up-front`, `make front-npm CMD="run build"`, `make logs-front`.
- Comandos diretos: `npm --prefix carteira_front run build` e `npm --prefix carteira_front run lint`.

## Referências
- Execução e ambiente: `../MANUAL_AMBIENTES.md`
- Visão do módulo: `README.md`
- Stack e padrões gerais: `../.github/tech-dna.md`

