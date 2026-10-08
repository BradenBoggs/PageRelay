import type { ExtensionSession } from '../auth/session';
import type {
    AttentionPage,
    Notice,
} from '../../../../resources/js/components/collaboration/client';

const appUrl = (
    import.meta.env.VITE_SIDEWIRE_APP_URL ?? 'http://localhost:8000'
).replace(/\/$/, '');
const alarm = 'sidewire.notifications';
const sessionKey = 'sidewire.extension.session';
const enabledKey = 'sidewire.desktop.enabled';
const linksKey = 'sidewire.notification-links';
let running = false;

async function api<T>(
    session: ExtensionSession,
    path: string,
    data?: unknown,
): Promise<T> {
    const response = await fetch(
        `${appUrl}/api/v1/extension/collaboration${path}`,
        {
            method: data === undefined ? 'GET' : 'POST',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${session.token}`,
                'Content-Type': 'application/json',
            },
            body: data === undefined ? undefined : JSON.stringify(data),
            cache: 'no-store',
            credentials: 'omit',
        },
    );
    if (response.status === 401 || response.status === 403) {
        await chrome.storage.local.remove([sessionKey, enabledKey, linksKey]);
        throw new Error('Session ended.');
    }
    if (!response.ok) throw new Error('Notification check unavailable.');
    return (await response.json()) as T;
}

async function syncAlarm() {
    const stored = await chrome.storage.local.get([enabledKey, sessionKey]);
    if (stored[enabledKey] && stored[sessionKey]) {
        if (!(await chrome.alarms.get(alarm)))
            await chrome.alarms.create(alarm, { periodInMinutes: 1 });
        await check();
    } else {
        await chrome.alarms.clear(alarm);
        if (
            await chrome.permissions.contains({
                permissions: ['notifications'],
            })
        ) {
            const notices = await chrome.notifications.getAll();
            for (const id of Object.keys(notices)) {
                if (id.startsWith('sidewire-'))
                    await chrome.notifications.clear(id);
            }
        }
        await chrome.storage.local.remove(linksKey);
    }
}

async function check() {
    if (running) return;
    running = true;
    try {
        const stored = await chrome.storage.local.get([
            sessionKey,
            enabledKey,
            linksKey,
        ]);
        const session = stored[sessionKey] as ExtensionSession | undefined;
        if (
            !session ||
            !stored[enabledKey] ||
            new Date(session.expiresAt).getTime() <= Date.now()
        )
            return;
        if (
            !(await chrome.permissions.contains({
                permissions: ['notifications'],
            })) ||
            (await chrome.notifications.getPermissionLevel()) !== 'granted'
        )
            return;
        const page = await api<AttentionPage>(session, '/notifications');
        if (!page.enabled) return;
        const links = (stored[linksKey] ?? {}) as Record<
            string,
            { path: string; user: number; organization: number }
        >;
        for (const id of page.desktop_candidates) {
            const result = await api<{ data: Notice | null }>(
                session,
                `/notifications/${id}/claim`,
                {},
            );
            if (!result.data) continue;
            const current = await chrome.storage.local.get(sessionKey);
            if (
                (current[sessionKey] as ExtensionSession | undefined)?.token !==
                session.token
            )
                break;
            const notice = result.data;
            const notificationId = `sidewire-${session.user.id}-${notice.id}`;
            links[notificationId] = {
                path: notice.path,
                user: session.user.id,
                organization: session.organization.id,
            };
            await chrome.storage.local.set({
                [linksKey]: Object.fromEntries(
                    Object.entries(links).slice(-100),
                ),
            });
            await chrome.notifications.create(notificationId, {
                type: 'basic',
                iconUrl: chrome.runtime.getURL('notification.png'),
                title: notice.title,
                message: notice.body,
            });
            await api(session, `/notifications/${id}/delivered`, {
                claim: notice.claim,
            });
        }
    } catch {
        /* Retained attention stays unread. The next alarm or foreground event retries. */
    } finally {
        running = false;
    }
}

chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch(() => {});
chrome.runtime.onInstalled.addListener(() => {
    void syncAlarm();
});
chrome.runtime.onStartup.addListener(() => {
    void syncAlarm();
});
chrome.alarms.onAlarm.addListener((event) => {
    if (event.name === alarm) void check();
});
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes[sessionKey] || changes[enabledKey]))
        void syncAlarm();
});
chrome.runtime.onMessage.addListener((message: unknown, sender, reply) => {
    if (
        sender.id !== chrome.runtime.id ||
        !message ||
        typeof message !== 'object' ||
        !('type' in message)
    )
        return false;
    if (message.type === 'sidewire.check-notifications') {
        void check().then(() => reply({ ok: true }));
        return true;
    }
    if (message.type === 'sidewire.test-notification') {
        void chrome.permissions
            .contains({ permissions: ['notifications'] })
            .then(async (granted) => {
                if (!granted)
                    throw new Error('Enable extension notifications first.');
                await chrome.notifications.create('sidewire-test', {
                    type: 'basic',
                    iconUrl: chrome.runtime.getURL('notification.png'),
                    title: 'SideWire test',
                    message:
                        'Desktop notifications are enabled on this browser.',
                });
                reply({ ok: true });
            })
            .catch(() =>
                reply({
                    ok: false,
                    error: 'Could not display the test notification. Check Chrome and system notification permissions.',
                }),
            );
        return true;
    }
    return false;
});
chrome.notifications.onClicked.addListener((id) => {
    void (async () => {
        const stored = await chrome.storage.local.get([sessionKey, linksKey]);
        const session = stored[sessionKey] as ExtensionSession | undefined;
        const links = (stored[linksKey] ?? {}) as Record<
            string,
            { path: string; user: number; organization: number }
        >;
        const target = links[id];
        if (
            target &&
            session &&
            target.user === session.user.id &&
            target.organization === session.organization.id &&
            target.path.startsWith('/messages?')
        ) {
            await chrome.tabs.create({ url: `${appUrl}${target.path}` });
        } else await chrome.tabs.create({ url: `${appUrl}/messages` });
        delete links[id];
        await chrome.storage.local.set({ [linksKey]: links });
        await chrome.notifications.clear(id);
    })().catch(() => {});
});
