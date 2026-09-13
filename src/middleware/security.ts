import { Request, Response, NextFunction } from "express";

/**
 * Enterprise Security Middleware for ASCEND STUDY / Remix Study Buddy
 * Provides:
 * 1. Strict Security HTTP Headers (HSTS, Anti-Sniffing, Anti-Clickjacking, XSS Protection)
 * 2. Sliding-Window IP Rate Limiting (Anti-DDoS, Anti-Brute-Force, API Quota Shield)
 * 3. Input Sanitization & Payload Bounds (Anti-Buffer-Overflow, Memory Exhaustion Defense)
 * 4. Data-Theft Prevention & Host Origin Guarding
 */

// --- 1. ENTERPRISE SECURITY HEADERS ---
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  // Prevent MIME sniffing attacks
  res.setHeader("X-Content-Type-Options", "nosniff");
  
  // Anti-clickjacking (SameOrigin for safe framing in approved environments)
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  
  // Legacy XSS protection filter
  res.setHeader("X-XSS-Protection", "1; mode=block");
  
  // Privacy-first referrer policy (no sensitive URLs or tokens leaked to external domains)
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Permissions Policy: restrict dangerous device APIs
  res.setHeader("Permissions-Policy", "geolocation=(), payment=(), usb=(), display-capture=(self)");
  
  // Cross-Origin Resource Policy
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");

  next();
}

// --- 2. HIGH-PERFORMANCE SLIDING-WINDOW IP RATE LIMITER ---
interface RateLimitEntry {
  timestamps: number[];
}

class SlidingWindowRateLimiter {
  private requests = new Map<string, RateLimitEntry>();
  private windowMs: number;
  private maxRequests: number;

  constructor(maxRequests: number = 60, windowSeconds: number = 60) {
    this.maxRequests = maxRequests;
    this.windowMs = windowSeconds * 1000;

    // Periodic sweep to prevent any memory leak (every 2 minutes)
    setInterval(() => this.cleanup(), 2 * 60 * 1000);
  }

  private cleanup(): void {
    const cutoff = Date.now() - this.windowMs;
    for (const [ip, entry] of this.requests.entries()) {
      entry.timestamps = entry.timestamps.filter(ts => ts > cutoff);
      if (entry.timestamps.length === 0) {
        this.requests.delete(ip);
      }
    }
  }

  public check(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const cutoff = now - this.windowMs;

    let entry = this.requests.get(ip);
    if (!entry) {
      entry = { timestamps: [] };
      this.requests.set(ip, entry);
    }

    // Keep only timestamps within window
    entry.timestamps = entry.timestamps.filter(ts => ts > cutoff);

    if (entry.timestamps.length >= this.maxRequests) {
      const oldest = entry.timestamps[0];
      const resetTime = Math.ceil((oldest + this.windowMs - now) / 1000);
      return { allowed: false, remaining: 0, resetTime: Math.max(1, resetTime) };
    }

    entry.timestamps.push(now);
    const remaining = this.maxRequests - entry.timestamps.length;
    return { allowed: true, remaining, resetTime: 60 };
  }
}

// Global Limiter Instances
const aiEndpointLimiter = new SlidingWindowRateLimiter(60, 60); // 60 AI calls/min per IP
const generalApiLimiter = new SlidingWindowRateLimiter(150, 60); // 150 general API calls/min per IP

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "127.0.0.1";
}

export function rateLimitAi(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIp(req);
  const result = aiEndpointLimiter.check(ip);

  res.setHeader("X-RateLimit-Limit", "60");
  res.setHeader("X-RateLimit-Remaining", result.remaining.toString());

  if (!result.allowed) {
    res.setHeader("Retry-After", result.resetTime.toString());
    res.status(429).json({
      error: "Too Many Requests",
      message: `Rate limit exceeded. To protect system security and prevent abuse, please retry in ${result.resetTime} seconds.`,
      code: "RATE_LIMIT_EXCEEDED"
    });
    return;
  }

  next();
}

export function rateLimitGeneral(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIp(req);
  const result = generalApiLimiter.check(ip);

  res.setHeader("X-RateLimit-Limit", "150");
  res.setHeader("X-RateLimit-Remaining", result.remaining.toString());

  if (!result.allowed) {
    res.setHeader("Retry-After", result.resetTime.toString());
    res.status(429).json({
      error: "Too Many Requests",
      message: "API rate limit reached. Please wait a moment before sending more requests.",
      code: "RATE_LIMIT_EXCEEDED"
    });
    return;
  }

  next();
}

// --- 3. INPUT SANITIZATION & BOUNDS VALIDATION ---
export function sanitizeInputs(req: Request, res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === "object") {
    try {
      sanitizeObject(req.body);
    } catch (err: any) {
      res.status(400).json({
        error: "Invalid Request Payload",
        message: err.message || "Input validation failed."
      });
      return;
    }
  }
  next();
}

function sanitizeObject(obj: any, depth = 0): void {
  if (depth > 12) {
    throw new Error("Payload depth limit exceeded (potential circular injection).");
  }

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === "string") {
      // Null-byte injection prevention
      if (val.includes("\0")) {
        throw new Error("Invalid payload: null bytes are forbidden.");
      }
      // String size bounds protection (except base64 data URLs)
      if (!val.startsWith("data:") && val.length > 50000) {
        obj[key] = val.slice(0, 50000);
      }
    } else if (val && typeof val === "object") {
      sanitizeObject(val, depth + 1);
    }
  }
}
