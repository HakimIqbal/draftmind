import { describe, expect, it } from 'vitest';
import { getOverviewHealth } from '@/lib/admin/overview-health';

describe('getOverviewHealth', () => {
  it('treats no unresolved logs as healthy', () => {
    expect(getOverviewHealth(0, 0)).toEqual({ errorRate: 0, healthStatus: 'healthy', healthLabel: 'Healthy' });
  });

  it('marks high unresolved error ratio as critical', () => {
    expect(getOverviewHealth(20, 22)).toEqual({ errorRate: 90.9090909090909, healthStatus: 'critical', healthLabel: 'Critical' });
  });

  it('marks moderate unresolved error ratio as warning', () => {
    expect(getOverviewHealth(1, 10)).toEqual({ errorRate: 10, healthStatus: 'warning', healthLabel: 'Warning' });
  });
});
