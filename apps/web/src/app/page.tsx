"use client";

import Header from "@/components/header";
import { EventGrid } from "@/components/event-grid";

export default function Home() {
	return (
		<div className="min-h-screen bg-background">
			<Header />
			<main className="mx-auto max-w-7xl px-6 py-10">
				<div className="mb-8">
					<h2 className="text-3xl font-bold text-foreground">
						Upcoming Events
					</h2>
					<p className="mt-2 text-muted-foreground">
						Discover and reserve seats for amazing events happening near you
					</p>
				</div>
				<EventGrid />
			</main>
		</div>
	);
}
