# Sorteios Lagoa — manual do usuário

## Objetivo do sistema

O sistema organiza provas de laço em dupla. Ele permite cadastrar atletas, criar uma prova, realizar inscrições, gerar a ordem de corrida, registrar os tempos e publicar os resultados.

## Como o sistema será organizado

### Acesso da equipe

O botão **Acessar conta**, no menu lateral, abre a tela de login. Informe o e-mail
e a senha cadastrados para acessar a operação. O botão de visualização da senha
permite conferir o texto digitado antes do envio.

Durante a transição, o login já está disponível visualmente, mas o sistema mantém
o protótipo acessível até que o banco de dados e a sessão do servidor sejam
configurados no ambiente.

### Menu lateral

O menu lateral fica sempre disponível no computador e organiza o sistema por área:

- **Painel geral:** visão resumida da operação e próximos passos.
- **Provas e arenas:** criação e acompanhamento dos eventos.
- **Cadastro de atletas:** manutenção do cadastro reutilizável de participantes.
- **Minha agenda:** consulta das provas relacionadas ao usuário.
- **Usuários:** administração dos acessos da equipe.
- **Novo sorteio:** abertura direta do fluxo para montar as duplas.

No celular, o mesmo menu é aberto pelo botão de menu no topo. As áreas que ainda
não foram conectadas ao banco exibem uma mensagem explicando o que será habilitado,
sem apresentar informações fictícias.

### Painel geral

O painel apresenta um resumo das provas e dos atletas. A partir dele, o usuário poderá abrir uma prova existente, criar uma nova prova ou consultar a agenda.

### Provas

Uma prova reúne todas as informações de um evento:

- Nome da prova.
- Data.
- Arena ou local.
- Cidade.
- Situação das inscrições.
- Situação do sorteio.
- Situação da apuração.

As provas poderão estar em rascunho, abertas para inscrição, sorteadas, em andamento, finalizadas ou canceladas.

O menu **Provas e arenas** apresenta as provas importadas do cadastro de referência,
com data, formato, arena, status, quantidade de inscritos e corridas. Os atalhos
de inscrições e sorteio já estão posicionados para receber as rotas persistentes.

Clique em **Detalhes** ou **Inscrições** para abrir o resumo completo da prova.
Nessa tela ficam reunidas as informações do evento, os números principais e os
acessos para inscrições, sorteio e pista, locução e resultado final.

Para criar uma prova, clique em **Nova prova / arena** e informe nome, data, arena,
cidade e UF. O cadastro da arena é feito junto com a prova quando o banco está
conectado. O botão de edição permite alterar nome e data; o botão de exclusão
cancela a prova sem apagar seu histórico.

Se já existir uma arena cadastrada, selecione-a no campo **Arena**. Para cadastrar
uma nova, escolha **Cadastrar nova arena** e preencha nome, cidade e UF. Arenas
inativas não aparecem para novas provas.

Na primeira implantação, a equipe técnica pode carregar os dados iniciais com o seed
do banco. Esse processo cria o usuário administrador, os atletas importados e as
provas de referência sem duplicar registros quando executado novamente.

Depois que o seed for executado, entre com o e-mail configurado em `SEED_ADMIN_EMAIL`
e a senha definida em `SEED_ADMIN_PASSWORD`. O login real depende de `AUTH_SECRET`,
`DATABASE_URL` e das migrations aplicadas no ambiente.

### Atletas

O cadastro de atletas guarda os dados que podem ser reutilizados em várias provas. O cadastro não significa que o atleta está inscrito em uma prova específica.

Na tela de cadastro, use a busca para localizar um atleta pelo nome ou cidade. O botão
**Novo atleta** abre o formulário de inclusão, e o ícone de lixeira remove um cadastro
da lista local durante a fase de transição. A persistência definitiva será ativada
quando a API estiver conectada ao PostgreSQL.

O cadastro inicial foi preenchido com os atletas existentes no sistema de referência,
incluindo número de inscrição, cidade e os handicaps de cabeça e pé informados.

Quando o usuário estiver autenticado e o banco estiver conectado, a tela carregará os
atletas persistidos pela API. Sem essa conexão, os dados de referência continuam
visíveis para permitir a navegação e os testes do fluxo.

Cada atleta poderá ter:

- Nome.
- Apelido.
- Telefone.
- Cidade e estado.
- Handicap de cabeça.
- Handicap de pé.
- Situação ativo ou inativo.

### Inscrições

Depois de criar uma prova, o organizador escolhe quais atletas participarão dela. A inscrição pertence à prova e pode ser cancelada sem apagar o cadastro global do atleta.

Para inscrever:

1. Abra **Provas e arenas** e entre nos detalhes da prova.
2. Clique em **Inscrições**.
3. Selecione o atleta no campo de busca.
4. Escolha a função **Cabeceiro** ou **Pezeiro**.
5. Clique em **Adicionar**.

As duas listas mostram os atletas já incluídos e o contador de cada função. Use o
ícone de lixeira para remover uma inscrição sem excluir o atleta do cadastro geral.
Durante a fase atual de transição, as alterações ficam na tela e ainda não são
persistidas no banco; a integração com PostgreSQL será ativada junto dos endpoints
de inscrições.

Com a API e o banco disponíveis, a inclusão e o cancelamento passam a ser persistidos
automaticamente. A inscrição cancelada não apaga o atleta do cadastro global e pode
ser reativada em uma nova inclusão.

### Sorteio

O sorteio combina cabeceiros e pezeiros conforme as regras configuradas pelo organizador. Antes de gerar, confira:

- Atletas selecionados.
- Grupos ou chaves.
- Quantidade de baterias.
- Intervalo mínimo de descanso.
- Opção de balanceamento por handicap.

Depois de gerado, o sorteio deve ser conferido antes de ser publicado para a pista.

### Operação da pista

Na operação, a equipe acompanha a ordem das corridas. Para cada corrida, registra os tempos dos bois e indica quando houver NT, ausência ou eliminação.

O resultado só deve ser publicado depois da conferência dos tempos e das médias.

### Agenda

A agenda ajuda a encontrar provas abertas e consultar a participação do atleta. Ela será usada para localizar data, arena, inscrição e ordem de corrida.

## Fluxo recomendado para uma prova

1. Cadastre os atletas que ainda não existem.
2. Crie a prova e informe data e arena.
3. Abra as inscrições.
4. Inscreva os atletas participantes.
5. Encerre as inscrições.
6. Configure e gere o sorteio.
7. Confira a ordem de corrida.
8. Inicie a operação da pista.
9. Registre tempos e ocorrências.
10. Confira a classificação.
11. Publique o resultado.

## Estados e cuidados

- **Rascunho:** a prova ainda está sendo configurada.
- **Aberta para inscrições:** atletas podem ser adicionados ou removidos.
- **Sorteada:** a ordem foi gerada e deve ser conferida.
- **Em andamento:** a pista está registrando corridas.
- **Finalizada:** o resultado está encerrado.
- **Cancelada:** a prova não será realizada.

Antes de excluir ou cancelar qualquer informação, confirme se ela não será necessária para o histórico da prova.

## Tema e usabilidade

O sistema será migrado para um tema claro e minimalista. A intenção é facilitar:

- Leitura em ambientes externos e arenas.
- Uso em notebooks e tablets.
- Identificação rápida de ações.
- Visualização de tabelas e tempos.
- Impressão de súmulas.

Botões, mensagens, estados de carregamento e erros serão padronizados para que cada ação tenha uma resposta clara.

## Atualização visual em andamento

O primeiro passo da mudança para o tema claro já foi aplicado na base da aplicação. Os componentes estão sendo migrados gradualmente para controles padronizados, começando pelos botões do cadastro de competidor.

A paleta utiliza fundo marfim, texto azul-esverdeado escuro, azul-petróleo para ações estruturais e âmbar queimado para destaques. O contador de inscritos usa o azul-petróleo para indicar informação operacional sem competir com os botões principais.

O painel inicial agora apresenta apenas os dados disponíveis no sistema. Enquanto o banco de dados não estiver conectado, a área de provas recentes exibirá um estado vazio orientando a criação da primeira prova, sem exemplos ou números fictícios.
