"use client";
import axios, { AxiosError } from "axios";

export const axiosInstance = axios.create({
	withCredentials: true,
});

export const apiConnector = async (
    method: string,
    url: string,
    data: object | null,
    headers: object | null,
    params: object | null,
    responseType:
        | "arraybuffer"
        | "blob"
        | "json"
        | "text"
        | "stream"
        | null
) => {
    try {
        const fields = {
            method: method,
            url: url,
            data: data || undefined,
            headers: headers || undefined,
            params: params || undefined,
            responseType: responseType || undefined,
        };
		
        const response = await axiosInstance(fields);

        return response;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error?.response?.status === 408) {
                setTimeout(() => {
                    localStorage.clear();
                    if (typeof window !== "undefined") window.location.reload();
                }, 200);
            }

            return error?.response
        }
    }
}