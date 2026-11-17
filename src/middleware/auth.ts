import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.js';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.status(401).json({ error: 'Missing authorization header', code: 'token_missing' });
    return;
  }

  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Malformed authorization header', code: 'token_malformed' });
    return;
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    res.status(401).json({ error: 'Empty authorization token', code: 'token_empty' });
    return;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error: any) {
    const errorCode = error?.code || '';
    const errorMessage = (error?.message || '').toLowerCase();

    console.warn(`[AuthMiddleware] verifyIdToken failed. Code: "${errorCode}", ProjectID: "${adminAuth.app.options.projectId}", Message: "${error?.message}"`);

    if (
      errorCode === 'auth/network-request-failed' ||
      errorCode === 'auth/internal-error' ||
      errorMessage.includes('network') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('unavailable') ||
      errorMessage.includes('socket')
    ) {
      res.status(503).json({ error: 'Authentication service unavailable', code: 'service_unavailable' });
      return;
    }

    let tokenCode = 'token_invalid';
    if (errorCode === 'auth/id-token-expired' || errorMessage.includes('expired')) {
      tokenCode = 'token_expired';
    } else if (errorMessage.includes('aud') || errorMessage.includes('project') || errorMessage.includes('issuer') || errorMessage.includes('claim')) {
      tokenCode = 'token_wrong_project';
    } else if (errorCode === 'auth/argument-error' || errorMessage.includes('malformed')) {
      tokenCode = 'token_invalid';
    }

    res.status(401).json({ error: 'Invalid or expired token', code: tokenCode });
  }
};

