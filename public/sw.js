// GigMe PWA Web Push & Offline Service Worker
const CACHE_NAME = 'gigme-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// PWA Web Push Notification Handler
self.addEventListener('push', (event) => {
  let data = {
    title: 'GigMe Vietnam',
    body: 'Bạn vừa có thông báo mới từ GigMe!',
    icon: '/icon.svg',
    url: '/',
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon.svg',
    badge: '/icon.svg',
    vibrate: [150, 80, 150, 80, 200],
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
    actions: [
      { action: 'open_app', title: 'Mở ứng dụng' },
      { action: 'dismiss', title: 'Bỏ qua' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Handler - Focuses or Opens App Tab
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Background Sync Handler for Offline Applications
self.addEventListener('sync', (event) => {
  if (event.tag === 'gigme-sync-applications') {
    event.waitUntil(
      clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({ type: 'GIGME_TRIGGER_BACKGROUND_SYNC' });
        });
      })
    );
  }
});
