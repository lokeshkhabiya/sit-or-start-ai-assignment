"use client";

import { Calendar, MapPin, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Event } from "@/stores/event-store";

type EventCardProps = {
	event: Event;
	isActionInProgress: boolean;
	isAuthenticated: boolean;
	onReserve: (eventId: string) => void;
	onCancel: (eventId: string) => void;
};

export function EventCard({
	event,
	isActionInProgress,
	isAuthenticated,
	onReserve,
	onCancel,
}: EventCardProps) {
	const bookedSeats = event.totalSeats - event.availableSeats;
	const bookedPercent = Math.round((bookedSeats / event.totalSeats) * 100);
	const isSoldOut = event.availableSeats === 0;
	const hasReservation = event.userReservation?.status === "ACTIVE";

	const formattedDate = new Date(event.createdAt).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	return (
		<div className="flex flex-col rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md">
			{/* Header: Name + Badge */}
			<div className="mb-4 flex items-start justify-between gap-3">
				<h3 className="text-lg font-semibold leading-tight text-foreground">
					{event.name}
				</h3>
				{isSoldOut ? (
					<span className="shrink-0 rounded-full bg-destructive/15 px-3 py-1 text-xs font-medium text-destructive">
						Sold Out
					</span>
				) : (
					<span className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
						Available
					</span>
				)}
			</div>

			{/* Event details */}
			<div className="mb-4 space-y-2">
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<Calendar className="size-4 shrink-0" />
					<span>{formattedDate}</span>
				</div>
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<MapPin className="size-4 shrink-0" />
					<span className="line-clamp-1">{event.description}</span>
				</div>
			</div>

			{/* Seat info */}
			<div className="mt-auto">
				<div className="mb-2 flex items-center justify-between">
					<div className="flex items-center gap-2 text-sm font-medium text-foreground">
						<Users className="size-4" />
						<span>
							{event.availableSeats} of {event.totalSeats} seats
						</span>
					</div>
					<span className="text-sm text-muted-foreground">
						{bookedPercent}% booked
					</span>
				</div>

				{/* Progress bar */}
				<div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-muted">
					<div
						className="h-full rounded-full bg-foreground transition-all duration-300"
						style={{ width: `${bookedPercent}%` }}
					/>
				</div>

				{/* Action button */}
				{isSoldOut && !hasReservation ? (
					<Button
						disabled
						variant="outline"
						className="h-11 w-full rounded-lg text-sm"
					>
						Fully Booked
					</Button>
				) : hasReservation ? (
					<Button
						onClick={() => onCancel(event.id)}
						disabled={isActionInProgress}
						variant="destructive"
						className="h-11 w-full rounded-lg text-sm"
					>
						{isActionInProgress ? (
							<>
								<Loader2 className="size-4 animate-spin" />
								Cancelling...
							</>
						) : (
							"Cancel Reservation"
						)}
					</Button>
				) : (
					<Button
						onClick={() => onReserve(event.id)}
						disabled={isActionInProgress || !isAuthenticated}
						className="h-11 w-full rounded-lg text-sm"
					>
						{isActionInProgress ? (
							<>
								<Loader2 className="size-4 animate-spin" />
								Reserving...
							</>
						) : (
							"Reserve Seat"
						)}
					</Button>
				)}
			</div>
		</div>
	);
}
