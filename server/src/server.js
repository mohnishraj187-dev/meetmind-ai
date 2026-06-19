import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { authRouter } from "./routes/auth.routes.js";
import { meetingRouter } from "./routes/meeting.routes.js";
import { taskRouter } from "./routes/task.routes.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "../..");

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "meetmind-ai" });
});

app.get("/api/config", (_req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || ""
  });
});

app.use("/api/auth", authRouter);
app.use("/api/meetings", meetingRouter);
app.use("/api/tasks", taskRouter);

app.use(express.static(publicDir));

app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(port, () => {
  console.log(`MeetMind AI running on http://localhost:${port}`);
});
