# Carteira Frontend

Frontend React/Vite do projeto Carteira.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- Shadcn/UI
- Zustand
- Axios
- TanStack Table
- Recharts

## Execução

O fluxo oficial está em [../MANUAL_AMBIENTES.md](../MANUAL_AMBIENTES.md).

Comandos mais usados a partir da raiz:

```bash
make dev-up-front
make logs-front
make front-install PKG=recharts
make front-npm CMD="run build"
```

Em desenvolvimento, o frontend responde por padrão em:

- `http://localhost:5173`

Em produção local com Docker Compose:

- `http://localhost`

## Variável principal

- `VITE_API_BASE_URL`

Essa variável deve ser configurada no `.env.dev`.
