import { Request, Response, NextFunction } from "express";

export class feedController {
    static getPosts = (req: Request, res: Response, next: NextFunction) => {
        res.status(200).json({
            posts: [
                {
                    id: 1,
                    title: "Primeiro post",
                    imageUrl: "https://picsum.photos/seed/1/640/320",
                    content: "Conteudo curto do post para visualizacao inicial da estrutura. Expanda para ver mais.",
                    author: "Thigas",
                    createdAt: "15/10/2026",
                },
                {
                    id: 2,
                    title: "Segundo post",
                    imageUrl: "https://picsum.photos/seed/2/640/320",
                    content: "Outro conteudo de exemplo para validar layout, espacamento e botoes de acao.",
                    author: "Rest App",
                    createdAt: "14/10/2026",
                },
            ],
        });
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
