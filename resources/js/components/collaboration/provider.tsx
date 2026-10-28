import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';
import { CollaborationClient, type AttentionPage, type Notice } from './client';
import { showDesktopNotification } from './desktop-notification';
import { incomingSound } from './incoming-sound';
import './workspace.css';

type WorkspaceState = {
    client: CollaborationClient;
    revision: number;
    refresh: () => void;
    attention: AttentionPage | null;
    status: string;
    unreadCounts: Record<string, number>;
    unreadTotals: { direct: number; work: number } | null;
};
const Context = createContext<WorkspaceState | null>(null);
export function useCollaboration(): WorkspaceState {
    const value = useContext(Context);
    if (!value) throw new Error('Collaboration provider is missing.');
    return value;
}

export function CollaborationProvider({
    client,
    userId,
    organizationId,
    children,
    backgroundCheck,
}: {
    client: CollaborationClient;
    userId: number;
    organizationId: number;
    children: ReactNode;
    backgroundCheck?: () => void;
}) {
    const [revision, setRevision] = useState(0);
    const [attention, setAttention] = useState<AttentionPage | null>(null);
    const [status, setStatus] = useState('Connecting');
    const [expired, setExpired] = useState(false);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>(
        {},
    );
    const [unreadTotals, setUnreadTotals] =
        useState<WorkspaceState['unreadTotals']>(null);
    const refresh = () => setRevision((value) => value + 1);
    useEffect(() => {
        if (expired) return;
        client.onAuthLost = () => {
            setAttention(null);
            setUnreadCounts({});
            setUnreadTotals(null);
            setExpired(true);
        };
        let active = true;
        let cursor: number | null = null;
        const sound = incomingSound();
        let busy = false;
        let timer: ReturnType<typeof setTimeout>;
        const check = async () => {
            if (busy || !active) return;
            busy = true;
            try {
                const updates = await client.request<{
                    cursor: number;
                    incoming: boolean;
                    unread_counts: Record<string, number>;
                    unread_totals: { direct: number; work: number };
                }>(`/updates${cursor === null ? '' : `?after=${cursor}`}`);
                if (!active) return;
                setUnreadCounts(updates.unread_counts);
                setUnreadTotals(updates.unread_totals);
                if (cursor !== null && updates.incoming) sound.play();
                cursor = Math.max(cursor ?? 0, updates.cursor);
                const result =
                    await client.request<AttentionPage>('/notifications');
                if (!active) return;
                setAttention(result);
                if (backgroundCheck) backgroundCheck();
                else if (
                    result.enabled &&
                    'Notification' in window &&
                    Notification.permission === 'granted'
                ) {
                    for (const id of result.desktop_candidates) {
                        if (!active) break;
                        const claimed = await client.mutate<{
                            data: Notice | null;
                        }>(`/notifications/${id}/claim`, {});
                        if (!claimed.data || !active) continue;
                        const notice = claimed.data;
                        await showDesktopNotification({
                            title: notice.title,
                            body: notice.body,
                            tag: `sidewire-${notice.id}`,
                            path: notice.path,
                        });
                        await client.mutate(`/notifications/${id}/delivered`, {
                            claim: notice.claim,
                        });
                    }
                }
            } catch {
                if (active) setStatus('Connection interrupted · retrying');
            } finally {
                busy = false;
            }
        };
        const changed = () => {
            if (!active) return;
            refresh();
            clearTimeout(timer);
            timer = setTimeout(() => {
                void check();
            }, 900);
        };
        const disconnect = client.connect(
            userId,
            organizationId,
            changed,
            setStatus,
        );
        const interval = setInterval(changed, 30000);
        const focused = () => {
            if (document.visibilityState === 'visible') changed();
        };
        client.events.addEventListener('changed', changed);
        document.addEventListener('visibilitychange', focused);
        window.addEventListener('online', changed);
        window.addEventListener('focus', focused);
        void check();
        return () => {
            active = false;
            clearInterval(interval);
            clearTimeout(timer);
            disconnect();
            sound.dispose();
            client.events.removeEventListener('changed', changed);
            document.removeEventListener('visibilitychange', focused);
            window.removeEventListener('online', changed);
            window.removeEventListener('focus', focused);
            client.onAuthLost = () => {};
        };
    }, [client, userId, organizationId, backgroundCheck, expired]);
    if (expired)
        return (
            <section className="sw-collaboration">
                <h2>Your session has ended</h2>
                <p>
                    Private content has been cleared. Sign in or reconnect the
                    extension to continue.
                </p>
                <a
                    href={`${client.origin}/login`}
                    target={client.token ? '_blank' : undefined}
                    rel="noreferrer"
                >
                    Sign in to SideWire
                </a>
            </section>
        );
    return (
        <Context.Provider
            value={{
                client,
                revision,
                refresh,
                attention,
                status,
                unreadCounts,
                unreadTotals,
            }}
        >
            {children}
        </Context.Provider>
    );
}
