"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ticket, LogOut, User } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";

export default function Header() {
	const router = useRouter();
	const { isAuthenticated, user, signOut } = useAuthStore();

	const handleSignOut = () => {
		signOut();
		router.push("/login");
	};

	return (
		<header className="border-b border-border bg-card">
			<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
				<Link href="/" className="flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-lg bg-foreground">
						<Ticket className="size-5 text-background" />
					</div>
					<div>
						<h1 className="text-lg font-bold leading-tight text-foreground">
							Sit or Start AI
						</h1>
						<p className="text-xs text-muted-foreground">
							Reserve your perfect experience
						</p>
					</div>
				</Link>

				<div className="flex items-center gap-3">
					{isAuthenticated && user ? (
						<>
							<Link href="/my-reservations">
								<Button variant="outline" size="sm" className="rounded-lg gap-1.5">
									<User className="size-3.5" />
									My Reservations
								</Button>
							</Link>
							<div className="flex items-center gap-2">
								<span className="text-sm text-muted-foreground">
									{user.name}
								</span>
								<Button
									onClick={handleSignOut}
									variant="ghost"
									size="icon-sm"
									className="rounded-lg"
								>
									<LogOut className="size-4" />
								</Button>
							</div>
						</>
					) : (
						<Link href="/login">
							<Button size="sm" className="rounded-lg">
								Sign In
							</Button>
						</Link>
					)}
				</div>
			</div>
		</header>
	);
}
