# Atlas Fitness

PWA de **alimentação + treino + corpo + relatórios**, em português do Brasil. JavaScript puro (módulos ES), sem build, funciona offline e instala na tela inicial.

- **Alimentação** (aba inicial): escreva o que comeu ("2 ovos mexidos, 150 g de arroz, 1 banana, café com leite"), confira a tradução em kcal/macros e salve. Banco local com mais de 150 alimentos brasileiros. Sem IA nesta versão.
- **Treino**: escolha os dias; o app monta fichas que cobrem todas as porções de cada músculo (peitoral clavicular/esternal/costal, três cabeças do tríceps, etc.), explica por que cada exercício entrou, troca por alternativas que ativam as mesmas porções e registra cargas, repetições e gasto calórico.
- **Registrar treino do dia** (na aba Alimentação): marca o treino programado como feito (completo ou parcial) com 1 toque, ou registra outra atividade (corrida, caminhada, bike, natação, HIIT, esportes...) com ritmo/pace, distância (km ou milhas), duração e kcal ao vivo. Entra no balanço do dia, nos relatórios e no gasto da previsão.
- **Corpo**: peso, % de gordura (manual, fórmula da Marinha, dobras de Jackson-Pollock 3/7 ou IMC), 14 medidas, fotos de progresso e histórico.
- **Relatórios**: gráficos em SVG, previsão de composição em 4/8/12 semanas (modelo p-ratio + Forbes, com faixa de incerteza), detecção de platô e guias.
- **Boas-vindas** (primeira abertura, só com Firebase configurado): entrar com e-mail/senha, criar conta (com aceite de privacidade), Google, esqueci a senha, ou **Continuar sem login**. A escolha é lembrada; quem está logado vai direto ao app; conta existente puxa os dados e pula o onboarding; conta nova com dados locais pergunta se quer enviá-los. Sem Firebase configurado a tela não aparece.
- **Dados**: sempre salvos no aparelho; opcionalmente sincronizados com Firebase (login com e-mail/senha ou Google). Exportar/importar JSON e apagar tudo (LGPD) em Ajustes.

> Tudo é estimativa. O app não substitui médico, nutricionista ou educador físico.

## Visual (v1.4)

Identidade "Piso de Ladrilho" (ver `../DESIGN.md`): o progresso do dia é um piso de ladrilhos que se acendem; cantos de folha de ladrilho; cobalto como única cor de ação; claro e escuro automáticos. Fontes Bricolage Grotesque e Figtree ficam em `fonts/` (offline). O ícone (quatro ladrilhos) é gerado por `node tools/gerar-icones.mjs` (192, 512, maskable, apple-touch, favicon).

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

Cobre parser de alimentos e banco, TMB/TDEE/metas/% de gordura, planner (cobertura de porções por dia, equipamentos, lesões, troca), p-ratio/previsão/platô e a camada de dados.

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
  foods.js       banco de alimentos (kcal/macros por 100 g + porções)
  parser.js      texto livre -> itens (quantidades, unidades, sinônimos)
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
tools/      servir.mjs, gerar-icones.mjs, gerar-sw.mjs
docs/       FIREBASE_SETUP.md
```

## Decisões que valem saber

- **IA da alimentação**: só banco local. Para plugar IA depois, troque o corpo de `estimarRefeicao` em `js/estimador.js` (há um TODO com o formato esperado). A foto já é guardada, só não é analisada.
- **Menores de idade**: a partir de 14 anos. Abaixo de 18, déficit limitado a 10% e avisos reforçados. Pisos de segurança de calorias (1200 mulheres / 1500 homens).
- **Atividade**: o nível de atividade descreve o dia a dia *sem* treino; os treinos registrados entram à parte (evita contar duas vezes).
- **p-ratio**: segue `body-composition-prediction-methodology.md`, com três ajustes documentados no código: fração em *massa* (não em energia), efeito Forbes (pessoa mais magra perde proporcionalmente mais massa magra) e teto de ganho de massa magra por nível de experiência. A metodologia traz um erro de conta no cenário A (0,35); a fórmula dá 0,4225.
- **Fotos** nunca vão para a nuvem.
- **Banco de alimentos**: valores aproximados no estilo TACO, escritos à mão; confira e amplie em `js/foods.js` (uma linha por alimento).

## Ilustrações dos exercícios

Todo exercício (ficha, troca e execução) mostra fotos do **free-exercise-db** (https://github.com/yuhonas/free-exercise-db, domínio público/Unlicense): posição inicial e final lado a lado na ficha, miniatura na troca e na execução. O casamento de cada exercício com a foto equivalente foi revisado à mão (`js/ilustracoes-dados.js`); para variações sem equivalente exato (elástico, mochila) usa-se o exercício mais fiel que existe no banco. As fotos foram redimensionadas para 640 px (`img/ex/`, cerca de 8 MB) e ficam no cache do service worker conforme aparecem, funcionando offline depois da primeira visualização. Se uma imagem falhar ao carregar aparece um ícone neutro. `tests/ilustracoes.test.mjs` garante que todo exercício tem foto existente em disco. Créditos também em Ajustes.

## Atividades e MET

O catálogo tem 19 atividades, incluindo **Pilates** (solo/mat, reformer, cadillac), **CrossFit** (WOD for time, AMRAP, EMOM, força/ginástica, técnica/aquecimento) e **Yoga** separados, todos com MET por intensidade (fontes e justificativas nos comentários de `js/atividades.js`) e atalhos de duração de 30/45/60 min. CrossFit e pilates também contam como um pouco de estímulo de força na previsão (séries equivalentes, com teto de 30 em 14 dias); cardio e yoga não.

O gasto de atividades é **líquido** e estimado: (MET - 1) x peso x horas, com MET do Compêndio de Atividades Físicas (corrida, caminhada e bike usam a velocidade; as demais, a intensidade). Cardio e esportes contam como gasto de energia na previsão, não como estímulo de hipertrofia.
