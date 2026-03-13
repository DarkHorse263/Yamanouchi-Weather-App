import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import router from "./routes";

const app: Express = express();

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  const staticDir = path.join(__dirname, "../../yamanouchi/dist/public");
  app.use(express.static(staticDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

export default app;
