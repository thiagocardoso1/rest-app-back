# ADR-0001 — Persistência: PostgreSQL 18 local + Prisma ORM 7

## Contexto

A API nasceu didática, com posts fixos em memória. Para persistir dados sem abrir mão da
execução direta de TypeScript via `tsx` (sem build step), era preciso escolher banco e
camada de acesso.

Ambiente definido e verificado localmente:

- PostgreSQL **18.3** em `localhost:5432`, database `rest_app`.
- Serviço Windows `postgresql-x64-18` em execução com `StartType = Manual` (o banco não sobe
  automaticamente com a máquina).
- `schema.prisma` sem `url` no bloco `datasource`: no Prisma 7 a conexão do CLI vem de
  `prisma7.config.ts`.

## Decisão

- Persistir em **PostgreSQL 18 local** (database `rest_app`, `localhost:5432`), com o serviço
  `postgresql-x64-18` iniciado manualmente.
- Usar **Prisma ORM 7.10.1**: `prisma` (devDependency), `@prisma/client` e
  `@prisma/adapter-pg`, com CLIs alinhadas na mesma versão (hoje `npm ls` resolve os três em
  `7.10.1`).
- Acesso em runtime pelo **driver adapter** `PrismaPg` em `utils/database.ts`, com
  `DATABASE_URL` carregada por `import "dotenv/config"`.
- Migrations versionadas em `prisma/migrations/` (aplicadas: `20261027014008_init` e
  `20261103201448_edit_title_type_in_post_table`), configuradas por `prisma7.config.ts`
  (`schema`, `migrations.path`, `datasource.url = PRISMA_MIGRATE_URL`).

## Consequências

- Schema e histórico de migrations versionados; tipos gerados pelo Prisma, sem SQL manual na
  aplicação (`prisma.post.findMany()` em `controllers/feed.ts`).
- O client gerado (`src/generated/prisma`) é artefato e está no `.gitignore`: é preciso rodar
  `prisma generate` após clonar/instalar.
- Duas variáveis de ambiente passam a ser obrigatórias (`DATABASE_URL` e
  `PRISMA_MIGRATE_URL`), com `.env` fora do controle de versão.
- Acoplamento ao adapter `@prisma/adapter-pg` e ao ciclo 7.x. A troca para 8.x exige revisão
  coordenada de CLI e client.
- Persistir não resolve o build: `npm start` continua apontando para `dist/app.js`, que não
  existe.

## Alternativas descartadas

- **Prisma 8**: o dist-tag `latest` do Prisma apontava para `8.0.0-rc.27` enquanto o client
  estava em `7.10.1` — versões desalinhadas.
- **`pg` puro**: perde migrations versionadas e tipos gerados.

## Status

Aceito — implementado.

## Pendências

- **Divergência (repo vence):** o `package.json` usa ranges `^7.10.1` para `prisma`,
  `@prisma/client` e `@prisma/adapter-pg` (e `^7.0.0` para `typescript`), não um pino exato. A
  versão instalada hoje é `7.10.1`, mas um `npm install` futuro pode desalinhar CLIs.
- Sem `tsconfig.json` e sem build step: decisão de build em aberto (ver ADR-0003).
- Sem testes automatizados; verificação é manual (`curl`) e por consultas ao banco.
- `AGENTS.md` e `docs/api-contract.md` ainda descrevem o projeto como "sem banco de dados"
  (ver ADR-0004).
