// sw.js
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  clients.claim();
});

// Listen for `sync` event and retry failed requests
self.addEventListener('sync', async (event) => {
  if (event.tag === 'syncSearchRequest') {
    event.waitUntil(processSyncQueue());
  }
});

async function processSyncQueue() {
  const queue = await getQueuedRequests();
  for (const request of queue) {
    try {
      await fetch(request.url, request.options);
      // Remove successfully processed requests from the queue
      await removeRequestFromQueue(request.id);
    } catch (error) {
      console.error('Background sync failed:', error);
      break;
    }
  }
}
