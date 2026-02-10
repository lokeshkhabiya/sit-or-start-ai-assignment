import { create } from "zustand";

export type Event = {
	id: string;
	name: string;
	description: string;
	totalSeats: number;
	availableSeats: number;
	createdAt: string;
	userReservation?: {
		id: string;
		status: "ACTIVE";
		createdAt: string;
	} | null;
};

type Pagination = {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
};

type EventState = {
	events: Event[];
	pagination: Pagination;
	loading: boolean;
	actionInProgress: Record<string, boolean>;
	setEvents: (events: Event[], pagination: Pagination) => void;
	setLoading: (loading: boolean) => void;
	setActionInProgress: (eventId: string, inProgress: boolean) => void;
	updateEvent: (eventId: string, updates: Partial<Event>) => void;
};

export const useEventStore = create<EventState>((set) => ({
	events: [],
	pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
	loading: true,
	actionInProgress: {},

	setEvents: (events, pagination) => set({ events, pagination, loading: false }),

	setLoading: (loading) => set({ loading }),

	setActionInProgress: (eventId, inProgress) =>
		set((state) => ({
			actionInProgress: { ...state.actionInProgress, [eventId]: inProgress },
		})),

	updateEvent: (eventId, updates) =>
		set((state) => ({
			events: state.events.map((event) =>
				event.id === eventId ? { ...event, ...updates } : event,
			),
		})),
}));
