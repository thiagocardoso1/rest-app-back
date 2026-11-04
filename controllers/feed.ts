import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/database";
import { type IPostInput, SPostInput } from "../models/post";
import createHttpError from "http-errors";
import type { $ZodIssue } from "zod/v4/core";
export class feedController {
    static getPosts = async (req: Request, res: Response, next: NextFunction) => {
        const posts = await prisma.post.findMany();
        res.json({
            posts: posts.map((p) => ({
                ...p,
                createdAt: p.createdAt.toLocaleDateString("en-US"),
            })),
        });
    };

    static createPost = async (req: Request<IPostInput>, res: Response, next: NextFunction) => {
        const result = await SPostInput.safeParseAsync(req.body);
        if (!result.success) {
            return next(
                createHttpError(400, "Invalid payload", {
                    code: "VALIDATION_ERROR",
                    details: projectIssues(result.error.issues),
                })
            );
        }

        const post = await prisma.post.create({ data: result.data });
        res.status(201).json({ message: "Post created successfully!", post });
    };
}

function projectIssues(issues: $ZodIssue[]) {
    return issues.map((i) => ({
        path: i.path.join(", "),
        message: i.message,
    }));
}
