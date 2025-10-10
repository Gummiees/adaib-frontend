import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ServiceWorkerCleanupService {
  constructor() {
    this.unregisterServiceWorker();
  }

  private async unregisterServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();

        for (const registration of registrations) {
          console.log('Unregistering service worker:', registration.scope);
          await registration.unregister();
        }

        // Clear any cached data
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map((cacheName) => {
              console.log('Deleting cache:', cacheName);
              return caches.delete(cacheName);
            }),
          );
        }

        console.log('All service workers and caches have been cleaned up');
      } catch (error) {
        console.warn('Failed to unregister service worker:', error);
      }
    }
  }
}
