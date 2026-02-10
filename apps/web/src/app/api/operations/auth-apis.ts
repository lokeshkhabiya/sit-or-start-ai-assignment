import { apiConnector } from "@/utils/api-connector";
import { authAPIS } from "../api";

export const signup = async (name: string, email: string, password: string) => {
    try {
        const response = await apiConnector(
            "POST",
            authAPIS.signup,
            { name, email, password },
            null,
            null,
            "json",
        );
        return response?.data;
    } catch (error) {
        console.error("Error signing up:", error);
        return null;
    }
};

export const login = async (email: string, password: string) => {
    try {
        const response = await apiConnector(
            "POST",
            authAPIS.login,
            { email, password },
            null,
            null,
            "json",
        );
        return response?.data;
    } catch (error) {
        console.error("Error logging in:", error);
        return null;
    }
};

export const getCurrentUser = async (token: string) => {
    try {
        const response = await apiConnector(
            "GET",
            authAPIS.me,
            null,
            { Authorization: `Bearer ${token}` },
            null,
            "json",
        );
        return response?.data;
    } catch (error) {
        console.error("Error fetching user:", error);
        return null;
    }
};
