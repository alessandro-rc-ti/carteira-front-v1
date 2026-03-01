# Carteira Frontend

Frontend do Super App de Finanças Pessoais e Investimentos (PFM/Wealth) — Projeto Carteira.

## Tecnologias
- React + Vite + TypeScript
- Tailwind CSS v4
- Shadcn/UI
- Zustand (state)
- Axios (API)
- @tanstack/react-table
- Recharts
- Docker (dev/prod)

## Funcionalidades
- Cadastro e edição de bancos/configurações CSV
- Importação de extratos CSV com análise automática
- Mapeamento manual de descrições
- Visualização de padrões de sumarização
- UI 100% em português (código em inglês)

## Desenvolvimento
```sh
# Subir ambiente dev (hot reload via Docker)
make dev-up-front
# ou manualmente
cd carteira_front
npm install
npm run dev
```

Acesse: http://localhost:5173

## Produção
```sh
# Build de produção
npm run build
# Gerar imagem Docker
cd carteira_front
docker build -t carteira-front:prod .
```

## Docker Compose (dev)
O serviço `front` já está integrado ao docker-compose do backend.

## Variáveis de ambiente
- `VITE_API_BASE_URL` (default: http://localhost:8080/api/v1)

## Scripts úteis
- `push-to-remote.sh` — publica o projeto neste repositório

## Repositório
https://github.com/alessandro-rc-ti/carteira-front-v1

---

> Projeto open source. Para dúvidas, abra uma issue.
