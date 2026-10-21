# Atlas Fitness

PWA de **alimentação + treino + corpo + relatórios**, em português do Brasil. JavaScript puro (módulos ES), sem build, funciona offline e instala na tela inicial.

- **Alimentação** (aba inicial): escreva o que comeu ("2 ovos mexidos, 150 g de arroz, 1 banana, café com leite"), confira a tradução em kcal/macros e salve. Banco local com mais de 2.100 alimentos (TACO, IBGE, USDA e embutido, sem repetidos), porções caseiras e busca opcional de produtos no Open Food Facts. Sem IA nesta versão.
- **Treino**: escolha os dias; o app monta fichas que cobrem todas as porções de cada músculo (peitoral clavicular/esternal/costal, três cabeças do tríceps, etc.), explica por que cada exercício entrou, troca por alternativas que ativam as mesmas porções e registra cargas, repetições e gasto calórico.
- **Registrar treino do dia** (na aba Alimentação): marca o treino programado como feito (completo ou parcial) com 1 toque, ou registra outra atividade (corrida, caminhada, bike, natação, HIIT, esportes...) com ritmo/pace, distância (km ou milhas), duração e kcal ao vivo. Entra no balanço do dia, nos relatórios e no gasto da previsão.
- **Corpo**: peso, % de gordura (manual, fórmula da Marinha, dobras de Jackson-Pollock 3/7 ou IMC), 14 medidas, fotos de progresso e histórico.
- **Relatórios**: gráficos em SVG, previsão de composição em 4/8/12 semanas (modelo p-ratio + Forbes, com faixa de incerteza), detecção de platô e guias.
- **Boas-vindas** (primeira abertura, só com Firebase configurado): entrar com e-mail/senha, criar conta (com aceite de privacidade), Google, esqueci a senha, ou **Continuar sem login**. A escolha é lembrada; quem está logado vai direto ao app; conta existente puxa os dados e pula o onboarding; conta nova com dados locais pergunta se quer enviá-los. Sem Firebase configurado a tela não aparece.
- **Dados**: sempre salvos no aparelho; opcionalmente sincronizados com Firebase (login com e-mail/senha ou Google). Exportar/importar JSON e apagar tudo (LGPD) em Ajustes.

> Tudo é estimativa. O app não substitui médico, nutricionista ou educador físico.

## Visual (v1.4)

Identidade "Piso de Ladrilho" (ver `../DESIGN.md`): o progresso do dia é um piso de ladrilhos que se acendem; cantos de folha de ladrilho; cobalto como única cor de ação; claro e escuro automáticos. Fontes Bricolage Grotesque e Figtree ficam em `fonts/` (offline). A faixa do topo é uma corda trançada de aparelho (só CSS) com o símbolo halter + A. Os ícones vêm da arte oficial (`tools/arte/icone-original.png`) por `node tools/gerar-icones-arte.mjs`, com nomes `-v2` (icon-v2-192/512/maskable, apple-touch-icon-v2, favicon-v2-32/48/.ico, marca-atlas-v2) para vencer o cache do navegador e do service worker; os `<link>` do index.html levam `?v=2`. Ao trocar a arte de novo, use `-v3` e atualize index.html, manifest e rode gerar-sw.

## Ficha sugerida

Na aba Treino há a ficha pronta **Semanal Seg–Sáb** (a ficha real do Eric, em `js/fichas.js`), com pré-visualização por dia, o porquê de cada exercício, e botões Adotar / Desfazer / Voltar ao gerador automático. Séries, repetições e descanso não vêm da ficha original: são padrões do planner por nível e objetivo. O quadrado de cada exercício marca como feito na semana atual (coleção `marcas`, sincronizada).

## Como rodar

Precisa de um servidor estático (módulos ES não abrem com `file://`). Na pasta `app/`:

```bash
node tools/servir.mjs          # http://localhost:8137  (recomendado: nunca usa módulo em cache)
# ou
python -m http.server 8000     # http://localhost:8000
```

O service worker (offline) só liga em `https://` (GitHub Pages). Em `localhost` ele fica desligado de propósito, para você não ver arquivo velho durante o desenvolvimento. Para testar o modo offline localmente, abra `http://localhost:8137/?sw`.

## Testes

```bash
node tests/rodar.mjs
```

Cobre parser de alimentos e banco (inclui `tests/alimentos.test.mjs`: conversão e validação de nutrientes, camadas TACO/IBGE/USDA, desduplicação, ids antigos e 70 frases do dia a dia), TMB/TDEE/metas/% de gordura, planner (cobertura de porções por dia, equipamentos, lesões, troca), p-ratio/previsão/platô e a camada de dados.

## Publicar no GitHub Pages

1. Crie um repositório (ex.: `atlas-fitness`) e coloque o **conteúdo da pasta `app/`** na raiz do repositório (ou publique a pasta `app/` com uma ação do Pages).
2. Antes de publicar, rode `node tools/gerar-sw.mjs atlas-v1.0.1` (troque a versão a cada publicação): atualiza a lista de arquivos do service worker e renova o cache nos aparelhos.
3. No GitHub: **Settings > Pages > Build and deployment > Source: Deploy from a branch**, branch `main`, pasta `/ (root)`, **Save**.
4. O app abre em `https://SEU-USUARIO.github.io/atlas-fitness/`. No celular, abra no Chrome/Safari e use "Instalar app" / "Adicionar à tela inicial".
5. Para login/nuvem, siga [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md) e autorize o domínio `SEU-USUARIO.github.io` no Firebase.

## Estrutura

```
index.html  manifest.webmanifest  sw.js  firebase-config.js  firestore.rules
css/        app.css (tokens + componentes), fonts.css (Barlow local)
js/
  main.js        roteamento, abas, tema, service worker
  store.js       camada de dados única (localStorage + eventos para a nuvem)
  firebase.js    login e sincronização com Firestore (carregado sob demanda)
  images.js      fotos no IndexedDB (redimensionadas)
  foods.js       banco embutido (204 alimentos) + carregamento das camadas data/taco|ibge|usda.json
  banco.js       Meus alimentos e produtos do Open Food Facts (coleção `alimentos`, sincronizada e no backup)
  off.js         busca no Open Food Facts (só online, só quando a pessoa toca)
  parser.js      texto livre -> itens (quantidades, unidades, sinônimos; índice invertido por palavra)
  estimador.js   estimarRefeicao(texto, foto): ponto de plugue para IA (TODO)
  nutrition.js   TMB (Mifflin/Katch), TDEE, metas, % de gordura, alertas
  exercises.js   músculos em porções + 156 exercícios
  planner.js     montagem de fichas, justificativas, volume, troca
  composition.js p-ratio, Forbes, simulação semanal, platô, calibração
  ilustracao.js  fotos do exercício   ilustracoes-dados.js  mapa exercício -> fotos
  atividades.js  catálogo, MET, pace/velocidade
  charts.js      gráficos SVG   tips.js  guias e dicas   dados.js  consultas
  views/         onboarding, alimentacao, treino, corpo, relatorios, config
img/ex/      300 fotos de exercícios (free-exercise-db, domínio público)
tests/      testes em Node (sem dependências)
data/       taco.json, ibge.json, usda.json (banco de alimentos por camada, carregado sob demanda)
tools/      servir.mjs, gerar-icones-arte.mjs, gerar-sw.mjs, gerar-taco/ibge/usda.mjs, unificar-banco.mjs, lib-banco.mjs, ler-xls.mjs, relatorio-banco.md, fonte/
docs/       FIREBASE_SETUP.md
```

## Decisões que valem saber

- **IA da alimentação**: só banco local. Para plugar IA depois, troque o corpo de `estimarRefeicao` em `js/estimador.js` (há um TODO com o formato esperado). A foto já é guardada, só não é analisada.
- **Menores de idade**: a partir de 14 anos. Abaixo de 18, déficit limitado a 10% e avisos reforçados. Pisos de segurança de calorias (1200 mulheres / 1500 homens).
- **Atividade**: o nível de atividade descreve o dia a dia *sem* treino; os treinos registrados entram à parte (evita contar duas vezes).
- **p-ratio**: segue `body-composition-prediction-methodology.md`, com três ajustes documentados no código: fração em *massa* (não em energia), efeito Forbes (pessoa mais magra perde proporcionalmente mais massa magra) e teto de ganho de massa magra por nível de experiência. A metodologia traz um erro de conta no cenário A (0,35); a fórmula dá 0,4225.
- **Fotos** nunca vão para a nuvem.
- **Banco de alimentos**: ver a seção "Banco de alimentos unificado" abaixo. O embutido (`js/foods.js`, uma linha por alimento, escrito à mão) guarda os apelidos e as porções caseiras mais usados.

## Banco de alimentos unificado

Quatro fontes, com prioridade ao desduplicar: **TACO > IBGE > embutido > USDA**. "Mesmo alimento" = nome equivalente (sem acento, plural, ordem das palavras, sinônimos pt-BR) e valores próximos (±15% de kcal, proteína e gordura coerentes). Fica um registro, o da fonte de maior prioridade, que recebe os apelidos e as porções caseiras das outras. Cru, cozido, frito, grelhado e assado nunca se fundem.

| Camada | Arquivo | Fonte |
|---|---|---|
| TACO | `data/taco.json` | Tabela Brasileira de Composição de Alimentos, 4ª ed. (NEPA/UNICAMP, 2011) |
| IBGE | `data/ibge.json` | POF 2008-2009: Tabelas de Composição Nutricional + Tabela de Medidas Referidas (porções caseiras) |
| Embutido | `js/foods.js` | escrito à mão (apelidos e porções caseiras curados) |
| USDA | `data/usda.json` | FoodData Central (Foundation Foods + SR Legacy), selecionados e traduzidos por regras |
| Open Food Facts | online | só por busca/código de barras, quando a pessoa toca em "Buscar produto" (nenhum dump) |

Cada item: id estável com prefixo da fonte (`taco-5`, `ibge-6300101-99`, `usda-s167785`; os do embutido mantêm o id antigo), nome, apelidos, grupo, kcal/proteína/carboidrato/gordura/fibra/açúcar por 100 g (ou ml), porções caseiras, líquido?, flags (ultraprocessado, bebida açucarada, suplemento). Os arquivos de `data/` carregam sob demanda, uma camada por vez e em fatias (para não travar a tela), entram no service worker (funcionam offline) e somam cerca de 250 KB. Um alimento do embutido absorvido por TACO/IBGE some do banco quando a camada carrega, mas o id antigo continua resolvendo (`alimentoPorId`), então refeições e favoritos já salvos não quebram. O parser usa índice invertido por palavra e desempata sempre a favor da fonte brasileira (o que a pessoa criou vale mais).

Regenerar (os scripts são reprodutíveis; os arquivos baixados inteiros ficam fora do projeto, só os extratos pequenos de `tools/fonte/` são versionados):

```bash
node tools/gerar-taco.mjs                       # tools/fonte/taco4-extrato.json -> taco-itens.json
node tools/gerar-ibge.mjs --xls tabelacompleta.xls tabelamedidas_bd.xls   # planilhas do IBGE -> ibge-extrato.json -> ibge-itens.json (sem --xls usa o extrato)
node tools/gerar-usda.mjs --csv <pasta-foundation> <pasta-sr-legacy>      # CSV do FDC -> usda-extrato.json -> usda-itens.json (sem --csv usa o extrato)
node tools/unificar-banco.mjs                   # desduplica e grava data/*.json e tools/relatorio-banco.md
node tools/gerar-sw.mjs atlas-v1.5.0            # renova o cache offline
```

Fontes originais (baixadas só para gerar os extratos): IBGE `ftp.ibge.gov.br/Orcamentos_Familiares/Pesquisa_de_Orcamentos_Familiares_2008_2009/` (pastas `Tabelas_de_Composicao_Nutricional_dos_Alimentos_Consumidos_no_Brasil` e `Tabela_de_Medidas_Referidas_para_os_Alimentos_Consumidos_no_Brasil`) e USDA `fdc.nal.usda.gov/download-datasets` (`FoodData_Central_foundation_food_csv_2026-04-30.zip` e `FoodData_Central_sr_legacy_food_csv_2018-04.zip`). O relatório de desduplicação (contagens por fonte, fundidos, descartados) fica em `tools/relatorio-banco.md`.

### Licenças e créditos (também em Ajustes > Créditos)

- **TACO**: reprodução permitida citando a fonte (NEPA/UNICAMP). Transcrição em JSON: IgorFZ/taco-br (MIT).
- **IBGE**: dados do IBGE (POF 2008-2009), citados como fonte em Ajustes. As páginas de termos de uso do IBGE bloquearam o acesso automático (HTTP 403), então os termos exatos de reprodução não foram verificados no texto oficial; a prática do IBGE é permitir o uso de dados e tabelas citando a fonte, e o app cita. Se o app virar comercial, vale pedir confirmação ao IBGE.
- **USDA FoodData Central**: domínio público (CC0 1.0 Universal; conferido em fdc.nal.usda.gov/download-datasets). Pede-se citar o FoodData Central como fonte, o que o app faz.
- **Open Food Facts**: ODbL 1.0 (opendatacommons.org/licenses/odbl/1-0); só o produto que a pessoa escolhe é guardado, com a fonte indicada.

## Ilustrações dos exercícios

Todo exercício (ficha, troca e execução) mostra fotos do **free-exercise-db** (https://github.com/yuhonas/free-exercise-db, domínio público/Unlicense): posição inicial e final lado a lado na ficha, miniatura na troca e na execução. O casamento de cada exercício com a foto equivalente foi revisado à mão (`js/ilustracoes-dados.js`); para variações sem equivalente exato (elástico, mochila) usa-se o exercício mais fiel que existe no banco. As fotos foram redimensionadas para 640 px (`img/ex/`, cerca de 8 MB) e ficam no cache do service worker conforme aparecem, funcionando offline depois da primeira visualização. Se uma imagem falhar ao carregar aparece um ícone neutro. `tests/ilustracoes.test.mjs` garante que todo exercício tem foto existente em disco. Créditos também em Ajustes.

## Atividades e MET

O catálogo tem 19 atividades, incluindo **Pilates** (solo/mat, reformer, cadillac), **CrossFit** (WOD for time, AMRAP, EMOM, força/ginástica, técnica/aquecimento) e **Yoga** separados, todos com MET por intensidade (fontes e justificativas nos comentários de `js/atividades.js`) e atalhos de duração de 30/45/60 min. CrossFit e pilates também contam como um pouco de estímulo de força na previsão (séries equivalentes, com teto de 30 em 14 dias); cardio e yoga não.

O gasto de atividades é **líquido** e estimado: (MET - 1) x peso x horas, com MET do Compêndio de Atividades Físicas (corrida, caminhada e bike usam a velocidade; as demais, a intensidade). Cardio e esportes contam como gasto de energia na previsão, não como estímulo de hipertrofia.
