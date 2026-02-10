"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Loader2, ArrowLeft, Dessert, Paperclip } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { apiConnector } from "@/utils/api-connector";
import { BASE_URL } from "@/utils/api-connection";
import { cancelReservation } from "@/app/api/operations/event-apis";
import Link from "next/link";

type Reservation = {
	id: string;
	userId: string;
	eventId: string;
	status: "ACTIVE" | "CANCELLED";
	createdAt: string;
	updatedAt: string;
	event: {
		id: string;
		name: string;
		description: string;
		totalSeats: number;
		availableSeats: number;
		createdAt: string;
	};
};

export default function MyReservationsPage() {
	const router = useRouter();
	const { isAuthenticated, loading: authLoading, user } = useAuthStore();
	const [reservations, setReservations] = useState<Reservation[]>([]);
	const [loading, setLoading] = useState(true);
	const [cancellingId, setCancellingId] = useState<string | null>(null);

	const fetchReservations = useCallback(async () => {
		const token = localStorage.getItem("authToken");
		if (!token || !user) return;

		setLoading(true);
		try {
			const response = await apiConnector(
				"GET",
				`${BASE_URL}/api/users/${user.id}/reservations`,
				null,
				{ Authorization: `Bearer ${token}` },
				null,
				"json",
			);

			if (response?.data?.success) {
				setReservations(response.data.data.reservations);
			}
		} catch {
			toast.error("Failed to load reservations");
		} finally {
			setLoading(false);
		}
	}, [user]);

	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			router.push("/login");
		}
	}, [authLoading, isAuthenticated, router]);

	useEffect(() => {
		if (isAuthenticated && user) {
			fetchReservations();
		}
	}, [isAuthenticated, user, fetchReservations]);

	const handleCancel = async (eventId: string) => {
		const token = localStorage.getItem("authToken");
		if (!token) return;

		setCancellingId(eventId);
		const result = await cancelReservation(eventId, token);

		if (result?.success) {
			toast.success("Reservation cancelled");
			fetchReservations();
		} else {
			toast.error("Failed to cancel reservation");
		}
		setCancellingId(null);
	};

	if (authLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Loader2 className="size-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!isAuthenticated) return null;

	const activeReservations = reservations.filter((r) => r.status === "ACTIVE");
	const cancelledReservations = reservations.filter(
		(r) => r.status === "CANCELLED",
	);

	return (
		<div className="min-h-screen bg-background">
			<Header />
			<main className="mx-auto max-w-7xl px-6 py-10">
				<div className="mb-8">
					<Link
						href="/"
						className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
					>
						<ArrowLeft className="size-4" />
						Back to Events
					</Link>
					<h2 className="text-3xl font-bold text-foreground">
						My Reservations
					</h2>
					<p className="mt-2 text-muted-foreground">
						Manage your event reservations
					</p>
				</div>

				{loading ? (
					<div className="flex min-h-[220px] items-center justify-center">
						<Loader2 className="size-8 animate-spin text-muted-foreground" />
					</div>
				) : reservations.length === 0 ? (
					<div className="py-16 text-center">
						<p className="text-lg text-muted-foreground">
							You have no reservations yet.
						</p>
						<Link href="/">
							<Button className="mt-4 rounded-lg">
								Browse Events
							</Button>
						</Link>
					</div>
				) : (
					<div className="space-y-8">
						{activeReservations.length > 0 && (
							<div>
								<h3 className="mb-4 text-lg font-semibold text-foreground">
									Active ({activeReservations.length})
								</h3>
								<div className="space-y-3">
									{activeReservations.map((reservation) => (
										<div
											key={reservation.id}
											className="flex items-center justify-between rounded-lg border border-border bg-card p-5"
										>
											<div className="space-y-1.5">
												<h4 className="text-base font-semibold text-foreground">
													{reservation.event.name}
												</h4>
												<div className="flex items-center gap-4 text-sm text-muted-foreground">
													<span className="flex items-center gap-1.5">
														<Calendar className="size-3.5" />
														{new Date(
															reservation.event.createdAt,
														).toLocaleDateString("en-US", {
															year: "numeric",
															month: "long",
															day: "numeric",
														})}
													</span>
													<span className="flex items-center gap-1.5">
														<span className="line-clamp-1 max-w-[300px]">
															{reservation.event.description}
														</span>
													</span>
												</div>
												<p className="text-xs text-muted-foreground">
													Reserved on{" "}
													{new Date(
														reservation.createdAt,
													).toLocaleDateString("en-US", {
														year: "numeric",
														month: "long",
														day: "numeric",
													})}
												</p>
											</div>
											<Button
												onClick={() =>
													handleCancel(reservation.eventId)
												}
												disabled={
													cancellingId === reservation.eventId
												}
												variant="destructive"
												size="sm"
												className="rounded-lg"
											>
												{cancellingId === reservation.eventId ? (
													<>
														<Loader2 className="size-4 animate-spin" />
														Cancelling...
													</>
												) : (
													"Cancel"
												)}
											</Button>
										</div>
									))}
								</div>
							</div>
						)}

						{cancelledReservations.length > 0 && (
							<div>
								<h3 className="mb-4 text-lg font-semibold text-muted-foreground">
									Cancelled ({cancelledReservations.length})
								</h3>
								<div className="space-y-3">
									{cancelledReservations.map((reservation) => (
										<div
											key={reservation.id}
											className="flex items-center justify-between rounded-lg border border-border bg-card p-5 opacity-60"
										>
											<div className="space-y-1.5">
												<h4 className="text-base font-semibold text-foreground">
													{reservation.event.name}
												</h4>
												<div className="flex items-center gap-4 text-sm text-muted-foreground">
													<span className="flex items-center gap-1.5">
														<Calendar className="size-3.5" />
														{new Date(
															reservation.event.createdAt,
														).toLocaleDateString("en-US", {
															year: "numeric",
															month: "long",
															day: "numeric",
														})}
													</span>
												</div>
											</div>
											<span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
												Cancelled
											</span>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</main>
		</div>
	);
}
