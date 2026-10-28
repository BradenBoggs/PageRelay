type DesktopNotice = {
    title: string;
    body: string;
    tag?: string;
    path?: string;
};

// Mobile browsers (e.g. Android Chrome) reject the page constructor with a TypeError and
// only display notifications through a service worker, which also handles the click.
export async function showDesktopNotification(
    notice: DesktopNotice,
): Promise<void> {
    const options = { body: notice.body, tag: notice.tag };
    try {
        const toast = new Notification(notice.title, options);
        const path = notice.path;
        if (path)
            toast.onclick = () => {
                window.focus();
                window.location.assign(path);
                toast.close();
            };
        return;
    } catch (error) {
        if (!(error instanceof TypeError) || !('serviceWorker' in navigator))
            throw error;
    }
    await navigator.serviceWorker.register('/notifications-sw.js');
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(notice.title, {
        ...options,
        data: { path: notice.path ?? '/messages' },
    });
}
