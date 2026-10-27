// environment.d.ts
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DATABASE_URL: string;
            PRISMA_MIGRATE_URL: string;
        }
    }
}

export {};
