export const ADMIN_REDIS_KEY = process.env.ADMIN_REDIS_KEY;
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_TOKEN_LIFETIME = 60*60*24*7;

export default {
  port: process.env.PORT || 3000
};
