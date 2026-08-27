import { apiFetch } from './client.js';

export async function getTracks() {
  return await apiFetch('/api/dashboard/tracks', { method: 'GET' });
}

export async function createTrack(name, topicId) {
  return await apiFetch('/api/dashboard/tracks', {
    method: 'POST',
    body: JSON.stringify({ 
      trackName: name, 
      topicId: topicId || null 
    }),
  });
}

export async function getTopics(trackId) {
  return await apiFetch(`/api/dashboard/tracks/${trackId}/topics`, { method: 'GET' });
}

export async function createTopic(trackId, topicName) {
  return await apiFetch(`/api/dashboard/tracks/${trackId}/topic`, {
    method: 'POST',
    body: JSON.stringify({ topicName }),
  });
}

export async function getTimeline(topicId) {
  return await apiFetch(`/api/dashboard/topics/${topicId}/timeline`, { method: 'GET' });
}
