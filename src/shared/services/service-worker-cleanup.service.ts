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

          // Force immediate activation of any waiting worker to bypass it
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }

          // Unregister the service worker
          const unregistered = await registration.unregister();
          console.log('Service worker unregistered:', unregistered);
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

        // Force page reload to ensure service worker is completely removed
        if (registrations.length > 0) {
          console.log(
            'Service workers found and removed. Reloading page to complete cleanup...',
          );
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          console.log('No service workers found - cleanup complete');
        }
      } catch (error) {
        console.warn('Failed to unregister service worker:', error);
      }
    }
  }
}
