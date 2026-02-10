import type { Request, Response } from "express";
import prisma from "@sitorstartai/db";

const seedDatabase = async (_req: Request, res: Response) => {
	try {
		await prisma.reservation.deleteMany();
		await prisma.event.deleteMany();
		await prisma.user.deleteMany();

		await prisma.user.createMany({
			data: [
				{
					email: "alice@example.com",
					password: "hashed_password_123",
				},
				{
					email: "bob@example.com",
					password: "hashed_password_456",
				},
				{
					email: "charlie@example.com",
					password: "hashed_password_789",
				},
				{
					email: "diana@example.com",
					password: "hashed_password_012",
				},
			],
		});

		const createdUsers = await prisma.user.findMany();

		await prisma.event.createMany({
			data: [
				{
					name: "Tech Conference 2026",
					description:
						"Annual technology conference featuring the latest in AI, blockchain, and cloud computing",
					totalSeats: 100,
					availableSeats: 85,
				},
				{
					name: "Web Development Workshop",
					description:
						"Hands-on workshop covering modern web development with React, Node.js, and TypeScript",
					totalSeats: 30,
					availableSeats: 15,
				},
				{
					name: "Startup Networking Event",
					description:
						"Connect with entrepreneurs, investors, and innovators in the startup ecosystem",
					totalSeats: 50,
					availableSeats: 42,
				},
				{
					name: "AI & Machine Learning Seminar",
					description:
						"Deep dive into neural networks, LLMs, and practical ML applications",
					totalSeats: 75,
					availableSeats: 60,
				},
				{
					name: "Design Thinking Bootcamp",
					description:
						"Learn user-centered design methodologies and rapid prototyping techniques",
					totalSeats: 25,
					availableSeats: 10,
				},
			],
		});

		const createdEvents = await prisma.event.findMany();

		await prisma.reservation.createMany({
			data: [
				{
					userId: createdUsers[0]?.id ?? "",
					eventId: createdEvents[0]?.id ?? "",
					status: "ACTIVE",
				},
				{
					userId: createdUsers[0]?.id ?? "",
					eventId: createdEvents[2]?.id ?? "",
					status: "ACTIVE",
				},
				{
					userId: createdUsers[1]?.id ?? "",
					eventId: createdEvents[1]?.id ?? "",
					status: "ACTIVE",
				},
				{
					userId: createdUsers[1]?.id ?? "",
					eventId: createdEvents[3]?.id ?? "",
					status: "ACTIVE",
				},
				{
					userId: createdUsers[1]?.id ?? "",
					eventId: createdEvents[4]?.id ?? "",
					status: "CANCELLED",
				},
				{
					userId: createdUsers[2]?.id ?? "",
					eventId: createdEvents[0]?.id ?? "",
					status: "ACTIVE",
				},
			],
		});

		const summary = {
			users: await prisma.user.count(),
			events: await prisma.event.count(),
			reservations: await prisma.reservation.count(),
		};

		res.json({
			success: true,
			message: "Database seeded successfully",
			data: summary,
		});
	} catch (error) {
		console.error("Error seeding database:", error);
		res.status(500).json({
			success: false,
			error: "Failed to seed database",
			details: error instanceof Error ? error.message : "Unknown error",
		});
	}
};

export const seedController = {
	seedDatabase,
};
