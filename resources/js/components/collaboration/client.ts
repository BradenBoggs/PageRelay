import Pusher from 'pusher-js';

export type Person = { id: number; name: string };
export type Source = {
    id: string;
    title: string;
    url: string;
    host: string;
    version?: number;
};
export type Chat = {
    id: string;
    title: string;
    type: 'page' | 'direct';
    can_send: boolean;
    unread_attention: number;
    linked_pages: Source[];
};
export type Message = {
    id: string;
    body: string;
    created_at: string;
    author: Person;
    source: Source | null;
    thread_root_id: string | null;
    reply_count: number;
    mentions: Person[];
};
export type Attention = {
    id: string;
    reason: 'mention' | 'direct' | 'thread';
    chat_id: string;
    chat_title: string;
    message_id: string;
    thread_id: string | null;
    author: string;
    body: string;
    created_at: string;
};
export type Notice = {
    id: string;
    claim: string;
    title: string;
    body: string;
    path: string;
};
export type AttentionPage = {
    data: Attention[];
    unread_count: number;
    enabled: boolean;
    desktop_candidates: string[];
    next_page: number | null;
};
export type MessagePage = {
    data: Message[];
    root: Message | null;
    chat: Chat;
    older_cursor: string | null;
};
export type Draft = {
    body: string;
    mentions: Person[];
    key: string;
    source: Source | null;
};

export class CollaborationError extends Error {
    constructor(
        message: string,
        public status: number,
    ) {
        super(message);
    }
}

export class CollaborationClient {
    readonly drafts = new Map<string, Draft>();
    readonly events = new EventTarget();
    onAuthLost: () => void = () => {};

    constructor(
        readonly origin = '',
        readonly token?: string,
    ) {}

    get base(): string {
        return this.token
            ? '/api/v1/extension/collaboration'
            : '/collaboration';
    }

    async request<T>(path: string, init: RequestInit = {}): Promise<T> {
        const headers = new Headers(init.headers);
        headers.set('Accept', 'application/json');
        if (this.token) headers.set('Authorization', `Bearer ${this.token}`);
        else {
            const csrf =
                typeof document === 'undefined'
                    ? undefined
                    : document.cookie
                          .split('; ')
                          .find((cookie) => cookie.startsWith('XSRF-TOKEN='));
            if (csrf)
                headers.set('X-XSRF-TOKEN', decodeURIComponent(csrf.slice(11)));
        }
        if (init.body) headers.set('Content-Type', 'application/json');
        let response: Response;
        try {
            response = await fetch(`${this.origin}${this.base}${path}`, {
                ...init,
                headers,
                credentials: this.token ? 'omit' : 'same-origin',
                cache: 'no-store',
            });
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError')
                throw error;
            throw new CollaborationError(
                'Connection lost. Your draft has been kept. Reconnect and retry.',
                0,
            );
        }
        if (!response.ok) {
            if ([401, 403, 419].includes(response.status)) {
                this.drafts.clear();
                this.onAuthLost();
            }
            const body = (await response.json().catch(() => ({}))) as {
                message?: string;
            };
            throw new CollaborationError(
                body.message ?? `Request failed (${response.status}).`,
                response.status,
            );
        }
        return (await response.json()) as T;
    }

    mutate<T>(path: string, data: unknown, method = 'POST'): Promise<T> {
        return this.request<T>(path, { method, body: JSON.stringify(data) });
    }

    connect(
        userId: number,
        organizationId: number,
        changed: () => void,
        status: (value: string) => void,
    ): () => void {
        const key = import.meta.env.VITE_REVERB_APP_KEY;
        if (!key) {
            status('Automatic refresh · realtime not configured');
            return () => {};
        }
        const csrf =
            typeof document === 'undefined'
                ? undefined
                : document.cookie
                      .split('; ')
                      .find((cookie) => cookie.startsWith('XSRF-TOKEN='));
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (this.token) headers.Authorization = `Bearer ${this.token}`;
        else if (csrf)
            headers['X-XSRF-TOKEN'] = decodeURIComponent(csrf.slice(11));
        const realtime = new Pusher(key, {
            cluster: 'mt1',
            wsHost:
                import.meta.env.VITE_REVERB_HOST ||
                new URL(this.origin || window.location.origin).hostname,
            wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 80),
            wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 443),
            forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
            enabledTransports: ['ws', 'wss'],
            channelAuthorization: {
                transport: 'ajax',
                endpoint: `${this.origin}${this.token ? '/api/v1/extension' : ''}/broadcasting/auth`,
                headers,
            },
        });
        realtime.connection.bind(
            'state_change',
            (change: { current: string }) => {
                status(
                    change.current === 'connected'
                        ? 'Live'
                        : 'Reconnecting · automatic refresh available',
                );
                if (change.current === 'connected') changed();
            },
        );
        for (const name of [
            `private-organizations.${organizationId}`,
            `private-App.Models.User.${userId}`,
        ]) {
            const channel = realtime.subscribe(name);
            channel.bind('message.created', changed);
            channel.bind('pusher:subscription_error', () =>
                status(
                    'Live connection unavailable · automatic refresh available',
                ),
            );
        }
        return () => {
            realtime.disconnect();
        };
    }
}

export function freshDraft(): Draft {
    return { body: '', mentions: [], key: crypto.randomUUID(), source: null };
}
export function messagePath(
    chat: string,
    thread?: string | null,
    message?: string | null,
): string {
    const query = new URLSearchParams({ chat });
    if (thread) query.set('thread', thread);
    if (message) query.set('message', message);
    return `/messages?${query.toString()}`;
}
