# ADR-0004 — Validação e política de erro

## Contexto

O Express 5 encaminha rejeições de handlers `async` para o error handler, e o `express.json()`
emite erros com `type` (`entity.parse.failed`, `entity.too.large`). Sem error handler, o
default do Express responde **HTML com stack** — formato que o front não sabe consumir. O front
espera JSON e precisa distinguir erro de entrada, indisponibilidade de banco e bug interno.

## Decisão

- **Validação:** `zod` (já era dependência) + middleware próprio; sem biblioteca de cola.
- A validação **lança um erro conhecido**; o error handler é o **único escritor** do envelope.
- Envelope **(i)**: `{ error: { code, message, details } }`.
- **400** para JSON malformado (`entity.parse.failed`) e para falha de validação. **Não** usar
  422.
- **413** (`entity.too.large`) e **404** (rota inexistente, via handler terminal) com códigos
  próprios.
- **Banco:** allowlist de códigos transitórios → **503**: `P1001`, `P1002`, `P2024`,
  `ECONNREFUSED`, `ETIMEDOUT`, `08006`, `53300`. Todo o resto → **500**.
- `fail fast` no boot (`$connect()` na inicialização): **adiado**.

## Consequências

- Contrato de erro uniforme em JSON: o front consegue separar validação (400), payload grande
  (413), rota (404), indisponibilidade transitória (503) e bug (500), sem parsear stack.
- O error handler centraliza a decisão de status; validadores não chamam `res` diretamente,
  o que evita respostas duplicadas.
- A allowlist de códigos precisa cobrir tanto erros do Prisma (`P10xx`/`P20xx`) quanto do
  driver `pg` (SQLSTATE/`ECONNREFUSED`) — os dois vocabulários convivem por causa do adapter.
- `fail fast` adiado: banco fora aparece só na primeira request (e como 503), não no boot.
- Ordem de middlewares passa a importar: o body-parser roda antes do CORS hoje, então respostas
  de erro do parser saem sem os headers de CORS.

## Alternativas descartadas

- **400 + 422**.
- Envelope **(ii)** e **RFC 9457**.
- **`zod-express-middleware`**: peer deps presos a Express 4 / zod 3 (o projeto usa Express 5 e
  zod 4).
- **`express-zod-api`**: framework inteiro para o problema.
- **Só 500**.

## Status

**Pendente.** Apenas o schema zod existe (`models/post.ts`) e é chamado no controller; o
middleware, o erro conhecido, o error handler, o envelope, os status e a allowlist não foram
implementados.

## Estado atual verificado (pré-implementação)

- `models/post.ts` define `SPost` e `SPostInput` (zod 4). Única peça da decisão presente.
- `createPost` chama `SPostInput.parseAsync(req)` — parseia o **objeto `Request` inteiro**, não
  `req.body` — e não persiste: devolve `id`, `imageUrl`, `author` e `createdAt` fixos. Hoje
  qualquer `POST /feed/post` responde **500 em HTML** com `ZodError` (`title`, `imageUrl`,
  `content`, `author` como `undefined`).
- `SPostInput` deriva de `SPost` e exige `imageUrl` e `author`, mas o contrato só envia
  `title`/`content` (os demais têm default no banco). Mesmo corrigindo para `req.body`, o POST
  continuaria em 400.
- `getPosts` engole o erro: `catch` só faz `console.log` e nunca responde — a request fica
  pendurada. No caminho feliz, formata a data em `mm/dd/aaaa` (ADR-0003).
- JSON malformado → **400 em HTML** (body-parser), sem headers de CORS, porque `express.json()`
  é registrado antes do middleware de CORS.
- Rota inexistente → **404 em HTML** (`Cannot GET /nope`), sem handler terminal.
- Sem handler explícito de `OPTIONS`, mas o Express 5 responde `200` com `Allow: POST` e o
  middleware global injeta `Access-Control-Allow-*` — o preflight **passa** hoje. O POST real é
  que falha (500/ZodError), não o preflight.

## Pendências

- **Divergência (repo vence):** não existe middleware de validação nem pasta de middlewares; a
  validação está inline no controller.
- **Divergência (repo vence):** não existe erro conhecido nem error handler; erros de
  `express.json()` e do zod saem em HTML.
- **Divergência (repo vence):** não existe 404 terminal; o `OPTIONS` é respondido
  automaticamente pelo Express 5 (a falha de preflight registrada originalmente não se
  reproduz).
- Implementar o envelope `{ error: { code, message, details } }`.
- Implementar 400 (parse e validação), 413 e 404 com códigos próprios; sem 422.
- Implementar a allowlist de transitórios → 503 e o fallback → 500.
- Corrigir `SPostInput.parseAsync(req)` → `req.body` e alinhar o schema ao contrato
  (`title`/`content` obrigatórios; `imageUrl`/`author` opcionais com default do banco).
- Corrigir `getPosts`: responder no `catch` (ou `next(error)`) e formatar a data como
  `dd/mm/aaaa`.
- Reavaliar a ordem CORS × body-parser para que erros de parser também tenham headers de CORS.
- `fail fast` com `$connect()` no boot: adiado, sem previsão.
- `docs/api-contract.md` não documenta status de erro e ainda afirma "sem banco de dados"
  (ADR-0003); o request de `POST /feed/post` lista só `title`/`content`, enquanto o schema exige
  `imageUrl`/`author`.
- `AGENTS.md` está desatualizado: diz "sem banco", "`models/post.ts` vazio", "`zod` não é
  importado" e não menciona `utils/database.ts`.
