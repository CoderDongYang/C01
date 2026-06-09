export { query, queryReturning, initDatabase, generateId } from './database.js';
export { client as redisClient } from './redis.js';

export const config = {
  jwt: {
    secret: process.env.JWT_SECRET || 'codoc-jwt-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'codoc-refresh-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  },
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
};
