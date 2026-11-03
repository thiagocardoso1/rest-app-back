# ADR-0003 — Geração do client, modelo e fuso

## Contexto

O projeto roda TypeScript direto com `tsx`, sem build, e usa o generator `prisma-client` do
Prisma 7 (que gera TS, não JS, e resolve imports por extensão). O PostgreSQL armazena
`createdAt` como `timestamp(3)` **sem** fuso, e o servidor local está em
`America/Sao_Paulo` (verificado: `current_setting('TimeZone')` = `America/Sao_Paulo` para
`rest_admin` e `rest_app`). O contrato com o front exige `dd/mm/aaaa`.

## Decisão

- Generator `prisma-client` com:
  - `output = "../src/generated/prisma"`
  - `moduleFormat = "esm"`
  - `importFileExtension = "ts"` — obrigatório por causa do `tsx`; sem ele o import resolve
    `./internal/class.js` e falha com `Cannot find module './internal/class.js'`.
- `model Post`:
  - `id Int @id @default(autoincrement())` → gera `SERIAL`;
  - todas as colunas `NOT NULL`;
  - `title String @db.VarChar(50)`;
  - `imageUrl String @default("https://picsum.photos/seed/1/640/320")` (URL estática);
  - `content String`;
  - `author String @default("Thigas")`;
  - `createdAt DateTime @default(now())` → `timestamp(3) DEFAULT CURRENT_TIMESTAMP`.
- **Fuso:** a sessão de escrita do app é fixada em UTC com
  `options: "-c timezone=UTC"` no `PoolConfig` do `PrismaPg` (`utils/database.ts`). Foi
  escolhida a alternativa que mantém o invariante **versionado no repo**, sem depender de
  configuração de servidor. A formatação de saída para `dd/mm/aaaa` deve usar
  `America/Sao_Paulo` explícito na borda.
- Mapper e schema de validação em `models/post.ts` (nome no singular). O schema existe; o
  mapper ainda não foi extraído (ver Pendências).

## Consequências

- SQL das migrations reflete o modelo: `SERIAL`, `VARCHAR(50)`/`TEXT`, `NOT NULL`,
  defaults textuais e `TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP`.
- O client gerado é artefato (`src/generated/prisma` no `.gitignore`, junto com
  `/generated/prisma`): `prisma generate` é pré-requisito para rodar.
- `importFileExtension = "ts"` acopla a execução a um loader/runtime que resolva TypeScript
  (`tsx`). Um build com `tsc` exigiria `allowImportingTsExtensions` e revisão do output.
- Como o servidor está em `America/Sao_Paulo`, é o `options` do pool — e não o default do
  servidor — que garante gravação/leitura em UTC. Ler sem esse pool muda a interpretação do
  `timestamp` sem fuso.
- `title` em `VARCHAR(50)` no banco é mais restritivo que o contrato (`title` é `string` sem
  limite documentado); título maior que 50 caracteres falha no banco.

## Alternativas descartadas

- `options` nas URLs de conexão: encoding duplicado e o parâmetro some na rotação de
  credencial.
- `ALTER DATABASE/ROLE ... SET timezone`: estado invisível fora do repo.
- `timestamptz`.
- `createdAt` como `String`.

## Status

Aceito na configuração (generator, modelo e sessão UTC). A formatação de saída da data está
**pendente** e diverge do contrato.

## Pendências

- **Divergência (repo vence):** `utils/database.ts` **já** aplica
  `options: "-c timezone=UTC"` no `PrismaPg`. A pendência registrada originalmente ("ainda sem
  options") não existe no repo; a decisão está implementada.
- **Divergência (repo vence):** não há mapper em `models/post.ts`. O arquivo só tem os schemas
  zod (`SPost`, `SPostInput`) e os tipos; a conversão de data está inline em
  `controllers/feed.ts`.
- **Divergência (repo vence):** `getPosts` formata com `p.createdAt.toLocaleDateString("en-US")`,
  que produz **`mm/dd/aaaa`** (a API responde `"10/26/2026"`), sem `America/Sao_Paulo`
  explícito. O contrato e esta decisão pedem `dd/mm/aaaa`.
- `title @db.VarChar(50)` existe no repo (migration aplicada) e não constava na decisão
  original; o limite não está refletido no contrato nem validado na entrada.
- Sem `tsconfig.json`, o `importFileExtension = "ts"` só é validado em runtime pelo `tsx`;
  `npm start` (build) continua inviável.
- `docs/api-contract.md` exemplifica `dd/mm/aaaa`, formato que a implementação ainda não
  entrega.
