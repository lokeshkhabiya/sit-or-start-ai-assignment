import { create } from "zustand";

type User = {
	id: string;
	name: string;
	email: string;
	createdAt: string;
	updatedAt: string;
};

type AuthState = {
	user: User | null;
	isAuthenticated: boolean;
	loading: boolean;
	setUser: (user: User | null) => void;
	setLoading: (loading: boolean) => void;
	signOut: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	isAuthenticated: false,
	loading: true,

	setUser: (user) =>
		set({ user, isAuthenticated: Boolean(user), loading: false }),

	setLoading: (loading) => set({ loading }),

	signOut: () => {
		if (typeof window !== "undefined") {
			localStorage.removeItem("authToken");
			sessionStorage.clear();
		}
		set({ user: null, isAuthenticated: false, loading: false });
	},
}));