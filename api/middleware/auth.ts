import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import type { JwtPayload } from '../../shared/types.js';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

function generateTokens(payload: { id: string; email: string; username: string }) {
  const accessToken = jwt.sign(payload, config.jwt.secret!, {
    expiresIn: config.jwt.expiresIn,
  } as SignOptions);
  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret!, {
    expiresIn: config.jwt.refreshExpiresIn,
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
    const decoded = jwt.verify(token, config.jwt.secret!) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, error: '无效或过期的令牌' });
  }
}

export { authenticate, generateTokens };
