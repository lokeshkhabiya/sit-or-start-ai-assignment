"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";

export default function Home() {
	const router = useRouter();
	const { isAuthenticated, loading, user, signOut } = useAuthStore();

	useEffect(() => {
		// Wait for loading to complete before redirecting
		if (!loading && !isAuthenticated) {
			router.push("/login");
		}
	}, [isAuthenticated, loading, router]);

	const handleSignOut = () => {
		signOut();
		router.push("/login");
	};

	// Show loading state
	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-center">
					<div className="mb-4 text-lg">Loading...</div>
				</div>
			</div>
		);
	}

	// Don't render content if not authenticated (will redirect)
	if (!isAuthenticated) {
		return null;
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
			<div className="w-full max-w-2xl space-y-6">
				<div className="rounded-lg border border-border bg-card p-8 text-center">
					<h1 className="mb-4 text-3xl font-bold">Welcome to sitorstartai</h1>
					{user && (
						<div className="mb-6 space-y-2">
							<p className="text-lg">
								<span className="font-semibold">Name:</span> {user.name}
							</p>
							<p className="text-lg">
								<span className="font-semibold">Email:</span> {user.email}
							</p>
						</div>
					)}
					<Button onClick={handleSignOut} variant="outline" className="mt-4">
						Sign Out
					</Button>
				</div>
			</div>
		</div>
	);
}
