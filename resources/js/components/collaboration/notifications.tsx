import { ArrowUpRight, Bell, BellOff, BellRing, CheckCircle2, Wifi } from 'lucide-react';
import { useState } from 'react';
import { useCollaboration } from './provider';
import { CollaborationDialog } from './ui';

export function NotificationControls({
    enableExtension,
    testExtension,
}: {
    enableExtension?: () => Promise<boolean>;
    testExtension?: () => Promise<void>;
}) {
    const { client, attention, refresh, status } = useCollaboration();
    const [open, setOpen] = useState(false);
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
                new Notification('SideWire test', {
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
            <CollaborationDialog open={open} onOpenChange={setOpen} title="Notifications" description="Choose when SideWire gets your attention." trigger={
                <button type="button" className="sw-notification-trigger" aria-label={`Notifications${attention?.unread_count ? `, ${attention.unread_count} unread` : ''}`} title="Notification preferences">
                    <Bell aria-hidden="true" /><span className="sw-notification-label">Notifications</span>
                    {Boolean(attention?.unread_count) && <span className="sw-attention-badge">{attention!.unread_count > 99 ? '99+' : attention!.unread_count}</span>}
                </button>
            }>
                <div className="sw-notification-intro"><span className="sw-settings-icon"><BellRing aria-hidden="true" /></span><div><h3>Only the conversations that need you</h3><p>Direct messages, selected @mentions, and replies to threads you participate in.</p></div></div>
                <div className="sw-settings-row"><div><strong>Desktop alerts</strong><p>{attention?.enabled ? 'Enabled for your account. This browser also needs permission.' : 'Off until you choose to enable them.'}</p></div><span className="sw-status-label">{attention?.enabled ? <CheckCircle2 aria-hidden="true" /> : <BellOff aria-hidden="true" />}{attention?.enabled ? 'Enabled' : 'Off'}</span></div>
                <div className="sw-settings-row"><div><strong>Connection</strong><p>{status}</p></div><Wifi aria-hidden="true" /></div>
                <p className="sw-notification-note">{client.token ? 'With extension alerts enabled, Chrome checks about once a minute, even with the panel closed. Chrome must be running.' : 'Keep a SideWire tab open for web alerts. To receive alerts with the tab and panel closed, enable them in the Chrome extension.'} Sleep and system notification settings can delay alerts. Desktop previews never include message text.</p>
                {message && <p className="sw-settings-feedback" role="status">{message}</p>}
                <div className="sw-dialog-actions">
                    <button type="button" className="sw-button-primary" disabled={busy} onClick={() => { void enable(); }}><BellRing aria-hidden="true" />Enable on this browser</button>
                    <button type="button" className="sw-button-secondary" disabled={busy || !attention?.enabled} onClick={() => { void pause(); }}>Pause desktop alerts</button>
                    <button type="button" className="sw-button-text" disabled={busy} onClick={() => { void test(); }}>Send test notification <ArrowUpRight aria-hidden="true" /></button>
                </div>
            </CollaborationDialog>
        </div>
    );
}
