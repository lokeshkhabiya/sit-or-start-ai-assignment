import bcrypt from "bcryptjs";
import prisma from "@sitorstartai/db";

const USERS = [
	{ name: "Alice Johnson", email: "alice@example.com", password: "password123" },
	{ name: "Bob Smith", email: "bob@example.com", password: "password123" },
	{ name: "Charlie Brown", email: "charlie@example.com", password: "password123" },
	{ name: "Diana Prince", email: "diana@example.com", password: "password123" },
];

const BASE_EVENTS = [
	{
		name: "Tech Conference 2026",
		description:
			"Annual technology conference featuring the latest in AI, blockchain, and cloud computing.",
		totalSeats: 100,
	},
	{
		name: "Web Development Workshop",
		description:
			"Hands-on workshop on modern web development with React, Node.js, and TypeScript.",
		totalSeats: 30,
	},
	{
		name: "Startup Networking Event",
		description:
			"Connect with entrepreneurs, investors, and innovators in the startup ecosystem.",
		totalSeats: 50,
	},
	{
		name: "AI & Machine Learning Seminar",
		description:
			"Deep dive into neural networks, LLMs, and practical machine-learning applications.",
		totalSeats: 75,
	},
	{
		name: "Design Thinking Bootcamp",
		description:
			"Learn user-centered design methodologies and rapid prototyping techniques.",
		totalSeats: 25,
	},
];

const GENERATED_EVENT_COUNT = 120;

const EVENTS = [
	...BASE_EVENTS,
	...Array.from({ length: GENERATED_EVENT_COUNT }, (_, index) => {
		const eventNumber = index + 1;
		const totalSeats = 40 + (eventNumber % 6) * 10;

		return {
			name: `Community Event #${eventNumber}`,
			description: `Auto-generated seeded event number ${eventNumber} for load and pagination testing.`,
			totalSeats,
		};
	}),
];

const main = async () => {
	console.log("Starting seed...");

	const hashedUsers = await Promise.all(
		USERS.map(async (user) => ({
			...user,
			password: await bcrypt.hash(user.password, 10),
		})),
	);

	await prisma.reservation.deleteMany();
	await prisma.event.deleteMany();
	await prisma.user.deleteMany();

	await prisma.user.createMany({ data: hashedUsers });
	await prisma.event.createMany({
		data: EVENTS.map((event) => ({
			...event,
			availableSeats: event.totalSeats,
		})),
	});

	const [users, events] = await Promise.all([
		prisma.user.findMany({
			where: { email: { in: USERS.map((user) => user.email) } },
			select: { id: true, email: true },
		}),
		prisma.event.findMany({
			where: { name: { in: BASE_EVENTS.map((event) => event.name) } },
			select: { id: true, name: true, totalSeats: true },
		}),
	]);

	const reservationsToCreate = [
		{ userEmail: "alice@example.com", eventName: "Tech Conference 2026", status: "ACTIVE" },
		{ userEmail: "alice@example.com", eventName: "Startup Networking Event", status: "ACTIVE" },
		{ userEmail: "bob@example.com", eventName: "Web Development Workshop", status: "ACTIVE" },
		{ userEmail: "bob@example.com", eventName: "AI & Machine Learning Seminar", status: "ACTIVE" },
		{ userEmail: "bob@example.com", eventName: "Design Thinking Bootcamp", status: "CANCELLED" },
		{ userEmail: "charlie@example.com", eventName: "Tech Conference 2026", status: "ACTIVE" },
	] as const;

	const reservationRows = reservationsToCreate.map((reservation) => {
		const user = users.find((item) => item.email === reservation.userEmail);
		const event = events.find((item) => item.name === reservation.eventName);

		if (!user || !event) {
			throw new Error(
				`Cannot create reservation for ${reservation.userEmail} -> ${reservation.eventName}`,
			);
		}

		return {
			userId: user.id,
			eventId: event.id,
			status: reservation.status,
		};
	});

	await prisma.reservation.createMany({ data: reservationRows });

	const activeReservationCounts = await prisma.reservation.groupBy({
		by: ["eventId"],
		where: { status: "ACTIVE" },
		_count: { eventId: true },
	});

	const allEvents = await prisma.event.findMany({
		select: { id: true, totalSeats: true },
	});

	for (const event of allEvents) {
		const activeCount =
			activeReservationCounts.find((item) => item.eventId === event.id)?._count.eventId ?? 0;

		await prisma.event.update({
			where: { id: event.id },
			data: { availableSeats: event.totalSeats - activeCount },
		});
	}

	const [usersCount, eventsCount, reservationsCount, activeReservationsCount] =
		await Promise.all([
			prisma.user.count(),
			prisma.event.count(),
			prisma.reservation.count(),
			prisma.reservation.count({ where: { status: "ACTIVE" } }),
		]);

	console.log("Seed completed successfully.");
	console.log("Summary:");
	console.log(`- Users: ${usersCount}`);
	console.log(`- Events: ${eventsCount}`);
	console.log(`- Reservations: ${reservationsCount}`);
	console.log(`- Active reservations: ${activeReservationsCount}`);
	console.log("Test login credentials:");
	console.log("- Email: alice@example.com | Password: password123");
};

main()
	.catch((error) => {
		console.error("Seed failed:", error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
