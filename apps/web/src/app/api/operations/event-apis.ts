import { apiConnector } from "@/utils/api-connector";
import { eventAPIS } from "../api";

export const fetchEvents = async (page: number, limit: number) => {
    try {
        const response = await apiConnector(
            "GET",
            eventAPIS.list,
            null,
            null,
            { page, limit },
            "json",
        );
        return response?.data;
    } catch (error) {
        console.error("Error fetching events:", error);
        return null;
    }
};

export const fetchEventDetail = async (id: string, token?: string) => {
    try {
        const headers = token ? { Authorization: `Bearer ${token}` } : null;
        const response = await apiConnector(
            "GET",
            eventAPIS.detail(id),
            null,
            headers,
            null,
            "json",
        );
        return response?.data;
    } catch (error) {
        console.error("Error fetching event detail:", error);
        return null;
    }
};

export const reserveSeat = async (eventId: string, token: string) => {
    try {
        const response = await apiConnector(
            "POST",
            eventAPIS.reserve(eventId),
            {},
            { Authorization: `Bearer ${token}` },
            null,
            "json",
        );
        return response?.data;
    } catch (error) {
        console.error("Error reserving seat:", error);
        return null;
    }
};

export const cancelReservation = async (eventId: string, token: string) => {
    try {
        const response = await apiConnector(
            "DELETE",
            eventAPIS.reserve(eventId),
            null,
            { Authorization: `Bearer ${token}` },
            null,
            "json",
        );
        return response?.data;
    } catch (error) {
        console.error("Error cancelling reservation:", error);
        return null;
    }
};
