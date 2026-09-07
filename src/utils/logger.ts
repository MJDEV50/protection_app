export const logger = {
  info: (msg: string, data?: any) => console.log(`[info] ${msg}`, data || ''),
  error: (msg: string, data?: any) => {
    // Suppress Redis connection errors - app continues without Redis
    if (msg.includes('Redis') || (data && String(data).includes('redis'))) {
      return;
    }
    console.error(`[error] ${msg}`, data || '');
  },
  warn: (msg: string, data?: any) => console.warn(`[warn] ${msg}`, data || ''),
};
