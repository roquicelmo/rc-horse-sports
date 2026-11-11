# Sorteios Lagoa — documentação técnica

## Visão geral

O produto é uma plataforma de gestão de provas de laço em dupla, com cadastro de atletas, inscrições, geração de sorteios, operação de pista e publicação de resultados.

O frontend atual é um protótipo React/Vite. A evolução planejada mantém o algoritmo de sorteio e substitui o estado local por uma API persistente em PostgreSQL, usando Prisma ORM e implantação na Vercel.

## Plano de ação por blocos

### Bloco 1 — Fundação e contrato do domínio

- Definir o domínio persistente em Prisma/PostgreSQL.
- Documentar arquitetura, rotas e responsabilidades.
- Criar configuração segura para ambientes local, preview e produção.
- Preservar o protótipo atual enquanto a API ainda não existe.

### Bloco 2 — Identidade e acesso

- Criar login, logout, recuperação de senha e sessão persistente.
- Implementar usuários, papéis e permissões.
- Proteger rotas e operações no servidor.
- Registrar auditoria das ações administrativas.

Durante a transição, a autenticação será preparada sem bloquear o protótipo:
o frontend continua acessível até que `DATABASE_URL`, `AUTH_SECRET` e a migration
de autenticação estejam configurados em cada ambiente.

### Bloco 3 — Tema e sistema visual

- Migrar o tema atual escuro para um tema claro, minimalista e orientado à operação.
- Adotar tokens de cor, tipografia, espaçamento, foco e estados.
- Introduzir componentes reutilizáveis no padrão shadcn/ui, Radix ou equivalente.
- Revisar responsividade, acessibilidade, estados vazios, carregamento e erros.

### Bloco 4 — Cadastro e provas

- Implementar CRUD de arenas, provas e atletas.
- Separar atleta cadastrado de atleta inscrito em uma prova.
- Implementar status, busca, filtros e edição.
- Criar a agenda do atleta e a visão administrativa da prova.

### Bloco 5 — Sorteio persistente

- Persistir configurações, versões e corridas geradas.
- Validar as regras no servidor antes de publicar o sorteio.
- Permitir reabertura e versionamento controlado.
- Migrar o algoritmo existente para uma camada de domínio testável.

### Bloco 6 — Operação de pista e resultados

- Criar tela de corrida atual e próxima corrida.
- Registrar tempos, NT, ausências e eliminações.
- Criar modo locutor e modo público.
- Publicar resultados e exportar súmulas.

### Bloco 7 — Qualidade e produção

- Testes unitários, integração e fluxo crítico.
- Observabilidade, logs e tratamento de erros.
- Backups, auditoria e políticas de retenção.
- Validação de deploy, migrations e ambientes na Vercel.

## Stack alvo

- React + TypeScript + Vite no frontend atual.
- Tailwind CSS para tokens e composição visual.
- shadcn/ui/Radix ou componentes equivalentes para primitives acessíveis.
- API TypeScript compatível com funções serverless da Vercel.
- Prisma ORM.
- PostgreSQL gerenciado compatível com Vercel.
- Validação de entrada com Zod.
- Autenticação baseada em sessão segura ou solução equivalente compatível com Vercel.
- Auth.js Core e Prisma Adapter como base da integração de credenciais e sessão.

## Estrutura atual

```text
src/
  components/       Componentes do wizard e da súmula
  data/             Seed inicial importado e dados de transição
  types/            Tipos do domínio do sorteio
  utils/            Algoritmo e cálculos
  App.tsx           Orquestração atual em estado local
  index.css         Tokens globais e impressão
prisma/
  schema.prisma     Modelo persistente alvo
docs/
  technical.md     Arquitetura e plano para desenvolvedores
  user-manual.md   Manual operacional não técnico
```

## Rotas planejadas

No shell atual, a navegação principal é feita por uma sidebar persistente no desktop,
com drawer no mobile. A seleção ainda é controlada pelo estado do frontend e será
substituída por rotas reais quando a autenticação e a API forem conectadas.

| Menu da sidebar | Seção atual |
| --- | --- |
| Painel geral | `dashboard` |
| Provas e arenas | `events` |
| Cadastro de atletas | `athletes` |
| Minha agenda | `agenda` |
| Usuários | `users` |
| Novo sorteio | `draw` |

| Rota | Responsabilidade |
| --- | --- |
| `/login` | Autenticação |
| `/` | Painel geral |
| `/provas` | Lista e criação de provas |
| `/provas/:eventId` | Detalhes e inscrições |
| `/provas/:eventId/sorteio` | Configuração e sorteio |
| `/provas/:eventId/pista` | Operação da pista |
| `/provas/:eventId/resultado` | Resultado publicado |
| `/atletas` | Cadastro global de atletas |
| `/agenda` | Agenda por atleta e prova |
| `/usuarios` | Administração de usuários |

## Endpoints da API

Os endpoints abaixo formam o contrato da API. Os endpoints de inscrições já estão
implementados nos handlers serverless correspondentes; os demais permanecem como
próximos módulos.

```text
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/session

GET    /api/events
POST   /api/events
GET    /api/events/:eventId
PATCH  /api/events/:eventId
DELETE /api/events/:eventId

GET    /api/athletes
POST   /api/athletes
GET    /api/athletes/:athleteId
PATCH  /api/athletes/:athleteId
DELETE /api/athletes/:athleteId

GET    /api/events/:eventId/registrations
POST   /api/events/:eventId/registrations
DELETE /api/events/:eventId/registrations/:registrationId

POST   /api/events/:eventId/draws
GET    /api/events/:eventId/draws
GET    /api/events/:eventId/draws/:drawId
POST   /api/events/:eventId/draws/:drawId/publish

PATCH  /api/runs/:runId/times
POST   /api/events/:eventId/results/publish
GET    /api/events/:eventId/audit-logs
```

## Persistência e segurança

- Senhas nunca serão armazenadas em texto puro.
- Dados de ambiente ficam apenas em `.env` local ou secrets da Vercel.
- `.env.example` contém nomes de variáveis, nunca valores reais.
- Alterações de resultado devem registrar usuário, data, valor anterior e novo valor.
- Regras críticas serão revalidadas no backend.
- Migrations Prisma serão executadas no pipeline de deploy de forma explícita.

## Desenvolvimento local

1. Copiar `.env.example` para `.env`.
2. No Vercel Postgres, usar a URL pooled para `DATABASE_URL` em runtime e a
   `POSTGRES_URL_NON_POOLING` temporariamente para migrations, quando disponível.
3. Executar `npm run db:deploy` em preview/produção ou `npx prisma migrate dev` em desenvolvimento.
4. Executar `npm run dev`.

O frontend atual continua funcional sem banco durante a transição. O uso de dados mock será removido quando o fluxo persistente do Bloco 4 estiver concluído.

### Vercel Postgres

- As variáveis do banco devem ser cadastradas nos ambientes Development, Preview e Production
  da Vercel, sem entrar no repositório.
- `DATABASE_URL` deve apontar para a conexão de runtime.
- A migration inicial está em `prisma/migrations/20261111030000_init`.
- O deploy deve executar `npm run db:deploy` antes de disponibilizar as funções autenticadas.

## Registro de decisões

- O tema alvo é claro e minimalista, com fundo quase branco, azul-marinho, laranja de ação
  e verde-petróleo para priorizar leitura, operação rápida e impressão.
- O domínio será relacional porque provas, inscrições, atletas, corridas e resultados possuem relacionamentos e histórico.
- O algoritmo existente será reaproveitado, mas a geração oficial deverá ser validada e persistida no servidor.
- A documentação deve ser atualizada no mesmo bloco em que uma rota, entidade ou comportamento for alterado.

## Status de implementação

### Bloco 2 — tema claro e sistema visual (em andamento)

- Tokens de superfície, texto, borda e marca adicionados em `src/index.css`.
- Paleta refinada para marfim, azul-petróleo e âmbar queimado, substituindo o cinza frio nos elementos de contexto.
- Compatibilidade visual temporária criada para as classes escuras do protótipo.
- Primitive `Button` criada em `src/components/ui/Button.tsx`.
- Modal de novo competidor já utiliza a primitive de botão.
- Dashboard inicial criado em `src/components/Dashboard.tsx`, com estado vazio explícito e sem provas fictícias.
- Ações de demonstração e chips de busca de teste removidos da operação.
- Sidebar criada em `src/components/Sidebar.tsx`, integrada ao shell principal com estado ativo e drawer mobile.
- Estados vazios de seções ainda não persistidas centralizados em `src/components/SectionPlaceholder.tsx`.
- Cadastro de atletas ganhou uma tela operacional em `src/components/AthletesPage.tsx`,
  com busca, contagem, inclusão pelo modal existente e remoção local durante a transição.
- Cadastro inicial importado do sistema de referência em `src/data/referenceAthletes.ts`;
  os registros mantêm número de inscrição, nome, cidade e handicaps de cabeça/pé quando disponíveis.
- Tela de provas e arenas criada em `src/components/EventsPage.tsx`, com seis eventos
  iniciais importados para orientar a futura persistência.
- Tela de detalhes criada em `src/components/EventDetailsPage.tsx`, ligada aos cartões
  da lista e preparada para inscrições, sorteio, locução e resultado.
- Tela de inscrições criada em `src/components/RegistrationPage.tsx`, com seleção de
  atleta, função de cabeceiro/pezeiro, contadores, remoção e estado local de transição.
- O fluxo de inscrições é aberto a partir dos detalhes da prova e usa a coleção
  `EventRegistration` do Prisma. A tela usa a API quando há sessão e banco disponíveis;
  em ambientes sem essa infraestrutura, deixa explícito que os dados são locais.
- A aplicação passou a consultar `GET /api/athletes` e `GET /api/events` na inicialização.
  Quando a API responde com dados válidos, os cadastros persistidos substituem os seeds;
  quando o ambiente ainda não possui sessão ou banco, os dados de referência permanecem
  disponíveis como fallback identificado.
- O endpoint `GET /api/events` expõe provas, arena, responsável e contagens para alimentar
  a lista operacional.
- CRUD de provas iniciado: `POST /api/events`, `PATCH /api/events/:eventId` e
  `DELETE /api/events/:eventId`. A exclusão é cancelamento lógico para preservar inscrições,
  sorteios e histórico.
- O formulário de prova em `src/components/EventsPage.tsx` cria arena e prova no mesmo
  fluxo, permite editar nome/data e usa fallback local quando a API não está disponível.
- CRUD de arenas adicionado em `api/arenas/index.ts` e `api/arenas/[id].ts`, com
  listagem, criação idempotente, edição e desativação lógica.
- O cadastro de provas consulta arenas ativas e permite reutilizar uma arena existente
  ou criar uma nova, evitando duplicações por nome, cidade e UF.
- Seed idempotente criado em `prisma/seed.ts`, com usuário administrador, 66 atletas,
  arenas derivadas e seis provas de referência. A senha do usuário seed nunca fica no
  código: deve ser fornecida por `SEED_ADMIN_PASSWORD`.
- Cliente Auth.js corrigido para usar `/api/auth/csrf`, `/api/auth/callback/credentials`
  e `/api/auth/signout`, mantendo cookies e proteção CSRF no fluxo real de login.
- Prisma usa `DATABASE_URL` para runtime pooled e `DIRECT_URL` para migrations. As
  credenciais nunca devem ser commitadas, documentadas ou enviadas em mensagens.
- Próximo passo: migrar as listas, configuração e súmula para classes semânticas e remover a camada de compatibilidade.

### Bloco 2 — identidade e acesso (fundação iniciada)

- Dependências `@auth/core`, `@auth/prisma-adapter` e `zod` adicionadas.
- Modelos `Account`, `Session` e `VerificationToken` adicionados ao schema Prisma.
- `User` preparado para os campos esperados pelo adapter e para autenticação por credenciais.
- Cliente de sessão criado em `src/auth/session.ts`, usando cookies incluídos nas requisições.
- Próximo passo: criar o handler serverless do Auth.js, login visual e proteção gradual das operações.
