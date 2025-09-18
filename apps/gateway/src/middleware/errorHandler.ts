import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
    console.error("❌ Gateway Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
}
