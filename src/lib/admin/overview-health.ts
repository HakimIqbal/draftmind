export function getOverviewHealth(errorCount: number, totalLogs: number) {
  const errorRate = totalLogs > 0 ? (errorCount / totalLogs) * 100 : 0;
  const healthStatus = errorRate < 5 ? 'healthy' : errorRate < 15 ? 'warning' : 'critical';
  const healthLabel =
    healthStatus === 'healthy' ? 'Healthy' : healthStatus === 'warning' ? 'Warning' : 'Critical';

  return { errorRate, healthStatus, healthLabel };
}
