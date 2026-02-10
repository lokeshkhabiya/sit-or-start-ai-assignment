import prisma from "@sitorstartai/db";
import type { Request, Response } from "express";
import { z } from "zod";

const paginationSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

const getAllEvents = async (req: Request, res: Response) => {
	try {
		const parsed = paginationSchema.safeParse(req.query);

		if (!parsed.success) {
			return res.status(400).json({
				success: false,
				data: null,
				error: "INVALID_PAGINATION_PARAMS",
			});
		}

		const { page, limit } = parsed.data;
		const skip = (page - 1) * limit;

		const [events, total] = await Promise.all([
			prisma.event.findMany({
				select: {
					id: true,
					name: true,
					description: true,
					totalSeats: true,
					availableSeats: true,
					createdAt: true,
				},
				orderBy: { createdAt: "desc" },
				skip,
				take: limit,
			}),
			prisma.event.count(),
		]);

		return res.status(200).json({
			success: true,
			data: {
				events,
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
				},
			},
			error: null,
		});
	} catch (error) {
		console.error("Error fetching events:", error);
		return res.status(500).json({
			success: false,
			data: null,
			error: "Internal server error",
		});
	}
};

const getEventById = async (req: Request, res: Response) => {
	try {
		const id = req.params.id as string;

		const event = await prisma.event.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				description: true,
				totalSeats: true,
				availableSeats: true,
				createdAt: true,
			},
		});

		if (!event) {
			return res.status(404).json({
				success: false,
				data: null,
				error: "EVENT_NOT_FOUND",
			});
		}

		let userReservation = null;

		if (req.user?.userId) {
			const reservation = await prisma.reservation.findUnique({
				where: {
					userId_eventId: {
						userId: req.user.userId,
						eventId: id,
					},
				},
				select: {
					id: true,
					status: true,
					createdAt: true,
				},
			});

			if (reservation && reservation.status === "ACTIVE") {
				userReservation = reservation;
			}
		}

		return res.status(200).json({
			success: true,
			data: {
				...event,
				userReservation,
			},
			error: null,
		});
	} catch (error) {
		console.error("Error fetching event:", error);
		return res.status(500).json({
			success: false,
			data: null,
			error: "Internal server error",
		});
	}
};

export const eventController = {
	getAllEvents,
	getEventById,
};
