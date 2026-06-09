import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import type { JwtPayload } from '../../shared/types.js';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

function generateTokens(payload: { id: string; email: string; username: string }) {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  } as SignOptions);
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
  return { accessToken, refreshToken };
}

function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: '未提供认证令牌' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, error: '无效或过期的令牌' });
  }
}

export { authenticate, generateTokens };
