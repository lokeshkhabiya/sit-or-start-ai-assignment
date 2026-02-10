import { BASE_URL } from "@/utils/api-connection";

export const authAPIS = {
    signup: `${BASE_URL}/api/auth/signup`,
    login: `${BASE_URL}/api/auth/login`,
    me: `${BASE_URL}/api/auth/me`,
};

export const eventAPIS = {
    list: `${BASE_URL}/api/events`,
    detail: (id: string) => `${BASE_URL}/api/events/${id}`,
    reserve: (id: string) => `${BASE_URL}/api/events/${id}/reserve`,
};