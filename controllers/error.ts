import type { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";

export type NormalizedError = { status: number; code: string; message: string; details?: unknown };

export class errorController {
    static async errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
        if (res.headersSent) return next(err);

        const { status, code, message, details } = normalize(err);

        if (status >= 500) console.error(err);

        res.status(status).json({ error: { code, message, details: status >= 500 ? undefined : details } });
    }
}

function normalize(err: unknown): NormalizedError {
    if (createHttpError.isHttpError(err)) {
        return {
            status: err.status,
            code: err.code ?? "HTTP_ERROR", // vai existir se veio do seu createHttpError
            message: err.message,
            details: err.details,
        };
    }

    return { status: 500, code: "INTERNAL_ERROR", message: "Internal server error" };
}
