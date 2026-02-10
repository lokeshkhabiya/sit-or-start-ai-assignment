import { env } from "@sitorstartai/env/server";
import cors from "cors";
import express from "express";
import usersRouter from "./routes/users.routes";
import seedRouter from "./routes/seed.routes";
import authRouter from "./routes/auth.routes";
import eventsRouter from "./routes/events.routes";

const app = express();

app.use(
	cors({
		origin: env.CORS_ORIGIN,
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		credentials: true,
	}),
);

app.use(express.json());

app.get("/", (_req, res) => {
	res.status(200).send("OK");
});

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/events", eventsRouter);
app.use("/api/seed", seedRouter);

const PORT = env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
