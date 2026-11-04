import { z } from "zod";

export const SPost = z.object({
    id: z.coerce.number().positive(),
    title: z.string(),
    imageUrl: z.url(),
    content: z.string(),
    author: z.string(),
    createdAt: z.string().transform((v) => new Date(v)),
});

export const SPostInput = SPost.omit({ id: true, createdAt: true });

export type IPost = z.infer<typeof SPost>;
export type IPostInput = z.input<typeof SPost>;
