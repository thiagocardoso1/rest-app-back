# AGENTS.md

API REST em Node.js + Express 5 (`rest-app-back`). TypeScript executado direto via `tsx`, sem build step.

## Idioma

- Responda **sempre em português do Brasil (pt-BR)**, inclusive explicações, resumos de tarefa e perguntas de esclarecimento.

## Comandos

- `npm run dev` — servidor em watch (`tsx watch src/app.ts`) na porta **8080** (hardcoded em `app.listen`).
- `npm start` — roda `node dist/app.js`; não há script de build nem `dist/`, então falha hoje.
- Não há testes, lint, formatador nem `tsconfig.json`; o `tsx` usa os defaults.
- Verificação manual (não existe suíte de testes):
  - `curl http://localhost:8080/feed/posts`
  - `curl -X POST http://localhost:8080/feed/post -H "Content-Type: application/json" -d '{"title":"a","content":"b"}'`

## Estrutura

- `src/app.ts` é o **único** arquivo em `src/` — entrypoint: `express.urlencoded` + `express.json`, CORS manual e `app.listen(8080)`.
- `routes/<feature>.ts` e `controllers/<feature>.ts` ficam na **raiz** do repo (não em `src/`); de dentro de `src/` o import é `../routes/<feature>`.
- `controllers/<feature>.ts` — classe com handlers `static` em arrow function.
- `models/post.ts` existe mas está **vazio**: o tipo `Post` é montado inline no controller e não é compartilhado.
- Sem banco de dados (dados fixos em memória) e sem autenticação.

## Endpoints

- `GET /feed/posts` → `200 { posts: Post[] }`
- `POST /feed/post` → `201 { message, post: Post }` (ecoa `title`/`content`; os demais campos são fixos)

O contrato completo (campos, tipos e exemplos) está em `docs/api-contract.md`, carregado automaticamente como instrução via `opencode.jsonc`.

## Contrato

- `docs/api-contract.md` é a fonte de verdade consumida pelo front (`../rest-app-front`, referência `front` em `opencode.jsonc`).
- Mudança de rota, payload, status code ou formato de data exige atualizar o contrato **no mesmo commit**.
- Mudança breaking precisa ser sinalizada explicitamente no resumo da tarefa.
- O front consome **apenas** `GET /feed/posts` (`src/app/services/posts.ts`), esperando `{ posts: Post[] }` com campos não-nulos; `POST /feed/post` ainda não tem consumidor no front.
- Datas trafegam como string `dd/mm/aaaa`, não ISO 8601.

## Convenções

- ESM (`"type": "module"`): use `import`/`export`, como no código existente.
- Mantenha o padrão por feature: `routes/<feature>.ts` + `controllers/<feature>.ts`, registrado em `src/app.ts`.
- Não introduza ORM, validação ou camada de serviço sem pedido explícito; hoje o projeto é didático e mínimo.
- `zod`, `express-session` e `dotenv` estão no `package.json` mas **nada os importa**. O `.gitignore` cita `/generated/prisma` e `.env.keys`, mas não há Prisma nem carregamento de `.env`.
- CORS é liberado para qualquer origem; não restrinja sem que seja solicitado.

## Estado do repo (não commitado)

- Só existe o commit `first commit`. `src/`, `docs/`, `models/`, `opencode.jsonc` e este `AGENTS.md` ainda estão untracked, e o `app.ts` da raiz aparece como deletado (migrado para `src/app.ts`). Não rode `git restore app.ts` nem `git clean -fd`.
