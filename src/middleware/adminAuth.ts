import { Request, Response, NextFunction } from "express";

export function requireAdminHealthToken(req: Request, res: Response, next: NextFunction): void {
  const headerToken = req.get("x-admin-token");
  const expectedToken = process.env.ADMIN_HEALTH_TOKEN;
  const queryTokenKeys = ["token", "adminToken", "admin_token"];
  const hasQueryToken = queryTokenKeys.some((key) => Object.prototype.hasOwnProperty.call(req.query, key));

  if (hasQueryToken) {
    res.status(401).json({ error: "Unauthorized access to telemetry data." });
    return;
  }

  if (!expectedToken || expectedToken.trim() === "") {
    res.status(401).json({ error: "Unauthorized access to telemetry data." });
    return;
  }

  if (typeof headerToken !== "string" || headerToken !== expectedToken) {
    res.status(401).json({ error: "Unauthorized access to telemetry data." });
    return;
  }

  next();
}
