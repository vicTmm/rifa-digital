# Plano de Implementação — Rifa Digital

## 1. Objetivo

Este documento organiza o trabalho necessário para levar o projeto do estado atual até uma versão confiável para homologação e produção.

O plano foi estruturado por dependências técnicas. Uma fase só deve avançar quando os critérios de aceite da fase anterior estiverem atendidos, salvo tarefas explicitamente independentes.

## 2. Estado atual

O projeto já possui uma base funcional relevante:

- backend em FastAPI com autenticação e controle de perfis;
- frontend em Next.js;
- gestão multi-tenant de organizadores e rifas;
- checkout PIX e integração com Mercado Pago;
- reservas, bilhetes, sorteios, saques e reembolsos;
- ledger financeiro e auditoria de sorteio;
- migrações Alembic e workflow de CI;
- 30 testes automatizados do backend aprovados na revisão inicial.

Principais lacunas encontradas:

- a cadeia de migrações falha ao criar um banco vazio porque `financial_ledger` é criada mais de uma vez;
- o build limpo do frontend ainda precisa ser restabelecido e validado;
- a consulta pública de bilhetes permite localizar pedidos apenas por telefone ou CPF;
- faltam rate limiting, headers de segurança e maior proteção dos endpoints públicos;
- tarefas de expiração e reconciliação executam dentro do processo web;
- os fluxos financeiros ainda precisam de testes concorrentes em PostgreSQL;
- faltam configuração de deploy, observabilidade, backup e testes E2E.

## 3. Estratégia de execução

Ordem obrigatória recomendada:

1. estabilizar instalação, migrações, testes e build;
2. corrigir riscos de segurança e privacidade;
3. garantir integridade financeira e concorrência em PostgreSQL;
4. completar os fluxos funcionais e a cobertura automatizada;
5. preparar workers, infraestrutura, deploy e observabilidade;
6. homologar pagamentos, operação, conformidade e lançamento.

Cada tarefa deve ser entregue em commits pequenos e revisáveis. Testes e build devem permanecer verdes durante toda a execução.

---

## 4. Fase 1 — Fundação e build reproduzível

**Objetivo:** permitir que um clone novo seja instalado, migrado, testado e compilado sem intervenção manual.

**Prioridade:** crítica.

**Estimativa inicial:** 2 a 3 dias.

### Tarefas

- [x] **F1.1 — Corrigir a migração duplicada de `financial_ledger`.**
  - [x] Identificar a versão correta em que a tabela deve nascer.
  - [x] Fixar o schema histórico da migração inicial, sem importar os modelos atuais.
  - [x] Evitar correções condicionais que ocultem divergência de schema.
  - [x] Validar a cadeia completa até `20260827_07 (head)` em um banco SQLite vazio.
  - [x] Executar a suíte existente: 30 testes aprovados.

- [x] **F1.2 — Auditar toda a cadeia de migrações.**
  - [x] Conferir tabelas, índices, chaves estrangeiras e restrições entre as versões `01` e `07`.
  - [x] Comparar o schema final das migrações com os modelos SQLAlchemy.
  - [x] Alinhar índices de saques e constraints nomeadas de eventos e sorteios.
  - [x] Validar com `alembic check` sem operações pendentes.

- [x] **F1.3 — Validar migração em banco SQLite vazio.**
  - [x] Executar `alembic upgrade head` a partir de um arquivo inexistente.
  - [x] Confirmar o revision head após a execução.

- [x] **F1.4 — Criar teste automatizado da cadeia de migrações.**
  - [x] Criar banco temporário isolado.
  - [x] Aplicar todas as migrações.
  - [x] Validar tabelas, revision head e ausência de drift no schema.

- [x] **F1.5 — Validar migrações em PostgreSQL.**
  - [x] Adicionar o driver PostgreSQL às dependências de execução.
  - [x] Configurar PostgreSQL 17 limpo no job de CI.
  - [x] Configurar `upgrade head`, `alembic check` e testes contra PostgreSQL no CI.
  - [x] Confirmar a execução no CI: workflow `33115059869` aprovado em PostgreSQL 17.

- [x] **F1.6 — Organizar dependências Python.**
  - [x] Separar dependências de execução das dependências de desenvolvimento/teste.
  - [x] Incluir explicitamente o driver necessário para PostgreSQL.

- [x] **F1.7 — Tornar as dependências reproduzíveis.**
  - [x] Fixar as dependências diretas de backend e frontend.
  - [x] Manter o lockfile transitivo do frontend sincronizado.
  - [x] Definir Python 3.13 e Node.js 22 como versões de referência.

- [x] **F1.8 — Restabelecer a instalação limpa do frontend.**
  - [x] Validar `npm ci` usando apenas o `package-lock.json` versionado.
  - [x] Corrigir e sincronizar manifesto e lockfile.
  - [x] Atualizar PostCSS e validar `npm audit` sem vulnerabilidades conhecidas.
  - [x] Executar `npm run build` com geração de build de produção.

- [x] **F1.9 — Melhorar os scripts de bootstrap.**
  - [x] Detectar ferramentas ausentes.
  - [x] Criar o ambiente virtual quando necessário.
  - [x] Instalar dependências de maneira explícita.
  - [x] Exibir erros acionáveis ao usuário.

- [x] **F1.10 — Atualizar CI e documentação.**
  - [x] Separar claramente instalação, migração, testes, auditoria e build.
  - [x] Adicionar PostgreSQL 17 e verificação de drift ao CI.
  - [x] Atualizar o README com versões e comandos validados.

### Critérios de aceite

- [x] Um clone novo possui instruções e scripts de configuração autocontidos.
- [x] Um banco vazio chega ao revision head sem erro.
- [x] Os testes atuais do backend continuam passando.
- [x] `npm ci` e `npm run build` passam em ambiente limpo.
- [x] O pipeline completo passa no CI.

---

## 5. Fase 2 — Segurança e privacidade

**Objetivo:** impedir enumeração de dados privados e endurecer autenticação, autorização e entradas externas.

**Dependência:** Fase 1 concluída.

**Estimativa inicial:** 4 a 6 dias.

### Tarefas

- [x] **F2.1 — Proteger a consulta “Meus bilhetes”.**
  - [x] Substituir a consulta direta por telefone/CPF por pedido e token criptograficamente aleatório.
  - [x] Não revelar se um CPF ou telefone existe antes da validação.
  - [x] Armazenar localmente as referências dos pedidos recentes para preservar a experiência no mesmo navegador.

- [x] **F2.2 — Proteger consultas públicas de pedidos.**
  - [x] Exigir token de acesso específico do pedido em todos os ambientes.
  - [x] Proteger também a simulação de pagamento disponível em desenvolvimento.

- [x] **F2.3 — Implementar rate limiting.**
  - [x] Aplicar limites configuráveis a login, cadastro, criação de pedido, simulação e consultas públicas.
  - [x] Definir resposta `429` padronizada com orientação de nova tentativa.
  - [x] Exigir armazenamento compartilhado em produção e permitir memória apenas no desenvolvimento.
  - [x] Adicionar teste automatizado do bloqueio de tentativas de login.

- [x] **F2.4 — Isolar recursos exclusivos de desenvolvimento.**
  - Impedir que o simulador de pagamento seja habilitado em produção.
  - Ocultar endpoints de simulação fora do ambiente autorizado.

- [x] **F2.5 — Revisar CORS e hosts permitidos.**
  - Configurar origens por ambiente.
  - Evitar origens locais em produção.

- [x] **F2.6 — Adicionar headers de segurança.**
  - Definir HSTS, proteção de conteúdo, política de referrer e demais headers aplicáveis.

- [x] **F2.7 — Sanitizar logs e erros.**
  - [x] Mascarar telefones e remover mensagens completas de notificações dos logs.
  - [x] Redigir credenciais e limitar respostas externas registradas.
  - [x] Evitar devolver detalhes internos em erros HTTP dos fluxos alterados.

- [x] **F2.8 — Auditar autorização multi-tenant.**
  - [x] Exigir tenant ativo e pertencente ao usuário na dependência de organizador.
  - [x] Cobrir helpers e cenários negativos de autorização.

- [x] **F2.9 — Endurecer uploads.**
  - [x] Limitar tamanho e dimensões/pixels.
  - [x] Validar o conteúdo real, não apenas extensão ou MIME informado.
  - [x] Rejeitar imagens truncadas e nomes gerados com UUID.

- [x] **F2.10 — Completar o ciclo de contas.**
  - [x] Implementar recuperação de senha com token hash, expiração e uso único.
  - [x] Adicionar emissão e verificação de e-mail com token temporário.
  - [x] Restringir tokens de debug a ambientes não produtivos.
  - [ ] Integrar envio efetivo de e-mail e interface frontend.

- [x] **F2.11 — Criar testes automatizados de segurança.**
  - [x] Cobrir enumeração, autorização, tokens inválidos, rate limit, upload malicioso e configuração de produção.
  - [x] Validar migração de segurança de contas em banco limpo.

### Critérios de aceite

- [ ] Nenhum dado de comprador é acessível apenas com identificadores previsíveis.
- [ ] Um organizador não consegue acessar recursos de outro tenant.
- [ ] Endpoints sensíveis possuem limitação de requisições.
- [ ] Simulação de pagamento é impossível em produção.
- [ ] Controles de segurança possuem testes negativos.

---

## 6. Fase 3 — Pagamentos, saldos e concorrência

**Objetivo:** garantir que vendas, pagamentos, reembolsos e saques permaneçam consistentes sob repetição, falhas e concorrência.

**Dependências:** Fases 1 e 2 concluídas.

**Estimativa inicial:** 1 a 2 semanas.

### Tarefas

- [x] **F3.1 — Adicionar PostgreSQL ao desenvolvimento e CI.**
  - Manter SQLite apenas para testes unitários compatíveis, se útil.
  - Executar testes de integração financeira em PostgreSQL.

- [x] **F3.2 — Padronizar valores monetários com `Decimal`.**
  - Remover `float` de cálculos e contratos financeiros.
  - Definir arredondamento em centavos de forma centralizada.

- [ ] **F3.3 — Testar reservas concorrentes.**
  - Simular duas compras tentando reservar o mesmo número.
  - Simular disputa pelos últimos números disponíveis.

- [ ] **F3.4 — Garantir idempotência do webhook.**
  - Registrar chave idempotente antes de aplicar efeitos financeiros.
  - Tratar repetição, atraso e entrega fora de ordem.

- [x] **F3.5 — Validar integralmente os pagamentos.**
  - Conferir valor, moeda, conta recebedora, identificador externo e associação ao pedido.

- [ ] **F3.6 — Definir pagamentos após expiração.**
  - Formalizar política de confirmação, reembolso ou revisão manual.
  - Evitar realocar um número já pago a outro comprador.

- [ ] **F3.7 — Testar webhook e reconciliação simultâneos.**
  - Garantir que somente uma confirmação produza efeitos.

- [x] **F3.8 — Revisar cancelamentos e reembolsos.**
  - Garantir liberação correta de bilhetes.
  - Evitar reembolso duplicado e saldo negativo indevido.

- [ ] **F3.9 — Revisar saques.**
  - Garantir reserva atômica do saldo.
  - Tratar aprovação, rejeição, falha e reprocessamento.

- [ ] **F3.10 — Criar reprocessamento administrativo auditável.**
  - Registrar operador, motivo, estado anterior e resultado.

- [x] **F3.11 — Criar testes de invariantes do ledger.**
  - Confirmar que o saldo pode ser reconstruído pelos lançamentos.
  - Proibir chaves idempotentes duplicadas e efeitos financeiros órfãos.

### Critérios de aceite

- [ ] Não ocorre venda dupla em testes concorrentes.
- [ ] Eventos repetidos não alteram o saldo novamente.
- [ ] O saldo de cada tenant pode ser reconstruído pelo ledger.
- [ ] Webhook e reconciliação podem operar simultaneamente com segurança.
- [ ] Testes financeiros passam em PostgreSQL.

---

## 7. Fase 4 — Produto e cobertura funcional

**Objetivo:** completar os fluxos do produto e protegê-los com testes de API e interface.

**Dependência:** Fase 3 concluída.

**Estimativa inicial:** 1 a 2 semanas.

### Tarefas

- [x] **F4.1 — Formalizar estados de uma rifa.**
  - Definir transições permitidas entre rascunho, publicada, pausada, encerrada, sorteada e cancelada.

- [ ] **F4.2 — Completar a gestão de rifas.**
  - Implementar edição, publicação, pausa, encerramento e cancelamento.

- [ ] **F4.3 — Melhorar checkout e retomada de pagamento.**
  - Tratar refresh, fechamento do navegador, expiração e retorno posterior.

- [x] **F4.4 — Adicionar paginação e filtros.**
  - Rifas, pedidos, eventos de pagamento, saques e tenants.

- [ ] **F4.5 — Otimizar o grid de números.**
  - Evitar carregar ou renderizar toda a faixa de rifas grandes.
  - Adotar paginação, janelas ou consulta por intervalos.

- [ ] **F4.6 — Padronizar estados da interface.**
  - Loading, vazio, erro recuperável, erro definitivo e sessão expirada.

- [ ] **F4.7 — Criar testes HTTP dos fluxos principais.**
  - Cadastro, login, rifa, pedido, pagamento, consulta, sorteio, saque e reembolso.

- [ ] **F4.8 — Criar testes de contrato frontend/backend.**
  - Validar payloads, enums, erros e campos opcionais compartilhados.

- [ ] **F4.9 — Criar testes E2E.**
  - Jornada do comprador.
  - Jornada do organizador.
  - Jornada do superadministrador.

- [ ] **F4.10 — Revisar acessibilidade e responsividade.**
  - Navegação por teclado, foco, contraste, leitores de tela e dispositivos móveis.

- [ ] **F4.11 — Criar massa de teste determinística.**
  - Separar fixtures de teste do seed demonstrativo.

### Critérios de aceite

- [ ] A jornada cadastro → rifa → compra → pagamento → bilhete passa em E2E.
- [ ] Sorteio, saque e reembolso possuem cenários automatizados.
- [ ] Rifas grandes não exigem carregar toda a numeração no navegador.
- [ ] Erros de API são apresentados de forma consistente e recuperável.

---

## 8. Fase 5 — Operação, infraestrutura e deploy

**Objetivo:** permitir deploy previsível, operação observável e recuperação diante de falhas.

**Dependência:** Fases 1 a 4 concluídas.

**Estimativa inicial:** 4 a 7 dias.

### Tarefas

- [x] **F5.1 — Criar imagens de execução.**
  - Dockerfile do backend.
  - Dockerfile do frontend.

- [x] **F5.2 — Criar ambiente composto de desenvolvimento.**
  - API, frontend, PostgreSQL e infraestrutura adicional necessária.

- [x] **F5.3 — Remover tarefas periódicas do processo web.**
  - Retirar expiração de pedidos e reconciliação do `lifespan` da API.

- [x] **F5.4 — Criar worker e scheduler.**
  - Garantir execução exclusiva ou idempotente entre réplicas.
  - Implementar retentativas e fila de falhas.

- [ ] **F5.5 — Migrar uploads para armazenamento de objetos.**
  - Definir URLs, exclusão, expiração e política de acesso.

- [ ] **F5.6 — Implementar logs estruturados.**
  - Adicionar correlation ID e contexto seguro de pedido/evento.

- [ ] **F5.7 — Integrar rastreamento de erros.**
  - Capturar falhas de API, frontend, workers e integrações.

- [ ] **F5.8 — Adicionar métricas e alertas.**
  - Erros HTTP, latência, webhooks, fila, reconciliação, reservas e pagamentos pendentes.

- [ ] **F5.9 — Separar liveness e readiness.**
  - Readiness deve validar dependências necessárias ao tráfego.

- [ ] **F5.10 — Configurar backup e restauração.**
  - Automatizar backups.
  - Executar e documentar um teste de restauração.

- [ ] **F5.11 — Criar pipelines de homologação e produção.**
  - Segredos por ambiente.
  - Migração como etapa única e controlada.
  - Deploy com verificação e rollback.

- [ ] **F5.12 — Documentar operação.**
  - Deploy, migração, rollback, incidentes, backups e reprocessamentos.

### Critérios de aceite

- [ ] Deploy e rollback são automatizados e documentados.
- [ ] Tarefas periódicas não duplicam efeitos entre réplicas.
- [ ] Uploads persistem fora do disco efêmero da aplicação.
- [ ] Falhas relevantes geram alertas acionáveis.
- [ ] Um backup pode ser restaurado com sucesso.

---

## 9. Fase 6 — Homologação e lançamento

**Objetivo:** validar o sistema em condições próximas das reais e preparar a operação pública.

**Dependência:** Fases 1 a 5 concluídas.

**Estimativa inicial:** 3 a 5 dias, sem contar prazos externos.

### Tarefas

- [ ] **F6.1 — Homologar Mercado Pago.**
  - Validar criação, confirmação, atraso, falha e repetição de eventos.

- [ ] **F6.2 — Executar transações reais controladas.**
  - Compra, confirmação, cancelamento e reembolso de baixo valor.

- [ ] **F6.3 — Executar testes de carga.**
  - Checkout, grid, webhook, consulta pública, dashboard e workers.

- [ ] **F6.4 — Fazer revisão final de segurança.**
  - Dependências, configuração, autenticação, autorização, segredos e superfície pública.

- [ ] **F6.5 — Validar conformidade jurídica.**
  - Regras de sorteio, atuação dos organizadores, pagamentos, prêmios e obrigações aplicáveis.

- [ ] **F6.6 — Preparar documentos públicos.**
  - Termos de uso, política de privacidade, regras de campanhas e contatos de suporte.

- [ ] **F6.7 — Higienizar o ambiente de produção.**
  - Remover credenciais, contas e campanhas demonstrativas.
  - Confirmar que segredos de desenvolvimento não são aceitos.

- [ ] **F6.8 — Criar procedimentos operacionais.**
  - Suporte, disputa, reembolso, pagamento não conciliado, fraude e incidente.

- [ ] **F6.9 — Executar checklist de lançamento.**
  - Produto, segurança, operação, pagamentos, comunicação e rollback.

- [ ] **F6.10 — Realizar lançamento gradual.**
  - Limitar inicialmente o número de organizadores ou campanhas.
  - Acompanhar erros, pagamentos, conversão e suporte antes da expansão.

### Critérios de aceite

- [ ] Pagamentos e reembolsos foram homologados ponta a ponta.
- [ ] A aplicação suporta a carga definida para o lançamento.
- [ ] Documentos e processos operacionais estão disponíveis.
- [ ] Não existem segredos ou dados demonstrativos em produção.
- [ ] Existe plano de rollback e equipe responsável pelo acompanhamento.

---

## 10. Sequência imediata de execução

O primeiro ciclo deve conter apenas tarefas da Fase 1:

1. executar **F1.1**, corrigindo a duplicidade da migração;
2. executar **F1.2** e comparar o schema final com os modelos;
3. executar **F1.3** e **F1.4**, protegendo a correção com teste automatizado;
4. executar **F1.8**, recuperando e validando o build limpo do frontend;
5. executar **F1.10**, incorporando as validações ao CI;
6. concluir as demais tarefas da Fase 1 antes de iniciar mudanças funcionais.

## 11. Definição de pronto por tarefa

Uma tarefa somente pode ser marcada como concluída quando:

- [ ] a implementação está versionada e revisável;
- [ ] testes relevantes foram criados ou atualizados;
- [ ] testes existentes continuam passando;
- [ ] build e análise estática aplicáveis passam;
- [ ] migrações foram validadas quando houver mudança de schema;
- [ ] configuração e documentação foram atualizadas quando necessário;
- [ ] riscos ou limitações restantes foram registrados;
- [ ] não há segredos, dados locais ou artefatos gerados incluídos no commit.

## 12. Marcos do projeto

| Marco | Fases necessárias | Resultado esperado |
|---|---|---|
| Base reproduzível | Fase 1 | Instalação, migração, testes e build confiáveis |
| Homologação segura | Fases 1–3 | Segurança básica e integridade financeira em PostgreSQL |
| Produto completo | Fases 1–4 | Jornadas principais completas e cobertas por E2E |
| Pronto para produção | Fases 1–5 | Deploy, workers, observabilidade e recuperação operacional |
| Lançamento | Fases 1–6 | Homologação financeira, operacional e de conformidade concluída |

## 13. Estimativa geral

- **Homologação interna confiável:** aproximadamente 2 a 3 semanas.
- **Produção enxuta:** aproximadamente 4 a 6 semanas.

As estimativas devem ser recalibradas ao final da Fase 1, quando instalação, banco, CI e build estiverem reproduzíveis.
