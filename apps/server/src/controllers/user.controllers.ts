import type { Request, Response } from "express";
import prisma from "@sitorstartai/db";

const getAllUsers = async (_req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                createdAt: true,
            },
            orderBy: {
                email: "asc",
            },
        });

        res.json({
            success: true,
            data: users,
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch users",
        });
    }
};

const getUserReservations = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: id as string },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
            });
        }

        const reservations = await prisma.reservation.findMany({
            where: {
                userId: id as string,
            },
            include: {
                event: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        totalSeats: true,
                        availableSeats: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                },
                reservations,
            },
        });
    } catch (error) {
        console.error("Error fetching user reservations:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch user reservations",
        });
    }
};

export const userController = {
    getAllUsers,
    getUserReservations,
};