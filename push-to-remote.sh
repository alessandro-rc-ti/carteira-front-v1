#!/bin/sh
set -e

# Inicializa git se necessário
if [ ! -d .git ]; then
  git init
fi

git remote remove origin 2>/dev/null || true

git remote add origin git@github.com:alessandro-rc-ti/carteira-front-v1.git

git add .
git commit -m "feat: projeto carteira-front inicial (docker, vite, pt-br, shadcn, zustand, etc)" || true

git branch -M main
git push -u origin main

echo "\n✅ Frontend publicado em: https://github.com/alessandro-rc-ti/carteira-front-v1"
