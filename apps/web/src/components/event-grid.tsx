"use client";

import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { useEventStore } from "@/stores/event-store";
import {
	fetchEvents,
	fetchEventDetail,
	reserveSeat,
	cancelReservation,
} from "@/app/api/operations/event-apis";
import { EventCard } from "./event-card";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EventGrid() {
	const { isAuthenticated } = useAuthStore();
	const {
		events,
		pagination,
		loading,
		actionInProgress,
		setEvents,
		setLoading,
		setActionInProgress,
		updateEvent,
	} = useEventStore();

	const loadEvents = useCallback(
		async (page: number) => {
			setLoading(true);
			const result = await fetchEvents(page, pagination.limit);
			if (result?.success) {
				let eventsData = result.data.events;

				const token = localStorage.getItem("authToken");
				if (token) {
					const detailPromises = eventsData.map((event: { id: string }) =>
						fetchEventDetail(event.id, token),
					);
					const details = await Promise.all(detailPromises);
					eventsData = eventsData.map(
						(event: { id: string }, i: number) => {
							const detail = details[i];
							if (detail?.success) {
								return {
									...event,
									userReservation: detail.data.userReservation,
								};
							}
							return event;
						},
					);
				}

				setEvents(eventsData, result.data.pagination);
			} else {
				toast.error("Failed to load events");
				setLoading(false);
			}
		},
		[pagination.limit, setEvents, setLoading],
	);

	useEffect(() => {
		loadEvents(1);
	}, [loadEvents]);

	const handleReserve = async (eventId: string) => {
		if (!isAuthenticated) {
			toast.error("Please log in to reserve a seat");
			return;
		}

		const token = localStorage.getItem("authToken");
		if (!token) return;

		setActionInProgress(eventId, true);
		const result = await reserveSeat(eventId, token);

		if (result?.success) {
			updateEvent(eventId, {
				availableSeats: result.data.event.availableSeats,
				userReservation: {
					id: result.data.id,
					status: "ACTIVE",
					createdAt: result.data.createdAt,
				},
			});
			toast.success("Seat reserved successfully!");
		} else {
			const errorMsg =
				result?.error === "ALREADY_RESERVED"
					? "You already have a reservation for this event"
					: result?.error === "EVENT_FULL"
						? "This event is fully booked"
						: "Failed to reserve seat";
			toast.error(errorMsg);
		}

		setActionInProgress(eventId, false);
	};

	const handleCancel = async (eventId: string) => {
		const token = localStorage.getItem("authToken");
		if (!token) return;

		setActionInProgress(eventId, true);
		const result = await cancelReservation(eventId, token);

		if (result?.success) {
			const detail = await fetchEventDetail(eventId, token);
			if (detail?.success) {
				updateEvent(eventId, {
					availableSeats: detail.data.availableSeats,
					userReservation: null,
				});
			} else {
				const event = events.find((e) => e.id === eventId);
				if (event) {
					updateEvent(eventId, {
						availableSeats: event.availableSeats + 1,
						userReservation: null,
					});
				}
			}
			toast.success("Reservation cancelled");
		} else {
			toast.error("Failed to cancel reservation");
		}

		setActionInProgress(eventId, false);
	};

	const goToPage = (page: number) => {
		loadEvents(page);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	if (loading) {
		return (
			<div className="flex min-h-[320px] items-center justify-center">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (events.length === 0) {
		return (
			<div className="py-16 text-center">
				<p className="text-lg text-muted-foreground">
					No events available at the moment.
				</p>
			</div>
		);
	}

	return (
		<div>
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{events.map((event) => (
					<EventCard
						key={event.id}
						event={event}
						isActionInProgress={!!actionInProgress[event.id]}
						isAuthenticated={isAuthenticated}
						onReserve={handleReserve}
						onCancel={handleCancel}
					/>
				))}
			</div>

			{/* Pagination */}
			{pagination.totalPages > 1 && (
				<div className="mt-8 flex items-center justify-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => goToPage(pagination.page - 1)}
						disabled={pagination.page <= 1}
						className="rounded-lg"
					>
						<ChevronLeft className="size-4" />
						Previous
					</Button>

					<div className="flex items-center gap-1">
						{Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
							.filter((page) => {
								// Show first, last, current, and adjacent pages
								return (
									page === 1 ||
									page === pagination.totalPages ||
									Math.abs(page - pagination.page) <= 1
								);
							})
							.map((page, idx, arr) => {
								const showEllipsis =
									idx > 0 && page - (arr[idx - 1] ?? 0) > 1;
								return (
									<span key={page} className="flex items-center">
										{showEllipsis && (
											<span className="px-2 text-muted-foreground">
												...
											</span>
										)}
										<Button
											variant={
												page === pagination.page
													? "default"
													: "outline"
											}
											size="sm"
											onClick={() => goToPage(page)}
											className="h-8 w-8 rounded-lg p-0"
										>
											{page}
										</Button>
									</span>
								);
							})}
					</div>

					<Button
						variant="outline"
						size="sm"
						onClick={() => goToPage(pagination.page + 1)}
						disabled={pagination.page >= pagination.totalPages}
						className="rounded-lg"
					>
						Next
						<ChevronRight className="size-4" />
					</Button>
				</div>
			)}
		</div>
	);
}
