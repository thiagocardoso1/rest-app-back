# ADR-0002 — Identidades de banco separadas

## Contexto

Migrations do Prisma precisam de uma _shadow database_ (criação de banco temporário), o que
exige `CREATEDB`. Já o processo Express só faz DML. Usar uma única credencial daria ao runtime
poder de alterar schema.

## Decisão

- **`rest_admin`**: `LOGIN` + `CREATEDB` (necessário para a shadow database), **sem
  superusuário**. É dono do database `rest_app` e da tabela `"Post"`.
- **`rest_app`**: `LOGIN` apenas para o runtime Express.
- Privilégios do app: `SELECT`/`INSERT`/`UPDATE`/`DELETE` nas tabelas e `USAGE`/`SELECT` nas
  sequences, concedidos por `ALTER DEFAULT PRIVILEGES FOR ROLE rest_admin IN SCHEMA public`
  (objetos futuros) mais `GRANT ... ON ALL TABLES` como rede para objetos já existentes.
  DDL é negado.
- Variáveis de ambiente separadas: `DATABASE_URL` = `rest_app` (runtime/adapter);
  `PRISMA_MIGRATE_URL` = `rest_admin` (CLI, lida em `prisma7.config.ts`). `.env` está no
  `.gitignore`.
- Decisão consciente: **CRUD completo** concedido antes de existirem rotas de escrita no
  Express.

## Consequências

Estado verificado no cluster (PostgreSQL 18.3):

| Verificação | Resultado |
| --- | --- |
| `pg_roles` de `rest_admin` | `rolsuper = false`, `rolcreatedb = true`, `rolcanlogin = true` |
| `pg_roles` de `rest_app` | `rolsuper = false`, `rolcanlogin = true` |
| Dono do database `rest_app` | `rest_admin` |
| Dono da tabela `"Post"` | `rest_admin` (`public`) |
| Grants de `rest_app` em `"Post"` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` (sem `REFERENCES`, `TRIGGER`, `TRUNCATE`) |
| `public` para `rest_app` | `USAGE = true`, `CREATE = false` |
| Sequence `Post_id_seq` para `rest_app` | `USAGE = true`, `SELECT = true` |
| Default ACLs (`pg_default_acl`) | `rest_admin` → `rest_app` com `arwd` (tabelas) e `rU` (sequences) em `public` |
| Prova de DDL negado | `create table` como `rest_app` → `42501 permissão negada para esquema public` |

- Vazamento da credencial de runtime não permite DDL.
- Migrations **precisam** rodar como `rest_admin`; os `ALTER DEFAULT PRIVILEGES` são por role,
  então objetos criados por outra role não herdariam os grants.
- Duas credenciais no `.env`, sem política de rotação (URLs sem query params, o que facilita
  rotação sem encoding duplicado).
- `rest_admin` com `CREATEDB` não é superusuário, mas ainda pode criar bancos.

## Alternativas descartadas

- **Superusuário único** para CLI e runtime.
- **Role única com `CREATEDB`**: daria poder de DDL ao runtime.
- **Privilégio mínimo (só `SELECT`/`INSERT`)**: não cobre `UPDATE`/`DELETE` das rotas de
  escrita previstas.

## Status

Aceito — implementado, com divergências registradas abaixo.

## Pendências

- **Divergência (repo vence):** `rest_app` está com `rolcreatedb = true` no cluster, embora a
  decisão seja "LOGIN sem atributos". Mitigação: `ALTER ROLE rest_app NOCREATEDB;`.
- **Divergência (repo vence):** `prisma7.config.ts` usa `process.env.PRISMA_MIGRATE_URL`
  diretamente; `env()` é importado de `prisma/config` mas não usado. Falta a validação/erro
  explícito que `env()` daria.
- **Divergência (repo vence):** não há `.env.example` documentando as duas variáveis, nem
  script versionado para recriar roles/grants. O setup das identidades só existe fora do repo.
- Os grants foram verificados manualmente (consultas em `information_schema`/`pg_catalog`);
  não há teste automatizado que falhe se o privilégio for revogado.
