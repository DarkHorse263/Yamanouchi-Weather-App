import type { Request, Response, NextFunction } from "express";

export function requireOwner(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.ownerId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}
