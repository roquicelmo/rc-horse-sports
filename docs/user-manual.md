# Sorteios Lagoa — manual do usuário

## 1. Para que serve

O Sorteios Lagoa organiza provas de laço em dupla do cadastro ao resultado:

1. cadastrar atletas e arenas;
2. criar uma prova;
3. inscrever atletas;
4. gerar o sorteio;
5. operar a pista;
6. registrar tempos;
7. publicar e imprimir resultados;
8. consultar relatórios e histórico.

O sistema utiliza dados reais salvos no banco. Não é necessário recadastrar
atletas, arenas ou provas a cada acesso.

## 2. Entrar no sistema

Na tela inicial informe:

- e-mail;
- senha.

Clique em **Entrar**. A sessão permanece ativa ao atualizar a página. Para
encerrar, use **Sair** no cabeçalho ou **Sair da conta** no menu lateral.

Usuários inativos ou com acesso expirado não conseguem entrar.

## 3. Solicitar acesso

Se ainda não possui uma conta:

1. clique em **Ainda não tenho acesso**;
2. informe nome;
3. informe telefone;
4. informe e-mail;
5. complete o reCAPTCHA;
6. envie a solicitação.

A solicitação não libera o sistema automaticamente. Um Admin ou Manager precisa
analisá-la, definir uma senha inicial e habilitar o usuário.

Se o reCAPTCHA não aparecer, o administrador precisa configurar as chaves do
Google no ambiente de produção.

## 4. Menu principal

- **Painel geral:** visão resumida das provas, atletas e operação.
- **Provas e arenas:** criação, edição, inscrições e acompanhamento das provas.
- **Cadastro de atletas:** cadastro reutilizável dos participantes.
- **Minha agenda:** próximas provas e participações.
- **Usuários:** usuários, solicitações e habilitações, conforme permissão.
- **Relatórios:** totais, filtros e impressão.
- **Novo sorteio:** acesso rápido ao fluxo de sorteio.

Em telas menores, abra o menu pelo botão no topo.

## 5. Usuários e permissões

### Admin

Pode:

- acessar todas as áreas;
- criar, editar, habilitar e bloquear usuários;
- aprovar ou recusar solicitações;
- consultar dados de todos os proprietários;
- criar cadastros para qualquer usuário.

### Manager

Pode:

- operar provas, atletas, arenas, inscrições, sorteios e resultados;
- consultar dados de todos os proprietários;
- aprovar ou recusar solicitações;
- habilitar ou bloquear usuários provisórios.

Não pode criar, editar ou excluir usuários. O Admin permanece visível para o
Manager, mas sem ações administrativas indevidas.

### User

Pode consultar e manter somente seus próprios:

- atletas;
- arenas;
- provas;
- inscrições;
- sorteios;
- tempos;
- resultados;
- histórico.

## 6. Cadastrar atletas

1. Abra **Cadastro de atletas**.
2. Clique em **Novo atleta**.
3. Preencha nome, cidade, estado e handicaps.
4. Se disponível, informe telefone, e-mail, apelido e número de inscrição.
5. Selecione o proprietário quando a permissão permitir.
6. Salve.

O atleta fica disponível para futuras provas. Excluir um cadastro não deve ser
usado para retirar um atleta de uma prova: nesse caso, cancele a inscrição.

Use a busca para localizar por nome ou cidade. Admin e Manager podem filtrar
por proprietário.

## 7. Cadastrar arenas

Ao criar uma prova, escolha uma arena existente ou cadastre uma nova informando:

- nome;
- cidade;
- UF;
- endereço, quando aplicável.

Arenas inativas não aparecem para novas provas, mas permanecem no histórico.

## 8. Criar e editar provas

1. Abra **Provas e arenas**.
2. Clique em **Nova prova / arena**.
3. Informe nome e data.
4. Selecione uma arena ou cadastre uma nova.
5. Defina o proprietário, quando tiver permissão.
6. Salve.

O botão de edição permite alterar dados da prova. A exclusão é tratada como
cancelamento lógico para preservar inscrições, sorteios e histórico.

Cada prova exibe seu status, arena, proprietário, inscritos e corridas.

## 9. Fazer inscrições

1. Abra uma prova.
2. Entre em **Inscrições**.
3. Busque o atleta.
4. Adicione-o à prova.
5. Escolha a função de cabeceiro ou pezeiro quando o fluxo solicitar.
6. Remova a inscrição pela própria lista quando necessário.

A inscrição pertence à prova. Cancelá-la não remove o cadastro global do atleta.
Somente inscrições ativas participam do sorteio.

## 10. Gerar o sorteio

1. Abra os detalhes da prova.
2. Clique em **Sorteio e pista** ou **Novo sorteio**.
3. Confira cabeceiros, pezeiros, grupos e configuração.
4. Gere o sorteio.
5. Revise as duplas, baterias e rodadas.
6. Gere uma nova versão se precisar refazer.

Cada geração fica salva no banco como uma versão. Ao recarregar a tela, o
último sorteio persistido é recuperado.

## 11. Operar a pista e lançar tempos

Na tabela de corridas:

1. selecione a corrida;
2. informe o tempo de cada boi;
3. marque **NT** quando a corrida não tiver tempo válido;
4. revise total, média e status;
5. avance para a próxima corrida.

Os tempos são salvos no banco. Se a página for recarregada, os dados continuam
disponíveis.

## 12. Tela do locutor

Abra a tela de locução a partir dos detalhes da prova. Ela mostra:

- corrida atual;
- próxima corrida;
- nomes da dupla;
- bateria e rodada;
- progresso da prova.

A tela depende de um sorteio salvo e acompanha a fila persistida.

## 13. Publicar resultados

1. Abra **Resultado final**.
2. Confira médias, tempos, NTs e pendências.
3. Corrija ou complete as corridas pendentes.
4. Publique o resultado.

O sistema impede a publicação enquanto houver corridas pendentes. Depois da
publicação, o sorteio fica publicado e a prova passa para **Finalizada**.

## 14. Relatórios e PDF

Abra **Relatórios** para consultar:

- total de provas;
- total de atletas;
- total de arenas;
- total de sorteios;
- total de corridas.

Use os filtros de:

- proprietário;
- status;
- data inicial;
- data final.

Clique em **Imprimir / salvar PDF** e escolha **Salvar como PDF** na janela do
navegador. A impressão usa formato A4 e oculta os controles de navegação.

Resultados de provas também possuem impressão própria.

## 15. Agenda e painel

O **Painel geral** exibe os dados operacionais mais importantes e atalhos para
as provas. A **Minha agenda** organiza provas por data, arena, inscrições e
proprietário.

Admin e Manager conseguem consultar todos os proprietários e filtrar uma conta
específica. User visualiza apenas seu próprio contexto.

## 16. Fluxo recomendado

1. Cadastre ou localize os atletas.
2. Cadastre ou reutilize a arena.
3. Crie a prova.
4. Confira o proprietário.
5. Faça as inscrições.
6. Gere e revise o sorteio.
7. Opere a pista.
8. Lance tempos e NTs.
9. Confira a classificação.
10. Publique o resultado.
11. Imprima ou consulte o relatório.

## 17. Status mais comuns

- **Rascunho:** prova em configuração.
- **Aberta:** recebendo inscrições.
- **Sorteada:** sorteio gerado.
- **Em andamento:** corridas sendo realizadas.
- **Finalizada:** resultado publicado.
- **Cancelada:** prova encerrada sem realização.

Corridas podem estar pendentes, em andamento, concluídas, ausentes ou
eliminadas.

## 18. Segurança e boas práticas

- não compartilhe sua senha;
- encerre a sessão em computadores compartilhados;
- confirme o proprietário antes de salvar um cadastro;
- não exclua dados históricos sem verificar a necessidade;
- use cancelamento de inscrição para retirar um atleta de uma prova;
- revise tempos antes de publicar;
- Admin e Manager devem habilitar somente solicitações verificadas.

O sistema não armazena senhas em texto puro. A sessão é protegida por cookie
de autenticação e as APIs verificam a permissão no servidor.

## 19. Situações que exigem administrador

Procure o administrador quando:

- o reCAPTCHA não carregar;
- o usuário estiver inativo ou expirado;
- for necessário trocar o proprietário de muitos registros;
- houver erro de conexão com o banco;
- uma prova precisar ser reaberta após publicação;
- for necessário configurar variáveis da Vercel.
