// Notification display only, for browsers that disallow page-constructed notifications.
// No fetch handling, caching or push subscription.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const target = new URL(event.notification.data?.path ?? '/messages', self.location.origin);
    if (target.origin !== self.location.origin) return;
    event.waitUntil(
        (async () => {
            const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
            for (const client of windows) {
                try {
                    await client.focus();
                    await client.navigate(target.href);
                    return;
                } catch {
                    // Uncontrolled or closing window; fall back to a new one.
                }
            }
            await self.clients.openWindow(target.href);
        })(),
    );
});
