import { env } from "@sitorstartai/env/server";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
            };
        }
    }
}

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                data: null,
                error: "NO_TOKEN_PROVIDED",
            });
        }

        const token = authHeader.substring(7);

        if (!token) {
            return res.status(401).json({
                success: false,
                data: null,
                error: "NO_TOKEN_PROVIDED",
            });
        }

        const secret = env.JWT_SECRET;
        const decoded = jwt.verify(token, secret) as {
            userId: string;
            email: string;
        };

        req.user = {
            userId: decoded.userId,
            email: decoded.email,
        };

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                data: null,
                error: "INVALID_TOKEN",
            });
        }

        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                data: null,
                error: "TOKEN_EXPIRED",
            });
        }

        return res.status(500).json({
            success: false,
            data: null,
            error: "Internal server error",
        });
    }
};
