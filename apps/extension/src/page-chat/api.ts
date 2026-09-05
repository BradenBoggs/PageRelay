import type { ExtensionSession } from '../auth/session';

const appUrl = (
    import.meta.env.VITE_SIDEWIRE_APP_URL ?? 'http://localhost:8000'
).replace(/\/$/, '');

export type PageSource = {
    id: string;
    title: string;
    host: string;
    url: string;
};

export type ChatMessage = {
    id: string;
    body: string;
    created_at: string;
    author: { id: number; name: string };
    source: PageSource | null;
};

export type PageChat = {
    id: string;
    title: string;
    type: 'page';
    web_url: string;
    linked_pages: PageSource[];
    messages?: ChatMessage[];
};

export type PageContext = Omit<PageSource, 'id'> & {
    persisted: boolean;
    id: string | null;
    favicon_url: string | null;
    association_version: number | null;
    chat: PageChat | null;
};

export type CreatePageChatInput = {
    pageUrl: string;
    pageTitle: string;
    chatName: string;
    faviconUrl?: string | null;
};

export type DiscoveryItem = {
    id: string;
    title: string;
    web_url: string;
    message_count: number;
    unread_count: number;
    linked_pages: PageSource[];
    latest_message: {
        id: string;
        body: string;
        created_at: string;
        author: { id: number; name: string };
        source: PageSource | null;
    } | null;
};

export type DiscoveryResult = {
    items: DiscoveryItem[];
    apps: Array<{ id: string; label: string }>;
    nextPage: number | null;
    webUrl: string;
};

type ApiResponse<T> = { data: T };

export class PageChatApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public reason?: string,
    ) {
        super(message);
    }
}

export async function resolvePage(
    session: ExtensionSession,
    page: { url: string; title: string; faviconUrl?: string },
): Promise<PageContext> {
    const response = await request<ApiResponse<PageContext>>(
        session,
        '/api/v1/extension/page-contexts/resolve',
        {
            method: 'POST',
            body: JSON.stringify({
                url: page.url,
                title: page.title,
                favicon_url: page.faviconUrl,
            }),
        },
    );

    return response.data;
}

export async function refreshPage(
    session: ExtensionSession,
    contextId: string,
): Promise<PageContext> {
    const response = await request<ApiResponse<PageContext>>(
        session,
        `/api/v1/extension/page-contexts/${encodeURIComponent(contextId)}`,
    );

    return response.data;
}

export async function createPageChat(
    session: ExtensionSession,
    input: CreatePageChatInput,
): Promise<PageContext> {
    const response = await request<ApiResponse<PageContext>>(
        session,
        '/api/v1/extension/page-chats',
        {
            method: 'POST',
            body: JSON.stringify({
                page_url: input.pageUrl,
                page_title: input.pageTitle,
                chat_name: input.chatName,
                favicon_url: input.faviconUrl,
            }),
        },
    );

    return response.data;
}

export async function sendPageMessage(
    session: ExtensionSession,
    context: PageContext,
    body: string,
    idempotencyKey: string,
): Promise<ChatMessage> {
    if (!context.id || context.association_version === null || !context.chat) {
        throw new PageChatApiError(
            'Create or link a chat before sending a message.',
            409,
            'chat_required',
        );
    }

    const response = await request<ApiResponse<ChatMessage>>(
        session,
        `/api/v1/extension/page-contexts/${encodeURIComponent(context.id)}/messages`,
        {
            method: 'POST',
            body: JSON.stringify({
                body,
                idempotency_key: idempotencyKey,
                expected_association_version: context.association_version,
            }),
        },
    );

    return response.data;
}

export async function listPageChats(
    session: ExtensionSession,
    query = '',
): Promise<PageChat[]> {
    const suffix = query ? `?query=${encodeURIComponent(query)}` : '';
    const response = await request<ApiResponse<PageChat[]>>(
        session,
        `/api/v1/extension/page-chats${suffix}`,
    );

    return response.data;
}

export async function listDiscovery(
    session: ExtensionSession,
    filters: {
        surface: 'activity' | 'chats';
        view: 'all' | 'unread';
        query?: string;
        app?: string;
    },
): Promise<DiscoveryResult> {
    const parameters = new URLSearchParams({
        surface: filters.surface,
        view: filters.view,
    });
    if (filters.query) parameters.set('query', filters.query);
    if (filters.app) parameters.set('app', filters.app);

    const response = await request<{
        data: DiscoveryItem[];
        meta: {
            apps: Array<{ id: string; label: string }>;
            next_page: number | null;
            web_url: string;
        };
    }>(session, `/api/v1/extension/discovery?${parameters.toString()}`);

    return {
        items: response.data,
        apps: response.meta.apps,
        nextPage: response.meta.next_page,
        webUrl: response.meta.web_url,
    };
}

export async function markChatRead(
    session: ExtensionSession,
    chatId: string,
    messageId: string,
): Promise<void> {
    await request(
        session,
        `/api/v1/extension/page-chats/${encodeURIComponent(chatId)}/read`,
        {
            method: 'POST',
            body: JSON.stringify({ message_id: messageId }),
        },
    );
}

export async function linkPage(
    session: ExtensionSession,
    context: PageContext,
    conversationId: string,
    input?: CreatePageChatInput,
): Promise<PageContext> {
    if (!context.id) {
        const response = await request<ApiResponse<PageContext>>(
            session,
            '/api/v1/extension/page-contexts/chat',
            {
                method: 'PUT',
                body: JSON.stringify({
                    conversation_id: conversationId,
                    page_url: input?.pageUrl ?? context.url,
                    page_title: input?.pageTitle ?? context.title,
                    favicon_url: input?.faviconUrl ?? context.favicon_url,
                }),
            },
        );

        return response.data;
    }

    const response = await request<ApiResponse<PageContext>>(
        session,
        `/api/v1/extension/page-contexts/${encodeURIComponent(context.id)}/chat`,
        {
            method: 'PUT',
            body: JSON.stringify({
                conversation_id: conversationId,
                expected_association_version: context.association_version,
            }),
        },
    );

    return response.data;
}

export async function unlinkPage(
    session: ExtensionSession,
    context: PageContext,
): Promise<PageContext> {
    if (!context.id || context.association_version === null) {
        throw new PageChatApiError(
            'This page does not have a chat to unlink.',
            409,
        );
    }

    const response = await request<ApiResponse<PageContext>>(
        session,
        `/api/v1/extension/page-contexts/${encodeURIComponent(context.id)}/chat`,
        {
            method: 'DELETE',
            body: JSON.stringify({
                expected_association_version: context.association_version,
            }),
        },
    );

    return response.data;
}

async function request<T>(
    session: ExtensionSession,
    path: string,
    init: RequestInit = {},
): Promise<T> {
    let response: Response;
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    headers.set('Authorization', `Bearer ${session.token}`);

    if (init.body) {
        headers.set('Content-Type', 'application/json');
    }

    try {
        response = await fetch(`${appUrl}${path}`, {
            ...init,
            headers,
        });
    } catch {
        throw new PageChatApiError(
            'SideWire is offline. Your draft is still here.',
            0,
            'offline',
        );
    }

    if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
            message?: string;
            reason?: string;
        };

        throw new PageChatApiError(
            payload.message ??
                `SideWire request failed (HTTP ${response.status}).`,
            response.status,
            payload.reason,
        );
    }

    return (await response.json()) as T;
}
