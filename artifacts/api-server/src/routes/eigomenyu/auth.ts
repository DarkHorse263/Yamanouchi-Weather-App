import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, ownersTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ error: "email, password, and name are required" });
    return;
  }

  const existing = await db.select().from(ownersTable).where(eq(ownersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [owner] = await db.insert(ownersTable).values({ email, passwordHash, name }).returning();

  req.session.ownerId = owner.id;

  res.status(201).json({
    id: owner.id,
    email: owner.email,
    name: owner.name,
    createdAt: owner.createdAt.toISOString(),
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const [owner] = await db.select().from(ownersTable).where(eq(ownersTable.email, email)).limit(1);
  if (!owner) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, owner.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  req.session.ownerId = owner.id;

  res.json({
    id: owner.id,
    email: owner.email,
    name: owner.name,
    createdAt: owner.createdAt.toISOString(),
  });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Failed to logout" });
      return;
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out" });
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  if (!req.session.ownerId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [owner] = await db.select().from(ownersTable).where(eq(ownersTable.id, req.session.ownerId)).limit(1);
  if (!owner) {
    res.status(401).json({ error: "Owner not found" });
    return;
  }

  res.json({
    id: owner.id,
    email: owner.email,
    name: owner.name,
    createdAt: owner.createdAt.toISOString(),
  });
});

export default router;
