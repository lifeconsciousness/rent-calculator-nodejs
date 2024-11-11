self.addEventListener('sync', (event) => {
    if (event.tag === 'apiSyncTag') {
      event.waitUntil(retryApiRequest());
    }
  });
  
  // Function to retry the API request in the background
  async function retryApiRequest() {
    // Retrieve the post parameters from localStorage
    const postParameters = JSON.parse(localStorage.getItem('postParameters'));
  
    if (!postParameters) {
      console.log('No post parameters found for background sync');
      return;
    }
  
    try {
      // Attempt to make the API call
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postParameters)
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const data = await response.json();
      console.log('Background sync API call successful:', data);
  
      // Update the frontend using a postMessage or other means
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'API_RESPONSE', data: data });
        });
      });
  
      // Clear stored data after a successful call
      localStorage.removeItem('postParameters');
    } catch (error) {
      console.error('Background sync API request failed:', error);
      // Optionally re-register sync if it failed and needs another retry
      self.registration.sync.register('apiSyncTag');
    }
  }
  