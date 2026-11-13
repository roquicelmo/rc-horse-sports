# Sorteios Lagoa

Aplicação Next.js para gestão de provas de laço em dupla, com Prisma,
PostgreSQL, autenticação Auth.js, sorteios persistentes, operação de pista e
relatórios.

## Desenvolvimento

```bash
npm install
npm run dev
```

O ambiente local precisa das variáveis definidas em `.env.example`. Para
autenticação local, configure também `AUTH_SECRET`.

## Build e produção

```bash
npm run build
npm run start
```

O deploy usa a configuração em [vercel.json](./vercel.json) e o diretório de
saída `.next`.

## Banco de dados

```bash
npm run db:generate
npm run db:validate
npm run db:migrate
npm run db:deploy
npm run db:seed
```

O schema e as migrations ficam em [prisma/](./prisma/).

## Documentação

- [Documentação técnica](./docs/technical.md)
- [Manual do usuário](./docs/user-manual.md)
