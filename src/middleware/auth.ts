import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.js';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

export const requireAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1]?.trim();
    if (token) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        req.user = decodedToken;
        next();
        return;
      } catch (error) {
        // Token verification failed (expired/mismatched project) - fallback gracefully to guest mode
        console.warn('Firebase token verification warning (falling back to guest session):', error);
      }
    }
  }

  // Graceful Guest Fallback: never block unauthenticated users with 401!
  // Assign a guest session so they can use all AI features under the guest daily limit (15 req/day).
  const forwarded = req.headers["x-forwarded-for"];
  const clientIp = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : (req.socket.remoteAddress || "127.0.0.1");
  
  req.user = {
    uid: `guest_${clientIp.replace(/[^a-zA-Z0-9]/g, '_')}`,
    firebase: { sign_in_provider: 'anonymous' }
  } as any;

  next();
};
