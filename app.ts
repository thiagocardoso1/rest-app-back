import express from "express";
import { Request, Response, NextFunction } from "express";
import { feedRouter } from "./routes/feed";

const app = express();

app.use(express.urlencoded()); // x-www-form-urlencoded <form>
app.use(express.json()); // application/json

app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET, POST, PUT, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

app.use("/feed", feedRouter);
app.listen(8080);
