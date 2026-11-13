# Sorteios Lagoa — documentação técnica

## 1. Visão geral

Sorteios Lagoa é uma aplicação web para gestão de provas de laço em dupla:

- cadastro persistente de atletas e arenas;
- criação e administração de provas;
- inscrições por prova;
- geração persistente de sorteios;
- operação de pista e lançamento de tempos;
- locução;
- publicação de resultados;
- relatórios administrativos;
- autenticação, papéis e isolamento por proprietário.

A aplicação não possui mais modo protótipo em runtime. Os dados operacionais são
consultados e alterados por API e persistidos em PostgreSQL.

## 2. Stack e execução

- Next.js 16, com App Router para a aplicação web;
- React 19 e TypeScript;
- Tailwind CSS 4;
- componentes React reutilizáveis em `src/components`;
- Prisma 6.19.0;
- PostgreSQL;
- Auth.js Core 0.41.3 com Prisma Adapter;
- `bcryptjs` para verificação de senhas;
- Zod para validação de payloads;
- Vercel para deploy;
- Google reCAPTCHA no formulário público de solicitação de acesso.

Comandos principais:

```bash
npm run dev       # Next em desenvolvimento
npm run build     # prisma generate + next build
npm run start     # inicia o build de produção
npm run lint      # oxlint

npm run db:generate
npm run db:validate
npm run db:migrate
npm run db:deploy
npm run db:seed
```

O build de produção é definido em [package.json](../package.json). A página
principal é renderizada por [app/page.tsx](../app/page.tsx), que reutiliza o
shell client-side de [src/App.tsx](../src/App.tsx). O layout e os metadados
ficam em [app/layout.tsx](../app/layout.tsx).

## 3. Arquitetura de pastas

```text
app/
  layout.tsx                 Layout global, metadata e CSS
  page.tsx                   Entrada da aplicação

pages/api/
  [...path].ts               Gateway das APIs de domínio
  auth/[...path].ts          Auth.js
  auth/callback/[provider].ts

src/
  App.tsx                    Shell autenticado e navegação da aplicação
  auth/session.ts            Cliente de login, sessão, logout e solicitação
  components/                Telas e componentes de operação
  server/
    auth.ts                  Configuração Auth.js e leitura da sessão
    next-auth-handler.ts     Adaptador Auth.js para Next Pages API
    next-data-gateway.ts     Roteamento das APIs de domínio
    permissions.ts           Regras de papéis e permissões
    prisma.ts                Cliente Prisma
    routes/                  Handlers de domínio
  types/                     Tipos de eventos e sorteios
  utils/drawAlgorithm.ts     Algoritmo de cruzamento
  index.css                  Tokens visuais e estilos de impressão

prisma/
  schema.prisma              Modelo PostgreSQL
  migrations/                Histórico de migrations
  seed.ts                    Seed idempotente

docs/
  technical.md               Esta documentação
  user-manual.md             Manual operacional
```

Os arquivos `api/`, `index.html` e `vite.config.ts` da arquitetura Vite/Vercel
anterior foram removidos. O roteamento de API agora pertence ao Next.

## 4. API no Next.js

O Next expõe uma única rota catch-all para os endpoints de domínio:

[`pages/api/[...path].ts`](../pages/api/[...path].ts) delega para
[`src/server/next-data-gateway.ts`](../src/server/next-data-gateway.ts).
O gateway transforma o caminho público em um handler de
[`src/server/routes/`](../src/server/routes/) e preserva `req.body`, método,
headers e parâmetros.

Autenticação usa:

- [`pages/api/auth/[...path].ts`](../pages/api/auth/[...path].ts);
- [`pages/api/auth/callback/[provider].ts`](../pages/api/auth/callback/[provider].ts);
- [`src/server/next-auth-handler.ts`](../src/server/next-auth-handler.ts);
- [`src/server/auth.ts`](../src/server/auth.ts).

Não há mais rewrites em `vercel.json`. Isso elimina a arquitetura anterior de
várias funções independentes e deixa o Next controlar o empacotamento das APIs.

### Endpoints implementados

#### Autenticação e acesso

```text
GET    /api/auth/session
GET    /api/auth/csrf
POST   /api/auth/callback/credentials
POST   /api/auth/signout

POST   /api/access-requests
GET    /api/access-requests
PATCH  /api/access-requests
```

#### Atletas

```text
GET    /api/athletes
POST   /api/athletes
GET    /api/athletes/:id
PATCH  /api/athletes/:id
DELETE /api/athletes/:id
```

#### Arenas

```text
GET    /api/arenas
POST   /api/arenas
GET    /api/arenas/:id
PATCH  /api/arenas/:id
DELETE /api/arenas/:id
```

Exclusões de atletas e arenas são desativações lógicas quando aplicável.

#### Provas

```text
GET    /api/events
POST   /api/events
GET    /api/events/:eventId
PATCH  /api/events/:eventId
DELETE /api/events/:eventId
```

#### Inscrições

```text
GET    /api/events/:eventId/registrations
POST   /api/events/:eventId/registrations
DELETE /api/events/:eventId/registrations/:registrationId
```

#### Sorteio e pista

```text
GET    /api/events/:eventId/draws
POST   /api/events/:eventId/draws
PATCH  /api/runs/:runId/times
POST   /api/events/:eventId/results/publish
```

#### Usuários e relatórios

```text
GET    /api/users
POST   /api/users
GET    /api/users/:id
PATCH  /api/users/:id
DELETE /api/users/:id

GET    /api/reports/overview
```

Todas as rotas protegidas verificam a sessão no servidor antes de consultar ou
alterar o banco. Uma chamada sem sessão retorna `401`.

## 5. Banco de dados e domínio

O contrato persistente está em [prisma/schema.prisma](../prisma/schema.prisma).
As migrations principais são:

- `20261111030000_init`: domínio inicial;
- `20261113030000_add_access_requests`: solicitações públicas de acesso;
- `20261113052510_add_user_roles_and_ownership`: papéis, validade, gestão e
  propriedade dos dados.

Entidades principais:

- `User`: conta, papel, status, validade e gestor;
- `AccessRequest`: solicitação pública pendente, aprovada ou recusada;
- `Account`, `Session`, `VerificationToken`: suporte ao adapter do Auth.js;
- `Athlete`: cadastro reutilizável de atleta;
- `Arena`: local de realização;
- `Event`: prova, data, status, arena e proprietário;
- `EventRegistration`: vínculo atleta/prova;
- `Draw`: versão e configuração do sorteio;
- `Run`: dupla, bateria, rodada e status da corrida;
- `RunTime`: tempo por boi;
- `AuditLog`: histórico de ações do domínio.

O Prisma usa `DATABASE_URL_POOLED` no runtime e `DATABASE_URL` como conexão
direta para migrations. Variáveis e credenciais não devem ser commitadas.

## 6. Autenticação e sessão

O login usa Auth.js Credentials Provider:

1. o cliente solicita CSRF;
2. envia e-mail e senha para o callback Credentials;
3. o servidor busca o usuário por e-mail;
4. `bcryptjs` compara a senha com `passwordHash`;
5. usuários inativos ou expirados são recusados;
6. o Auth.js cria sessão JWT em cookie;
7. `/api/auth/session` restaura a sessão após reload.

O logout chama `/api/auth/signout`, remove a sessão e retorna à tela de login.
Senhas nunca são armazenadas em texto puro.

## 7. Papéis, permissões e propriedade

Papéis de negócio:

| Papel | Permissões |
| --- | --- |
| `ADMIN` | Acesso completo, incluindo gerenciamento de usuários |
| `MANAGER` | Acesso operacional completo; pode habilitar/bloquear provisórios, mas não cria, edita ou exclui usuários |
| `USER` | Acessa e mantém seus próprios atletas, arenas, provas, inscrições e histórico |

O schema mantém papéis legados para compatibilidade (`ORGANIZER`,
`TRACK_OPERATOR`, `ANNOUNCER`, `JUDGE`, `ATHLETE`, `VIEWER`), mas as telas
principais usam `ADMIN`, `MANAGER` e `USER`.

Ownership:

- `Athlete.ownerId`;
- `Arena.ownerId`;
- `Event.createdById`.

Admin e Manager podem consultar todos os proprietários, criar cadastros em nome
de um proprietário e filtrar os dados. User recebe somente o próprio escopo.
As verificações são feitas no servidor, inclusive em inscrições, sorteios,
tempos e resultados.

## 8. Solicitação e habilitação de acesso

O formulário público da tela de login recebe:

- nome;
- telefone;
- e-mail;
- token do Google reCAPTCHA.

O servidor valida o reCAPTCHA usando `RECAPTCHA_SECRET_KEY`, recusa solicitações
pendentes duplicadas e cria `AccessRequest`.

Admin ou Manager podem:

1. visualizar a fila;
2. aprovar definindo uma senha inicial;
3. criar o usuário provisório inativo;
4. habilitar o acesso;
5. bloquear posteriormente;
6. recusar a solicitação.

Variáveis necessárias:

```env
AUTH_SECRET=...
DATABASE_URL=...
DATABASE_URL_POOLED=...
VITE_RECAPTCHA_SITE_KEY=...
RECAPTCHA_SECRET_KEY=...
```

## 9. Fluxos operacionais implementados

### Provas e inscrições

O cadastro permite criar ou reutilizar uma arena, criar/editar uma prova,
consultar proprietário, status, inscrições e corridas. Inscrições são
persistidas por prova e podem ser canceladas sem apagar o atleta global.

### Sorteio

O servidor consulta inscrições ativas, executa o algoritmo de cruzamento,
cria nova versão de `Draw` e grava cada dupla como `Run`. A versão mais recente
é recuperada após reload.

### Pista e locução

O operador registra tempos por corrida e por boi. O servidor faz upsert em
`RunTime`, recalcula total/média e atualiza o status da corrida. A tela do
locutor apresenta a fila persistida e o progresso da prova.

### Resultados

Resultados ordenam as duplas pela média final, separam NTs e pendências e só
podem ser publicados quando não há corridas pendentes. Publicar marca o sorteio
como `PUBLISHED` e a prova como `FINISHED`.

### Relatórios e impressão

`/api/reports/overview` agrega provas, atletas, arenas, sorteios e corridas,
com filtros por proprietário, status e intervalo de datas. Relatórios e
resultados possuem impressão A4 via `window.print()` e CSS específico, sem
dependência de biblioteca de PDF.

## 10. Interface e navegação

A aplicação usa tema claro e minimalista, com tokens em
[src/index.css](../src/index.css), sidebar responsiva, drawer mobile, estados
de carregamento, vazios e erros.

Seções:

- Painel geral;
- Provas e arenas;
- Cadastro de atletas;
- Minha agenda;
- Usuários;
- Relatórios;
- Novo sorteio;
- detalhes da prova, inscrições, pista, locução e resultado.

A navegação atual é orquestrada pelo shell React. As APIs e o banco são reais;
a evolução futura pode transformar cada seção em uma rota App Router dedicada
sem alterar o contrato de domínio.

## 11. Seed e produção

[prisma/seed.ts](../prisma/seed.ts) é idempotente e pode criar/atualizar:

- usuário administrador;
- atletas de referência;
- arenas;
- seis provas iniciais.

O e-mail e a senha do seed vêm de `SEED_ADMIN_EMAIL` e
`SEED_ADMIN_PASSWORD`. A senha não fica no código.

Antes do deploy:

1. configurar variáveis na Vercel;
2. executar migrations;
3. executar o build;
4. validar login, sessão, logout e APIs protegidas;
5. confirmar a publicação pública.

## 12. Estado atual e pendências

Implementado:

- autenticação real com sessão persistente;
- logout;
- papéis e permissões;
- ownership e filtros administrativos;
- solicitação de acesso com aprovação;
- CRUD de atletas, arenas, provas e usuários;
- inscrições persistentes;
- sorteio persistente;
- tempos, locução e resultados;
- relatórios e impressão;
- tema claro;
- migração de Vite para Next.js;
- build Next validado;
- APIs protegidas com `401` sem sessão.

Pendências de operação:

- configurar e testar as chaves reais do reCAPTCHA na Vercel;
- criar contas reais separadas para validar Manager e User em produção;
- executar homologação completa de criação, sorteio, tempos e publicação em
  ambiente produtivo;
- adicionar rate limiting e observabilidade para uso público;
- revisar avisos de lint existentes;
- considerar rotas App Router individuais para cada seção visual.
