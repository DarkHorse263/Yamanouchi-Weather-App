import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import router from "./routes";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve Vite-built frontend static files in production
if (process.env.NODE_ENV === "production") {
  // __dirname is available in the CJS bundle at artifacts/api-server/dist/
  // frontend build is at artifacts/yamanouchi/dist/public/
  const staticDir = path.join(__dirname, "../../yamanouchi/dist/public");
  app.use(express.static(staticDir));
  // SPA fallback: send index.html for all non-API routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

export default app;
