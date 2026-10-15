import express from "express";
import { feedController } from "../controllers/feed";

export const feedRouter = express.Router();

// GET /feed/posts
feedRouter.get("/posts", feedController.getPosts);

// POST /feed/post
feedRouter.post("/post", feedController.createPost);
