import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
    ArrowUpRight,
    Bell,
    BellOff,
    BellRing,
    CheckCircle2,
    Settings,
    Wifi,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { NotificationHistoryPage } from './client';
import { showDesktopNotification } from './desktop-notification';
import { dayLabel, timeLabel } from './presentation';
import { useCollaboration } from './provider';
import { CollaborationDialog, IconButton, PersonAvatar } from './ui';

export function NotificationControls({
    enableExtension,
    testExtension,
}: {
    enableExtension?: () => Promise<boolean>;
    testExtension?: () => Promise<void>;
}) {
    const { client, attention, refresh, status, revision } = useCollaboration();
    const [open, setOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const bell = useRef<HTMLButtonElement>(null);
    const [history, setHistory] = useState<NotificationHistoryPage | null>(
        null,
    );
    const [pages, setPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [retry, setRetry] = useState(0);
    useEffect(() => {
        if (!open) return;
        const controller = new AbortController();
        setLoading(true);
        setError('');
        void (async () => {
            try {
                const items = new Map<
                    string,
                    NotificationHistoryPage['data'][number]
                >();
                let next: number | null = 1;
                for (
                    let count = 0;
                    count < pages && next !== null;
                    count += 1
                ) {
                    const result: NotificationHistoryPage =
                        await client.request(
                            `/notifications/history?page=${next}`,
                            { signal: controller.signal },
                        );
                    if (controller.signal.aborted) return;
                    for (const item of result.data) items.set(item.id, item);
                    next = result.next_page;
                }
                setHistory({ data: [...items.values()], next_page: next });
            } catch (cause) {
                if (controller.signal.aborted) return;
                setHistory(null);
                setError(
                    cause instanceof Error
                        ? cause.message
                        : 'Could not load notifications.',
                );
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        })();
        return () => controller.abort();
    }, [client, open, pages, revision, retry]);
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    async function enable() {
        setBusy(true);
        setMessage('');
        try {
            const allowed = enableExtension
                ? await enableExtension()
                : 'Notification' in window &&
                  window.isSecureContext &&
                  (await Notification.requestPermission()) === 'granted';
            if (!allowed) {
                setMessage(
                    'Notifications are blocked or unsupported. Allow them in browser settings; web notifications require HTTPS.',
                );
                return;
            }
            await client.mutate(
                '/notifications/settings',
                { enabled: true },
                'PUT',
            );
            client.events.dispatchEvent(new Event('changed'));
            refresh();
            setMessage(
                'Enabled. Browser and operating-system notification settings still apply.',
            );
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : 'Could not enable notifications.',
            );
        } finally {
            setBusy(false);
        }
    }
    async function pause() {
        setBusy(true);
        try {
            await client.mutate(
                '/notifications/settings',
                { enabled: false },
                'PUT',
            );
            client.events.dispatchEvent(new Event('changed'));
            setMessage('Desktop alerts paused. Activity is still available.');
        } catch {
            setMessage('Could not pause notifications. Retry when connected.');
        } finally {
            setBusy(false);
        }
    }
    async function test() {
        try {
            if (testExtension) await testExtension();
            else if (
                'Notification' in window &&
                Notification.permission === 'granted'
            )
                await showDesktopNotification({
                    title: 'SideWire test',
                    body: 'Desktop notifications are enabled on this browser.',
                });
            else throw new Error('Enable browser notifications first.');
            setMessage(
                'Test requested. Check your system notification center and Do Not Disturb settings if nothing appeared.',
            );
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : 'Test notification failed.',
            );
        }
    }
    return (
        <div className="sw-collaboration sw-notification-controls">
            <DropdownMenu.Root
                open={open}
                onOpenChange={(value) => {
                    setOpen(value);
                    if (value) {
                        setPages(1);
                        setHistory(null);
                        setError('');
                    }
                }}
            >
                <DropdownMenu.Trigger asChild>
                    <button
                        ref={bell}
                        type="button"
                        className="sw-notification-trigger"
                        aria-label={`Notifications${attention?.unread_count ? `, ${attention.unread_count} unread` : ''}`}
                        title="Notifications"
                    >
                        <Bell aria-hidden="true" />
                        <span className="sw-notification-label">
                            Notifications
                        </span>
                        {Boolean(attention?.unread_count) && (
                            <span className="sw-attention-badge">
                                {attention!.unread_count > 99
                                    ? '99+'
                                    : attention!.unread_count}
                            </span>
                        )}
                    </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                    <DropdownMenu.Content
                        className="sw-collaboration sw-notification-panel"
                        align="end"
                        sideOffset={8}
                        collisionPadding={12}
                        aria-label="Notifications"
                        aria-labelledby={undefined}
                        onCloseAutoFocus={(event) => {
                            if (settingsOpen) event.preventDefault();
                        }}
                    >
                        <header className="sw-notification-heading">
                            <DropdownMenu.Label>
                                Notifications
                            </DropdownMenu.Label>
                            <DropdownMenu.Item
                                asChild
                                onSelect={() => setSettingsOpen(true)}
                            >
                                <IconButton
                                    icon={Settings}
                                    label="Notification settings"
                                />
                            </DropdownMenu.Item>
                        </header>
                        <div
                            className="sw-notification-history"
                            aria-busy={loading}
                        >
                            {loading && !history && (
                                <p
                                    className="sw-notification-state"
                                    role="status"
                                >
                                    Loading notifications…
                                </p>
                            )}
                            {error && (
                                <div
                                    className="sw-notification-state"
                                    role="alert"
                                >
                                    <p>{error}</p>
                                    <DropdownMenu.Item
                                        asChild
                                        onSelect={(event) => {
                                            event.preventDefault();
                                            setRetry((value) => value + 1);
                                        }}
                                    >
                                        <button
                                            type="button"
                                            className="sw-button-text"
                                        >
                                            Try again
                                        </button>
                                    </DropdownMenu.Item>
                                </div>
                            )}
                            {!loading &&
                                !error &&
                                history?.data.length === 0 && (
                                    <div className="sw-notification-state">
                                        <Bell aria-hidden="true" />
                                        <strong>No notifications yet</strong>
                                        <p>
                                            Mentions, direct messages and thread
                                            replies will appear here.
                                        </p>
                                    </div>
                                )}
                            {history?.data.map((item) => {
                                const query = new URLSearchParams({
                                    chat: item.chat_id,
                                    message: item.message_id,
                                });
                                if (item.thread_id)
                                    query.set('thread', item.thread_id);
                                return (
                                    <DropdownMenu.Item key={item.id} asChild>
                                        <a
                                            className={`sw-notification-item${item.read_at ? '' : ' sw-notification-unread'}`}
                                            href={`${client.origin}/messages?${query}`}
                                            target={
                                                client.token
                                                    ? '_blank'
                                                    : undefined
                                            }
                                            rel={
                                                client.token
                                                    ? 'noreferrer'
                                                    : undefined
                                            }
                                        >
                                            <PersonAvatar
                                                name={item.author}
                                                small
                                            />
                                            <span className="sw-notification-copy">
                                                <span className="sw-notification-author">
                                                    {item.author}
                                                    <span className="sw-notification-read-state">
                                                        {item.read_at
                                                            ? 'Read'
                                                            : 'Unread'}
                                                    </span>
                                                </span>
                                                <span className="sw-notification-reason">
                                                    {item.reason === 'mention'
                                                        ? 'Mention'
                                                        : item.reason ===
                                                            'thread'
                                                          ? 'Thread reply'
                                                          : 'Direct message'}{' '}
                                                    · {item.chat_title}
                                                </span>
                                                <span className="sw-notification-preview">
                                                    {item.body}
                                                </span>
                                                <time
                                                    dateTime={item.created_at}
                                                    title={new Date(
                                                        item.created_at,
                                                    ).toLocaleString()}
                                                >
                                                    {dayLabel(item.created_at)}{' '}
                                                    ·{' '}
                                                    {timeLabel(item.created_at)}
                                                </time>
                                            </span>
                                        </a>
                                    </DropdownMenu.Item>
                                );
                            })}
                        </div>
                        {history?.next_page && (
                            <DropdownMenu.Item
                                asChild
                                disabled={loading}
                                onSelect={(event) => {
                                    event.preventDefault();
                                    setPages((value) => value + 1);
                                }}
                            >
                                <button
                                    type="button"
                                    className="sw-notification-more"
                                    disabled={loading}
                                >
                                    {loading
                                        ? 'Loading…'
                                        : 'Load older notifications'}
                                </button>
                            </DropdownMenu.Item>
                        )}
                    </DropdownMenu.Content>
                </DropdownMenu.Portal>
            </DropdownMenu.Root>
            <CollaborationDialog
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
                returnFocusRef={bell}
                title="Notification settings"
                description="Choose when SideWire gets your attention."
            >
                <div className="sw-notification-intro">
                    <span className="sw-settings-icon">
                        <BellRing aria-hidden="true" />
                    </span>
                    <div>
                        <h3>Only the conversations that need you</h3>
                        <p>
                            Direct messages, selected @mentions, and replies to
                            threads you participate in.
                        </p>
                    </div>
                </div>
                <div className="sw-settings-row">
                    <div>
                        <strong>Desktop alerts</strong>
                        <p>
                            {attention?.enabled
                                ? 'Enabled for your account. This browser also needs permission.'
                                : 'Off until you choose to enable them.'}
                        </p>
                    </div>
                    <span className="sw-status-label">
                        {attention?.enabled ? (
                            <CheckCircle2 aria-hidden="true" />
                        ) : (
                            <BellOff aria-hidden="true" />
                        )}
                        {attention?.enabled ? 'Enabled' : 'Off'}
                    </span>
                </div>
                <div className="sw-settings-row">
                    <div>
                        <strong>Connection</strong>
                        <p>{status}</p>
                    </div>
                    <Wifi aria-hidden="true" />
                </div>
                <p className="sw-notification-note">
                    {client.token
                        ? 'With extension alerts enabled, Chrome checks about once a minute, even with the panel closed. Chrome must be running.'
                        : 'Keep a SideWire tab open for web alerts. To receive alerts with the tab and panel closed, enable them in the Chrome extension.'}{' '}
                    Sleep and system notification settings can delay alerts.
                    Desktop alerts show the sender, chat name and a short
                    message preview. Click an alert to open the message.
                </p>
                {message && (
                    <p className="sw-settings-feedback" role="status">
                        {message}
                    </p>
                )}
                <div className="sw-dialog-actions">
                    <button
                        type="button"
                        className="sw-button-primary"
                        disabled={busy}
                        onClick={() => {
                            void enable();
                        }}
                    >
                        <BellRing aria-hidden="true" />
                        Enable on this browser
                    </button>
                    <button
                        type="button"
                        className="sw-button-secondary"
                        disabled={busy || !attention?.enabled}
                        onClick={() => {
                            void pause();
                        }}
                    >
                        Pause desktop alerts
                    </button>
                    <button
                        type="button"
                        className="sw-button-text"
                        disabled={busy}
                        onClick={() => {
                            void test();
                        }}
                    >
                        Send test notification{' '}
                        <ArrowUpRight aria-hidden="true" />
                    </button>
                </div>
            </CollaborationDialog>
        </div>
    );
}
