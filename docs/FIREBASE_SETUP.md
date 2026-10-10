# Ativar login e nuvem (Firebase) no Atlas Fitness

Tempo: uns 15 minutos. Custo: R$ 0 no plano gratuito (Spark) para uso normal.
Enquanto você não fizer isso, o app funciona normalmente em **modo local** (sem login, dados só no aparelho).

Você vai: criar um projeto, registrar o app web, ligar o login (e-mail/senha e Google), criar o banco (Firestore), publicar as regras de segurança e colar a configuração no arquivo `firebase-config.js`.

---

## 1. Criar o projeto

1. Abra <https://console.firebase.google.com> e entre com a sua conta Google.
2. Clique no cartão **Criar um projeto** (ou **Adicionar projeto**).
3. Em **Nome do projeto**, digite `atlas-fitness` e clique em **Continuar**.
4. Na tela do Google Analytics, deixe o botão **desativado** (não precisamos) e clique em **Criar projeto**.
5. Espere o "Seu novo projeto está pronto" e clique em **Continuar**.

Você vai cair na **Visão geral do projeto**.

## 2. Registrar o app web e copiar a configuração

1. Na Visão geral, clique no ícone **`</>`** (Web), logo abaixo de "Comece adicionando o Firebase ao seu app".
2. **Apelido do app:** `Atlas Fitness Web`.
3. **Não** marque "Configurar também o Firebase Hosting".
4. Clique em **Registrar app**.
5. Aparece um bloco de código com `const firebaseConfig = { ... }`. **Copie só os valores** (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).
6. Abra o arquivo `app/firebase-config.js` e troque cada `COLE_AQUI...` pelo valor correspondente, mantendo as aspas. Exemplo:

   ```js
   export const firebaseConfig = {
     apiKey: 'AIzaSy...',
     authDomain: 'atlas-fitness-xxxxx.firebaseapp.com',
     projectId: 'atlas-fitness-xxxxx',
     storageBucket: 'atlas-fitness-xxxxx.appspot.com',
     messagingSenderId: '1234567890',
     appId: '1:1234567890:web:abcdef123456',
   };
   ```

7. De volta ao console, clique em **Continuar para o console**.

> Esses valores **não são segredos**. Quem protege os dados são as regras do passo 5 e a lista de domínios do passo 4.

## 3. Ligar o login

1. No menu da esquerda, abra **Criação** (ou **Build**) e clique em **Authentication**.
2. Clique em **Vamos começar**.
3. Na aba **Método de login**, escolha **E-mail/senha**:
   - ligue a **primeira** chave (E-mail/senha) e deixe "Link de e-mail" desligado;
   - clique em **Salvar**.
4. Clique em **Adicionar novo provedor** e escolha **Google**:
   - ligue a chave **Ativar**;
   - em **Nome do projeto para o público** deixe `Atlas Fitness`;
   - em **E-mail de suporte do projeto** escolha o seu e-mail;
   - clique em **Salvar**.

## 4. Autorizar o endereço do app

1. Ainda em **Authentication**, abra a aba **Configurações** e depois **Domínios autorizados**.
2. `localhost` já está na lista (serve para testar no computador).
3. Clique em **Adicionar domínio** e digite o endereço onde o app vai ficar, **sem** `https://` e sem barra no final. Para GitHub Pages: `ericsouzag.github.io`.
4. Clique em **Adicionar**.

Se esquecer este passo, o login mostra o erro "Este endereço ainda não está autorizado".

## 5. Criar o banco (Firestore) e as regras

1. No menu da esquerda, **Criação** > **Firestore Database** > **Criar banco de dados**.
2. **Edição:** Standard. **ID do banco:** deixe `(default)`.
3. **Local:** escolha `southamerica-east1 (São Paulo)` e clique em **Avançar**.
4. Escolha **Iniciar no modo de produção** e clique em **Criar**.
5. Quando abrir o banco, clique na aba **Regras**.
6. Apague tudo o que estiver no editor, abra o arquivo `app/firestore.rules` deste projeto, copie o conteúdo e cole no editor.
7. Clique em **Publicar**.

O que essas regras fazem: cada pessoa só lê e grava dentro de `users/<o próprio id>`. Todo o resto é negado.

## 6. Testar

1. Rode o app (veja o `README.md`) e abra **Ajustes > Conta e nuvem**.
2. Digite e-mail e senha (6+ caracteres) e toque **Criar conta**. Deve aparecer "Conectado como ..." e "Sincronizado".
3. Registre uma refeição, abra o app em outro aparelho/navegador, entre com a mesma conta: a refeição aparece lá.
4. No console do Firebase, **Firestore Database > Dados**: você verá `users > (seu id) > refeicoes`.

## Problemas comuns

| Mensagem | O que fazer |
|---|---|
| "Este endereço ainda não está autorizado" | Passo 4: adicione o domínio onde o app está aberto. |
| "Sem permissão no Firestore" | Passo 5: publique as regras de `firestore.rules`. |
| Google não abre no iPhone com o app instalado na tela inicial | Use e-mail e senha nesse caso (limitação do iOS com apps instalados). |
| "Firebase não configurado" | Algum `COLE_AQUI` ficou no `firebase-config.js`. |

## Sobre dados e LGPD

- Fotos **não** vão para a nuvem (ficam só no aparelho).
- Em **Ajustes**, a pessoa pode **exportar** tudo, **apagar tudo no aparelho** e **apagar os dados da nuvem** (tentando também excluir a conta).
- Se um dia você tiver muitos usuários, vale ligar um alerta de orçamento em **Configurações do projeto > Uso e faturamento**.
