import prisma from "@sitorstartai/db";
import type { Request, Response } from "express";
import { z } from "zod";

const paginationSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

const isPrismaError = (
	error: unknown,
): error is { code: string; meta?: unknown } => {
	return typeof error === "object" && error !== null && "code" in error;
};

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

const reserveSeat = async (req: Request, res: Response) => {
	try {
		const eventId = req.params.id as string;
		const userId = req.user!.userId;

		const event = await prisma.event.findUnique({
			where: { id: eventId },
			select: { id: true, availableSeats: true },
		});

		if (!event) {
			return res.status(404).json({
				success: false,
				data: null,
				error: "EVENT_NOT_FOUND",
			});
		}

		const existingReservation = await prisma.reservation.findUnique({
			where: { userId_eventId: { userId, eventId } },
			select: { id: true, status: true },
		});

		if (existingReservation?.status === "ACTIVE") {
			return res.status(409).json({
				success: false,
				data: null,
				error: "ALREADY_RESERVED",
			});
		}

		const result = await prisma.$transaction(async (tx) => {
			// Atomic conditional decrement — only succeeds if availableSeats > 0
			const updated = await tx.$queryRaw<
				{ id: string }[]
			>`UPDATE "Event" SET "availableSeats" = "availableSeats" - 1, "updatedAt" = NOW() WHERE "id" = ${eventId} AND "availableSeats" > 0 RETURNING "id"`;

			if (!updated || updated.length === 0) {
				throw new Error("EVENT_FULL");
			}

			const reservation = await tx.reservation.upsert({
				where: { userId_eventId: { userId, eventId } },
				create: { userId, eventId, status: "ACTIVE" },
				update: { status: "ACTIVE" },
				select: {
					id: true,
					status: true,
					createdAt: true,
					event: {
						select: {
							id: true,
							name: true,
							availableSeats: true,
							totalSeats: true,
						},
					},
				},
			});

			return reservation;
		});

		return res.status(201).json({
			success: true,
			data: result,
			error: null,
		});
	} catch (error) {
		if (error instanceof Error && error.message === "EVENT_FULL") {
			return res.status(409).json({
				success: false,
				data: null,
				error: "EVENT_FULL",
			});
		}

		if (isPrismaError(error) && error.code === "P2002") {
			return res.status(409).json({
				success: false,
				data: null,
				error: "ALREADY_RESERVED",
			});
		}

		console.error("Error reserving seat:", error);
		return res.status(500).json({
			success: false,
			data: null,
			error: "Internal server error",
		});
	}
};

const cancelReservation = async (req: Request, res: Response) => {
	try {
		const eventId = req.params.id as string;
		const userId = req.user!.userId;

		const existingReservation = await prisma.reservation.findUnique({
			where: { userId_eventId: { userId, eventId } },
			select: { id: true, status: true },
		});

		if (!existingReservation || existingReservation.status !== "ACTIVE") {
			return res.status(404).json({
				success: false,
				data: null,
				error: "RESERVATION_NOT_FOUND",
			});
		}

		const result = await prisma.$transaction(async (tx) => {
			// Optimistic lock: only cancel if still ACTIVE (prevents double-cancel)
			const reservation = await tx.reservation.update({
				where: { id: existingReservation.id, status: "ACTIVE" },
				data: { status: "CANCELLED" },
				select: { id: true, status: true, updatedAt: true },
			});

			// Atomically increment available seats
			await tx.$executeRaw`UPDATE "Event" SET "availableSeats" = "availableSeats" + 1, "updatedAt" = NOW() WHERE "id" = ${eventId}`;

			return reservation;
		});

		return res.status(200).json({
			success: true,
			data: result,
			error: null,
		});
	} catch (error) {
		// P2025: Record not found — reservation was cancelled between check and update
		if (isPrismaError(error) && error.code === "P2025") {
			return res.status(404).json({
				success: false,
				data: null,
				error: "RESERVATION_NOT_FOUND",
			});
		}

		console.error("Error cancelling reservation:", error);
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
	reserveSeat,
	cancelReservation,
};
