"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, signup, getCurrentUser } from "@/app/api/operations/auth-apis";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

const nameSchema = z.string().min(2, "Name must be at least 2 characters");
const emailSchema = z.string().min(1, "Email is required").email("Please enter a valid email");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

function validate(schema: z.ZodString, value: string) {
	const result = schema.safeParse(value);
	return result.success ? undefined : result.error.issues[0]?.message;
}

export default function LoginPage() {
	const [isSignUp, setIsSignUp] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();
	const { setUser, isAuthenticated } = useAuthStore();

	// Redirect if already logged in
	useEffect(() => {
		if (isAuthenticated) {
			router.push("/");
		}
	}, [isAuthenticated, router]);

	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			setIsLoading(true);
			setError(null);
			try {
				if (isSignUp) {
					const result = await signup(value.name, value.email, value.password);
					if (!result || !result.success) {
						const errorMessage = result?.error === "EMAIL_ALREADY_EXISTS" 
							? "Email already exists. Please login instead."
							: "Sign up failed. Please try again.";
						setError(errorMessage);
						toast.error(errorMessage);
						return;
					}
					// After signup, automatically login
					const loginResult = await login(value.email, value.password);
					if (!loginResult || !loginResult.success) {
						setError("Sign up successful but login failed. Please login manually.");
						toast.error("Please login with your credentials");
						setIsSignUp(false);
						return;
					}
					// Store token and fetch user
					const token = loginResult.data.token;
					localStorage.setItem("authToken", token);
					
					const userResult = await getCurrentUser(token);
					if (userResult && userResult.success) {
						setUser(userResult.data);
						toast.success("Account created successfully!");
						router.push("/");
					} else {
						setError("Failed to fetch user data.");
						toast.error("Authentication failed");
					}
				} else {
					const result = await login(value.email, value.password);
					if (!result || !result.success) {
						const errorMessage = result?.error === "INVALID_CREDENTIALS"
							? "Invalid email or password."
							: "Login failed. Please try again.";
						setError(errorMessage);
						toast.error(errorMessage);
						return;
					}
					// Store token and fetch user
					const token = result.data.token;
					localStorage.setItem("authToken", token);
					
					const userResult = await getCurrentUser(token);
					if (userResult && userResult.success) {
						setUser(userResult.data);
						toast.success("Logged in successfully!");
						router.push("/");
					} else {
						setError("Failed to fetch user data.");
						toast.error("Authentication failed");
					}
				}
			} catch {
				setError("Something went wrong. Please try again.");
				toast.error("An unexpected error occurred");
			} finally {
				setIsLoading(false);
			}
		},
	});

	const toggleMode = () => {
		setIsSignUp((prev) => !prev);
		setError(null);
		form.reset();
	};

	return (
		<div className="flex min-h-svh flex-col items-center justify-center bg-background px-4">
			<div className="w-full max-w-[400px]">
				<div className="mb-8 text-center">
					<h1 className="text-3xl font-bold tracking-tight text-foreground">
						sitorstartai
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						{isSignUp ? "Create your account" : "Sign in to your account"}
					</p>
				</div>

				<div className="rounded-lg border border-border p-6">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
					>
						<div className="space-y-4">
							{isSignUp && (
								<form.Field
									name="name"
									validators={{
										onSubmit: ({ value }) => validate(nameSchema, value),
									}}
								>
									{(field) => (
										<div className="space-y-1.5">
											<Label
												htmlFor={field.name}
												className="text-sm font-semibold"
											>
												Name
											</Label>
											<Input
												id={field.name}
												name={field.name}
												placeholder="John Doe"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												className="h-10 rounded-md text-sm"
											/>
											{field.state.meta.errors.length > 0 && (
												<p className="text-xs text-destructive">
													{field.state.meta.errors[0]?.toString()}
												</p>
											)}
										</div>
									)}
								</form.Field>
							)}

							<form.Field
								name="email"
								validators={{
									onSubmit: ({ value }) => validate(emailSchema, value),
								}}
							>
								{(field) => (
									<div className="space-y-1.5">
										<Label
											htmlFor={field.name}
											className="text-sm font-semibold"
										>
											Email
										</Label>
										<Input
											id={field.name}
											name={field.name}
											type="email"
											placeholder="you@example.com"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											className="h-10 rounded-md text-sm"
										/>
										{field.state.meta.errors.length > 0 && (
											<p className="text-xs text-destructive">
												{field.state.meta.errors[0]?.toString()}
											</p>
										)}
									</div>
								)}
							</form.Field>

							<form.Field
								name="password"
								validators={{
									onSubmit: ({ value }) => validate(passwordSchema, value),
								}}
							>
								{(field) => (
									<div className="space-y-1.5">
										<Label
											htmlFor={field.name}
											className="text-sm font-semibold"
										>
											Password
										</Label>
										<Input
											id={field.name}
											name={field.name}
											type="password"
											placeholder="••••••"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											className="h-10 rounded-md text-sm"
										/>
										{field.state.meta.errors.length > 0 && (
											<p className="text-xs text-destructive">
												{field.state.meta.errors[0]?.toString()}
											</p>
										)}
									</div>
								)}
							</form.Field>

							{error && (
								<p className="text-center text-xs text-destructive">{error}</p>
							)}

							<Button
								type="submit"
								disabled={isLoading}
								className="h-10 w-full rounded-md text-sm"
							>
								{isLoading
									? isSignUp
										? "Creating account..."
										: "Signing in..."
									: isSignUp
										? "Sign Up"
										: "Sign In"}
							</Button>
						</div>
					</form>

					<div className="my-5 border-t border-border" />

					<p className="text-center text-sm text-muted-foreground">
						{isSignUp
							? "Already have an account?"
							: "Don't have an account?"}{" "}
						<button
							type="button"
							onClick={toggleMode}
							className="font-semibold text-foreground hover:underline"
						>
							{isSignUp ? "Sign In" : "Sign Up"}
						</button>
					</p>
				</div>

				<p className="mt-6 text-center text-xs text-muted-foreground">
					By continuing, you agree to our Terms of Service and Privacy Policy
				</p>
			</div>
		</div>
	);
}
