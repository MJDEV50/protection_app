import { Request, Response, NextFunction } from 'express';

interface Metrics {
  totalRequests: number;
  totalErrors: number;
  responseTimeMs: number[];
  requestCount: Map<string, number>;
}

const metrics: Metrics = {
  totalRequests: 0,
  totalErrors: 0,
  responseTimeMs: [],
  requestCount: new Map(),
};

export const metricsCollector = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  // Track request
  metrics.totalRequests++;
  const endpoint = `${req.method} ${req.path}`;
  metrics.requestCount.set(endpoint, (metrics.requestCount.get(endpoint) || 0) + 1);

  // Track response
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.responseTimeMs.push(duration);

    // Keep only last 1000 measurements
    if (metrics.responseTimeMs.length > 1000) {
      metrics.responseTimeMs.shift();
    }

    if (res.statusCode >= 400) {
      metrics.totalErrors++;
    }
  });

  next();
};

export function getMetrics() {
  const avgResponseTime = metrics.responseTimeMs.length > 0
    ? Math.round(
        metrics.responseTimeMs.reduce((a, b) => a + b, 0) /
          metrics.responseTimeMs.length
      )
    : 0;

  return {
    totalRequests: metrics.totalRequests,
    totalErrors: metrics.totalErrors,
    errorRate: (
      (metrics.totalErrors / Math.max(metrics.totalRequests, 1)) *
      100
    ).toFixed(2),
    avgResponseTimeMs: avgResponseTime,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    topEndpoints: Array.from(metrics.requestCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
  };
}
