import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/database";

export class feedController {
    static getPosts = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const posts = await prisma.post.findMany();
            res.json({ posts });
        } catch (error) {
            console.log(error);
        }
    };

    static createPost = (req: Request, res: Response, next: NextFunction) => {
        const title = req.body.title;
        const content = req.body.content;
        // Create post in db
        res.status(201).json({
            message: "Post created successfully!",
            post: {
                id: 3,
                title: title,
                imageUrl: "https://picsum.photos/seed/3/640/320",
                content: content,
                author: "Thigas",
                createdAt: "19/10/2026",
            },
        });
    };
}
