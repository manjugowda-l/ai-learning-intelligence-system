import { apiFetch } from './client.js';

export async function getAnalyticsOverview() {
  return await apiFetch('/api/analytics/', { method: 'GET' });
}

s
