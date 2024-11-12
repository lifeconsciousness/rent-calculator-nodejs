self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  clients.claim();
});

// Sync event listener
self.addEventListener('sync', (event) => {
  if (event.tag === 'syncSearchRequest') {
    event.waitUntil(processSyncQueue());
  }
});

// Function to process requests stored in local storage
async function processSyncQueue() {
  const queue = getQueuedRequests();
  for (const request of queue) {
    try {
      await fetch(request.url, {
        method: request.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body),
      });
      removeRequestFromQueue(request.id); // Remove the successfully processed request
    } catch (error) {
      console.error('Background sync failed:', error);
      break; // Stop further processing if there's an error
    }
  }
}

// Retrieve queued requests from local storage
function getQueuedRequests() {
  const queue = localStorage.getItem('requestQueue');
  return queue ? JSON.parse(queue) : [];
}

// Remove a processed request from the local storage queue
function removeRequestFromQueue(id) {
  const queue = getQueuedRequests();
  const updatedQueue = queue.filter((request) => request.id !== id);
  localStorage.setItem('requestQueue', JSON.stringify(updatedQueue));
}
