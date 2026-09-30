# Expedição Gaúcha — versão Supabase

Projeto mestre da Feira Cultural com os três jogos, portal, ranking online e estatísticas.

## Arquitetura definitiva

- **GitHub:** guarda o código do projeto.
- **Netlify:** publica o portal, os jogos e executa as Functions.
- **Supabase:** guarda todas as partidas e alimenta ranking/estatísticas.

Os navegadores **não recebem a chave administrativa do Supabase**. Eles chamam `/api/...` no Netlify; as Netlify Functions acessam o Supabase no servidor.

## Estrutura

```text
expedicao-gaucha/
├── public/
│   ├── index.html
│   ├── personalidades/
│   ├── rota/
│   ├── bah-ou-nao-bah/
│   ├── ranking/
│   └── assets/
├── netlify/functions/
│   ├── _shared.mjs
│   ├── iniciar-partida.mjs
│   ├── finalizar-partida.mjs
│   ├── ranking.mjs
│   └── estatisticas.mjs
├── supabase/
│   └── schema.sql
├── netlify.toml
├── package.json
└── .env.example
```

## 1. Criar o projeto no Supabase

1. Entre em https://supabase.com e crie um projeto.
2. Aguarde o banco ficar disponível.
3. Abra **SQL Editor**.
4. Crie uma nova consulta.
5. Copie todo o conteúdo de `supabase/schema.sql`.
6. Execute o SQL.
7. Em **Table Editor**, confirme que existe a tabela `partidas`.

## 2. Copiar as credenciais do Supabase

No painel do Supabase, abra as configurações/API do projeto e copie:

- Project URL → será `SUPABASE_URL`
- service role key / secret server key → será `SUPABASE_SERVICE_ROLE_KEY`

**Nunca** coloque a service role key dentro de `public/`, HTML ou JavaScript do navegador, nem faça commit dela no GitHub.

## 3. Enviar o projeto ao GitHub

Crie um repositório chamado `expedicao-gaucha` e envie o conteúdo desta pasta inteira. A raiz do repositório deve conter `public`, `netlify`, `supabase`, `package.json` e `netlify.toml`.

## 4. Importar o GitHub no Netlify

No Netlify:

1. Add new project → Import an existing project.
2. Escolha GitHub.
3. Selecione `expedicao-gaucha`.
4. O `netlify.toml` já define `public` como pasta de publicação e `netlify/functions` como pasta das Functions.

## 5. Configurar as variáveis no Netlify

No projeto do Netlify, abra **Project configuration / Environment variables** e crie:

```text
SUPABASE_URL = https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY = SUA_CHAVE_DE_SERVIDOR
```

A chave deve ficar apenas no Netlify/Supabase, nunca no código público.

Depois das variáveis, faça um novo deploy.

## 6. Teste obrigatório

1. Abra o Portal no celular A.
2. Jogue uma partida até o fim.
3. Abra `/ranking/` no computador B.
4. Confira se a partida apareceu.
5. Jogue novamente com o mesmo nome.
6. Confirme que existem **dois registros separados**.
7. Confira as estatísticas de partidas iniciadas e concluídas.

## Regras de dados

Cada tentativa é um registro independente. Uma mesma pessoa pode aparecer várias vezes no ranking. Uma partida iniciada fica registrada mesmo que seja abandonada; ao terminar, o mesmo registro muda para `concluida` e recebe a pontuação.

Por privacidade na feira, prefira **primeiro nome ou apelido** dos participantes em vez de nome completo.
