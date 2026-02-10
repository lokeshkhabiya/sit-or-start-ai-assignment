"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { getCurrentUser } from "@/app/api/operations/auth-apis";

export function AuthInitializer() {
	const { setUser, setLoading } = useAuthStore();

	useEffect(() => {
		const initAuth = async () => {
			try {
				setLoading(true);
				const token = localStorage.getItem("authToken");

				if (!token) {
					setLoading(false);
					return;
				}

				const result = await getCurrentUser(token);

				if (result && result.success) {
					setUser(result.data);
				} else {
					// Token is invalid or expired, clear it
					localStorage.removeItem("authToken");
					setUser(null);
				}
			} catch (error) {
				console.error("Error initializing auth:", error);
				localStorage.removeItem("authToken");
				setUser(null);
			} finally {
				setLoading(false);
			}
		};

		initAuth();
	}, [setUser, setLoading]);

	return null;
}
