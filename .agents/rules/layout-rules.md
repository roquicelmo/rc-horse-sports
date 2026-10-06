---
trigger: always_on
description: Regras visuais, diretrizes de layout e convenções de interface do usuário para o projeto Sorteios Lagoa (Team Roping Pro)
---

# Regras de Layout e Padrões Visuais (layout-rules.md)

Este documento define as regras mandatórias de design, layout e comportamento visual do projeto **Sorteios Lagoa (Team Roping Pro)**.
Toda alteração de interface ou nova funcionalidade DEVE seguir estritamente as diretrizes abaixo.

---

## 1. Diretriz Geral de Governança
- **Consulta Obrigatória**: Sempre consultar este arquivo antes de implementar qualquer nova interface ou alterar componentes existentes.
- **Atualização Contínua**: Sempre que o usuário definir uma nova regra visual ou de layout, registrá-la e versioná-la imediatamente neste arquivo.

---

## 2. Tabelas e Exibição de Dados (RunsTable)

### 2.1 Cores e Saturação
- **Colunas de Tempo e Handicap**: Nunca usar cores chamativas ou excessivamente coloridas. Manter tons neutros e sóbrios (textos em `slate-300`/`slate-400` com fonte mono e fundos escuros/discretos) para evitar poluição visual.
- **Linha Concluída (Dupla com todos os tempos)**: Quando todos os tempos da corrida forem preenchidos (conforme a quantidade de bois da dupla), a linha inteira deve adotar um tom verde sutil de concluído (`bg-emerald-950/25` com borda `border-emerald-500/40`) e exibir um ícone de status (`CheckCircle2`), garantindo sensação imediata de conclusão e continuidade do evento.

### 2.2 Estrutura e Dimensões de Colunas
- **Coluna "Média Final"**: A largura deve ser suficiente para que o rótulo "Média Final" fique sempre em uma **única linha**, sem quebra de texto.
- **Coluna de Cruzamento ("X")**:
  - Deve existir uma coluna intermediária dedicada entre o Cabeceiro e o Pezeiro com um **"X"**.
  - O "X" deve ter tamanho visível destacado, alinhamento rigorosamente centralizado e espaçamento balanceado e equidistante entre os nomes do cabeceiro e do pezeiro.

### 2.3 Cabeçalhos e Hierarquia
- **Posicionamento do Header**: O cabeçalho das colunas da tabela (`#`, `Cabeceiro`, `X`, `Pezeiro`, `Boi 1`, `Boi 2`, `Boi 3`, `Média Final`, etc.) deve vir **imediatamente após a descrição/identificação da Rodada**.
- **Descrições de Rodada Limpas**: Não exibir descrições redundantes como `"X corridas (nenhum competidor repete nesta rodada)"`. Manter a identificação concisa e direta (ex: `Rodada X • X Corridas`).

---

## 3. Navegação, Baterias e Filtros

### 3.1 Accordions de Baterias
- As baterias devem ser estruturadas em formato de **Accordions expansíveis/recolhíveis**.
- **Estado Inicial**: Todas as baterias devem vir **abertas por padrão** ao carregar ou gerar o sorteio.

### 3.2 Visibilidade Total (Sem Filtros Ocultantes)
- **Sempre Exibir Todas as Baterias**: Não utilizar filtros suspensos que limitem a visualização a apenas uma bateria (ex: filtro "Todas as baterias" vs "Bateria individual"). O operador deve sempre ter visão panorâmica de todas as baterias na mesma tela.
- **Sem Filtros de Rodada Isolada**: As rodadas devem ser exibidas sequencialmente dentro de suas respectivas baterias, sem filtros restritivos que ocultem outras rodadas.

---

## 4. Estética, Design System e Feedback Visual
- **Tema e Paleta**: Dark glassmorphic de alta qualidade (`slate-950` de fundo, cartões em `slate-900/90`, bordas em `slate-800` com acentos em `amber-500` e `emerald-500`).
- **Tipografia**:
  - Textos institucionais e nomes: *Plus Jakarta Sans*.
  - Números, tempos, handicaps e médias: *JetBrains Mono*.
- **Recomendações e Ações**: Banners de recomendação do sistema devem apresentar badge de destaque (`★ Recomendado` / `ThumbsUp`), justificativa técnica e botão de aplicação direta em 1 clique.

---

## 5. Fluxo de Etapas do Wizard (WizardHeader)

### 5.1 Cores e Estados dos Cards de Etapa (Pezeiro, Cabeceiro, Configuração, Ordem de Corrida)
- **Etapa Atual / Em Questão (Ativa)**:
  - A cor do card DEVE ser **azul** (`bg-blue-950/40`, borda `border-blue-500/60`, anel de foco `ring-2 ring-blue-500/30`, linha superior azul `bg-blue-500`, ícone com badge azul `bg-blue-500/20 text-blue-400 border border-blue-500/40` e textos de destaque em tons de azul e branco).
- **Etapa Concluída (Finalizada / Anterior)**:
  - A cor do card DEVE mudar para **verde** (`bg-emerald-950/35`, borda `border-emerald-500/50`, linha superior esmeralda `bg-emerald-500/70`, badge de ícone verde `bg-emerald-500/20 text-emerald-400 border border-emerald-500/40` com ícone `Check` e textos em tons esmeralda/verde suave).
- **Etapas Pendentes (Não concluídas nem começadas)**:
  - Devem permanecer no estado original neutro/apagado (`bg-slate-950/40`, borda `border-slate-900/60`, opacidade reduzida `opacity-60`, cursor desabilitado e textos em `slate-500`/`slate-400`).

### 5.2 Estado Inicial das Listas de Seleção (Pezeiros e Cabeceiros)
- **Seleções Iniciais Vazias**: As listas de Pezeiros e Cabeceiros devem iniciar sem competidores pré-adicionados (`selectedPezeiros = []` e `selectedCabeceiros = []`).
- **Disponibilidade Total do Mock**: Todos os competidores inscritos devem estar acessíveis na coluna esquerda ("Inscritos Disponíveis") para escolha manual do operador.
- **Avanço Condicional**: O botão de avançar etapa só é habilitado após a seleção de ao menos 1 competidor para a respectiva função.


