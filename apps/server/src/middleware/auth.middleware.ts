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

/**
 * Extracts user from token if present, but does not reject unauthenticated requests.
 * Sets req.user if a valid token is provided, otherwise continues without it.
 */
export const optionalAuthMiddleware = async (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
            if (token) {
                const secret = env.JWT_SECRET;
                const decoded = jwt.verify(token, secret) as {
                    userId: string;
                    email: string;
                };
                req.user = {
                    userId: decoded.userId,
                    email: decoded.email,
                };
            }
        }
    } catch {
        // Invalid or expired token — continue without user context
    }

    next();
};

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
